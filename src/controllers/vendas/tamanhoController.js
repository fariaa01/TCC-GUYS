const Tamanho = require('../../models/vendas/tamanhoModel');

module.exports = {
  listar: async (req, res) => {
    try {
      const usuarioId = req.session.userId;
      const tamanhos = await Tamanho.listarPorUsuario(usuarioId);
      res.json({ ok: true, tamanhos });
    } catch (error) {
      console.error('Erro ao listar tamanhos:', error);
      res.status(500).json({ ok: false, msg: 'Erro ao listar tamanhos' });
    }
  },

  criar: async (req, res) => {
    try {
      const usuarioId = req.session.userId;
      const { nome, ordem = 0 } = req.body;

      if (!nome || nome.trim() === '') {
        return res.status(400).json({ ok: false, msg: 'Nome do tamanho é obrigatório' });
      }

      const jaExiste = await Tamanho.existeNome(usuarioId, nome);
      if (jaExiste) {
        return res.status(400).json({ ok: false, msg: 'Já existe um tamanho com este nome' });
      }

      const id = await Tamanho.criar(usuarioId, nome, ordem);
      res.json({ ok: true, msg: 'Tamanho criado com sucesso', id });
    } catch (error) {
      console.error('Erro ao criar tamanho:', error);
      res.status(500).json({ ok: false, msg: 'Erro ao criar tamanho' });
    }
  },

  // Atualizar tamanho
  atualizar: async (req, res) => {
    try {
      const usuarioId = req.session.userId;
      const { id } = req.params;
      const { nome, ordem = 0 } = req.body;

      // Validações
      if (!nome || nome.trim() === '') {
        return res.status(400).json({ ok: false, msg: 'Nome do tamanho é obrigatório' });
      }

      // Verificar se o tamanho existe
      const tamanho = await Tamanho.buscarPorId(id, usuarioId);
      if (!tamanho) {
        return res.status(404).json({ ok: false, msg: 'Tamanho não encontrado' });
      }

      // Verificar se já existe outro tamanho com o mesmo nome
      const jaExiste = await Tamanho.existeNome(usuarioId, nome, id);
      if (jaExiste) {
        return res.status(400).json({ ok: false, msg: 'Já existe um tamanho com este nome' });
      }

      const sucesso = await Tamanho.atualizar(id, usuarioId, nome, ordem);
      if (sucesso) {
        res.json({ ok: true, msg: 'Tamanho atualizado com sucesso' });
      } else {
        res.status(400).json({ ok: false, msg: 'Não foi possível atualizar o tamanho' });
      }
    } catch (error) {
      console.error('Erro ao atualizar tamanho:', error);
      res.status(500).json({ ok: false, msg: 'Erro ao atualizar tamanho' });
    }
  },

  // Excluir tamanho
  excluir: async (req, res) => {
    try {
      const usuarioId = req.session.userId;
      const { id } = req.params;

      const sucesso = await Tamanho.excluir(id, usuarioId);
      if (sucesso) {
        res.json({ ok: true, msg: 'Tamanho excluído com sucesso' });
      } else {
        res.status(404).json({ ok: false, msg: 'Tamanho não encontrado' });
      }
    } catch (error) {
      console.error('Erro ao excluir tamanho:', error);
      res.status(500).json({ ok: false, msg: 'Erro ao excluir tamanho' });
    }
  }
};
