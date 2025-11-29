const express = require('express');
const router = express.Router();
const controller = require('../../../controllers/sistema/folha-pagamento/folhaPagamentoController');
const ensureAuth = require('../../middlewares/ensureAuth');

router.use(ensureAuth);

// Listar folhas
router.get('/', controller.listar);
router.get('/:id', controller.visualizar);
router.post('/gerar', controller.gerar);
router.post('/:id/aprovar', controller.aprovar);
router.post('/:id/pagar', controller.pagar);
router.post('/:id/deletar', controller.deletar);

module.exports = router;
