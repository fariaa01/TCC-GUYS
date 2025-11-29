// /public/cardapio/cardapio.js
(function () {
  const money = (v) => 'R$ ' + Number(v || 0).toFixed(2).replace('.', ',');
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from((r || document).querySelectorAll(s));

  let pendingAction = null;

  // Auth modal elements (may exist)
  const authModal = $('#authModal');
  const formLogin = $('#formLogin');
  const formCadastro = $('#formCadastro');
  const loginFeedback = $('#loginFeedback');
  const cadastroFeedback = $('#cadastroFeedback');

  // Cart elements
  const cartPanel = document.querySelector('.cart');
  const cartBackdrop = $('#cartBackdrop');
  const btnToggle = $('#btnToggleCart');
  const container = $('#carrinho-container');
  const elSubtotal = $('#subtotal');
  const elTaxas = $('#taxas');
  const elTotal = $('#total');
  const badge = $('#badge-carrinho');

  // endpoints (adjust if your backend uses different paths)
  const endpoints = {
    listar: '/carrinho',
    adicionar: '/carrinho/adicionar',
    atualizar: '/carrinho/atualizar',
    remover: '/carrinho/remover'
  };

  // ==== helpers AJAX ====
  async function rawFetch(url, opts = {}) {
    const headers = { Accept: 'application/json', ...(opts.headers || {}) };
    const r = await fetch(url, { credentials: 'include', ...opts, headers });
    let data = {};
    try { data = await r.json(); } catch {}
    if (r.status === 401 || data?.authRequired) {
      const err = new Error('Login necessário');
      err.authRequired = true;
      throw err;
    }
    if (!r.ok) {
      throw new Error(data?.erro || data?.error || `Erro ${r.status}`);
    }
    return data;
  }
  const getJSON = (url) => rawFetch(url);
  const postJSON = (url, body = {}) => rawFetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

  // ==== state ====
  let carrinho = { itens: [] };

  function updateBadgeFromCart() {
    const totalQtd = (carrinho.itens || []).reduce((s, i) => s + Number(i.quantidade || 0), 0);
    if (badge) {
      badge.textContent = totalQtd;
      badge.style.display = totalQtd > 0 ? 'inline-block' : 'none';
    }
  }

  function calcTotais(itens) {
    const subtotal = itens.reduce((s, i) => s + Number(i.preco_unitario || 0) * Number(i.quantidade || 0), 0);
    const taxas = 0;
    return { subtotal, taxas, total: subtotal + taxas };
  }

  function rowHTML(it) {
    const precoUnit = Number(it.preco_unitario || it.preco || 0);
    const imagem = it.imagem ? `/uploads/${it.imagem}` : '';
    return `
      <div class="item" data-id="${it.id}">
        ${imagem ? `<img src="${imagem}" alt="">` : '<div class="noimg"></div>'}
        <div class="info">
          <span class="nome">${it.nome_produto || it.nome}</span>
          <span class="preco-unit">${money(precoUnit)}</span>
        </div>
        <div class="acoes">
          <button class="menos" aria-label="Diminuir">−</button>
          <input class="qty" type="number" min="1" value="${it.quantidade}">
          <button class="mais" aria-label="Aumentar">+</button>
          <button class="remover" aria-label="Remover">🗑️</button>
        </div>
      </div>
    `;
  }

  function bindRow(row) {
    const id = row.dataset.id;
    row.querySelector('.menos')?.addEventListener('click', async () => {
      const cur = carrinho.itens.find(x => String(x.id) === String(id))?.quantidade || 1;
      await guarded(() => apiUpdateQty(id, Math.max(1, Number(cur) - 1)));
    });
    row.querySelector('.mais')?.addEventListener('click', async () => {
      const cur = carrinho.itens.find(x => String(x.id) === String(id))?.quantidade || 1;
      await guarded(() => apiUpdateQty(id, Number(cur) + 1));
    });
    row.querySelector('.qty')?.addEventListener('change', async (e) => {
      const v = Math.max(1, Number(e.target.value) || 1);
      await guarded(() => apiUpdateQty(id, v));
    });
    row.querySelector('.remover')?.addEventListener('click', async () => {
      await guarded(() => apiRemoveItem(id));
    });
  }

  function renderCart() {
    if (!container) return;
    const itens = carrinho.itens || [];
    if (!itens.length) {
      container.innerHTML = '<div class="cart-empty"><p>Seu carrinho está vazio.</p></div>';
      if (elSubtotal) elSubtotal.textContent = money(0);
      if (elTaxas) elTaxas.textContent = money(0);
      if (elTotal) elTotal.textContent = money(0);
      updateBadgeFromCart();
      return;
    }
    container.innerHTML = itens.map(rowHTML).join('');
    $$('.item', container).forEach(bindRow);
    const { subtotal, taxas, total } = calcTotais(itens);
    if (elSubtotal) elSubtotal.textContent = money(subtotal);
    if (elTaxas) elTaxas.textContent = money(taxas);
    if (elTotal) elTotal.textContent = money(total);
    updateBadgeFromCart();
  }

  // ==== carregar ====
  async function loadCart() {
    const data = await getJSON(endpoints.listar);
    carrinho.itens = (data.itens || []).map(i => ({
      id: i.id,
      nome_produto: i.nome_produto || i.nome,
      imagem: i.imagem,
      preco_unitario: Number(i.preco_unitario ?? i.preco ?? 0),
      quantidade: Number(i.quantidade ?? 1),
      subtotal: Number(i.subtotal ?? 0)
    }));
    renderCart();
  }

  // ==== guarded ====
  async function guarded(fn) {
    try {
      return await fn();
    } catch (e) {
      if (e?.authRequired) {
        pendingAction = fn;
        if (authModal) authModal.classList.add('open');
        return;
      }
      console.error(e);
      throw e;
    }
  }

  // ==== API actions ====
  async function apiAddItem(produto_id) {
    await postJSON(endpoints.adicionar, { produto_id });
    await loadCart();
  }
  async function apiUpdateQty(item_id, quantidade) {
    await postJSON(endpoints.atualizar, { item_id, quantidade });
    await loadCart();
  }
  async function apiRemoveItem(item_id) {
    await postJSON(endpoints.remover, { item_id });
    await loadCart();
  }
  async function apiClearCart() {
    // se backend tiver endpoint específico, prefira chamá-lo.
    const ids = (carrinho.itens || []).map(i => i.id);
    for (const id of ids) {
      await apiRemoveItem(id);
    }
  }

  // ==== abrir / fechar ====
  function openCart() {
    if (cartPanel) cartPanel.classList.add('open');
    if (cartBackdrop) cartBackdrop.classList.add('show');
  }
  function closeCart() {
    if (cartPanel) cartPanel.classList.remove('open');
    if (cartBackdrop) cartBackdrop.classList.remove('show');
  }
  btnToggle?.addEventListener('click', async () => {
    await guarded(loadCart);
    if (!authModal || !authModal.classList.contains('open')) openCart();
  });
  cartBackdrop?.addEventListener('click', closeCart);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeCart(); });

  // ==== delegated event: adicionar ao carrinho (funciona mesmo se botões forem dinamicos) ====
  document.addEventListener('click', async (ev) => {
    const btn = ev.target.closest('.adicionar-carrinho');
    if (!btn) return;
    ev.preventDefault();
    const id = Number(btn.dataset.id || btn.getAttribute('data-id'));
    if (!Number.isFinite(id) || id <= 0) {
      console.warn('ID inválido no botão', btn);
      return;
    }
    btn.disabled = true;
    const original = btn.textContent;
    try {
      await guarded(() => apiAddItem(id));
      btn.textContent = 'Adicionado!';
      openCart();
      setTimeout(() => (btn.textContent = original), 900);
    } catch (err) {
      console.error('Erro ao adicionar:', err);
      btn.textContent = 'Erro';
      setTimeout(() => (btn.textContent = original), 900);
    } finally {
      btn.disabled = false;
    }
  });

  // ==== delegated events para + / - / remover dentro do cart container (se itens forem re-renderizados) ====
  container?.addEventListener('click', (ev) => {
    const menos = ev.target.closest('.menos');
    const mais = ev.target.closest('.mais');
    const remover = ev.target.closest('.remover');
    if (menos) {
      const id = menos.closest('.item')?.dataset?.id;
      if (id) guarded(() => apiUpdateQty(id, Math.max(1, (carrinho.itens.find(x => String(x.id) === String(id))?.quantidade || 1) - 1)));
    } else if (mais) {
      const id = mais.closest('.item')?.dataset?.id;
      if (id) guarded(() => apiUpdateQty(id, (carrinho.itens.find(x => String(x.id) === String(id))?.quantidade || 1) + 1));
    } else if (remover) {
      const id = remover.closest('.item')?.dataset?.id;
      if (id) guarded(() => apiRemoveItem(id));
    }
  });

  // limpar carrinho (botão)
  $('#limpar')?.addEventListener('click', async () => {
    try { await guarded(apiClearCart); } catch (e) { console.error(e); }
  });

  // checkout protection
  $('#ir-checkout')?.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
      await guarded(loadCart);
      if (authModal && authModal.classList.contains('open')) {
        pendingAction = () => { window.location.href = '/checkout'; };
      } else {
        window.location.href = '/checkout';
      }
    } catch {
      openAuth?.('login');
      pendingAction = () => { window.location.href = '/checkout'; };
    }
  });

  // ==== auth forms (simple) ====
  async function postAuth(url, payload) { return postJSON(url, payload); }

  formLogin?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = Object.fromEntries(new FormData(formLogin));
    try {
      await postAuth('/cliente/login', payload);
      // optionally wait for session
      await new Promise(r => setTimeout(r, 250));
      if (pendingAction) { const fn = pendingAction; pendingAction = null; await fn(); }
      else await loadCart();
      authModal?.classList.remove('open');
    } catch (err) {
      loginFeedback && (loginFeedback.textContent = err.message || 'Erro no login');
    }
  });

  formCadastro?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = Object.fromEntries(new FormData(formCadastro));
    try {
      await postAuth('/cliente/cadastrar', payload);
      await new Promise(r => setTimeout(r, 250));
      if (pendingAction) { const fn = pendingAction; pendingAction = null; await fn(); }
      else await loadCart();
      authModal?.classList.remove('open');
    } catch (err) {
      cadastroFeedback && (cadastroFeedback.textContent = err.message || 'Erro no cadastro');
    }
  });

  // ==== start ====
  loadCart().catch((e) => {
    console.warn('Não foi possível carregar o carrinho (ainda).', e?.message || e);
    // deixa UI consistente
    if (container) container.innerHTML = '<div class="cart-empty"><p>Seu carrinho está vazio.</p></div>';
    if (badge) { badge.textContent = 0; badge.style.display = 'none'; }
    if (elSubtotal) elSubtotal.textContent = money(0);
    if (elTaxas) elTaxas.textContent = money(0);
    if (elTotal) elTotal.textContent = money(0);
  });

})();
