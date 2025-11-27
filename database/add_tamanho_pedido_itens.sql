-- Adicionar coluna tamanho na tabela pedido_itens
-- Execute este script no seu banco de dados

ALTER TABLE pedido_itens 
ADD COLUMN IF NOT EXISTS tamanho VARCHAR(10) NULL 
AFTER quantidade;

-- Criar índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_pedido_produto_tamanho 
ON pedido_itens(pedido_id, produto_id, tamanho);
