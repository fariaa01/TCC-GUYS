/**
 * ============================================
 * MENU - GERENCIAMENTO DE CATEGORIAS
 * ============================================
 * CRUD completo de categorias personalizadas
 */

/**
 * Carrega e exibe todas as categorias do usuário
 */
async function carregarCategorias() {
  try {
    const response = await fetch('/categorias');
    const result = await response.json();

    if (!result.ok) {
      throw new Error(result.msg || 'Erro ao carregar categorias');
    }

    const listaCategorias = document.getElementById('listaCategorias');
    const emptyCategorias = document.getElementById('emptyCategorias');

    if (result.categorias.length === 0) {
      listaCategorias.innerHTML = '';
      emptyCategorias.style.display = 'block';
    } else {
      emptyCategorias.style.display = 'none';
      listaCategorias.innerHTML = result.categorias.map(cat => `
        <div class="categoria-item" data-id="${cat.id}">
          <div class="categoria-info">
            <span class="categoria-icone">${cat.icone}</span>
            <span class="categoria-nome">${cat.nome}</span>
          </div>
          <div class="categoria-acoes">
            <button class="btn-editar-cat" onclick="editarCategoria(${cat.id}, '${escapeHtml(cat.nome)}', '${cat.icone}')" title="Editar">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn-excluir-cat" onclick="excluirCategoria(${cat.id}, '${escapeHtml(cat.nome)}')" title="Excluir">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('Erro ao carregar categorias:', error);
    Swal.fire({
      icon: 'error',
      title: 'Erro',
      text: 'Não foi possível carregar as categorias.'
    });
  }
}

/**
 * Atualiza o select de categorias no modal de escolha
 */
async function atualizarSelectCategorias() {
  try {
    const response = await fetch('/categorias');
    const result = await response.json();

    if (result.ok) {
      const select = document.getElementById('selectCategoria');
      if (select) {
        const options = result.categorias.length > 0
          ? result.categorias.map(cat => 
              `<option value="${escapeHtml(cat.nome)}">${cat.icone} ${escapeHtml(cat.nome)}</option>`
            ).join('')
          : '<option value="" disabled>Nenhuma categoria cadastrada</option>';
        
        select.innerHTML = '<option value="">Selecione...</option>' + options;
      }
    }
  } catch (error) {
    console.error('Erro ao atualizar categorias:', error);
  }
}

/**
 * Cria uma nova categoria
 */
async function criarCategoria(nome, icone) {
  try {
    const response = await fetch('/categorias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, icone })
    });

    const result = await response.json();

    if (result.ok) {
      Swal.fire({
        icon: 'success',
        title: 'Sucesso!',
        text: result.msg,
        timer: 1500,
        showConfirmButton: false
      });

      await carregarCategorias();
      await atualizarSelectCategorias();
      
      return true;
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: result.msg
      });
      return false;
    }
  } catch (error) {
    console.error('Erro ao criar categoria:', error);
    Swal.fire({
      icon: 'error',
      title: 'Erro',
      text: 'Não foi possível criar a categoria.'
    });
    return false;
  }
}

/**
 * Edita uma categoria existente
 */
async function editarCategoria(id, nomeAtual, iconeAtual) {
  const { value: formValues } = await Swal.fire({
    title: 'Editar Categoria',
    html:
      `<input id="swal-nome" class="swal2-input" value="${escapeHtml(nomeAtual)}" placeholder="Nome da categoria">` +
      `<input id="swal-icone" class="swal2-input" value="${iconeAtual}" placeholder="Ícone (emoji)">`,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'Salvar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#1abc9c',
    cancelButtonColor: '#6c757d',
    preConfirm: () => {
      return {
        nome: document.getElementById('swal-nome').value.trim(),
        icone: document.getElementById('swal-icone').value.trim()
      }
    }
  });

  if (formValues && formValues.nome) {
    try {
      const response = await fetch(`/categorias/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formValues)
      });

      const result = await response.json();

      if (result.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Atualizado!',
          text: result.msg,
          timer: 1500,
          showConfirmButton: false
        });

        await carregarCategorias();
        await atualizarSelectCategorias();
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Erro',
          text: result.msg
        });
      }
    } catch (error) {
      console.error('Erro ao editar categoria:', error);
      Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: 'Não foi possível editar a categoria.'
      });
    }
  }
}

/**
 * Exclui uma categoria
 */
async function excluirCategoria(id, nome) {
  const result = await Swal.fire({
    title: 'Confirmar exclusão',
    text: `Deseja realmente excluir a categoria "${nome}"?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#e74c3c',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Sim, excluir',
    cancelButtonText: 'Cancelar'
  });

  if (result.isConfirmed) {
    try {
      const response = await fetch(`/categorias/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Excluída!',
          text: data.msg,
          timer: 1500,
          showConfirmButton: false
        });

        await carregarCategorias();
        await atualizarSelectCategorias();
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Erro',
          text: data.msg
        });
      }
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);
      Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: 'Não foi possível excluir a categoria.'
      });
    }
  }
}

/**
 * Abre o modal de gerenciar categorias
 */
function abrirModalGerenciarCategorias() {
  carregarCategorias();
  document.getElementById('modalGerenciarCategorias').style.display = 'flex';
}

/**
 * Fecha o modal de gerenciar categorias
 */
function fecharModalGerenciarCategorias() {
  document.getElementById('modalGerenciarCategorias').style.display = 'none';
}

/**
 * Função auxiliar para escapar HTML e prevenir XSS
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Inicializa o módulo de categorias
 */
function initCategorias() {
  // Formulário de Nova Categoria
  const formNovaCategoria = document.getElementById('formNovaCategoria');
  if (formNovaCategoria) {
    formNovaCategoria.addEventListener('submit', async function(e) {
      e.preventDefault();

      const nome = document.getElementById('inputNomeCategoria').value.trim();
      const icone = document.getElementById('inputIconeCategoria').value.trim() || '📦';

      if (!nome) {
        Swal.fire({
          icon: 'warning',
          title: 'Atenção',
          text: 'Digite o nome da categoria.'
        });
        return;
      }

      const sucesso = await criarCategoria(nome, icone);
      
      if (sucesso) {
        // Limpar formulário
        document.getElementById('inputNomeCategoria').value = '';
        document.getElementById('inputIconeCategoria').value = '📦';
      }
    });
  }

  // Botão Gerenciar Categorias
  const btnGerenciarCategorias = document.getElementById('btnGerenciarCategorias');
  if (btnGerenciarCategorias) {
    btnGerenciarCategorias.addEventListener('click', () => {
      document.getElementById('modalCategoria').style.display = 'none';
      abrirModalGerenciarCategorias();
    });
  }

  console.log('✅ Módulo de Categorias carregado');
}

// Exportar funções para uso global
window.carregarCategorias = carregarCategorias;
window.atualizarSelectCategorias = atualizarSelectCategorias;
window.criarCategoria = criarCategoria;
window.editarCategoria = editarCategoria;
window.excluirCategoria = excluirCategoria;
window.abrirModalGerenciarCategorias = abrirModalGerenciarCategorias;
window.fecharModalGerenciarCategorias = fecharModalGerenciarCategorias;
window.initCategorias = initCategorias;
