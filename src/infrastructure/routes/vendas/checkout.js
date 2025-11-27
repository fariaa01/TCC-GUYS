const express = require('express');
const router = express.Router();
const requireCliente = require('../../middlewares/requireCliente');
const Usuario = require('../../../models/usuarios/userModel');

// Página de checkout (revisão antes de finalizar)
router.get('/', requireCliente, async (req, res) => {
  try {
    const restauranteId = req.session.restauranteId;
    let empresaNome = 'Restaurante';
    let empresaEndereco = null;

    if (restauranteId) {
      const dono = await Usuario.findById(restauranteId);
      if (dono && dono.nome_empresa) {
        empresaNome = dono.nome_empresa;
        empresaEndereco = dono.endereco || null;
      }
    }

    res.render('vendas/checkout', {
      empresaNome: empresaNome,
      empresaEndereco: empresaEndereco
    });
  } catch (error) {
    console.error('Erro ao carregar checkout:', error);
    res.render('vendas/checkout', {
      empresaNome: 'Restaurante',
      empresaEndereco: null
    });
  }
});

// Página de sucesso
router.get('/sucesso', requireCliente, (req, res) => {
  const pedidoId = req.query.pedido;
  res.render('vendas/checkout-sucesso', {
    pedidoId: pedidoId
  });
});

module.exports = router;
