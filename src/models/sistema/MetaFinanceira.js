const db = require('../../../db');

class MetaFinanceira {
  static async buscarOuCriarMetaMesAtual(usuarioId) {
    const dataAtual = new Date();
    const mes = dataAtual.getMonth() + 1;
    const ano = dataAtual.getFullYear();
    
    try {
      const [metas] = await db.query(
        'SELECT * FROM metas_financeiras WHERE usuario_id = ? AND mes = ? AND ano = ?',
        [usuarioId, mes, ano]
      );
      
      if (metas.length > 0) {
        return metas[0];
      }
      
      // Criar meta padrão se não existir
      const [result] = await db.query(
        'INSERT INTO metas_financeiras (usuario_id, mes, ano, meta_receita, meta_despesa, meta_economia) VALUES (?, ?, ?, 0, 0, 0)',
        [usuarioId, mes, ano]
      );
      
      return {
        id: result.insertId,
        usuario_id: usuarioId,
        mes,
        ano,
        meta_receita: 0,
        meta_despesa: 0,
        meta_economia: 0
      };
    } catch (error) {
      console.error('Erro ao buscar/criar meta:', error);
      throw error;
    }
  }
  
  static async atualizarMeta(id, dados) {
    try {
      const { meta_receita, meta_despesa, meta_economia } = dados;
      
      const [result] = await db.query(
        'UPDATE metas_financeiras SET meta_receita = ?, meta_despesa = ?, meta_economia = ? WHERE id = ?',
        [meta_receita, meta_despesa, meta_economia, id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Erro ao atualizar meta:', error);
      throw error;
    }
  }
  
  static async calcularProgresso(usuarioId, mes, ano) {
    try {
      // Buscar meta do período
      const [metas] = await db.query(
        'SELECT * FROM metas_financeiras WHERE usuario_id = ? AND mes = ? AND ano = ?',
        [usuarioId, mes, ano]
      );
      
      if (metas.length === 0) {
        return null;
      }
      
      const meta = metas[0];
      
      // Calcular totais reais do período
      const [totais] = await db.query(`
        SELECT 
          COALESCE(SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE 0 END), 0) as total_entradas,
          COALESCE(SUM(CASE WHEN tipo = 'saida' THEN valor ELSE 0 END), 0) as total_saidas
        FROM financeiro
        WHERE usuario_id = ? 
          AND MONTH(data) = ? 
          AND YEAR(data) = ?
      `, [usuarioId, mes, ano]);
      
      const totalEntradas = parseFloat(totais[0].total_entradas || 0);
      const totalSaidas = parseFloat(totais[0].total_saidas || 0);
      const saldo = totalEntradas - totalSaidas;
      
      // Calcular percentuais
      const percentualReceita = meta.meta_receita > 0 ? (totalEntradas / meta.meta_receita) * 100 : 0;
      const percentualDespesa = meta.meta_despesa > 0 ? (totalSaidas / meta.meta_despesa) * 100 : 0;
      const percentualEconomia = meta.meta_economia > 0 ? (saldo / meta.meta_economia) * 100 : 0;
      
      return {
        meta,
        realizado: {
          receita: totalEntradas,
          despesa: totalSaidas,
          economia: saldo
        },
        progresso: {
          receita: Math.min(percentualReceita, 100),
          despesa: Math.min(percentualDespesa, 100),
          economia: Math.min(percentualEconomia, 100)
        },
        alertas: {
          receita_atingida: percentualReceita >= 100,
          despesa_ultrapassada: percentualDespesa >= 100,
          economia_atingida: percentualEconomia >= 100
        }
      };
    } catch (error) {
      console.error('Erro ao calcular progresso:', error);
      throw error;
    }
  }
}

module.exports = MetaFinanceira;
