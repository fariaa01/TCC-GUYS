/**
 * ============================================
 * MENU - CONTROLE DE MODAIS
 * ============================================
 * Gerencia abertura e fechamento de todos os modais
 */

/**
 * Inicializa controles dos modais
 */
function initModais() {
  const modalCategoria = document.getElementById('modalCategoria');
  const modalPedido = document.getElementById('modalPedido');
  const modalGerenciarCategorias = document.getElementById('modalGerenciarCategorias');
  const modalTamanhos = document.getElementById('modalTamanhos');

  // Botões de abrir modais
  const btnAbrirCategoria = document.getElementById('btnAbrirCategoria');
  const fecharCategoria = document.getElementById('fecharCategoria');
  const fecharModal = document.getElementById('fecharModal');
  const btnCancelarCadastro = document.getElementById('btnCancelarCadastro');

  // Abrir modal de seleção de categoria
  if (btnAbrirCategoria) {
    btnAbrirCategoria.addEventListener('click', () => {
      modalCategoria.style.display = 'flex';
    });
  }

  // Fechar modal de categoria
  if (fecharCategoria) {
    fecharCategoria.addEventListener('click', () => {
      modalCategoria.style.display = 'none';
    });
  }

  // Fechar modal de cadastro de produto
  if (fecharModal) {
    fecharModal.addEventListener('click', () => {
      modalPedido.style.display = 'none';
    });
  }

  // Botão cancelar cadastro
  if (btnCancelarCadastro) {
    btnCancelarCadastro.addEventListener('click', () => {
      modalPedido.style.display = 'none';
    });
  }

  // Fechar modais ao clicar fora
  window.addEventListener('click', (event) => {
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

  // Botão Avançar: Categoria → Cadastro de Produto
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

      // Preencher campo oculto
      inputCategoria.value = categoria;
      
      // Atualizar título
      const categoriaFormatada = categoria.charAt(0).toUpperCase() + categoria.slice(1);
      tituloModal.innerText = 'Novo Produto - ' + categoriaFormatada;
      
      // Campo genérico para detalhes adicionais
      camposDinamicos.innerHTML = `
        <input type="text" name="detalhes" placeholder="Detalhes adicionais (opcional)" class="form-box-input" />
      `;

      // Trocar modais
      modalCategoria.style.display = 'none';
      modalPedido.style.display = 'flex';
    });
  }

  console.log('✅ Módulo de Modais carregado');
}

// Exportar função
window.initModais = initModais;
