const db = require('../db');

async function corrigirSalarios() {
  try {
    console.log('🔧 Iniciando correção de salários multiplicados...\n');

    const [funcionarios] = await db.query(
      'SELECT id, nome, salario, usuario_id FROM funcionarios WHERE salario > 50000'
    );

    console.log(`📋 Encontrados ${funcionarios.length} funcionários com salários suspeitos\n`);

    let totalCorrigidos = 0;
    let totalGastosFixosCorrigidos = 0;

    for (const func of funcionarios) {
      const salarioAtual = parseFloat(func.salario);
      const salarioCorrigido = salarioAtual / 100;

      console.log(`👤 ${func.nome}`);
      console.log(`   Salário atual: R$ ${salarioAtual.toFixed(2)}`);
      console.log(`   Salário corrigido: R$ ${salarioCorrigido.toFixed(2)}`);

      await db.query(
        'UPDATE funcionarios SET salario = ? WHERE id = ?',
        [salarioCorrigido, func.id]
      );
      totalCorrigidos++;

      const nomeGastoFixo = `Salário - ${func.nome}`;
      const [gastosFixos] = await db.query(
        'SELECT id, valor FROM gastos_fixos WHERE usuario_id = ? AND nome = ?',
        [func.usuario_id, nomeGastoFixo]
      );

      if (gastosFixos.length > 0) {
        for (const gasto of gastosFixos) {
          const valorGastoAtual = parseFloat(gasto.valor);
          if (valorGastoAtual > 50000) {
            const valorGastoCorrigido = valorGastoAtual / 100;
            await db.query(
              'UPDATE gastos_fixos SET valor = ? WHERE id = ?',
              [valorGastoCorrigido, gasto.id]
            );
            console.log(`   ✅ Gasto fixo corrigido: R$ ${valorGastoAtual.toFixed(2)} → R$ ${valorGastoCorrigido.toFixed(2)}`);
            totalGastosFixosCorrigidos++;
          }
        }
      }

      console.log('');
    }

    console.log('\n📊 RESUMO DA CORREÇÃO');
    console.log('═'.repeat(50));
    console.log(`Total de salários corrigidos: ${totalCorrigidos}`);
    console.log(`Total de gastos fixos corrigidos: ${totalGastosFixosCorrigidos}`);
    console.log('═'.repeat(50));
    console.log('\n✅ Correção concluída com sucesso!\n');

  } catch (error) {
    console.error('\n❌ Erro ao corrigir salários:', error);
    throw error;
  } finally {
    await db.end();
  }
}

// Executar o script
corrigirSalarios()
  .then(() => {
    console.log('Script finalizado.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Erro fatal:', error);
    process.exit(1);
  });
