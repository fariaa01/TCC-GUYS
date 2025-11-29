const cron = require('node-cron');
const db = require('../../db');
const FolhaPagamento = require('../models/sistema/folha-pagamento/folhaPagamentoModel');
const Funcionario = require('../models/sistema/funcionario/funcionarioModel');

const TABELA_INSS = [
  { ate: 1412.00, aliquota: 0.075 },
  { ate: 2666.68, aliquota: 0.09 },
  { ate: 4000.03, aliquota: 0.12 },
  { ate: 7786.02, aliquota: 0.14 }
];

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

  return Math.min(inss, 7786.02 * 0.14);
}

function calcularFGTS(salarioBruto) {
  return salarioBruto * ALIQUOTA_FGTS;
}

async function gerarFolhaAutomatica() {
  const connection = await db.getConnection();
  
  try {
    console.log('[CRON] Iniciando geração automática de folhas de pagamento...');
    
    await connection.beginTransaction();

    const agora = new Date();
    const mes = agora.getMonth() + 1;
    const ano = agora.getFullYear();
s
    const [usuarios] = await connection.query('SELECT id FROM usuarios');

    let totalGeradas = 0;
    let totalErros = 0;

    for (const usuario of usuarios) {
      try {
        const userId = usuario.id;

        const folhaExistente = await FolhaPagamento.getByPeriodo(mes, ano, userId);
        if (folhaExistente) {
          console.log(`[CRON] Folha já existe para usuário ${userId} - ${mes}/${ano}`);
          continue;
        }

        const funcionarios = await Funcionario.getAllSimple(userId);
        const funcionariosAtivos = funcionarios.filter(f => 
          f.estado === 'empregado' || f.estado === 'Contratado'
        );

        if (funcionariosAtivos.length === 0) {
          console.log(`[CRON] Nenhum funcionário ativo para usuário ${userId}`);
          continue;
        }

        let totalBruto = 0;
        let totalDescontos = 0;
        let totalLiquido = 0;

        const folhaId = await FolhaPagamento.create({
          mes_referencia: mes,
          ano_referencia: ano,
          total_bruto: 0,
          total_descontos: 0,
          total_liquido: 0
        }, userId);

        for (const func of funcionariosAtivos) {
          const salarioBase = parseFloat(func.salario || 0);

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
          const totalProventos = salarioBase + bonus;
          
          const inss = calcularINSS(totalProventos);
          const fgts = calcularFGTS(totalProventos);
          const totalDescontosFunc = inss;
          const salarioLiquido = totalProventos - totalDescontosFunc;

          await FolhaPagamento.createItem({
            folha_id: folhaId,
            funcionario_id: func.id,
            salario_base: salarioBase,
            bonus: bonus,
            horas_extras: 0,
            valor_horas_extras: 0,
            outros_proventos: 0,
            total_proventos: totalProventos,
            inss: inss,
            fgts: fgts,
            vale_transporte: 0,
            vale_refeicao: 0,
            plano_saude: 0,
            outros_descontos: 0,
            total_descontos: totalDescontosFunc,
            salario_liquido: salarioLiquido
          });

          totalBruto += totalProventos;
          totalDescontos += totalDescontosFunc;
          totalLiquido += salarioLiquido;
        }

        // Atualizar totais da folha
        await FolhaPagamento.update(folhaId, {
          total_bruto: totalBruto,
          total_descontos: totalDescontos,
          total_liquido: totalLiquido
        }, userId);

        console.log(`[CRON] ✅ Folha gerada para usuário ${userId} - ${mes}/${ano} - ${funcionariosAtivos.length} funcionários`);
        totalGeradas++;

      } catch (error) {
        console.error(`[CRON] ❌ Erro ao gerar folha para usuário ${usuario.id}:`, error.message);
        totalErros++;
      }
    }

    await connection.commit();
    console.log(`[CRON] Finalizado: ${totalGeradas} folhas geradas, ${totalErros} erros`);

  } catch (error) {
    await connection.rollback();
    console.error('[CRON] Erro geral ao gerar folhas:', error);
  } finally {
    connection.release();
  }
}

const cronExpression = '0 0 25 * *';

function iniciarCronJobs() {
  console.log('[CRON] Agendador de folha de pagamento iniciado');
  console.log(`[CRON] Folhas serão geradas automaticamente todo dia 25 às 00:00`);
  
  cron.schedule(cronExpression, async () => {
    console.log('[CRON] Executando geração automática de folhas...');
    await gerarFolhaAutomatica();
  }, {
    timezone: "America/Sao_Paulo"
  });

}

module.exports = {
  iniciarCronJobs,
  gerarFolhaAutomatica
};
