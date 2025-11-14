const express = require('express');
const router = express.Router();
const upload = require('../../middlewares/upload');

const ensureAuth = require('../../middlewares/ensureAuth');
const menuController = require('../../../controllers/vendas/menuController');

// O middleware de upload já aplica limites e validação centralizados se necessário.

router.use(ensureAuth);

router.get('/', menuController.renderMenu);
router.post('/create', upload.single('imagem'), menuController.criarPrato);
router.get('/:id/tamanhos', menuController.buscarTamanhos);
router.post('/:id/tamanhos', express.urlencoded({ extended: true }), menuController.salvarTamanhos);
router.post('/edit/:id', upload.single('imagem'), menuController.editarPrato);
router.post(['/delete/:id', '/excluir/:id'], menuController.excluirPrato);

router.patch('/:id', menuController.updateParcial);

router.post('/:id/arquivar', (req, res, next) => { req.body.arquivado = 1; next(); }, menuController.updateParcial);
router.post('/:id/desarquivar', (req, res, next) => { req.body.arquivado = 0; next(); }, menuController.updateParcial);

module.exports = router;
