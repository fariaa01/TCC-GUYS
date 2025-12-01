const router = require('express').Router();
const controller = require('../../../controllers/sistema/financeiro/financeiroController');

router.get('/', controller.listar);

router.get('/create', controller.formCreate);
router.post('/create', controller.criar);
router.post('/update/:id', controller.atualizar);
router.post('/delete/:id', controller.deletar);

router.post('/metas/atualizar', controller.atualizarMeta);

module.exports = router;
