let contadorTamanhos = 1;
let contadorEdit = 0;

document.addEventListener('DOMContentLoaded', function() {
    const multiplosPrecos = document.getElementById('multiplosPrecos');
    if (multiplosPrecos) {
      multiplosPrecos.addEventListener('change', function() {
      const precoUnico = document.getElementById('precoUnico');
      const multiplosPrecos = document.getElementById('multiplosPrecosList');
      
      if (this.checked) {
        precoUnico.style.display = 'none';
        precoUnico.querySelector('input').removeAttribute('required');
        multiplosPrecos.style.display = 'block';
        multiplosPrecos.querySelectorAll('input, select').forEach(el => el.setAttribute('required', 'required'));
      } else {
        precoUnico.style.display = 'block';
        precoUnico.querySelector('input').setAttribute('required', 'required');
        multiplosPrecos.style.display = 'none';
        multiplosPrecos.querySelectorAll('input, select').forEach(el => el.removeAttribute('required'));
      }
    });

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

    // Adicionar tamanho no modal de edição
    function adicionarTamanhoEdit() {
      const container = document.getElementById('tamanhosEditList');
      const novoItem = document.createElement('div');
      novoItem.className = 'tamanho-preco-item';
      novoItem.innerHTML = `
        <select name="tamanhos[${contadorEdit}][tamanho]" required>
          <option value="">Tamanho...</option>
          <option value="P">Pequeno (P)</option>
          <option value="M">Médio (M)</option>
          <option value="G">Grande (G)</option>
          <option value="GG">Gigante (GG)</option>
        </select>
        <input type="number" step="0.01" name="tamanhos[${contadorEdit}][preco]" placeholder="Preço (R$)" required />
        <button type="button" class="btn-remove-tamanho" onclick="removerTamanho(this)">
          <i class="fas fa-trash"></i>
        </button>
      `;
      
      const btnAdd = container.querySelector('.btn-add-tamanho');
      container.insertBefore(novoItem, btnAdd);
      contadorEdit++;
    }

    // Abrir modal de editar tamanhos
    document.addEventListener('click', async function(e) {
      console.log('Click detectado em:', e.target);
      
      if (e.target.closest('.btn-editar-tamanhos')) {
        console.log('Botão tamanhos clicado!');
        const pratoId = e.target.closest('.btn-editar-tamanhos').dataset.id;
        console.log('Prato ID:', pratoId);
        document.getElementById('editPratoId').value = pratoId;
        
        // Carregar tamanhos existentes
        try {
          const response = await fetch(`/menu/${pratoId}/tamanhos`);
          const tamanhos = await response.json();
          
          const container = document.getElementById('tamanhosEditList');
          container.innerHTML = '<button type="button" class="btn-add-tamanho" onclick="adicionarTamanhoEdit()"><i class="fas fa-plus"></i> Adicionar Tamanho</button>';
          
          contadorEdit = 0;
          tamanhos.forEach((tamanho, index) => {
            const item = document.createElement('div');
            item.className = 'tamanho-preco-item';
            item.innerHTML = `
              <select name="tamanhos[${index}][tamanho]" required>
                <option value="">Tamanho...</option>
                <option value="P" ${tamanho.tamanho === 'P' ? 'selected' : ''}>Pequeno (P)</option>
                <option value="M" ${tamanho.tamanho === 'M' ? 'selected' : ''}>Médio (M)</option>
                <option value="G" ${tamanho.tamanho === 'G' ? 'selected' : ''}>Grande (G)</option>
                <option value="GG" ${tamanho.tamanho === 'GG' ? 'selected' : ''}>Gigante (GG)</option>
              </select>
              <input type="number" step="0.01" name="tamanhos[${index}][preco]" value="${tamanho.preco}" required />
              <input type="hidden" name="tamanhos[${index}][id]" value="${tamanho.id || ''}" />
              <button type="button" class="btn-remove-tamanho" onclick="removerTamanho(this)">
                <i class="fas fa-trash"></i>
              </button>
            `;
            
            const btnAdd = container.querySelector('.btn-add-tamanho');
            container.insertBefore(item, btnAdd);
            contadorEdit++;
          });
          const modal = document.getElementById('modalTamanhos');
          console.log('Modal encontrado:', modal);
          if (modal) {
            modal.style.display = 'block';
            console.log('Modal deve estar visível agora');
          } else {
            console.error('Modal não encontrado!');
          }
        } catch (error) {
          console.error('Erro ao carregar tamanhos:', error);
        }
      }
    });

    // Salvar tamanhos editados
    document.getElementById('formTamanhos').addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const pratoId = document.getElementById('editPratoId').value;
      const formData = new FormData(this);
      
      // Converter FormData para URLSearchParams para enviar como application/x-www-form-urlencoded
      const urlParams = new URLSearchParams();
      for (let [key, value] of formData) {
        urlParams.append(key, value);
      }
      
      console.log('Enviando dados:', urlParams.toString());
      
      try {
        const response = await fetch(`/menu/${pratoId}/tamanhos`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: urlParams.toString()
        });
        
        if (response.ok) {
          location.reload(); // Recarregar página para mostrar alterações
        } else {
          const errorText = await response.text();
          console.error('Erro do servidor:', errorText);
          alert('Erro ao salvar tamanhos');
        }
      } catch (error) {
        console.error('Erro ao salvar tamanhos:', error);
        alert('Erro ao salvar tamanhos');
      }
    });

    function fecharModalTamanhos() {
      document.getElementById('modalTamanhos').style.display = 'none';
    }

    document.getElementById('fecharModalTamanhos').onclick = fecharModalTamanhos;

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
      if (event.target == document.getElementById('modalTamanhos')) {
        document.getElementById('modalTamanhos').style.display = "none";
      }
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