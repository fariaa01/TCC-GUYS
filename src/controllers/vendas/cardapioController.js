const pratoModel = require('../../models/vendas/cardapioModel'); 

module.exports = {
    exibirCardapio: async (req, res) => {
        try {
            const usuarioId = req.session.userId;

            if( !usuarioId) {
                return res.redirect('/login');
            }

            const cardapio = await pratoModel.listarPorUsuario(usuarioId);
            res.json({ pratos: cardapio, usuarioId });
        } catch (error) {
            console.error('Erro ao exibir cardápio:', error);
            res.status(500).send('Erro ao carregar o cardápio');
        }
    }
}; 