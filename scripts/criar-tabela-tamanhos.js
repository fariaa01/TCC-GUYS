// Script para criar a tabela prato_tamanhos
const pool = require('../db');

async function criarTabela() {
    let connection;
    try {
        connection = await pool.getConnection();
        
        console.log('Conectado ao banco de dados tcc_db...\n');
        
        // SQL para criar a tabela
        const createTableSQL = `
            CREATE TABLE IF NOT EXISTS prato_tamanhos (
              id INT AUTO_INCREMENT PRIMARY KEY,
              prato_id INT NOT NULL,
              tamanho VARCHAR(10) NOT NULL COMMENT 'P, M, G, GG, etc',
              preco DECIMAL(10,2) NOT NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              
              FOREIGN KEY (prato_id) REFERENCES menu(id) ON DELETE CASCADE,
              UNIQUE KEY unique_prato_tamanho (prato_id, tamanho),
              INDEX idx_prato_id (prato_id)
            )
        `;
        
        console.log('Criando tabela prato_tamanhos...');
        await connection.query(createTableSQL);
        console.log('✓ Tabela criada com sucesso!\n');
        
        // Verificar se a tabela foi criada
        console.log('Verificando tabelas...');
        const [tables] = await connection.query("SHOW TABLES LIKE 'prato_tamanhos'");
        console.log('✓ Tabela encontrada:', tables);
        console.log('');
        
        // Verificar estrutura da tabela
        console.log('Verificando estrutura da tabela...');
        const [structure] = await connection.query('DESCRIBE prato_tamanhos');
        console.log('✓ Estrutura da tabela:');
        console.table(structure);
        
        console.log('\n✓ Script executado com sucesso!');
        
    } catch (error) {
        console.error('Erro ao criar tabela:', error.message);
        console.error('Código do erro:', error.code);
        if (error.code === 'ER_NO_SUCH_TABLE') {
            console.error('\nA tabela "menu" não existe. Crie-a primeiro antes de criar prato_tamanhos.');
        }
        process.exit(1);
    } finally {
        if (connection) connection.release();
        await pool.end();
    }
}

criarTabela();
