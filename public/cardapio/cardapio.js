// =============================================================
// UTILIDADES
// =============================================================
const money = (v) => 'R$ ' + Number(v || 0).toFixed(2).replace('.', ',');
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

console.log("cardapio.js carregado ✔️");

// =============================================================
// =================== MODAL DE AUTENTICAÇÃO ====================
// =============================================================
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
    cartItemsContainer.innerHTML = `<p class="empty-cart">Seu carrinho está vazio.</p>`;
    cartTotal.textContent = "R$ 0,00";
    return;
  }

  let total = 0;

  cart.forEach((item, index) => {
    total += item.preco * item.qtd;

    const div = document.createElement("div");
    div.className = "cart-item";
    div.innerHTML = `
      <div class="cart-info">
        <strong>${item.nome}</strong>
        <span>${formatCurrency(item.preco)}</span>
        <div class="qty">
          <button data-index="${index}" class="menos">−</button>
          <span>${item.qtd}</span>
          <button data-index="${index}" class="mais">+</button>
        </div>
      </div>
      <button class="remove" data-index="${index}">✕</button>
    `;

    cartItemsContainer.appendChild(div);
  });

  cartTotal.textContent = formatCurrency(total);
  saveCart();
}

// =============== ADICIONAR AO CARRINHO ===============
function addToCart(item) {
  const existing = cart.find(i => i.id === item.id);

  if (existing) existing.qtd++;
  else cart.push({ ...item, qtd: 1 });

  renderCart();
  openCart();
}

// =============== BOTÕES +, -, REMOVER ===============
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

// =============== BOTÃO "DETALHES" ADD TO CART ===============
// NÃO BUSCA DO BACKEND → pega dados direto do card
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

// =============================================================
// ===================== BUSCA DO CARDÁPIO ======================
// =============================================================

// usa os elementos já presentes no HTML
const searchInput = $("#searchMenu");
const searchClear = $(".search-clear");

// função de busca
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

// ativar busca ao digitar
searchInput?.addEventListener("input", buscarItens);

// limpar busca
searchClear?.addEventListener("click", () => {
  searchInput.value = "";
  buscarItens();
  searchInput.focus();
});
