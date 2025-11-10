const db = require('../../../db');

module.exports = {
  async listarPorUsuario(usuarioId) {
    const [rows] = await db.query(
      'SELECT * FROM categorias_menu WHERE usuario_id = ? AND ativo = 1 ORDER BY ordem ASC, nome ASC',
      [usuarioId]
    );
    return rows;
  },

  async buscarPorId(id, usuarioId) {
    const [rows] = await db.query(
      'SELECT * FROM categorias_menu WHERE id = ? AND usuario_id = ?',
      [id, usuarioId]
    );
    return rows[0] || null;
  },

  async criar(usuarioId, { nome, icone = '📦', ordem = 0 }) {
    const [result] = await db.query(
      'INSERT INTO categorias_menu (usuario_id, nome, icone, ordem) VALUES (?, ?, ?, ?)',
      [usuarioId, nome, icone, ordem]
    );
    return result.insertId;
  },

  async atualizar(id, usuarioId, { nome, icone, ordem }) {
    const updates = [];
    const values = [];

    if (nome !== undefined) {
      updates.push('nome = ?');
      values.push(nome);
    }
    if (icone !== undefined) {
      updates.push('icone = ?');
      values.push(icone);
    }
    if (ordem !== undefined) {
      updates.push('ordem = ?');
      values.push(ordem);
    }

    if (updates.length === 0) return false;

    values.push(id, usuarioId);

    await db.query(
      `UPDATE categorias_menu SET ${updates.join(', ')} WHERE id = ? AND usuario_id = ?`,
      values
    );
    return true;
  },

  async excluir(id, usuarioId) {
    await db.query(
      'UPDATE categorias_menu SET ativo = 0 WHERE id = ? AND usuario_id = ?',
      [id, usuarioId]
    );
    return true;
  },

  async excluirPermanente(id, usuarioId) {
    await db.query(
      'DELETE FROM categorias_menu WHERE id = ? AND usuario_id = ?',
      [id, usuarioId]
    );
    return true;
  },

  async existeNome(usuarioId, nome, idExcluir = null) {
    let sql = 'SELECT COUNT(*) as total FROM categorias_menu WHERE usuario_id = ? AND nome = ?';
    const params = [usuarioId, nome];

    if (idExcluir) {
      sql += ' AND id != ?';
      params.push(idExcluir);
    }

    const [rows] = await db.query(sql, params);
    return rows[0].total > 0;
  }
};
