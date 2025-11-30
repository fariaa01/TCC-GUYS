const FolhaPagamento = require('../../../models/sistema/folha-pagamento/folhaPagamentoModel');
const Funcionario = require('../../../models/sistema/funcionario/funcionarioModel');
const HistoricoSalarial = require('../../../models/sistema/funcionario/historicoSalarialModel');
const Financeiro = require('../../../models/sistema/financeiro/financeiroModel');
const db = require('../../../../db');

const TABELA_INSS = [
  { ate: 1412.00, aliquota: 0.075 },
  { ate: 2666.68, aliquota: 0.09 },
  { ate: 4000.03, aliquota: 0.12 },
  { ate: 7786.02, aliquota: 0.14 }
];

const TETO_INSS = 7786.02;
const ALIQUOTA_FGTS = 0.08;

function calcularINSS(salarioBruto) {
  if (salarioBruto <= 0) return 0;
  
  let inss = 0;
  let salarioRestante = salarioBruto;
  let faixaAnterior = 0;

  for (const faixa of TABELA_INSS) {
    if (salarioRestante <= 0) break;
    
    const limiteFaixa = faixa.ate - faixaAnterior;
    const valorFaixa = Math.min(salarioRestante, limiteFaixa);
    inss += valorFaixa * faixa.aliquota;
    
    salarioRestante -= valorFaixa;
    faixaAnterior = faixa.ate;
  }

  return Math.min(inss, TETO_INSS * 0.14);
}

function calcularFGTS(salarioBruto) {
  return salarioBruto * ALIQUOTA_FGTS;
}

module.exports = {
  listar: async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.redirect('/login');

      const folhas = await FolhaPagamento.getAll(userId);

      res.render('sistema/folha-pagamento/index', {
        folhas,
        meses: [
          'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
          'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ]
      });
    } catch (error) {
      console.error('Erro ao listar folhas:', error);
      res.status(500).send('Erro ao carregar folhas de pagamento');
    }
  },

  visualizar: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.session.userId;
      if (!userId) return res.redirect('/login');

      const folha = await FolhaPagamento.getById(id, userId);
      if (!folha) {
        return res.redirect('/folha-pagamento?erro=Folha não encontrada');
      }

      const itens = await FolhaPagamento.getItens(id);

      res.render('sistema/folha-pagamento/detalhes', {
        folha,
        itens,
        meses: [
          'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
          'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ]
      });
    } catch (error) {
      console.error('Erro ao visualizar folha:', error);
      res.redirect('/folha-pagamento?erro=Erro ao carregar detalhes');
    }
  },

  gerar: async (req, res) => {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const userId = req.session.userId;
      if (!userId) return res.redirect('/login');

      let { mes, ano } = req.body;

      if (!mes || !ano) {
        const agora = new Date();
        mes = mes || agora.getMonth() + 1;
        ano = ano || agora.getFullYear();
      }

      mes = parseInt(mes);
      ano = parseInt(ano);

      const folhaExistente = await FolhaPagamento.getByPeriodo(mes, ano, userId);
      if (folhaExistente) {
        await connection.rollback();
        return res.redirect(`/folha-pagamento?erro=Já existe folha de pagamento para ${mes}/${ano}`);
      }

      // Buscar funcionários ativos
      const funcionarios = await Funcionario.getAllSimple(userId);
      const funcionariosAtivos = funcionarios.filter(f => f.estado === 'empregado' || f.estado === 'Contratado');

      if (funcionariosAtivos.length === 0) {
        await connection.rollback();
        return res.redirect('/folha-pagamento?erro=Nenhum funcionário ativo encontrado');
      }

      let totalBruto = 0;
      let totalDescontos = 0;
      let totalLiquido = 0;

      // Criar a folha
      const folhaId = await FolhaPagamento.create({
        mes_referencia: mes,
        ano_referencia: ano,
        total_bruto: 0,
        total_descontos: 0,
        total_liquido: 0
      }, userId);

      for (const func of funcionariosAtivos) {
        const salarioBase = parseFloat(func.salario || 0);

        // Buscar dados do ponto para o mês/ano
        const mesReferencia = `${ano}-${String(mes).padStart(2, '0')}`;
        
        const [dadosPonto] = await connection.query(`
          SELECT 
            COALESCE(SUM(rp.horas_extras), 0) as total_horas_extras,
            COALESCE(SUM(rp.adicional_noturno), 0) as total_adicional_noturno,
            COALESCE(SUM(CASE WHEN rp.falta = 1 THEN 1 ELSE 0 END), 0) as total_faltas,
            COALESCE(SUM(rp.minutos_atraso), 0) as total_minutos_atraso,
            jt.horas_diarias,
            jt.percentual_noturno
          FROM registro_ponto rp
          LEFT JOIN jornada_trabalho jt ON rp.funcionario_id = jt.funcionario_id AND jt.ativo = 1
          WHERE rp.funcionario_id = ?
            AND DATE_FORMAT(rp.data, '%Y-%m') = ?
          GROUP BY jt.horas_diarias, jt.percentual_noturno
        `, [func.id, mesReferencia]);

        const pontoFunc = dadosPonto[0] || {
          total_horas_extras: 0,
          total_adicional_noturno: 0,
          total_faltas: 0,
          total_minutos_atraso: 0,
          horas_diarias: 8,
          percentual_noturno: 20
        };

        // Calcular valor da hora
        const valorHora = salarioBase / 220; // 220 horas mensais (padrão CLT)
        
        // Horas extras (50% a mais)
        const valorHorasExtras = parseFloat(pontoFunc.total_horas_extras) * valorHora * 1.5;
        
        // Adicional noturno (percentual configurado)
        const percentualNoturno = parseFloat(pontoFunc.percentual_noturno || 20) / 100;
        const valorAdicionalNoturno = parseFloat(pontoFunc.total_adicional_noturno) * valorHora * (1 + percentualNoturno);
        
        // Desconto de faltas (dia completo)
        const valorDescFaltas = parseFloat(pontoFunc.total_faltas) * (salarioBase / 30);
        
        // Desconto de atrasos (proporcional)
        const valorDescAtrasos = (parseFloat(pontoFunc.total_minutos_atraso) / 60) * valorHora;

        const [bonusAtivos] = await connection.query(`
          SELECT SUM(salario_novo - salario_anterior) as total_bonus
          FROM historico_salarial
          WHERE funcionario_id = ?
            AND tipo = 'bonus'
            AND duracao_meses IS NOT NULL
            AND DATE_ADD(data_reajuste, INTERVAL duracao_meses MONTH) >= CURDATE()
            AND bonus_revertido = 0
        `, [func.id]);

        const bonus = parseFloat(bonusAtivos[0]?.total_bonus || 0);
        
        // Total de proventos (salário + bônus + horas extras + adicional noturno)
        const outrosProventos = valorHorasExtras + valorAdicionalNoturno;
        const totalProventos = salarioBase + bonus + outrosProventos;

        // Calcular descontos
        const inss = calcularINSS(totalProventos);
        const fgts = calcularFGTS(totalProventos);
        const outrosDescontos = valorDescFaltas + valorDescAtrasos;
        const totalDescontosFunc = inss + outrosDescontos;
        const salarioLiquido = totalProventos - totalDescontosFunc;

        // Criar item com observações do ponto
        let observacoes = [];
        if (pontoFunc.total_horas_extras > 0) {
          observacoes.push(`${pontoFunc.total_horas_extras}h extras (R$ ${valorHorasExtras.toFixed(2)})`);
        }
        if (pontoFunc.total_adicional_noturno > 0) {
          observacoes.push(`${pontoFunc.total_adicional_noturno}h noturnas (R$ ${valorAdicionalNoturno.toFixed(2)})`);
        }
        if (pontoFunc.total_faltas > 0) {
          observacoes.push(`${pontoFunc.total_faltas} falta(s) (desc. R$ ${valorDescFaltas.toFixed(2)})`);
        }
        if (pontoFunc.total_minutos_atraso > 0) {
          observacoes.push(`${pontoFunc.total_minutos_atraso} min atraso (desc. R$ ${valorDescAtrasos.toFixed(2)})`);
        }

        await FolhaPagamento.createItem({
          folha_id: folhaId,
          funcionario_id: func.id,
          salario_base: salarioBase,
          bonus: bonus,
          horas_extras: parseFloat(pontoFunc.total_horas_extras),
          valor_horas_extras: valorHorasExtras,
          outros_proventos: valorAdicionalNoturno,
          total_proventos: totalProventos,
          inss: inss,
          fgts: fgts,
          vale_transporte: 0,
          vale_refeicao: 0,
          plano_saude: 0,
          outros_descontos: outrosDescontos,
          total_descontos: totalDescontosFunc,
          salario_liquido: salarioLiquido,
          observacoes: observacoes.length > 0 ? observacoes.join('; ') : null
        });

        totalBruto += totalProventos;
        totalDescontos += totalDescontosFunc;
        totalLiquido += salarioLiquido;
      }

      await FolhaPagamento.update(folhaId, {
        total_bruto: totalBruto,
        total_descontos: totalDescontos,
        total_liquido: totalLiquido
      }, userId);

      await connection.commit();

      res.redirect(`/folha-pagamento/${folhaId}?msg=Folha gerada com sucesso`);
    } catch (error) {
      await connection.rollback();
      console.error('Erro ao gerar folha:', error);
      res.redirect('/folha-pagamento?erro=Erro ao gerar folha de pagamento');
    } finally {
      connection.release();
    }
  },

  aprovar: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.session.userId;
      if (!userId) return res.redirect('/login');

      await FolhaPagamento.update(id, { status: 'aprovada' }, userId);

      res.redirect(`/folha-pagamento/${id}?msg=Folha aprovada com sucesso`);
    } catch (error) {
      console.error('Erro ao aprovar folha:', error);
      res.redirect(`/folha-pagamento/${id}?erro=Erro ao aprovar folha`);
    }
  },

  pagar: async (req, res) => {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const { id } = req.params;
      const userId = req.session.userId;
      if (!userId) return res.redirect('/login');

      const { data_pagamento } = req.body;

      const folha = await FolhaPagamento.getById(id, userId);
      if (!folha) {
        await connection.rollback();
        return res.redirect('/folha-pagamento?erro=Folha não encontrada');
      }

      await FolhaPagamento.update(id, {
        status: 'paga',
        data_pagamento: data_pagamento || new Date().toISOString().split('T')[0]
      }, userId);

      const meses = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
      ];
      const mesNome = meses[folha.mes_referencia - 1];

      await Financeiro.create({
        tipo: 'saida',
        categoria: 'Folha de Pagamento',
        valor: folha.total_liquido,
        data: data_pagamento || new Date().toISOString().split('T')[0],
        descricao: `Folha de Pagamento - ${mesNome}/${folha.ano_referencia}`
      }, userId);

      await connection.commit();

      res.redirect(`/folha-pagamento/${id}?msg=Pagamento registrado com sucesso`);
    } catch (error) {
      await connection.rollback();
      console.error('Erro ao registrar pagamento:', error);
      res.redirect(`/folha-pagamento/${id}?erro=Erro ao registrar pagamento`);
    } finally {
      connection.release();
    }
  },

  deletar: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.session.userId;
      if (!userId) return res.redirect('/login');

      await FolhaPagamento.delete(id, userId);

      res.redirect('/folha-pagamento?msg=Folha excluída com sucesso');
    } catch (error) {
      console.error('Erro ao deletar folha:', error);
      res.redirect('/folha-pagamento?erro=Erro ao excluir folha');
    }
  }
};
