let cart = [];

function loadCart() {
  const stored = localStorage.getItem('cart');
  if (stored) {
    try {
      cart = JSON.parse(stored);
    } catch (e) {
      cart = [];
    }
  }
  renderItens();
  updateTotals();
}

function renderItens() {
  const container = document.getElementById('lista-itens');
  
  if (!cart || cart.length === 0) {
    container.innerHTML = `
      <div class="carrinho-vazio">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="9" cy="21" r="1"/>
          <circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" stroke-width="2"/>
        </svg>
        <h3>Carrinho vazio</h3>
        <p>Você ainda não adicionou itens ao carrinho.</p>
        <a href="/cardapio" class="btn-voltar-cardapio">Voltar ao Cardápio</a>
      </div>
    `;
    document.getElementById('btn-finalizar').disabled = true;
    return;
  }

  container.innerHTML = cart.map(item => `
    <div class="item-pedido">
      ${item.imagem ? `<img src="${item.imagem}" alt="${item.nome}" class="item-imagem">` : '<div class="item-imagem"></div>'}
      <div class="item-info">
        <div class="item-nome">${item.nome}</div>
        <div class="item-preco">R$ ${Number(item.preco).toFixed(2)}</div>
        <div class="item-quantidade">Quantidade: ${item.qtd}</div>
      </div>
      <div class="item-subtotal">R$ ${(item.preco * item.qtd).toFixed(2)}</div>
    </div>
  `).join('');
}

function updateTotals() {
  const total = cart.reduce((acc, item) => acc + (item.preco * item.qtd), 0);
  document.getElementById('subtotal-valor').textContent = `R$ ${total.toFixed(2)}`;
  document.getElementById('total-valor').textContent = `R$ ${total.toFixed(2)}`;
}

const observacoes = document.getElementById('observacoes');
const charCount = document.getElementById('char-count');

observacoes.addEventListener('input', () => {
  charCount.textContent = observacoes.value.length;
});

const btnFinalizar = document.getElementById('btn-finalizar');

btnFinalizar.addEventListener('click', async () => {
  if (!cart || cart.length === 0) {
    alert('Seu carrinho está vazio!');
    return;
  }

  btnFinalizar.disabled = true;
  btnFinalizar.classList.add('loading');

  try {
    const itens = cart.map(item => ({
      produto_id: item.id,
      nome: item.nome,
      preco_unitario: item.preco,
      quantidade: item.qtd,
      subtotal: item.preco * item.qtd
    }));
    
    const total = cart.reduce((acc, item) => acc + (item.preco * item.qtd), 0);
    
    const pedidoData = {
      itens: itens,
      total: total,
      observacoes: observacoes.value.trim() || null
    };

    const response = await fetch('/pedido/checkout', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(pedidoData),
      credentials: 'include'
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Erro ao processar pedido');
    }

    localStorage.removeItem('cart');
    cart = [];

    window.location.href = `/checkout/sucesso?pedido=${result.pedidoId}`;

  } catch (error) {
    alert('Erro ao finalizar pedido: ' + error.message);
    btnFinalizar.disabled = false;
    btnFinalizar.classList.remove('loading');
  }
});

loadCart();
