-- Tabela de Metas Financeiras
CREATE TABLE IF NOT EXISTS metas_financeiras (
  id INT PRIMARY KEY AUTO_INCREMENT,
  usuario_id INT NOT NULL,
  mes INT NOT NULL,
  ano INT NOT NULL,
  meta_receita DECIMAL(10,2) DEFAULT 0,
  meta_despesa DECIMAL(10,2) DEFAULT 0,
  meta_economia DECIMAL(10,2) DEFAULT 0,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  UNIQUE KEY unique_meta_mes (usuario_id, mes, ano)
);

-- Índices para melhor performance
CREATE INDEX idx_usuario_periodo ON metas_financeiras(usuario_id, mes, ano);
