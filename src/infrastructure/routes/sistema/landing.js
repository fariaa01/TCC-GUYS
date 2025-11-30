const express = require('express');
const router = express.Router();

// Landing page principal
router.get('/', (req, res) => {
  res.render('landing');
});

// (Opcional) Tratamento do formulário
router.post('/inscricao', (req, res) => {
  const { email } = req.body;
  res.render('landing', { mensagem: 'Obrigado por se inscrever!' });
});

module.exports = router;