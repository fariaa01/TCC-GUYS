const express = require('express');
const router = express.Router();
const pontoController = require('../../../controllers/sistema/ponto/pontoController');
const ensureAuth = require('../../../infrastructure/middlewares/ensureAuth');

// Página principal (requer autenticação)
router.get('/', ensureAuth, pontoController.index);

// Ver ponto de funcionário específico
router.get('/funcionario/:id', ensureAuth, pontoController.porFuncionario);

// Registrar ponto manual (horário atual)
router.post('/registrar', ensureAuth, pontoController.registrar);

// Registrar ponto manual (com horários específicos)
router.post('/registrar-manual', ensureAuth, pontoController.registrarManual);

// Página de registro rápido (sem autenticação - para funcionário usar)
router.get('/registro-rapido', pontoController.registroRapido);

// Configurar jornada
router.post('/configurar-jornada', ensureAuth, pontoController.configurarJornada);

// Registrar falta
router.post('/registrar-falta', ensureAuth, pontoController.registrarFalta);

// Editar ponto
router.put('/editar', ensureAuth, pontoController.editar);

// Buscar horário padrão do funcionário
router.get('/horario-padrao/:funcionario_id', ensureAuth, pontoController.buscarHorarioPadrao);

// Relatório de produtividade
router.get('/produtividade', ensureAuth, pontoController.relatorioProdutividade);

// Relatório mensal
router.get('/relatorio', ensureAuth, pontoController.relatorioMensal);

module.exports = router;
