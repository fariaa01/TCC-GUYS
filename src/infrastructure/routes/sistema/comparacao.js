const express = require('express');
const router = express.Router();
const comparacaoController = require('../../../controllers/sistema/comparacao/comparacaoController');
const ensureAuth = require('../../../infrastructure/middlewares/ensureAuth');

router.use(ensureAuth);

router.get('/', comparacaoController.listar);
router.get('/ranking', comparacaoController.ranking);
router.get('/historico', comparacaoController.historicoCompras);
router.get('/:produto', comparacaoController.compararProduto);

module.exports = router;
