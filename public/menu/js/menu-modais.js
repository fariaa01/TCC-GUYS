function initModais() {
  const modalCategoria = document.getElementById('modalCategoria');
  const modalPedido = document.getElementById('modalPedido');
  const modalGerenciarCategorias = document.getElementById('modalGerenciarCategorias');
  const modalTamanhos = document.getElementById('modalTamanhos');

  const btnAbrirCategoria = document.getElementById('btnAbrirCategoria');
  const fecharCategoria = document.getElementById('fecharCategoria');
  const fecharModal = document.getElementById('fecharModal');
  const btnCancelarCadastro = document.getElementById('btnCancelarCadastro');

  if (btnAbrirCategoria) {
    btnAbrirCategoria.addEventListener('click', () => {
      modalCategoria.style.display = 'flex';
    });
  }

  if (fecharCategoria) {
    fecharCategoria.addEventListener('click', () => {
      modalCategoria.style.display = 'none';
    });
  }

  if (fecharModal) {
    fecharModal.addEventListener('click', () => {
      modalPedido.style.display = 'none';
    });
  }

  if (btnCancelarCadastro) {
    btnCancelarCadastro.addEventListener('click', () => {
      modalPedido.style.display = 'none';
    });
  }

  window.addEventListener('click', (event) => {
    // Não fechar modal se clicou em botão que abre ele
    if (event.target.closest('.btn-editar-tamanhos')) {
      return;
    }
    
    if (event.target === modalCategoria) {
      modalCategoria.style.display = 'none';
    }
    if (event.target === modalPedido) {
      modalPedido.style.display = 'none';
    }
    if (event.target === modalGerenciarCategorias) {
      modalGerenciarCategorias.style.display = 'none';
    }
    if (event.target === modalTamanhos) {
      modalTamanhos.style.display = 'none';
    }
  });

  const btnAvancar = document.getElementById('btnAvancar');
  const selectCategoria = document.getElementById('selectCategoria');
  const inputCategoria = document.getElementById('inputCategoria');
  const camposDinamicos = document.getElementById('camposDinamicos');
  const tituloModal = document.getElementById('tituloModal');

  if (btnAvancar) {
    btnAvancar.addEventListener('click', () => {
      const categoria = selectCategoria.value;
      
      if (!categoria) {
        Swal.fire({
          icon: 'warning',
          title: 'Atenção',
          text: 'Por favor, selecione uma categoria.'
        });
        return;
      }

      inputCategoria.value = categoria;

      const categoriaFormatada = categoria.charAt(0).toUpperCase() + categoria.slice(1);
      tituloModal.innerText = 'Novo Produto - ' + categoriaFormatada;

      camposDinamicos.innerHTML = `
        <input type="text" name="detalhes" placeholder="Detalhes adicionais (opcional)" class="form-box-input" />
      `;

      modalCategoria.style.display = 'none';
      modalPedido.style.display = 'flex';
    });
  }
}

window.initModais = initModais;
