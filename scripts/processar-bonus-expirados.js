const db = require('../db');
const Funcionario = require('../src/models/sistema/funcionario/funcionarioModel');

async function processarBonusExpirados() {
  try {
    console.log('Verificando bônus expirados...');

    const [bonusExpirados] = await db.query(`
      SELECT h.*, f.nome as funcionario_nome, f.salario as salario_atual
      FROM historico_salarial h
      INNER JOIN funcionarios f ON h.funcionario_id = f.id
      WHERE h.tipo = 'Bônus' 
      AND h.duracao_meses IS NOT NULL
      AND DATE_ADD(h.data_reajuste, INTERVAL h.duracao_meses MONTH) <= CURDATE()
      AND (h.bonus_revertido IS NULL OR h.bonus_revertido = 0)
    `);
    
    if (bonusExpirados.length === 0) {
      console.log('Nenhum bônus expirado encontrado.');
      return;
    }
    
    console.log(`Encontrados ${bonusExpirados.length} bônus expirados.`);
    
    for (const bonus of bonusExpirados) {
      try {
        await Funcionario.update(bonus.funcionario_id, { salario: bonus.salario_anterior }, null);

        await db.query(
          'UPDATE historico_salarial SET bonus_revertido = 1, data_reversao = CURDATE() WHERE id = ?',
          [bonus.id]
        );
        
        console.log(`✅ Bônus revertido para ${bonus.funcionario_nome}: R$ ${bonus.salario_atual} → R$ ${bonus.salario_anterior}`);
        
      } catch (error) {
        console.error(`❌ Erro ao processar bônus do funcionário ${bonus.funcionario_nome}:`, error);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro na verificação:', error);
  }
}

if (require.main === module) {
  processarBonusExpirados()
    .then(() => {
      console.log('✅ Verificação concluída.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro:', error);
      process.exit(1);
    });
}

module.exports = { processarBonusExpirados };