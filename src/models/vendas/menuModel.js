const db = require('../../../db');

const ALLOWED_COLUMNS = new Set([
  'nome_prato','preco','descricao','imagem','ingredientes','categoria','tamanho','porcao',
  'destaque','is_disponivel','arquivado','atualizado_por'
]);

function buildUpdateSet(data) {
  const keys = Object.keys(data).filter(k => ALLOWED_COLUMNS.has(k) && data[k] !== undefined);
  if (!keys.length) return { setSql: '', vals: [] };
  const setSql = keys.map(k => `${k} = ?`).join(', ');
  const vals = keys.map(k => data[k]);
  return { setSql, vals };
}

module.exports = {
  getAllByUsuario: async (usuarioId, { incluirArquivados = true } = {}) => {
    let sql = 'SELECT * FROM menu WHERE usuario_id = ?';
    const params = [usuarioId];
    if (!incluirArquivados) {
      sql += ' AND (arquivado IS NULL OR arquivado = 0)';
    }
    sql += ' ORDER BY COALESCE(arquivado,0) ASC, id DESC';
    const [rows] = await db.query(sql, params);
    return rows;
  },

  getById: async (id, usuarioId) => {
    const [rows] = await db.query(
      'SELECT * FROM menu WHERE id = ? AND usuario_id = ? LIMIT 1',
      [id, usuarioId]
    );
    return rows[0] || null;
  },

  create: async (dados) => {
    const {
      nome_prato, preco, descricao = null, imagem = null, usuario_id,
      destaque = 0, ingredientes = null, categoria = null, tamanho = null, porcao = null,
      is_disponivel = 1, arquivado = 0, atualizado_por = null
    } = dados;

    const sql = `
      INSERT INTO menu
        (nome_prato, preco, descricao, imagem, usuario_id, destaque, ingredientes, categoria, tamanho, porcao, is_disponivel, arquivado, atualizado_por)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(sql, [
      nome_prato, preco, descricao, imagem, usuario_id,
      destaque ? 1 : 0, ingredientes, categoria, tamanho, porcao,
      is_disponivel ? 1 : 0, arquivado ? 1 : 0, atualizado_por
    ]);
    
    return result.insertId;
  },

  update: async (id, dados) => {
    if (dados.imagem === undefined) {
      delete dados.imagem;
    }
    const { setSql, vals } = buildUpdateSet(dados);
    if (!setSql) return;
    const sql = `UPDATE menu SET ${setSql} WHERE id = ?`;
    vals.push(id);
    await db.query(sql, vals);
  },

  updatePartial: async (id, usuarioId, data) => {
    const { setSql, vals } = buildUpdateSet(data);
    if (!setSql) return;
    const sql = `UPDATE menu SET ${setSql} WHERE id = ? AND usuario_id = ?`;
    vals.push(id, usuarioId);
    await db.query(sql, vals);
  },

  delete: async (id) => {
    await db.query('DELETE FROM menu WHERE id = ?', [id]);
  },

  getPublicByUsuario: async (usuarioId) => {
    const [rows] = await db.query(
      `SELECT id, nome_prato, preco, descricao, imagem, destaque
         FROM menu
        WHERE usuario_id = ?
          AND COALESCE(arquivado, 0) = 0
          AND COALESCE(is_disponivel, 1) = 1
        ORDER BY destaque DESC, nome_prato ASC`,
      [usuarioId]
    );
    return rows;
  },

  async criarTamanhos(pratoId, tamanhosPrecos) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      await connection.execute('DELETE FROM prato_tamanhos WHERE prato_id = ?', [pratoId]);

      for (const item of tamanhosPrecos) {
        await connection.execute(
          'INSERT INTO prato_tamanhos (prato_id, tamanho, preco) VALUES (?, ?, ?)',
          [pratoId, item.tamanho, item.preco]
        );
      }

      await connection.commit();  
    }
    catch (error) {
      await connection.rollback();
      throw error;
    }
    finally {
      connection.release();
    }
  },

  async buscarTamanhos(pratoId) {
    const [rows] = await db.execute(
      'SELECT id, tamanho, preco FROM prato_tamanhos WHERE prato_id = ? ORDER BY tamanho',
      [pratoId]
    );
    return rows;
  },

  async listarTodos(usuario_id) {
    const [pratos] = await db.execute(`

      SELECT p.*, 
             JSON_ARRAYAGG(
               CASE WHEN pt.id IS NOT NULL 
               THEN JSON_OBJECT('id', pt.id, 'tamanho', pt.tamanho, 'preco', pt.preco)
               ELSE NULL END
             ) as tamanhos_json
      FROM pratos p
      LEFT JOIN prato_tamanhos pt ON p.id = pt.prato_id
      WHERE p.usuario_id = ?
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `, [usuario_id]);

    return pratos.map(prato => ({
      ...prato,
      tamanhos: prato.tamanhos_json ? prato.tamanhos_json.filter(t => t !== null) : []
    }));
  }
};
