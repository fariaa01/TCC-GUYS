const Ponto = require('../../../models/sistema/ponto/pontoModel');
const db = require('../../../../db');

// Página principal de controle de ponto
exports.index = async (req, res) => {
  try {
    const usuarioId = req.session.userId;
    if (!usuarioId) return res.redirect('/login');

    const { funcionario_id, mes } = req.query;
    const mesAtual = mes || new Date().toISOString().substring(0, 7);

    // Buscar funcionários
    const [funcionarios] = await db.query(
      'SELECT id, nome, cpf FROM funcionarios WHERE usuario_id = ? ORDER BY nome',
      [usuarioId]
    );

    // Buscar registros
    const filtros = { mes: mesAtual };
    if (funcionario_id) filtros.funcionario_id = funcionario_id;

    const registros = await Ponto.listarRegistros(usuarioId, filtros);

    res.render('sistema/ponto/index', {
      funcionarios,
      registros,
      mesAtual,
      funcionario_id: funcionario_id || '',
      cspNonce: res.locals.cspNonce
    });
  } catch (error) {
    console.error('Erro ao listar ponto:', error);
    res.redirect('/dashboard?erro=Erro ao carregar registros de ponto');
  }
};

// Registrar ponto manual
exports.registrar = async (req, res) => {
  try {
    const usuarioId = req.session.userId;
    if (!usuarioId) return res.redirect('/login');

    const { funcionario_id, observacoes } = req.body;

    const resultado = await Ponto.registrarPonto({
      usuario_id: usuarioId,
      funcionario_id,
      tipo_registro: 'manual',
      observacoes
    });

    res.redirect(`/ponto?msg=${resultado.tipo === 'entrada' ? 'Entrada' : 'Saída'} registrada com sucesso às ${resultado.hora}`);
  } catch (error) {
    console.error('Erro ao registrar ponto:', error);
    res.redirect('/ponto?erro=Erro ao registrar ponto');
  }
};

// Página de registro rápido (para funcionário usar)
exports.registroRapido = async (req, res) => {
  try {
    const [funcionarios] = await db.query(
      'SELECT id, nome, cpf FROM funcionarios ORDER BY nome'
    );

    const { funcionario_id } = req.query;

    if (!funcionario_id) {
      return res.render('sistema/ponto/registro-rapido', {
        funcionarios,
        funcionario: null,
        ultimoRegistro: null,
        cspNonce: res.locals.cspNonce
      });
    }

    const [funcionarioSelecionado] = await db.query(
      'SELECT id, nome, cpf FROM funcionarios WHERE id = ?',
      [funcionario_id]
    );

    if (funcionarios.length === 0) {
      return res.redirect('/ponto/registro-rapido?erro=Funcionário não encontrado');
    }

    const ultimoRegistro = await Ponto.getUltimoRegistroHoje(funcionario_id);

    res.render('sistema/ponto/registro-rapido', {
      funcionario: funcionarios[0],
      ultimoRegistro,
      cspNonce: res.locals.cspNonce
    });
  } catch (error) {
    console.error('Erro ao carregar registro rápido:', error);
    res.redirect('/ponto?erro=Erro ao carregar página de registro');
  }
};

// Ver ponto de funcionário específico
exports.porFuncionario = async (req, res) => {
  try {
    const usuarioId = req.session.userId;
    if (!usuarioId) return res.redirect('/login');

    const funcionario_id = req.params.id;
    const mes = req.query.mes || new Date().toISOString().slice(0, 7);

    // Redirecionar para página principal com filtro
    res.redirect(`/ponto?funcionario_id=${funcionario_id}&mes=${mes}`);
  } catch (error) {
    console.error('Erro ao carregar ponto do funcionário:', error);
    res.redirect('/ponto?erro=Erro ao carregar dados do funcionário');
  }
};

// Registrar ponto manual com horários específicos
exports.registrarManual = async (req, res) => {
  try {
    const usuarioId = req.session.userId;
    if (!usuarioId) return res.redirect('/login');

    const { funcionario_id, data, hora_entrada, hora_saida, observacoes } = req.body;

    if (!hora_entrada && !hora_saida) {
      return res.redirect('/ponto?erro=Informe pelo menos um horário (entrada ou saída)');
    }

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // Verificar se já existe registro para esta data
      const [registros] = await conn.query(
        'SELECT * FROM registro_ponto WHERE funcionario_id = ? AND data = ?',
        [funcionario_id, data]
      );

      if (registros.length > 0) {
        // Atualizar registro existente
        let updateFields = [];
        let updateValues = [];

        if (hora_entrada) {
          updateFields.push('hora_entrada = ?');
          updateValues.push(hora_entrada);
        }
        if (hora_saida) {
          updateFields.push('hora_saida = ?');
          updateValues.push(hora_saida);
        }
        if (observacoes) {
          updateFields.push('observacoes = ?');
          updateValues.push(observacoes);
        }

        updateValues.push(registros[0].id);

        await conn.query(
          `UPDATE registro_ponto SET ${updateFields.join(', ')} WHERE id = ?`,
          updateValues
        );

        // Se ambos os horários estão preenchidos, calcular horas
        if ((registros[0].hora_entrada || hora_entrada) && (registros[0].hora_saida || hora_saida)) {
          const Ponto = require('../../../models/sistema/ponto/pontoModel');
          await Ponto.calcularHorasTrabalhadas(registros[0].id, conn);
        }
      } else {
        // Criar novo registro
        const [insert] = await conn.query(
          `INSERT INTO registro_ponto 
           (usuario_id, funcionario_id, data, hora_entrada, hora_saida, tipo_registro, observacoes)
           VALUES (?, ?, ?, ?, ?, 'manual', ?)`,
          [usuarioId, funcionario_id, data, hora_entrada, hora_saida, observacoes]
        );

        // Se ambos os horários foram informados, calcular
        if (hora_entrada && hora_saida) {
          const Ponto = require('../../../models/sistema/ponto/pontoModel');
          await Ponto.calcularHorasTrabalhadas(insert.insertId, conn);
        }
      }

      await conn.commit();
      res.redirect('/ponto?msg=Ponto registrado manualmente com sucesso');
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('Erro ao registrar ponto manual:', error);
    res.redirect('/ponto?erro=Erro ao registrar ponto');
  }
};

// Configurar jornada de trabalho
exports.configurarJornada = async (req, res) => {
  try {
    const usuarioId = req.session.userId;
    if (!usuarioId) return res.redirect('/login');

    const {
      funcionario_id,
      horas_semanais,
      horas_diarias,
      tolerancia_minutos,
      inicio_expediente,
      fim_expediente,
      intervalo_minutos,
      dias_trabalho
    } = req.body;

    await Ponto.configurarJornada({
      usuario_id: usuarioId,
      funcionario_id,
      horas_semanais,
      horas_diarias,
      tolerancia_minutos,
      inicio_expediente,
      fim_expediente,
      intervalo_minutos,
      dias_trabalho: dias_trabalho ? dias_trabalho.split(',') : null
    });

    res.redirect(`/ponto?msg=Jornada configurada com sucesso`);
  } catch (error) {
    console.error('Erro ao configurar jornada:', error);
    res.redirect('/ponto?erro=Erro ao configurar jornada');
  }
};

// Registrar falta
exports.registrarFalta = async (req, res) => {
  try {
    const usuarioId = req.session.userId;
    if (!usuarioId) return res.redirect('/login');

    const { funcionario_id, data, justificativa } = req.body;

    await Ponto.registrarFalta(usuarioId, funcionario_id, data, justificativa);

    res.json({ sucesso: true, mensagem: 'Falta registrada com sucesso' });
  } catch (error) {
    console.error('Erro ao registrar falta:', error);
    res.json({ sucesso: false, mensagem: 'Erro ao registrar falta' });
  }
};

// Editar ponto
exports.editar = async (req, res) => {
  try {
    const usuarioId = req.session.userId;
    if (!usuarioId) return res.status(401).json({ sucesso: false, mensagem: 'Não autorizado' });

    const { id, hora_entrada, hora_saida, observacoes } = req.body;

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // Verificar se o registro pertence ao usuário
      const [registros] = await conn.query(
        'SELECT id, funcionario_id FROM registro_ponto WHERE id = ? AND usuario_id = ?',
        [id, usuarioId]
      );

      if (registros.length === 0) {
        await conn.rollback();
        return res.status(404).json({ sucesso: false, mensagem: 'Registro não encontrado' });
      }

      // Atualizar o registro
      await conn.query(
        `UPDATE registro_ponto 
         SET hora_entrada = ?, hora_saida = ?, observacoes = ?
         WHERE id = ?`,
        [hora_entrada || null, hora_saida || null, observacoes || null, id]
      );

      // Recalcular horas se ambos entrada e saída estiverem presentes
      if (hora_entrada && hora_saida) {
        const Ponto = require('../../../models/sistema/ponto/pontoModel');
        await Ponto.calcularHorasTrabalhadas(id, conn);
      }

      await conn.commit();
      res.json({ sucesso: true, mensagem: 'Registro atualizado com sucesso' });
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('Erro ao editar ponto:', error);
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao editar ponto' });
  }
};

// Relatório de produtividade
exports.relatorioProdutividade = async (req, res) => {
  try {
    const usuarioId = req.session.userId;
    if (!usuarioId) return res.redirect('/login');

    const mes = req.query.mes || new Date().toISOString().substring(0, 7);
    const funcionarios = await Ponto.relatorioProdutividade(usuarioId, mes);

    res.render('sistema/ponto/produtividade', {
      funcionarios,
      mes,
      mesFormatado: new Date(mes + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
      cspNonce: res.locals.cspNonce
    });
  } catch (error) {
    console.error('Erro ao gerar relatório de produtividade:', error);
    res.redirect('/ponto?erro=Erro ao gerar relatório');
  }
};

// Buscar horário padrão do funcionário
exports.buscarHorarioPadrao = async (req, res) => {
  try {
    const usuarioId = req.session.userId;
    if (!usuarioId) return res.status(401).json({ sucesso: false, mensagem: 'Não autorizado' });

    const funcionario_id = req.params.funcionario_id;

    // Buscar jornada configurada
    const [jornadas] = await db.query(
      'SELECT inicio_expediente, fim_expediente FROM jornada_trabalho WHERE funcionario_id = ? AND usuario_id = ? AND ativo = 1',
      [funcionario_id, usuarioId]
    );

    if (jornadas.length > 0) {
      return res.json({
        sucesso: true,
        hora_entrada: jornadas[0].inicio_expediente ? jornadas[0].inicio_expediente.substring(0, 5) : null,
        hora_saida: jornadas[0].fim_expediente ? jornadas[0].fim_expediente.substring(0, 5) : null
      });
    }

    // Se não tem jornada configurada, buscar o último registro do funcionário
    const [registros] = await db.query(
      `SELECT hora_entrada, hora_saida FROM registro_ponto 
       WHERE funcionario_id = ? AND usuario_id = ? 
       AND hora_entrada IS NOT NULL AND hora_saida IS NOT NULL
       ORDER BY data DESC, id DESC LIMIT 1`,
      [funcionario_id, usuarioId]
    );

    if (registros.length > 0) {
      return res.json({
        sucesso: true,
        hora_entrada: registros[0].hora_entrada ? registros[0].hora_entrada.substring(0, 5) : null,
        hora_saida: registros[0].hora_saida ? registros[0].hora_saida.substring(0, 5) : null
      });
    }

    // Se não encontrou nada, retornar horários padrão
    res.json({
      sucesso: true,
      hora_entrada: '08:00',
      hora_saida: '17:00'
    });
  } catch (error) {
    console.error('Erro ao buscar horário padrão:', error);
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao buscar horário padrão' });
  }
};

// Relatório mensal
exports.relatorioMensal = async (req, res) => {
  try {
    const usuarioId = req.session.userId;
    if (!usuarioId) return res.redirect('/login');

    const { funcionario_id, mes } = req.query;
    const mesReferencia = mes || new Date().toISOString().substring(0, 7);

    if (!funcionario_id) {
      return res.redirect('/ponto?erro=Selecione um funcionário');
    }

    const [funcionarios] = await db.query(
      'SELECT id, nome, cpf FROM funcionarios WHERE id = ? AND usuario_id = ?',
      [funcionario_id, usuarioId]
    );

    if (funcionarios.length === 0) {
      return res.redirect('/ponto?erro=Funcionário não encontrado');
    }

    const relatorio = await Ponto.relatorioMensal(funcionario_id, mesReferencia);

    res.render('sistema/ponto/relatorio', {
      funcionario: funcionarios[0],
      mesReferencia,
      mesFormatado: new Date(mesReferencia + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
      registros: relatorio.registros,
      resumo: {
        total_dias: relatorio.registros.length,
        total_horas_trabalhadas: relatorio.totalHoras,
        total_horas_extras: relatorio.totalExtras,
        total_minutos_atraso: relatorio.totalAtrasos,
        total_faltas: relatorio.totalFaltas,
        total_adicional_noturno: relatorio.totalNoturno,
        banco_horas_saldo: relatorio.bancoHoras.saldo_horas || 0,
        banco_horas_positivas: relatorio.bancoHoras.horas_positivas || 0,
        banco_horas_negativas: relatorio.bancoHoras.horas_negativas || 0
      },
      cspNonce: res.locals.cspNonce
    });
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    res.redirect('/ponto?erro=Erro ao gerar relatório');
  }
};
