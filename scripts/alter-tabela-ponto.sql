-- ============================================
-- ALTER TABLE para atualizar tabelas de ponto
-- Execute este script no phpMyAdmin
-- ============================================

-- Atualizar tabela registro_ponto
ALTER TABLE registro_ponto
ADD COLUMN adicional_noturno DECIMAL(5,2) DEFAULT 0 AFTER horas_extras,
ADD COLUMN minutos_atraso INT DEFAULT 0 AFTER adicional_noturno,
ADD COLUMN falta TINYINT(1) DEFAULT 0 AFTER minutos_atraso,
ADD COLUMN justificativa_falta TEXT AFTER falta,
ADD COLUMN latitude DECIMAL(10,8) NULL AFTER observacoes,
ADD COLUMN longitude DECIMAL(11,8) NULL AFTER latitude,
MODIFY COLUMN tipo_registro ENUM('manual', 'qrcode', 'automatico', 'biometria', 'app') DEFAULT 'manual';

-- Atualizar tabela jornada_trabalho
ALTER TABLE jornada_trabalho
ADD COLUMN horario_noturno_inicio TIME DEFAULT '22:00:00' AFTER intervalo_minutos,
ADD COLUMN horario_noturno_fim TIME DEFAULT '05:00:00' AFTER horario_noturno_inicio,
ADD COLUMN percentual_noturno DECIMAL(5,2) DEFAULT 20.00 AFTER horario_noturno_fim;

-- Verificar se a tabela folha_pagamento_itens tem o campo observacoes
-- Se não tiver, adicionar
ALTER TABLE folha_pagamento_itens
ADD COLUMN IF NOT EXISTS observacoes TEXT AFTER salario_liquido;

-- Verificar as alterações
DESCRIBE registro_ponto;
DESCRIBE jornada_trabalho;
DESCRIBE folha_pagamento_itens;
