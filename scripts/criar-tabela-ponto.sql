-- Tabela de registros de ponto
CREATE TABLE IF NOT EXISTS registro_ponto (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  funcionario_id INT NOT NULL,
  data DATE NOT NULL,
  hora_entrada TIME,
  hora_saida TIME,
  horas_trabalhadas DECIMAL(5,2) DEFAULT 0,
  horas_extras DECIMAL(5,2) DEFAULT 0,
  adicional_noturno DECIMAL(5,2) DEFAULT 0,
  minutos_atraso INT DEFAULT 0,
  falta TINYINT(1) DEFAULT 0,
  justificativa_falta TEXT,
  justificativa TEXT,
  tipo_registro ENUM('manual', 'qrcode', 'automatico', 'biometria', 'app') DEFAULT 'manual',
  status ENUM('pendente', 'aprovado', 'rejeitado') DEFAULT 'pendente',
  observacoes TEXT,
  latitude DECIMAL(10,8) NULL,
  longitude DECIMAL(11,8) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_funcionario_data (funcionario_id, data),
  INDEX idx_usuario (usuario_id),
  INDEX idx_data (data)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de configuração de jornada de trabalho
CREATE TABLE IF NOT EXISTS jornada_trabalho (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  funcionario_id INT NOT NULL,
  horas_semanais DECIMAL(5,2) DEFAULT 44.00,
  horas_diarias DECIMAL(5,2) DEFAULT 8.00,
  tolerancia_minutos INT DEFAULT 10,
  inicio_expediente TIME DEFAULT '08:00:00',
  fim_expediente TIME DEFAULT '17:00:00',
  intervalo_minutos INT DEFAULT 60,
  horario_noturno_inicio TIME DEFAULT '22:00:00',
  horario_noturno_fim TIME DEFAULT '05:00:00',
  percentual_noturno DECIMAL(5,2) DEFAULT 20.00,
  dias_trabalho JSON DEFAULT NULL, -- ["seg", "ter", "qua", "qui", "sex"]
  ativo TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE KEY uk_usuario_funcionario (usuario_id, funcionario_id),
  INDEX idx_usuario (usuario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de banco de horas
CREATE TABLE IF NOT EXISTS banco_horas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  funcionario_id INT NOT NULL,
  saldo_horas DECIMAL(5,2) DEFAULT 0,
  mes_referencia DATE NOT NULL,
  horas_positivas DECIMAL(5,2) DEFAULT 0,
  horas_negativas DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY uk_funcionario_mes (funcionario_id, mes_referencia),
  INDEX idx_usuario (usuario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
