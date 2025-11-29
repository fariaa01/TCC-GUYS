const money = (v) => 'R$ ' + Number(v || 0).toFixed(2).replace('.', ',');
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

console.log("cardapio.js carregado ✔️");

// ========== FUNÇÕES GLOBAIS DE AUTENTICAÇÃO ==========
// Função global para fetch com autenticação
async function rawFetch(url, opts = {}) {
  const headers = { Accept: 'application/json', ...(opts.headers || {}) };
  const r = await fetch(url, { credentials: 'include', ...opts, headers });

  let data = {};
  try { data = await r.json(); } catch {}

  if (!r.ok) {
    const err = new Error(data?.erro || data?.error || `Erro ${r.status}`);
    err.response = data;
    throw err;
  }
  return data;
}

// Variável global para ação pendente
window.cardapioPendingAction = null;

(function () {

  let pendingAction = null;

  const authModal       = $('#authModal');
  const paneLogin       = $('#pane-login');
  const paneCadastro    = $('#pane-cadastro');
  const tabLogin        = $('#tab-login');
  const tabCadastro     = $('#tab-cadastro');
  const formLogin       = $('#formLogin');
  const formCadastro    = $('#formCadastro');
  const loginFeedback   = $('#loginFeedback');
  const cadastroFeedback= $('#cadastroFeedback');

  function switchTab(which){
    if (!tabLogin || !tabCadastro || !paneLogin || !paneCadastro) return;
    const isLogin = which === 'login';
    tabLogin.classList.toggle('is-active', isLogin);
    tabCadastro.classList.toggle('is-active', !isLogin);

    paneLogin.classList.toggle('is-active', isLogin);
    paneCadastro.classList.toggle('is-active', !isLogin);
    paneCadastro.hidden = isLogin;
    paneLogin.hidden = !isLogin;
  }

  function openAuth(which='login'){
    if (!authModal) return;
    switchTab(which);
    authModal.classList.add('open');
  }

  function closeAuth(){
    authModal?.classList.remove('open');
    loginFeedback && (loginFeedback.textContent = '');
    cadastroFeedback && (cadastroFeedback.textContent = '');
    formLogin?.reset();
    formCadastro?.reset();
  }

  // Expor openAuth globalmente para uso externo
  window.openAuthModal = openAuth;

  tabLogin?.addEventListener('click', () => switchTab('login'));
  tabCadastro?.addEventListener('click', () => switchTab('cadastro'));

  $$('.auth-close, [data-close-auth]').forEach(el => 
    el.addEventListener('click', () => { pendingAction=null; closeAuth(); })
  );

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && authModal?.classList.contains('open')) { 
      pendingAction=null; 
      closeAuth(); 
    }
  });

  const postJSON = (url, body={}) => rawFetch(url, { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify(body) 
  });

  async function waitForLogin(tries = 6, delayMs = 200) {
    for (let i = 0; i < tries; i++) {
      try {
        const s = await rawFetch('/api/cliente/status');
        if (s?.loggedIn) return true;
      } catch {}
      await new Promise(r => setTimeout(r, delayMs));
    }
    return false;
  }

  async function postAuth(url, payload){
    return postJSON(url, payload);
  }

  formLogin?.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginFeedback && (loginFeedback.textContent = '');
    const btn = formLogin.querySelector('.auth-submit');
    if (btn) btn.disabled = true;

    try {
      const endpoint = formLogin.getAttribute('data-endpoint-login') || '/cliente/login';
      const fd = new FormData(formLogin);

      const payload = {
        email: fd.get('email'),
        senha: fd.get('senha'),
        next:  fd.get('next') || ''
      };

      await postAuth(endpoint, payload);
      await waitForLogin();
      closeAuth();

      if (typeof pendingAction === 'function') {
        const fn = pendingAction; pendingAction = null;
        await fn();
      }

      // Verificar se há ação global pendente
      if (typeof window.cardapioPendingAction === 'function') {
        const fn = window.cardapioPendingAction; 
        window.cardapioPendingAction = null;
        await fn();
      }

    } catch (err) {
      loginFeedback && (loginFeedback.textContent = err.message || 'Falha no login');
    } finally {
      if (btn) btn.disabled = false;
    }
  });

  formCadastro?.addEventListener('submit', async (e) => {
    e.preventDefault();
    cadastroFeedback && (cadastroFeedback.textContent = '');
    const btn = formCadastro.querySelector('.auth-submit');
    if (btn) btn.disabled = true;

    try {
      const endpoint = formCadastro.getAttribute('data-endpoint-cadastro') || '/cliente/cadastrar';
      const fd = new FormData(formCadastro);

      const payload = {
        nome:  fd.get('nome'),
        email: fd.get('email'),
        senha: fd.get('senha'),
        next:  fd.get('next') || ''
      };

      await postAuth(endpoint, payload);
      await waitForLogin();
      closeAuth();

      if (typeof pendingAction === 'function') {
        const fn = pendingAction; pendingAction = null;
        await fn();
      }

      // Verificar se há ação global pendente
      if (typeof window.cardapioPendingAction === 'function') {
        const fn = window.cardapioPendingAction; 
        window.cardapioPendingAction = null;
        await fn();
      }

    } catch (err) {
      cadastroFeedback && (cadastroFeedback.textContent = err.message || 'Falha no cadastro');
    } finally {
      if (btn) btn.disabled = false;
    }
  });

})();


// =============================================================
// ====================== CARRINHO LATERAL =======================
// =============================================================

const sideCart = $("#sideCart");
const cartOverlay = $("#cartOverlay");
const closeCartBtn = $("#closeCart");
const cartItemsContainer = $("#cartItems");
const cartTotal = $("#cartTotal");

let cart = JSON.parse(localStorage.getItem("cart") || "[]");

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function formatCurrency(v) {
  return "R$ " + v.toFixed(2).replace(".", ",");
}

function openCart() {
  sideCart.classList.add("open");
  cartOverlay.classList.add("show");
}

function closeCart() {
  sideCart.classList.remove("open");
  cartOverlay.classList.remove("show");
}

closeCartBtn?.addEventListener("click", closeCart);
cartOverlay?.addEventListener("click", closeCart);

// =============== RENDERIZAÇÃO DO CARRINHO ===============
function renderCart() {
  cartItemsContainer.innerHTML = "";

  if (cart.length === 0) {
    cartItemsContainer.innerHTML = `
      <div class="cart-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="9" cy="21" r="1"/>
          <circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" stroke-width="2"/>
        </svg>
        <h3>Carrinho vazio</h3>
        <p>Adicione itens do cardápio</p>
      </div>
    `;
    cartTotal.textContent = "R$ 0,00";
    return;
  }

  let total = 0;

  cart.forEach((item, index) => {
    total += item.preco * item.qtd;

    const div = document.createElement("div");
    div.className = "cart-item";
    div.innerHTML = `
      ${item.imagem ? `<img src="/uploads/${item.imagem}" alt="${item.nome}" class="cart-item-image">` : '<div class="cart-item-image"></div>'}
      <div class="cart-item-info">
        <div class="cart-item-name">${item.nome}</div>
        <div class="cart-item-price">${formatCurrency(item.preco)}</div>
        <div class="cart-item-actions">
          <div class="qty">
            <button data-index="${index}" class="menos">−</button>
            <span>${item.qtd}</span>
            <button data-index="${index}" class="mais">+</button>
          </div>
        </div>
      </div>
      <button class="remove" data-index="${index}">✕</button>
    `;

    cartItemsContainer.appendChild(div);
  });

  cartTotal.textContent = formatCurrency(total);
  saveCart();
}

function addToCart(item) {
  const existing = cart.find(i => i.id === item.id);

  if (existing) existing.qtd++;
  else cart.push({ ...item, qtd: 1 });

  renderCart();
  openCart();
}

cartItemsContainer.addEventListener("click", (e) => {
  const index = e.target.dataset.index;

  if (e.target.classList.contains("mais")) {
    cart[index].qtd++;
  }

  if (e.target.classList.contains("menos")) {
    if (cart[index].qtd > 1) cart[index].qtd--;
  }

  if (e.target.classList.contains("remove")) {
    cart.splice(index, 1);
  }

  renderCart();
});


document.querySelectorAll(".ver-item").forEach(btn => {
  btn.addEventListener("click", () => {
    const card = btn.closest(".card");

    const nome = card.querySelector(".titulo").textContent;
    const preco = Number(
      card.querySelector(".preco").textContent
        .replace("R$", "")
        .replace(",", ".")
        .trim()
    );

    addToCart({
      id: Number(btn.dataset.id),
      nome,
      preco
    });
  });
});


renderCart();

const btnCheckout = document.querySelector('.btn-checkout');
if (btnCheckout) {
  btnCheckout.addEventListener('click', async (e) => {
    e.preventDefault();

    if (cart.length === 0) {
      alert('Seu carrinho está vazio!');
      return;
    }
    
    try {
      const status = await rawFetch('/api/cliente/status');
      
      if (status && status.loggedIn) {
        await finalizarPedido();
      } else {
        window.cardapioPendingAction = async () => {
          await finalizarPedido();
        };
        window.openAuthModal('login');
      }
    } catch (err) {
      console.error('Erro ao verificar autenticação:', err);
      window.cardapioPendingAction = async () => {
        await finalizarPedido();
      };
      window.openAuthModal('login');
    }
  });
}

async function finalizarPedido() {
  try {
    if (!cart || cart.length === 0) {
      alert('Seu carrinho está vazio!');
      return;
    }

    window.location.href = '/checkout';
    
  } catch (err) {
    console.error('Erro ao finalizar pedido:', err);
    alert('Erro ao finalizar pedido: ' + (err.message || 'Tente novamente'));
  }
}

const searchInput = $("#searchMenu");
const searchClear = $(".search-clear");

function buscarItens() {
  const termo = searchInput.value.toLowerCase().trim();
  const cards = document.querySelectorAll(".card");

  cards.forEach(card => {
    const titulo = card.querySelector(".titulo")?.textContent.toLowerCase() || "";
    const desc = card.querySelector(".desc")?.textContent.toLowerCase() || "";
    const categoria = card.getAttribute("data-cat")?.toLowerCase() || "";

    const match =
      titulo.includes(termo) ||
      desc.includes(termo) ||
      categoria.includes(termo);

    card.style.display = match ? "" : "none";
  });
}

searchInput?.addEventListener("input", buscarItens);

searchClear?.addEventListener("click", () => {
  searchInput.value = "";
  buscarItens();
  searchInput.focus();
});

(function checkLoginRequired() {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('login') === 'required') {
    window.cardapioPendingAction = async () => {
      window.location.href = '/checkout';
    };

    setTimeout(() => {
      if (typeof window.openAuthModal === 'function') {
        window.openAuthModal('login');
      }
    }, 300);
  }
})();