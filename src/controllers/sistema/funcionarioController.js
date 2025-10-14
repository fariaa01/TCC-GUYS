const Funcionario = require('../../models/sistema/funcionario/funcionarioModel');
const GastosFixos = require('../../models/sistema/financeiro/gastos-fixosModel');
const HistoricoSalarial = require('../../models/sistema/funcionario/historicoSalarialModel');

function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function limparValorMonetario(valor) {
  if (valor === null || valor === undefined) return 0;
  
  if (typeof valor === 'number') return valor;
  
  if (typeof valor === 'string') {
    const valorLimpo = valor
      .replace(/R\$\s*/g, '')
      .replace(/\s/g, '')
      .replace(/\./g, '') 
      .replace(/,/g, '.'); 
    
    const numeroLimpo = parseFloat(valorLimpo) || 0;
    return numeroLimpo;
  }
  
  return 0;
}

async function findGastoFixoSalarioByNome(nomeFuncionario, userId) {
  const lista = await GastosFixos.getAll(userId);
  const nomeOld = `Salário - ${nomeFuncionario}`;
  return (lista || []).find(g => g.nome === nomeOld) || null;
}

module.exports = {
  listar: async (req, res) => {
    try {
      const bonusProcessados = await HistoricoSalarial.processarBonusExpiradosAutomatico();
      
      if (bonusProcessados > 0) {
        console.log(`[funcionarioController.listar] ${bonusProcessados} bônus expirados foram processados automaticamente`);
      }
      
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 5;
      const search = req.query.search || '';
      
      const result = await Funcionario.getAll(req.session.userId, { page, limit, search });
      
      res.render('sistema/funcionario', { 
        funcionarios: result.funcionarios,
        pagination: result.pagination,
        search: search
      });
    } catch (error) {
      console.error('[funcionarioController.listar] Erro:', error);
      const result = await Funcionario.getAll(req.session.userId, { page: 1, limit: 5 });
      res.render('sistema/funcionario', { 
        funcionarios: result.funcionarios,
        pagination: result.pagination,
        search: ''
      });
    }
  },

  criar: async (req, res) => {
    try {
      const userId = req.session.userId;
      const dados = { ...req.body };

      if (req.file) {
        dados.foto = req.file.filename;
      }

      await Funcionario.create(dados, userId);

      const salarioLimpo = limparValorMonetario(dados.salario);
      if (salarioLimpo > 0) {
        dados.salario = salarioLimpo;
        const existente = await findGastoFixoSalarioByNome(dados.nome, userId);
        if (!existente) {
          await GastosFixos.create(
            {
              nome: `Salário - ${dados.nome}`,
              valor: salarioLimpo,
              data_inicio: dados.data_admissao || todayStr(),
              data_fim: null,
              recorrencia: 'mensal',
              observacao: `Salário do funcionário ${dados.nome}`
            },
            userId
          );
        }
      }

      res.redirect('/funcionarios?ok=1&msg=' + encodeURIComponent('Funcionário cadastrado com sucesso!'));
    } catch (error) {
      if (error.message === 'CPF_DUPLICADO') {
        return res.redirect('/funcionarios?ok=0&msg=' + encodeURIComponent('Este CPF já está vinculado a um funcionário.'));
      }
      console.error('Erro ao criar funcionário:', error);
      res.redirect('/funcionarios?ok=0&msg=' + encodeURIComponent('Ocorreu um erro ao cadastrar o funcionário.'));
    }
  },

  atualizar: async (req, res) => {
    try {
      const userId = req.session.userId;
      const id = req.params.id;

      const antes = await Funcionario.getById(id, userId);
      
      const dados = { ...req.body };
      if (req.file) {
        dados.foto = req.file.filename;
      }
      
      await Funcionario.update(id, dados, userId);

      const nomeNovo = req.body.nome || (antes && antes.nome);
      const salarioNovo = req.body.salario !== undefined ? limparValorMonetario(req.body.salario) : (antes ? limparValorMonetario(antes.salario) : 0);

      if (nomeNovo) {
        const fixos = await GastosFixos.getAll(userId);
        const nomeAntigo = antes ? `Salário - ${antes.nome}` : null;
        const nomePossivelNovo = `Salário - ${nomeNovo}`;
        let gf = null;

        if (nomeAntigo) gf = (fixos || []).find(g => g.nome === nomeAntigo) || null;
        if (!gf) gf = (fixos || []).find(g => g.nome === nomePossivelNovo) || null;

        if (salarioNovo > 0) {
          if (gf) {
            await GastosFixos.update(
              gf.id,
              {
                nome: nomePossivelNovo,
                valor: salarioNovo,
                data_fim: null,
                recorrencia: 'mensal',
                observacao: `Salário do funcionário ${nomeNovo}`
              },
              userId
            );
          } else {
            await GastosFixos.create(
              {
                nome: nomePossivelNovo,
                valor: salarioNovo,
                data_inicio: todayStr(),
                data_fim: null,
                recorrencia: 'mensal',
                observacao: `Salário do funcionário ${nomeNovo}`
              },
              userId
            );
          }
        } else if (gf && (!req.body.salario || Number(req.body.salario) <= 0)) {
          await GastosFixos.update(gf.id, { data_fim: todayStr() }, userId);
        }
      }

      res.redirect('/funcionarios?ok=1&msg=' + encodeURIComponent('Funcionário atualizado com sucesso!'));
    } catch (error) {
      console.error('Erro ao atualizar funcionário:', error);
      res.redirect('/funcionarios?ok=0&msg=' + encodeURIComponent('Ocorreu um erro ao atualizar o funcionário.'));
    }
  },

  deletar: async (req, res) => {
    try {
      const userId = req.session.userId;
      const id = req.params.id;

      const func = await Funcionario.getById(id, userId);
      await Funcionario.delete(id, userId);

      if (func && func.nome) {
        const gf = await findGastoFixoSalarioByNome(func.nome, userId);
        if (gf) {
          await GastosFixos.update(gf.id, { data_fim: todayStr() }, userId);
        }
      }

      res.redirect('/funcionarios?ok=1&msg=' + encodeURIComponent('Funcionário excluído com sucesso!'));
    } catch (error) {
      console.error('Erro ao deletar funcionário:', error);
      res.redirect('/funcionarios?ok=0&msg=' + encodeURIComponent('Ocorreu um erro ao excluir o funcionário.'));
    }
  },

  obterHistoricoSalarial: async (req, res) => {
    try {
      const { funcionario_id } = req.params;
      console.log(`[obterHistoricoSalarial] Buscando histórico para funcionário ID: ${funcionario_id}`);
      
      await HistoricoSalarial.processarBonusExpiradosAutomatico();
      
      const historico = await HistoricoSalarial.obterPorFuncionario(funcionario_id);
      const estatisticas = await HistoricoSalarial.calcularEstatisticas(funcionario_id);
      
      console.log(`[obterHistoricoSalarial] Histórico encontrado:`, historico);
      console.log(`[obterHistoricoSalarial] Estatísticas calculadas:`, estatisticas);
      
      res.json({
        success: true,
        historico,
        estatisticas
      });
    } catch (error) {
      console.error('Erro ao obter histórico salarial:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  },
  
  criarReajusteSalarial: async (req, res) => {
    try {
      const { funcionario_id, tipo, salario_anterior, salario_novo, cargo_anterior, cargo_novo, data_reajuste, motivo, duracao_meses } = req.body;
      
      console.log('Dados recebidos:', req.body);

      if (!funcionario_id || !tipo || !salario_anterior || !salario_novo || !data_reajuste) {
        console.log('Validação falhou:', { funcionario_id, tipo, salario_anterior, salario_novo, data_reajuste });
        return res.status(400).json({
          success: false,
          message: 'Dados obrigatórios não fornecidos'
        });
      }

      if (tipo === 'Bônus' && !duracao_meses) {
        return res.status(400).json({
          success: false,
          message: 'Duração em meses é obrigatória para bônus'
        });
      }
 
      const funcionario = await Funcionario.getById(funcionario_id, req.session.userId);
      if (!funcionario) {
        return res.status(404).json({
          success: false,
          message: 'Funcionário não encontrado'
        });
      }
      
      console.log('Funcionário encontrado:', funcionario.nome);

      const salarioAnteriorLimpo = limparValorMonetario(salario_anterior);
      const salarioNovoLimpo = limparValorMonetario(salario_novo);
      
      console.log('Valores limpos:', {
        salario_anterior_original: salario_anterior,
        salario_anterior_limpo: salarioAnteriorLimpo,
        salario_novo_original: salario_novo,
        salario_novo_limpo: salarioNovoLimpo
      });

      let salarioNovoCalculado;
      if (tipo === 'Bônus') {
        salarioNovoCalculado = salarioAnteriorLimpo + salarioNovoLimpo;
        console.log(`Calculando bônus: ${salarioAnteriorLimpo} + ${salarioNovoLimpo} = ${salarioNovoCalculado}`);
      } else {
        salarioNovoCalculado = salarioNovoLimpo;
      }

      const dadosHistorico = {
        funcionario_id: parseInt(funcionario_id),
        tipo,
        salario_anterior: salarioAnteriorLimpo,
        salario_novo: salarioNovoCalculado,
        cargo_anterior: cargo_anterior || funcionario.cargo,
        cargo_novo: cargo_novo || cargo_anterior || funcionario.cargo,
        data_reajuste,
        motivo: motivo || null,
        usuario_responsavel: req.session.userId || null,
        duracao_meses: duracao_meses ? parseInt(duracao_meses) : null
      };
      
      console.log('Criando histórico com dados:', dadosHistorico);
      
      await HistoricoSalarial.criar(dadosHistorico);
      
      console.log('Histórico criado com sucesso');
      
      const dadosAtualizacao = {
        salario: salarioNovoCalculado
      };

      if (cargo_novo && cargo_novo !== cargo_anterior) {
        dadosAtualizacao.cargo = cargo_novo;
      }
      
      console.log('Atualizando funcionário:', dadosAtualizacao);
      
      await Funcionario.update(funcionario_id, dadosAtualizacao, req.session.userId);
      
      console.log('Funcionário atualizado com sucesso');
      
      res.json({
        success: true,
        message: 'Reajuste salarial registrado com sucesso'
      });
      
    } catch (error) {
      console.error('Erro detalhado ao criar reajuste salarial:', error);
      console.error('Stack trace:', error.stack);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor: ' + error.message
      });
    }
  }
};
