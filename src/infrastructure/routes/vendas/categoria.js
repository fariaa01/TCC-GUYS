const router = require('express').Router();
const categoriaController = require('../../../controllers/vendas/categoriaController');

// Listar todas as categorias
router.get('/', categoriaController.listar);

// Criar nova categoria
router.post('/', categoriaController.criar);

// Atualizar categoria
router.put('/:id', categoriaController.atualizar);

// Excluir categoria
router.delete('/:id', categoriaController.excluir);

module.exports = router;
