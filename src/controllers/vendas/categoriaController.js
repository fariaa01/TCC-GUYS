const Categoria = require('../../models/vendas/categoriaModel');

module.exports = {
  /**
   * Lista todas as categorias do usuário (JSON)
   */
  async listar(req, res) {
    try {
      const usuarioId = req.session.userId;
      if (!usuarioId) {
        return res.status(401).json({ ok: false, msg: 'Não autenticado.' });
      }

      const categorias = await Categoria.listarPorUsuario(usuarioId);
      res.json({ ok: true, categorias });
    } catch (error) {
      console.error('Erro ao listar categorias:', error);
      res.status(500).json({ ok: false, msg: 'Erro ao listar categorias.' });
    }
  },

  /**
   * Cria uma nova categoria
   */
  async criar(req, res) {
    try {
      const usuarioId = req.session.userId;
      if (!usuarioId) {
        return res.status(401).json({ ok: false, msg: 'Não autenticado.' });
      }

      const { nome, icone, ordem } = req.body;

      if (!nome || nome.trim() === '') {
        return res.status(400).json({ ok: false, msg: 'Nome da categoria é obrigatório.' });
      }

      // Verificar se já existe
      const existe = await Categoria.existeNome(usuarioId, nome.trim());
      if (existe) {
        return res.status(409).json({ ok: false, msg: 'Já existe uma categoria com este nome.' });
      }

      const id = await Categoria.criar(usuarioId, {
        nome: nome.trim(),
        icone: icone || '📦',
        ordem: ordem || 0
      });

      res.json({ ok: true, msg: 'Categoria criada com sucesso!', id });
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      res.status(500).json({ ok: false, msg: 'Erro ao criar categoria.' });
    }
  },

  /**
   * Atualiza uma categoria
   */
  async atualizar(req, res) {
    try {
      const usuarioId = req.session.userId;
      if (!usuarioId) {
        return res.status(401).json({ ok: false, msg: 'Não autenticado.' });
      }

      const { id } = req.params;
      const { nome, icone, ordem } = req.body;

      // Verificar se a categoria existe e pertence ao usuário
      const categoria = await Categoria.buscarPorId(id, usuarioId);
      if (!categoria) {
        return res.status(404).json({ ok: false, msg: 'Categoria não encontrada.' });
      }

      // Verificar duplicação de nome
      if (nome && nome.trim() !== '') {
        const existe = await Categoria.existeNome(usuarioId, nome.trim(), id);
        if (existe) {
          return res.status(409).json({ ok: false, msg: 'Já existe uma categoria com este nome.' });
        }
      }

      await Categoria.atualizar(id, usuarioId, { nome, icone, ordem });

      res.json({ ok: true, msg: 'Categoria atualizada com sucesso!' });
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);
      res.status(500).json({ ok: false, msg: 'Erro ao atualizar categoria.' });
    }
  },

  /**
   * Exclui uma categoria
   */
  async excluir(req, res) {
    try {
      const usuarioId = req.session.userId;
      if (!usuarioId) {
        return res.status(401).json({ ok: false, msg: 'Não autenticado.' });
      }

      const { id } = req.params;

      // Verificar se a categoria existe e pertence ao usuário
      const categoria = await Categoria.buscarPorId(id, usuarioId);
      if (!categoria) {
        return res.status(404).json({ ok: false, msg: 'Categoria não encontrada.' });
      }

      await Categoria.excluir(id, usuarioId);

      res.json({ ok: true, msg: 'Categoria excluída com sucesso!' });
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);
      res.status(500).json({ ok: false, msg: 'Erro ao excluir categoria.' });
    }
  }
};
