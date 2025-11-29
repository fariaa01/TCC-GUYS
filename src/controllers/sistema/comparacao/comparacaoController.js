const Comparacao = require('../../../models/sistema/comparacao/comparacaoModel');

exports.listar = async (req, res) => {
  try {
    const usuarioId = req.session.userId;
    if (!usuarioId) return res.redirect('/login');

    const produtos = await Comparacao.listarProdutosComPrecos(usuarioId);

    res.render('sistema/comparacao/index', {
      produtos,
      cspNonce: res.locals.cspNonce
    });
  } catch (error) {
    console.error('Erro ao listar comparação:', error);
    res.redirect('/dashboard?erro=Erro ao listar preços');
  }
};

exports.compararProduto = async (req, res) => {
  try {
    const produto_nome = decodeURIComponent(req.params.produto);
    const usuarioId = req.session.userId;
    if (!usuarioId) return res.redirect('/login');

    const precos = await Comparacao.compararProduto(produto_nome, usuarioId);

    if (precos.length === 0) {
      return res.redirect('/comparacao?erro=Nenhuma compra encontrada para este produto');
    }

    res.render('sistema/comparacao/detalhes', {
      precos,
      produto: precos[0],
      cspNonce: res.locals.cspNonce
    });
  } catch (error) {
    console.error('Erro ao comparar produto:', error);
    res.redirect('/comparacao?erro=Erro ao comparar preços');
  }
};

exports.historicoCompras = async (req, res) => {
  try {
    const { produto, fornecedor } = req.query;
    const usuarioId = req.session.userId;
    if (!usuarioId) return res.redirect('/login');

    if (!produto || !fornecedor) {
      return res.redirect('/comparacao?erro=Parâmetros inválidos');
    }

    const historico = await Comparacao.getHistoricoCompras(produto, fornecedor, usuarioId);

    res.render('sistema/comparacao/historico', {
      historico,
      produto,
      fornecedor,
      cspNonce: res.locals.cspNonce
    });
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.redirect('/comparacao?erro=Erro ao buscar histórico');
  }
};

exports.ranking = async (req, res) => {
  try {
    const usuarioId = req.session.userId;
    if (!usuarioId) return res.redirect('/login');

    const ranking = await Comparacao.melhorFornecedorGeral(usuarioId);

    res.render('sistema/comparacao/ranking', {
      ranking,
      cspNonce: res.locals.cspNonce
    });
  } catch (error) {
    console.error('Erro ao gerar ranking:', error);
    res.redirect('/comparacao?erro=Erro ao gerar ranking');
  }
};
