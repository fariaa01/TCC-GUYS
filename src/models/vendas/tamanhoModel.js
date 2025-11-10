const db = require('../../../db');

const Tamanho = {
  listarPorUsuario: async (usuarioId) => {
    const [rows] = await db.query(
      'SELECT * FROM tamanhos_personalizados WHERE usuario_id = ? ORDER BY ordem ASC, nome ASC',
      [usuarioId]
    );
    return rows;
  },

  buscarPorId: async (id, usuarioId) => {
    const [rows] = await db.query(
      'SELECT * FROM tamanhos_personalizados WHERE id = ? AND usuario_id = ?',
      [id, usuarioId]
    );
    return rows[0] || null;
  },

  // Criar novo tamanho
  criar: async (usuarioId, nome, ordem = 0) => {
    const [result] = await db.query(
      'INSERT INTO tamanhos_personalizados (usuario_id, nome, ordem) VALUES (?, ?, ?)',
      [usuarioId, nome.trim(), ordem]
    );
    return result.insertId;
  },

  // Atualizar tamanho
  atualizar: async (id, usuarioId, nome, ordem) => {
    const [result] = await db.query(
      'UPDATE tamanhos_personalizados SET nome = ?, ordem = ? WHERE id = ? AND usuario_id = ?',
      [nome.trim(), ordem, id, usuarioId]
    );
    return result.affectedRows > 0;
  },

  // Excluir tamanho
  excluir: async (id, usuarioId) => {
    const [result] = await db.query(
      'DELETE FROM tamanhos_personalizados WHERE id = ? AND usuario_id = ?',
      [id, usuarioId]
    );
    return result.affectedRows > 0;
  },

  // Verificar se já existe um tamanho com o mesmo nome para o usuário
  existeNome: async (usuarioId, nome, excluirId = null) => {
    let sql = 'SELECT id FROM tamanhos_personalizados WHERE usuario_id = ? AND nome = ?';
    const params = [usuarioId, nome.trim()];
    
    if (excluirId) {
      sql += ' AND id != ?';
      params.push(excluirId);
    }
    
    const [rows] = await db.query(sql, params);
    return rows.length > 0;
  }
};

module.exports = Tamanho;
