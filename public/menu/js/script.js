let contadorTamanhos = 1;
let contadorEdit = 0;

document.addEventListener('DOMContentLoaded', function() {
    const multiplosPrecos = document.getElementById('multiplosPrecos');
    if (multiplosPrecos) {
      multiplosPrecos.addEventListener('change', function() {
        const precoUnico = document.getElementById('precoUnico');
        const multiplosPrecosList = document.getElementById('multiplosPrecosList');
      
        if (this.checked) {
          precoUnico.style.display = 'none';
          const inputUnico = precoUnico.querySelector('input');
          if (inputUnico) inputUnico.removeAttribute('required');
          multiplosPrecosList.style.display = 'block';
          multiplosPrecosList.querySelectorAll('input, select').forEach(el => { el.removeAttribute('disabled'); el.setAttribute('required', 'required'); });
        } else {
          precoUnico.style.display = 'block';
          const inputUnico = precoUnico.querySelector('input');
          if (inputUnico) inputUnico.setAttribute('required', 'required');
          multiplosPrecosList.style.display = 'none';
          multiplosPrecosList.querySelectorAll('input, select').forEach(el => { el.removeAttribute('required'); el.setAttribute('disabled', 'disabled'); });
        }
      });

      // Aplica estado inicial (remove required de campos escondidos) para evitar validação nativa em elementos não focusáveis
      multiplosPrecos.dispatchEvent(new Event('change'));
    }

    function adicionarTamanho() {
      const container = document.getElementById('multiplosPrecosList');
      const novoItem = document.createElement('div');
      novoItem.className = 'tamanho-preco-item';
      novoItem.innerHTML = `
        <select name="tamanhos[${contadorTamanhos}][tamanho]" required>
          <option value="">Tamanho...</option>
          <option value="P">Pequeno (P)</option>
          <option value="M">Médio (M)</option>
          <option value="G">Grande (G)</option>
          <option value="GG">Gigante (GG)</option>
        </select>
        <input type="number" step="0.01" name="tamanhos[${contadorTamanhos}][preco]" placeholder="Preço (R$)" required />
        <button type="button" class="btn-remove-tamanho" onclick="removerTamanho(this)">
          <i class="fas fa-trash"></i>
        </button>
      `;
      
      const btnAdd = container.querySelector('.btn-add-tamanho');
      container.insertBefore(novoItem, btnAdd);
      contadorTamanhos++;
    }

    // Remover tamanho
    function removerTamanho(btn) {
      btn.closest('.tamanho-preco-item').remove();
    }

    // Funcionalidade de edição de tamanhos removida

    // Resto do código JavaScript existente...
    document.querySelectorAll('.form-excluir').forEach(form => {
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        Swal.fire({
          title: "Tem certeza?",
          text: "Você não poderá reverter isso!",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#c0392b",
          cancelButtonColor: "#4c4b4b",
          confirmButtonText: "Sim, excluir!"
        }).then((result) => {
          if (result.isConfirmed) {
            form.submit();
          }
        });
      });
    });

    const btnAbrirCategoria = document.getElementById("btnAbrirCategoria");
    const modalCategoria = document.getElementById("modalCategoria");
    const modalPedido = document.getElementById("modalPedido");
    const fecharCategoria = document.getElementById("fecharCategoria");
    const fecharModal = document.getElementById("fecharModal");
    const selectCategoria = document.getElementById("selectCategoria");
    const inputCategoria = document.getElementById("inputCategoria");
    const camposDinamicos = document.getElementById("camposDinamicos");
    const tituloModal = document.getElementById("tituloModal");

    btnAbrirCategoria.onclick = () => modalCategoria.style.display = "block";
    fecharCategoria.onclick = () => modalCategoria.style.display = "none";
    fecharModal.onclick = () => modalPedido.style.display = "none";

    window.onclick = (event) => {
      if (event.target == modalCategoria) modalCategoria.style.display = "none";
      if (event.target == modalPedido) modalPedido.style.display = "none";
    };

    document.getElementById("btnAvancar").onclick = () => {
      const categoria = selectCategoria.value;
      if (!categoria) {
        alert("Selecione uma categoria.");
        return;
      }

      inputCategoria.value = categoria;
      tituloModal.innerText = "Novo Prato - " + categoria.charAt(0).toUpperCase() + categoria.slice(1);
      camposDinamicos.innerHTML = "";

      if (categoria === "bebida") {
        camposDinamicos.innerHTML = `
          <input type="number" name="volume" placeholder="Volume (ml)" class="form-box-input" />`;
      } else if (categoria === "lanche") {
        camposDinamicos.innerHTML = `
          <input type="text" name="acompanhamento" placeholder="Acompanhamento" />`;
      }

      modalCategoria.style.display = "none";
      modalPedido.style.display = "block";
    };

    (function () {
      const grid = document.querySelector('.grid-cards');
      if (!grid) return;

      async function patch(id, body) {
        const res = await fetch(`/menu/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        return res.json();
      }

      grid.addEventListener('click', async (e) => {
        const btnArq = e.target.closest('.btn-arquivar');
        const btnRes = e.target.closest('.btn-restaurar');
        if (!btnArq && !btnRes) return;

        const card = e.target.closest('.card');
        const id = (btnArq || btnRes).dataset.id;
        const arquivar = !!btnArq;

        const resp = await patch(id, { arquivado: arquivar ? 1 : 0 });
        if (!resp.ok) return;

        card.classList.toggle('is-archived', arquivar);

        let badgeArch = card.querySelector('.badge-archived');
        if (arquivar && !badgeArch) {
          const span = document.createElement('span');
          span.className = 'badge badge-archived';
          span.innerHTML = '<i class="fa-solid fa-box-archive"></i> Arquivado';
          card.querySelector('.linha-topo').appendChild(span);
        }
        if (!arquivar && badgeArch) badgeArch.remove();

        const actions = card.querySelector('.actions');
        if (actions) {
          if (arquivar) {
            const old = actions.querySelector('.btn-arquivar');
            if (old) old.outerHTML = `<button type="button" class="btn-restaurar" data-id="${id}">
              <i class="fa-solid fa-rotate-left"></i> Restaurar
            </button>`;
          } else {
            const old = actions.querySelector('.btn-restaurar');
            if (old) old.outerHTML = `<button type="button" class="btn-arquivar" data-id="${id}">
              <i class="fa-solid fa-box-archive"></i> Arquivar
            </button>`;
          }
        }
      });
    })();

});