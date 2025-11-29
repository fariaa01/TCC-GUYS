const db = require('../../../../db');

module.exports = {
  getAll: async (usuarioId) => {
    const [rows] = await db.query(`
      SELECT 
        fp.*,
        COUNT(fpi.id) as total_funcionarios
      FROM folhas_pagamento fp
      LEFT JOIN folhas_pagamento_itens fpi ON fp.id = fpi.folha_id
      WHERE fp.usuario_id = ?
      GROUP BY fp.id
      ORDER BY fp.ano_referencia DESC, fp.mes_referencia DESC
    `, [usuarioId]);
    return rows;
  },

  getById: async (id, usuarioId) => {
    const [rows] = await db.query(
      'SELECT * FROM folhas_pagamento WHERE id = ? AND usuario_id = ?',
      [id, usuarioId]
    );
    return rows[0];
  },

  getByPeriodo: async (mes, ano, usuarioId) => {
    const [rows] = await db.query(
      'SELECT * FROM folhas_pagamento WHERE mes_referencia = ? AND ano_referencia = ? AND usuario_id = ?',
      [mes, ano, usuarioId]
    );
    return rows[0];
  },

  create: async (dados, usuarioId) => {
    const { mes_referencia, ano_referencia, total_bruto, total_descontos, total_liquido, observacoes } = dados;
    const [result] = await db.query(`
      INSERT INTO folhas_pagamento 
      (usuario_id, mes_referencia, ano_referencia, total_bruto, total_descontos, total_liquido, observacoes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [usuarioId, mes_referencia, ano_referencia, total_bruto, total_descontos, total_liquido, observacoes || null]);
    return result.insertId;
  },

  update: async (id, dados, usuarioId) => {
    const campos = [];
    const valores = [];

    if (dados.status !== undefined) {
      campos.push('status = ?');
      valores.push(dados.status);
    }
    if (dados.data_pagamento !== undefined) {
      campos.push('data_pagamento = ?');
      valores.push(dados.data_pagamento);
    }
    if (dados.total_bruto !== undefined) {
      campos.push('total_bruto = ?');
      valores.push(dados.total_bruto);
    }
    if (dados.total_descontos !== undefined) {
      campos.push('total_descontos = ?');
      valores.push(dados.total_descontos);
    }
    if (dados.total_liquido !== undefined) {
      campos.push('total_liquido = ?');
      valores.push(dados.total_liquido);
    }
    if (dados.observacoes !== undefined) {
      campos.push('observacoes = ?');
      valores.push(dados.observacoes);
    }

    if (campos.length === 0) return;

    valores.push(id, usuarioId);
    await db.query(
      `UPDATE folhas_pagamento SET ${campos.join(', ')} WHERE id = ? AND usuario_id = ?`,
      valores
    );
  },

  delete: async (id, usuarioId) => {
    await db.query('DELETE FROM folhas_pagamento WHERE id = ? AND usuario_id = ?', [id, usuarioId]);
  },

  getItens: async (folhaId) => {
    const [rows] = await db.query(`
      SELECT 
        fpi.*,
        f.nome as funcionario_nome,
        f.cpf as funcionario_cpf,
        f.cargo as funcionario_cargo
      FROM folhas_pagamento_itens fpi
      INNER JOIN funcionarios f ON fpi.funcionario_id = f.id
      WHERE fpi.folha_id = ?
      ORDER BY f.nome
    `, [folhaId]);
    return rows;
  },

  createItem: async (dados) => {
    const {
      folha_id, funcionario_id, salario_base, bonus, horas_extras, valor_horas_extras,
      outros_proventos, total_proventos, inss, fgts, vale_transporte, vale_refeicao,
      plano_saude, outros_descontos, total_descontos, salario_liquido, observacoes
    } = dados;

    const [result] = await db.query(`
      INSERT INTO folhas_pagamento_itens 
      (folha_id, funcionario_id, salario_base, bonus, horas_extras, valor_horas_extras,
       outros_proventos, total_proventos, inss, fgts, vale_transporte, vale_refeicao,
       plano_saude, outros_descontos, total_descontos, salario_liquido, observacoes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      folha_id, funcionario_id, salario_base, bonus || 0, horas_extras || 0, valor_horas_extras || 0,
      outros_proventos || 0, total_proventos, inss || 0, fgts || 0, vale_transporte || 0, vale_refeicao || 0,
      plano_saude || 0, outros_descontos || 0, total_descontos, salario_liquido, observacoes || null
    ]);
    return result.insertId;
  },

  updateItem: async (id, dados) => {
    const campos = [];
    const valores = [];

    Object.keys(dados).forEach(campo => {
      if (dados[campo] !== undefined) {
        campos.push(`${campo} = ?`);
        valores.push(dados[campo]);
      }
    });

    if (campos.length === 0) return;

    valores.push(id);
    await db.query(
      `UPDATE folhas_pagamento_itens SET ${campos.join(', ')} WHERE id = ?`,
      valores
    );
  }
};
