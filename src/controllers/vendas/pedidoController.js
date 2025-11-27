const Menu = require('../../models/vendas/menuModel');

module.exports = {
  listarPedidos: async (req, res) => {
    try {
      const usuarioId = req.session.userId;
      if (!usuarioId) return res.redirect('/login');

      const pedidos = await Pedidos.getAllByUsuario(usuarioId);
      // res.render('vendas/pedidos', { pedidos }); // View não encontrada
      res.json({ pedidos }); // Temporário
    } catch (err) {
      console.error('Erro ao listar pedidos:', err);
      res.status(500).send('Erro ao listar pedidos');
    }
  },

  criarPedido: async (req, res) => {
    try {
      const dados = {
        ...req.body,
        usuario_id: req.body.usuario_id 
      };

      await Pedidos.create(dados);
      res.redirect('/pedido/sucesso'); 
    } catch (err) {
      console.error('Erro ao criar pedido:', err);
      res.status(500).send('Erro ao criar pedido');
    }
  },

  atualizarStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status_pedido } = req.body;

      await Pedidos.updateStatus(id, status_pedido);
      res.redirect('/pedidos');
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      res.status(500).send('Erro ao atualizar status');
    }
  },

  // Endpoint para criar pedido via checkout do cardápio
  checkout: async (req, res) => {
    try {
      const clienteId = req.session.clienteId;
      
      if (!clienteId) {
        return res.status(401).json({ error: 'Cliente não autenticado' });
      }

      const { itens, total } = req.body;

      if (!itens || !Array.isArray(itens) || itens.length === 0) {
        return res.status(400).json({ error: 'Carrinho vazio' });
      }

      const pool = require('../../../db');
      const conn = await pool.getConnection();

      try {
        await conn.beginTransaction();

        // Criar pedido principal
        const [pedidoResult] = await conn.query(
          `INSERT INTO pedidos (cliente_id, status, total, criado_em, atualizado_em)
           VALUES (?, 'pendente', ?, NOW(), NOW())`,
          [clienteId, total]
        );

        const pedidoId = pedidoResult.insertId;

        // Inserir itens do pedido
        for (const item of itens) {
          await conn.query(
            `INSERT INTO pedido_itens (pedido_id, produto_id, quantidade, preco_unitario)
             VALUES (?, ?, ?, ?)`,
            [pedidoId, item.produto_id, item.quantidade, item.preco_unitario]
          );
        }

        await conn.commit();

        res.json({ 
          sucesso: true, 
          pedidoId: pedidoId,
          mensagem: 'Pedido criado com sucesso!' 
        });

      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }

    } catch (err) {
      console.error('Erro ao criar pedido via checkout:', err);
      res.status(500).json({ error: 'Erro ao processar pedido' });
    }
  },

  mostrarCardapioCliente: async (req, res) => {
    try {
      const usuario_id = req.params.usuario_id;
      const pratos = await Menu.getMenuByUsuarioId(usuario_id);
      // res.render('vendas/pedidoCliente', { pratos, usuario_id }); // View não encontrada
      res.json({ pratos, usuario_id }); // Temporário
    } catch (err) {
      console.error('Erro ao carregar cardápio:', err);
      res.status(500).send('Erro ao carregar cardápio');
    }
  }
};
