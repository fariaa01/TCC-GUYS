const express = require('express');
const router = express.Router();
const authController = require('../../../controllers/autenticacao/authController');

router.get('/login', (req, res) => res.render('usuarios/login'));
router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/logout', authController.logout);

module.exports = router;
