const Menu = require('../../models/vendas/menuModel');
const Categoria = require('../../models/vendas/categoriaModel');
const Tamanho = require('../../models/vendas/tamanhoModel');
const Audit = require('../../models/sistema/auditModel');
const Usuario = require('../../models/usuarios/userModel');
const { criar } = require('../../models/sistema/funcionario/historicoSalarialModel');

module.exports = {
  renderMenu: async (req, res) => {
    try {
      const usuarioId = req.session.userId;
      if (!usuarioId) return res.redirect('/login');

      const pratos = await Menu.getAllByUsuario(usuarioId, { incluirArquivados: true });
      const categorias = await Categoria.listarPorUsuario(usuarioId);
      const tamanhos = await Tamanho.listarPorUsuario(usuarioId);
      
      res.render('vendas/menu', { pratos, categorias, tamanhos });
    } catch (err) {
      console.error('Erro ao carregar o menu:', err);
      res.status(500).send('Erro ao carregar o menu');
    }
  },
  
  criarPrato: async (req, res) => {
    const usuarioId = req.session.userId;
    try {
      if (!usuarioId) return res.redirect('/login');

      const { categoria, nome_prato, ingredientes, quantidade, preco, tamanhos } = req.body;

      const temPrecoUnico = preco !== undefined && preco !== '' && preco !== null;
      let temTamanhos = false;
      let tamanhosArray = [];

      if (Array.isArray(tamanhos)) {
        tamanhosArray = tamanhos.filter(t => t.tamanho && t.preco && t.tamanho.trim() !== '' && t.preco.trim() !== '');
        temTamanhos = tamanhosArray.length > 0;
      } else {
        // Parse from req.body keys
        const keys = Object.keys(req.body);
        const tamanhosMap = {};

        keys.forEach(key => {
          const match = key.match(/^tamanhos\[(\d+)\]\[(tamanho|preco)\]$/);
          if (match) {
            const index = match[1];
            const field = match[2];

            if (!tamanhosMap[index]) {
              tamanhosMap[index] = {};
            }
            tamanhosMap[index][field] = req.body[key];
          }
        });

        tamanhosArray = Object.keys(tamanhosMap)
          .map(index => tamanhosMap[index])
          .filter(t => t.tamanho && t.preco && t.tamanho.trim() !== '' && t.preco.trim() !== '')
          .map(t => ({
            tamanho: t.tamanho.trim(),
            preco: parseFloat(t.preco)
          }));

        temTamanhos = tamanhosArray.length > 0;
      }

      if (!nome_prato) {
        return res.status(400).send('Nome do prato é obrigatório.');
      }

      if (!temPrecoUnico && !temTamanhos) {
        return res.status(400).send('Informe um preço único ou múltiplos tamanhos com preços.');
      }

      let precoNum = null;
      if (temPrecoUnico && !temTamanhos) {
        precoNum = Number(String(preco).replace(',', '.'));
        if (Number.isNaN(precoNum) || precoNum < 0) {
          return res.status(400).send('Preço inválido.');
        }
      }

      const dadosPrato = {
        categoria,
        nome_prato,
        ingredientes,
        quantidade: quantidade || null,
        preco: temTamanhos ? 0.00 : precoNum,
        usuario_id: usuarioId,
        destaque: req.body.destaque ? 1 : 0,
        is_disponivel: req.body.is_disponivel ? 1 : 0,
        arquivado: req.body.arquivado ? 1 : 0,
        atualizado_por: usuarioId
      };

      if (req.file) dadosPrato.imagem = req.file.filename;
      
      const pratoId = await Menu.create(dadosPrato);

      if (temTamanhos) {
        let tamanhosArray = [];

        if (Array.isArray(tamanhos)) {
          tamanhosArray = tamanhos
            .filter(t => t.tamanho && t.preco)
            .map(t => ({
              tamanho: t.tamanho,
              preco: parseFloat(t.preco)
            }));
        } else {
          const keys = Object.keys(req.body);
          const tamanhosMap = {};

          keys.forEach(key => {
            const match = key.match(/^tamanhos\[(\d+)\]\[(tamanho|preco)\]$/);
            if (match) {
              const index = match[1];
              const field = match[2];
              
              if (!tamanhosMap[index]) {
                tamanhosMap[index] = {};
              }
              tamanhosMap[index][field] = req.body[key];
            }
          });

          tamanhosArray = Object.keys(tamanhosMap)
            .map(index => tamanhosMap[index])
            .filter(t => t.tamanho && t.preco)
            .map(t => ({
              tamanho: t.tamanho,
              preco: parseFloat(t.preco)
            }));
        }
        
        if (tamanhosArray.length > 0) {
          await Menu.criarTamanhos(pratoId, tamanhosArray);
        }
      }

      res.redirect('/menu');
    } catch (err) {
      console.error('Erro ao criar prato:', err);
      console.error('Dados recebidos:', req.body);
      console.error('Usuario ID:', usuarioId);
      res.status(500).send('Erro ao criar prato: ' + err.message);
    }
  },

  editarPrato: async (req, res) => {
    try {
      const usuarioId = req.session.userId;
      const precoNum = req.body.preco !== undefined
        ? Number(String(req.body.preco).replace(',', '.'))
        : undefined;

      const dados = {
        ...req.body,
        destaque: req.body.destaque ? 1 : 0,
        atualizado_por: usuarioId
      };

      if (req.file) dados.imagem = req.file.filename;
      if (precoNum !== undefined && !Number.isNaN(precoNum)) dados.preco = precoNum;

      await Menu.update(req.params.id, dados);
      res.redirect('/menu');
    } catch (err) {
      console.error('Erro ao editar prato:', err);
      res.status(500).send('Erro ao editar prato');
    }
  },

  excluirPrato: async (req, res) => {
    try {
      await Menu.delete(req.params.id);
      res.redirect('/menu');
    } catch (err) {
      console.error('Erro ao excluir prato:', err);
      res.status(500).send('Erro ao excluir prato');
    }
  },

  updateParcial: async (req, res) => {
    try {
      const id = Number(req.params.id);
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ ok: false, msg: 'Não autenticado.' });

      const permitidos = ['nome_prato', 'preco', 'is_disponivel', 'arquivado'];
      const payload = {};
      for (const k of permitidos) {
        if (k in req.body) payload[k] = req.body[k];
      }
      if (!Object.keys(payload).length) {
        return res.status(400).json({ ok: false, msg: 'Nenhum campo permitido enviado.' });
      }

      const antes = await Menu.getById(id, userId);
      if (!antes) return res.status(404).json({ ok: false, msg: 'Prato não encontrado.' });

      if (payload.preco !== undefined) {
        const n = Number(String(payload.preco).replace(',', '.'));
        if (Number.isNaN(n) || n < 0) {
          return res.status(422).json({ ok: false, msg: 'Preço inválido.' });
        }
        payload.preco = n;
      }

      if (payload.is_disponivel !== undefined) {
        payload.is_disponivel = Number(payload.is_disponivel) ? 1 : 0;
      }
      if (payload.arquivado !== undefined) {
        payload.arquivado = Number(payload.arquivado) ? 1 : 0;
      }

      const finalArquivado = payload.arquivado !== undefined ? payload.arquivado : antes.arquivado;
      if (finalArquivado === 1) {
        payload.is_disponivel = 0;
      } else if (payload.arquivado === 0) {
        payload.is_disponivel = 1;
      }

      payload.atualizado_por = userId;

      await Menu.updatePartial(id, userId, payload);
      const depois = await Menu.getById(id, userId);
      
      await Audit.log({
        user_id: userId,
        entity: 'menu',
        entity_id: id,
        action: 'update_inline',
        before_json: antes,
        after_json: depois
      });

      return res.json({ ok: true, data: depois });
    } catch (err) {
      console.error('Erro ao atualizar prato (inline):', err);
      return res.status(500).json({ ok: false, msg: 'Erro ao atualizar prato.' });
    }
  },

  publicoPorUsuario: async (req, res) => {
    try {
      const usuarioId = Number(req.params.usuarioId);
      if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
        return res.status(400).send('ID de usuário inválido.');
      }

      const dono = await Usuario.findById(usuarioId);
      if (!dono || !dono.nome_empresa) {
        return res.status(404).send('Restaurante não encontrado.');
      }

      // Salvar o restauranteId na sessão para uso no checkout
      req.session.restauranteId = usuarioId;

      const itens = await Menu.getPublicByUsuario(usuarioId);
      return res.render('vendas/cardapio_publico', {
        itens,
        empresaNome: dono.nome_empresa
      });
    } catch (err) {
      console.error('Erro ao carregar cardápio público:', err);
      return res.status(500).send('Erro ao carregar cardápio público.');
    }
  },

  buscarTamanhos: async (req, res) => {
    try {
      const { id } = req.params;
      const tamanhos = await Menu.buscarTamanhos(id);
      res.json(tamanhos);
    } catch (error) {
      console.error('Erro ao buscar tamanhos:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  salvarTamanhos: async (req, res) => {
    try {
      const { id } = req.params;
      const { tamanhos } = req.body;

      console.log('Body recebido:', req.body);

      if (!tamanhos || !Array.isArray(tamanhos)) {
        return res.status(400).json({ 
          ok: false, 
          msg: 'Formato inválido: esperado array de tamanhos' 
        });
      }

      const tamanhosValidos = tamanhos.filter(t => 
        t.tamanho && t.preco !== undefined && t.preco !== null
      );

      console.log('Tamanhos válidos:', tamanhosValidos);
      
      if (tamanhosValidos.length === 0) {
        return res.status(400).json({ 
          ok: false, 
          msg: 'Nenhum tamanho válido foi fornecido' 
        });
      }
      
      await Menu.criarTamanhos(id, tamanhosValidos);
      res.json({ ok: true, msg: 'Tamanhos salvos com sucesso' });
    } catch (error) {
      console.error('Erro ao salvar tamanhos:', error);
      res.status(500).json({ 
        ok: false, 
        msg: 'Erro interno do servidor' 
      });
    }
  },

  buscarProduto: async (req, res) => {
    try {
      const { id } = req.params;
      const usuarioId = req.session.userId;
      
      if (!usuarioId) {
        return res.status(401).json({ ok: false, msg: 'Usuário não autenticado' });
      }
      
      const produto = await Menu.getById(id, usuarioId);
      
      if (!produto) {
        return res.status(404).json({ ok: false, msg: 'Produto não encontrado' });
      }

      const tamanhos = await Menu.buscarTamanhos(id);
      produto.tamanhos = tamanhos;
      
      res.json({ ok: true, produto });
    } catch (error) {
      console.error('Erro ao buscar produto:', error);
      res.status(500).json({ ok: false, msg: 'Erro interno do servidor' });
    }
  },
};
