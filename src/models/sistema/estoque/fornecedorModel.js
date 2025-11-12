const pool = require('../../../../db');

function onlyDigits(str = '') {
  return String(str).replace(/\D+/g, '');
}

module.exports = {
  async create({ nome, email, cnpj, telefone }, usuarioId) {
    if (!usuarioId) throw new Error('usuarioId ausente em fornecedorModel.create');

    const cnpjDigits = cnpj ? onlyDigits(cnpj) : null;
    // Verifica duplicidade de CNPJ para o mesmo usuário antes de inserir
    if (cnpjDigits) {
      const [existing] = await pool.execute(
        'SELECT id FROM fornecedores WHERE usuario_id = ? AND cnpj = ? LIMIT 1',
        [usuarioId, cnpjDigits]
      );
      if (existing && existing.length > 0) {
        const err = new Error('CNPJ já cadastrado para este usuário');
        err.code = 'DUP_CNPJ';
        throw err;
      }
    }
    // Inserir apenas colunas básicas que existem na maioria dos esquemas.
    const sql = `
      INSERT INTO fornecedores
        (usuario_id, nome, email, cnpj, telefone, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    `;
    const params = [
      usuarioId,
      nome,
      email || null,
      cnpjDigits || null,
      telefone || null
    ];
    const [result] = await pool.execute(sql, params);
    return { id: result.insertId };
  },

  async listarTodos(usuarioId) {
    if (!usuarioId) throw new Error('usuarioId ausente em listarTodos');
    // Selecionar apenas id/nome garante compatibilidade com o dropdown do estoque
    const sql = `SELECT id, nome FROM fornecedores WHERE usuario_id = ? ORDER BY nome ASC`;
    const [rows] = await pool.query(sql, [usuarioId]);
    return rows;
  },


  

  async findAll(usuarioId) {
    return module.exports.listarTodos(usuarioId);
  },

  async getAll(usuarioId) {
    return module.exports.listarTodos(usuarioId);
  },

  async update(id, data = {}, usuarioId) {
    if (!usuarioId) throw new Error('usuarioId ausente em fornecedorModel.update');
    if (!id) throw new Error('id ausente em fornecedorModel.update');

    // Atualizar apenas colunas básicas para evitar ER_BAD_FIELD_ERROR
    const sql = `
      UPDATE fornecedores SET
        nome = ?, email = ?, cnpj = ?, telefone = ?, updated_at = NOW()
      WHERE id = ? AND usuario_id = ?
    `;
    const params = [
      data.nome,
      data.email || null,
      data.cnpj || null,
      data.telefone || null,
      id,
      usuarioId
    ];
    const [result] = await pool.execute(sql, params);
    return result.affectedRows > 0;
  },

  async delete(id, usuarioId) {
    if (!usuarioId) throw new Error('usuarioId ausente em fornecedorModel.delete');
    if (!id) throw new Error('id ausente em fornecedorModel.delete');

    const sql = `DELETE FROM fornecedores WHERE id = ? AND usuario_id = ?`;
    const [result] = await pool.execute(sql, [id, usuarioId]);
    return result.affectedRows > 0;
  },

  async getById(id, usuarioId) {
    const [rows] = await pool.execute(
      'SELECT * FROM fornecedores WHERE id = ? AND usuario_id = ?',
      [id, usuarioId]
    );
    return rows[0] || null;
  },
};