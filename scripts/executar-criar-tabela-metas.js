    const db = require('../db');
const fs = require('fs');
const path = require('path');

async function criarTabelaMetasFinanceiras() {
  try {
    console.log('📊 Criando tabela de metas financeiras...');
    
    const sqlPath = path.join(__dirname, 'criar-tabela-metas-financeiras.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    await db.query(sql);
    
    console.log('✅ Tabela metas_financeiras criada com sucesso!');
    console.log('🎯 Sistema de metas financeiras está pronto para uso.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao criar tabela:', error.message);
    process.exit(1);
  }
}

criarTabelaMetasFinanceiras();
