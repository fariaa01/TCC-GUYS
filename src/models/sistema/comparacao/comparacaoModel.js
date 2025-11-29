const pool = require('../../../../db');

module.exports = {
  async compararProduto(produto_nome, usuario_id) {
    const sql = `
      SELECT 
        e.fornecedor as fornecedor_nome,
        e.produto,
        e.categoria,
        e.unidade_medida,
        MIN(e.valor) as menor_preco,
        MAX(e.valor) as maior_preco,
        AVG(e.valor) as preco_medio,
        COUNT(*) as total_compras,
        MAX(e.id) as ultima_compra_id,
        f.telefone as fornecedor_telefone,
        f.cidade as fornecedor_cidade,
        f.id as fornecedor_id
      FROM estoque e
      LEFT JOIN fornecedores f ON e.fornecedor COLLATE utf8mb4_unicode_ci = f.nome COLLATE utf8mb4_unicode_ci 
        AND f.usuario_id = e.usuario_id
      WHERE e.produto = ? 
        AND e.usuario_id = ?
        AND e.valor > 0
      GROUP BY e.fornecedor, e.produto, e.categoria, e.unidade_medida, f.telefone, f.cidade, f.id
      ORDER BY menor_preco ASC
    `;
    const [rows] = await pool.execute(sql, [produto_nome, usuario_id]);
    return rows;
  },

  async getHistoricoCompras(produto_nome, fornecedor_nome, usuario_id) {
    const sql = `
      SELECT 
        id,
        produto,
        categoria,
        quantidade,
        valor,
        validade,
        fornecedor,
        DATE_FORMAT(validade, '%d/%m/%Y') as data_compra_formatada
      FROM estoque
      WHERE produto = ? 
        AND fornecedor = ?
        AND usuario_id = ?
        AND valor > 0
      ORDER BY id DESC
      LIMIT 20
    `;
    const [rows] = await pool.execute(sql, [produto_nome, fornecedor_nome, usuario_id]);
    return rows;
  },

  async listarProdutosComPrecos(usuario_id) {
    const sql = `
      SELECT 
        e.produto as nome,
        e.categoria,
        e.unidade_medida,
        COUNT(DISTINCT e.fornecedor) as total_fornecedores,
        MIN(e.valor) as menor_preco,
        MAX(e.valor) as maior_preco,
        AVG(e.valor) as preco_medio,
        COUNT(*) as total_compras
      FROM estoque e
      WHERE e.usuario_id = ? AND e.valor > 0
      GROUP BY e.produto, e.categoria, e.unidade_medida
      HAVING COUNT(DISTINCT e.fornecedor) > 0
      ORDER BY e.produto ASC
    `;
    const [rows] = await pool.execute(sql, [usuario_id]);
    return rows;
  },

  async melhorFornecedorGeral(usuario_id) {
    const sql = `
      SELECT 
        e.fornecedor as nome,
        COUNT(DISTINCT e.produto) as produtos_mais_baratos,
        AVG(e.valor) as preco_medio_geral,
        COUNT(*) as total_compras
      FROM estoque e
      INNER JOIN (
        SELECT produto, MIN(valor) as menor_preco
        FROM estoque
        WHERE usuario_id = ? AND valor > 0
        GROUP BY produto
      ) min_precos ON e.produto = min_precos.produto 
        AND e.valor = min_precos.menor_preco
      WHERE e.usuario_id = ? AND e.valor > 0
      GROUP BY e.fornecedor
      ORDER BY produtos_mais_baratos DESC, preco_medio_geral ASC
      LIMIT 3
    `;
    const [rows] = await pool.execute(sql, [usuario_id, usuario_id]);
    return rows;
  }
};
