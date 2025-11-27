const express = require('express');
const router = express.Router();
const pedidoController = require('../../../controllers/vendas/pedidoController');
const requireCliente = require('../../middlewares/requireCliente');

router.get('/listar', pedidoController.listarPedidos);
router.post('/', pedidoController.criarPedido);
router.post('/checkout', requireCliente, pedidoController.checkout);

module.exports = router;
