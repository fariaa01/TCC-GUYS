const express = require('express');
const router = express.Router();
const tamanhoController = require('../../../controllers/vendas/tamanhoController');
const ensureAuth = require('../../middlewares/ensureAuth');

router.use(ensureAuth);

router.get('/', tamanhoController.listar);
router.post('/', tamanhoController.criar);
router.put('/:id', tamanhoController.atualizar);
router.delete('/:id', tamanhoController.excluir);

module.exports = router;
