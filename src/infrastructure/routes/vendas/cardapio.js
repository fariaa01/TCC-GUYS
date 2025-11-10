const express = require('express');
const router = express.Router();
const menuController = require('../../../controllers/vendas/menuController');

router.get('/', (req, res) => res.redirect('/lojas'));
router.get('/u/:usuarioId', menuController.publicoPorUsuario);

module.exports = router;
    