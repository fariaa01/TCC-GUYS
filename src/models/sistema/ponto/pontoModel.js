const pool = require('../../../../db');

module.exports = {
  // Registrar ponto (entrada ou saída)
  async registrarPonto({ usuario_id, funcionario_id, tipo_registro = 'manual', observacoes = null }) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const dataHoje = new Date().toISOString().split('T')[0];
      const horaAtual = new Date().toTimeString().split(' ')[0];

      // Verificar se já existe registro de hoje
      const [registros] = await connection.query(
        'SELECT * FROM registro_ponto WHERE funcionario_id = ? AND data = ? ORDER BY id DESC LIMIT 1',
        [funcionario_id, dataHoje]
      );

      let resultado;

      if (registros.length === 0 || registros[0].hora_saida !== null) {
        // Novo registro de entrada
        const [insert] = await connection.query(
          `INSERT INTO registro_ponto (usuario_id, funcionario_id, data, hora_entrada, tipo_registro, observacoes)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [usuario_id, funcionario_id, dataHoje, horaAtual, tipo_registro, observacoes]
        );
        resultado = { tipo: 'entrada', id: insert.insertId, hora: horaAtual };
      } else {
        // Registrar saída
        const [update] = await connection.query(
          `UPDATE registro_ponto 
           SET hora_saida = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [horaAtual, registros[0].id]
        );

        // Calcular horas trabalhadas
        await this.calcularHorasTrabalhadas(registros[0].id, connection);

        resultado = { tipo: 'saida', id: registros[0].id, hora: horaAtual };
      }

      await connection.commit();
      return resultado;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // Calcular horas trabalhadas, extras, atrasos e adicional noturno
  async calcularHorasTrabalhadas(registro_id, connection = null) {
    const conn = connection || await pool.getConnection();
    
    try {
      const [registros] = await conn.query(
        'SELECT * FROM registro_ponto WHERE id = ?',
        [registro_id]
      );

      if (registros.length === 0 || !registros[0].hora_saida) return;

      const registro = registros[0];
      
      // Buscar jornada do funcionário
      const [jornadas] = await conn.query(
        'SELECT * FROM jornada_trabalho WHERE funcionario_id = ? AND ativo = 1',
        [registro.funcionario_id]
      );

      const jornada = jornadas[0] || { 
        horas_diarias: 8.00, 
        intervalo_minutos: 60,
        inicio_expediente: '08:00:00',
        tolerancia_minutos: 10,
        horario_noturno_inicio: '22:00:00',
        horario_noturno_fim: '05:00:00',
        percentual_noturno: 20.00
      };

      // Calcular diferença em minutos
      const entrada = new Date(`2000-01-01 ${registro.hora_entrada}`);
      const saida = new Date(`2000-01-01 ${registro.hora_saida}`);
      
      let minutosTrabalhados = (saida - entrada) / (1000 * 60);
      
      // Descontar intervalo
      minutosTrabalhados -= jornada.intervalo_minutos;

      const horasTrabalhadas = minutosTrabalhados / 60;
      const horasExtras = Math.max(0, horasTrabalhadas - jornada.horas_diarias);

      // Calcular atraso (entrada após horário esperado + tolerância)
      const horarioEsperado = new Date(`2000-01-01 ${jornada.inicio_expediente}`);
      horarioEsperado.setMinutes(horarioEsperado.getMinutes() + jornada.tolerancia_minutos);
      const minutosAtraso = Math.max(0, (entrada - horarioEsperado) / (1000 * 60));

      // Calcular adicional noturno (22h às 5h)
      const horasNoturnas = this.calcularHorasNoturnas(
        registro.hora_entrada, 
        registro.hora_saida,
        jornada.horario_noturno_inicio,
        jornada.horario_noturno_fim
      );

      await conn.query(
        `UPDATE registro_ponto 
         SET horas_trabalhadas = ?, 
             horas_extras = ?,
             adicional_noturno = ?,
             minutos_atraso = ?
         WHERE id = ?`,
        [
          horasTrabalhadas.toFixed(2), 
          horasExtras.toFixed(2),
          horasNoturnas.toFixed(2),
          Math.floor(minutosAtraso),
          registro_id
        ]
      );

      // Atualizar banco de horas
      await this.atualizarBancoHoras(registro.funcionario_id, registro.data, horasExtras, conn);

      if (!connection) conn.release();
    } catch (error) {
      if (!connection) conn.release();
      throw error;
    }
  },

  // Calcular horas trabalhadas em horário noturno (22h às 5h)
  calcularHorasNoturnas(hora_entrada, hora_saida, inicio_noturno = '22:00:00', fim_noturno = '05:00:00') {
    const entrada = new Date(`2000-01-01 ${hora_entrada}`);
    const saida = new Date(`2000-01-01 ${hora_saida}`);
    const noturnoInicio = new Date(`2000-01-01 ${inicio_noturno}`);
    const noturnoFim = new Date(`2000-01-02 ${fim_noturno}`); // Próximo dia para período noturno

    let minutosNoturnos = 0;

    // Se trabalhou durante a noite (22h-5h)
    if (saida < entrada) { // Virou o dia
      saida.setDate(saida.getDate() + 1);
    }

    // Calcular interseção com período noturno
    const inicioCalculo = entrada > noturnoInicio ? entrada : noturnoInicio;
    const fimCalculo = saida < noturnoFim ? saida : noturnoFim;

    if (inicioCalculo < fimCalculo) {
      minutosNoturnos = (fimCalculo - inicioCalculo) / (1000 * 60);
    }

    return minutosNoturnos / 60;
  },

  // Atualizar banco de horas
  async atualizarBancoHoras(funcionario_id, data, horas_extras, connection = null) {
    const conn = connection || await pool.getConnection();
    
    try {
      // Converter data para string se for objeto Date
      const dataStr = data instanceof Date ? data.toISOString().split('T')[0] : data;
      const mesReferencia = dataStr.substring(0, 7) + '-01'; // YYYY-MM-01

      const [bancos] = await conn.query(
        'SELECT * FROM banco_horas WHERE funcionario_id = ? AND mes_referencia = ?',
        [funcionario_id, mesReferencia]
      );

      if (bancos.length === 0) {
        // Criar novo registro
        await conn.query(
          `INSERT INTO banco_horas (usuario_id, funcionario_id, mes_referencia, saldo_horas, horas_positivas)
           SELECT usuario_id, ?, ?, ?, ?
           FROM funcionarios WHERE id = ? LIMIT 1`,
          [funcionario_id, mesReferencia, horas_extras, horas_extras, funcionario_id]
        );
      } else {
        // Atualizar existente
        const novoSaldo = parseFloat(bancos[0].saldo_horas) + parseFloat(horas_extras);
        const novasPositivas = parseFloat(bancos[0].horas_positivas) + parseFloat(horas_extras);

        await conn.query(
          `UPDATE banco_horas 
           SET saldo_horas = ?, horas_positivas = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [novoSaldo.toFixed(2), novasPositivas.toFixed(2), bancos[0].id]
        );
      }

      if (!connection) conn.release();
    } catch (error) {
      if (!connection) conn.release();
      throw error;
    }
  },

  // Listar registros de ponto
  async listarRegistros(usuario_id, filtros = {}) {
    let sql = `
      SELECT 
        rp.*,
        f.nome as funcionario_nome,
        f.cpf as funcionario_cpf,
        DATE_FORMAT(rp.data, '%d/%m/%Y') as data_formatada,
        TIME_FORMAT(rp.hora_entrada, '%H:%i') as entrada_formatada,
        TIME_FORMAT(rp.hora_saida, '%H:%i') as saida_formatada
      FROM registro_ponto rp
      INNER JOIN funcionarios f ON rp.funcionario_id = f.id
      WHERE rp.usuario_id = ?
    `;
    const params = [usuario_id];

    if (filtros.funcionario_id) {
      sql += ' AND rp.funcionario_id = ?';
      params.push(filtros.funcionario_id);
    }

    if (filtros.data_inicio && filtros.data_fim) {
      sql += ' AND rp.data BETWEEN ? AND ?';
      params.push(filtros.data_inicio, filtros.data_fim);
    } else if (filtros.mes) {
      sql += ' AND DATE_FORMAT(rp.data, "%Y-%m") = ?';
      params.push(filtros.mes);
    }

    sql += ' ORDER BY rp.data DESC, rp.hora_entrada DESC LIMIT 100';

    const [rows] = await pool.query(sql, params);
    return rows;
  },

  // Buscar último registro do dia
  async getUltimoRegistroHoje(funcionario_id) {
    const dataHoje = new Date().toISOString().split('T')[0];
    
    const [rows] = await pool.query(
      `SELECT rp.*, f.nome as funcionario_nome
       FROM registro_ponto rp
       INNER JOIN funcionarios f ON rp.funcionario_id = f.id
       WHERE rp.funcionario_id = ? AND rp.data = ?
       ORDER BY rp.id DESC LIMIT 1`,
      [funcionario_id, dataHoje]
    );

    return rows[0] || null;
  },

  // Configurar jornada de trabalho
  async configurarJornada(dados) {
    const sql = `
      INSERT INTO jornada_trabalho 
        (usuario_id, funcionario_id, horas_semanais, horas_diarias, tolerancia_minutos, 
         inicio_expediente, fim_expediente, intervalo_minutos, dias_trabalho)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        horas_semanais = VALUES(horas_semanais),
        horas_diarias = VALUES(horas_diarias),
        tolerancia_minutos = VALUES(tolerancia_minutos),
        inicio_expediente = VALUES(inicio_expediente),
        fim_expediente = VALUES(fim_expediente),
        intervalo_minutos = VALUES(intervalo_minutos),
        dias_trabalho = VALUES(dias_trabalho)
    `;

    const diasTrabalho = dados.dias_trabalho ? JSON.stringify(dados.dias_trabalho) : null;

    const [result] = await pool.query(sql, [
      dados.usuario_id,
      dados.funcionario_id,
      dados.horas_semanais || 44,
      dados.horas_diarias || 8,
      dados.tolerancia_minutos || 10,
      dados.inicio_expediente || '08:00:00',
      dados.fim_expediente || '17:00:00',
      dados.intervalo_minutos || 60,
      diasTrabalho
    ]);

    return result;
  },

  // Registrar falta
  async registrarFalta(usuario_id, funcionario_id, data, justificativa = null) {
    const [result] = await pool.query(
      `INSERT INTO registro_ponto 
       (usuario_id, funcionario_id, data, falta, justificativa_falta, tipo_registro, status)
       VALUES (?, ?, ?, 1, ?, 'manual', 'pendente')`,
      [usuario_id, funcionario_id, data, justificativa]
    );

    // Atualizar banco de horas negativo
    const [jornadas] = await pool.query(
      'SELECT horas_diarias FROM jornada_trabalho WHERE funcionario_id = ? AND ativo = 1',
      [funcionario_id]
    );

    const horasFalta = jornadas[0]?.horas_diarias || 8;
    await this.atualizarBancoHoras(funcionario_id, data, -horasFalta);

    return result;
  },

  // Relatório de produtividade (atrasos, horas extras, faltas)
  async relatorioProdutividade(usuario_id, mes) {
    const sql = `
      SELECT 
        f.id as funcionario_id,
        f.nome as funcionario_nome,
        f.cargo,
        COUNT(DISTINCT rp.data) as dias_trabalhados,
        SUM(CASE WHEN rp.falta = 1 THEN 1 ELSE 0 END) as total_faltas,
        SUM(rp.minutos_atraso) as total_minutos_atraso,
        ROUND(AVG(rp.minutos_atraso), 0) as media_atraso,
        SUM(rp.horas_trabalhadas) as total_horas,
        SUM(rp.horas_extras) as total_horas_extras,
        SUM(rp.adicional_noturno) as total_adicional_noturno,
        bh.saldo_horas as banco_horas_saldo
      FROM funcionarios f
      LEFT JOIN registro_ponto rp ON f.id = rp.funcionario_id 
        AND DATE_FORMAT(rp.data, '%Y-%m') = ?
      LEFT JOIN banco_horas bh ON f.id = bh.funcionario_id 
        AND DATE_FORMAT(bh.mes_referencia, '%Y-%m') = ?
      WHERE f.usuario_id = ?
      GROUP BY f.id, f.nome, f.cargo, bh.saldo_horas
      ORDER BY total_horas_extras DESC, total_minutos_atraso DESC
    `;

    const [funcionarios] = await pool.query(sql, [mes, mes, usuario_id]);
    return funcionarios;
  },

  // Relatório mensal de ponto
  async relatorioMensal(funcionario_id, mes) {
    const sql = `
      SELECT 
        rp.*,
        DATE_FORMAT(rp.data, '%d/%m/%Y') as data_formatada,
        DAYNAME(rp.data) as dia_semana,
        TIME_FORMAT(rp.hora_entrada, '%H:%i') as entrada_formatada,
        TIME_FORMAT(rp.hora_saida, '%H:%i') as saida_formatada
      FROM registro_ponto rp
      WHERE rp.funcionario_id = ? 
        AND DATE_FORMAT(rp.data, '%Y-%m') = ?
      ORDER BY rp.data ASC
    `;

    const [registros] = await pool.query(sql, [funcionario_id, mes]);

    // Calcular totais
    const totalHoras = registros.reduce((sum, r) => sum + parseFloat(r.horas_trabalhadas || 0), 0);
    const totalExtras = registros.reduce((sum, r) => sum + parseFloat(r.horas_extras || 0), 0);
    const totalAtrasos = registros.reduce((sum, r) => sum + parseInt(r.minutos_atraso || 0), 0);
    const totalFaltas = registros.filter(r => r.falta === 1).length;
    const totalNoturno = registros.reduce((sum, r) => sum + parseFloat(r.adicional_noturno || 0), 0);

    // Buscar banco de horas
    const [banco] = await pool.query(
      'SELECT * FROM banco_horas WHERE funcionario_id = ? AND DATE_FORMAT(mes_referencia, "%Y-%m") = ?',
      [funcionario_id, mes]
    );

    return {
      registros,
      totalHoras: totalHoras.toFixed(2),
      totalExtras: totalExtras.toFixed(2),
      totalAtrasos: Math.floor(totalAtrasos),
      totalFaltas,
      totalNoturno: totalNoturno.toFixed(2),
      bancoHoras: banco[0] || { saldo_horas: 0, horas_positivas: 0, horas_negativas: 0 }
    };
  }
};
