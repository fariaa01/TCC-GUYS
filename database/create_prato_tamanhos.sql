-- Criar tabela para os tamanhos e preços dos pratos
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
);

-- Verificar se a tabela foi criada
SHOW TABLES LIKE 'prato_tamanhos';

-- Verificar estrutura da tabela
DESCRIBE prato_tamanhos;