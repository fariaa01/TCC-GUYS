const express = require('express');
const router = express.Router();
const fornecedorController = require('../../../controllers/sistema/fornecedorController');

router.get('/', fornecedorController.listar);
router.get('/:id', fornecedorController.detalhes);
router.post('/create', fornecedorController.create);
router.post('/:id/update', fornecedorController.update);
router.post('/:id/delete', fornecedorController.delete);
router.get('/create', (req, res) => {
  res.render('sistema/dados-fornecedor', { fornecedores: [] });
});

module.exports = router;
