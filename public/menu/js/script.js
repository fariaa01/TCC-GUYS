/**
 * ============================================
 * MENU - ARQUIVO PRINCIPAL (ORQUESTRADOR)
 * ============================================
 * Inicializa todos os módulos do sistema de gestão de cardápio
 * 
 * Módulos:
 * - menu-tamanhos.js: Gerenciamento de tamanhos e preços
 * - menu-categorias.js: CRUD de categorias personalizadas
 * - menu-modais.js: Controle de abertura/fechamento de modais
 * - menu-produtos.js: Edição, arquivar, excluir produtos
 */

// ============================================
// FUNÇÕES GLOBAIS (acessíveis via onclick)
// ============================================

/**
 * Adiciona um novo campo de tamanho/preço no formulário de cadastro
 */
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

/**
 * Remove um campo de tamanho/preço
 */
function removerTamanho(btn) {
  btn.closest('.tamanho-preco-item').remove();
}

/**
 * Adiciona um novo campo de tamanho/preço no modal de edição
 */
function adicionarTamanhoEdit() {
  const container = document.getElementById('tamanhosEditList');
  const emptyState = document.getElementById('emptyState');
  
  const novoItem = document.createElement('div');
  novoItem.className = 'tamanho-item-card';
  novoItem.innerHTML = `
    <select name="tamanhos[${contadorEdit}][tamanho]" class="tamanho-select" required>
      <option value="">Selecione o tamanho...</option>
      <option value="P">Pequeno (P)</option>
      <option value="M">Médio (M)</option>
      <option value="G">Grande (G)</option>
      <option value="GG">Gigante (GG)</option>
    </select>
    <input type="number" step="0.01" name="tamanhos[${contadorEdit}][preco]" 
           class="preco-input" placeholder="Preço (R$)" required />
    <button type="button" class="btn-remove-tamanho" onclick="removerTamanhoEdit(this)">
      <i class="fas fa-trash"></i>
    </button>
  `;
  
  container.appendChild(novoItem);
  contadorEdit++;
  
  // Esconder estado vazio se houver itens
  if (emptyState) {
    emptyState.style.display = 'none';
  }
}

/**
 * Remove um campo de tamanho/preço do modal de edição
 */
function removerTamanhoEdit(btn) {
  const container = document.getElementById('tamanhosEditList');
  const emptyState = document.getElementById('emptyState');
  
  btn.closest('.tamanho-item-card').remove();
  
  // Mostrar estado vazio se não houver mais itens
  if (container.children.length === 0 && emptyState) {
    emptyState.style.display = 'block';
  }
}

/**
 * Fecha o modal de gerenciar tamanhos
 */
function fecharModalTamanhos() {
  document.getElementById('modalTamanhos').style.display = 'none';
}

/**
 * Fecha o modal de gerenciar categorias
 */
function fecharModalGerenciarCategorias() {
  document.getElementById('modalGerenciarCategorias').style.display = 'none';
}

// ============================================
// INICIALIZAÇÃO QUANDO O DOM ESTIVER PRONTO
// ============================================

document.addEventListener('DOMContentLoaded', function() {
  
  // ==========================================
  // Toggle: Múltiplos Preços
  // ==========================================
  const multiplosPrecos = document.getElementById('multiplosPrecos');
  if (multiplosPrecos) {
    multiplosPrecos.addEventListener('change', function() {
      const precoUnico = document.getElementById('precoUnico');
      const multiplosPrecosList = document.getElementById('multiplosPrecosList');
      
      if (this.checked) {
        // Mostrar múltiplos tamanhos, esconder preço único
        precoUnico.style.display = 'none';
        precoUnico.querySelector('input').removeAttribute('required');
        
        multiplosPrecosList.style.display = 'block';
        multiplosPrecosList.querySelectorAll('input, select').forEach(el => {
          el.setAttribute('required', 'required');
        });
      } else {
        // Mostrar preço único, esconder múltiplos tamanhos
        precoUnico.style.display = 'block';
        precoUnico.querySelector('input').setAttribute('required', 'required');
        
        multiplosPrecosList.style.display = 'none';
        multiplosPrecosList.querySelectorAll('input, select').forEach(el => {
          el.removeAttribute('required');
        });
      }
    });
  }

  // ==========================================
  // Botão: Adicionar Tamanho (Modal de Edição)
  // ==========================================
  const btnAdicionarTamanho = document.getElementById('btnAdicionarTamanho');
  if (btnAdicionarTamanho) {
    btnAdicionarTamanho.addEventListener('click', adicionarTamanhoEdit);
  }

  // ==========================================
  // Abrir Modal: Editar Tamanhos
  // ==========================================
  document.addEventListener('click', async function(e) {
    if (e.target.closest('.btn-editar-tamanhos')) {
      const pratoId = e.target.closest('.btn-editar-tamanhos').dataset.id;
      const pratoCard = e.target.closest('.card');
      const pratoNome = pratoCard.querySelector('h3').textContent;
      
      // Definir ID do prato e nome no modal
      document.getElementById('editPratoId').value = pratoId;
      document.getElementById('pratoNomeModal').textContent = pratoNome;
      
      try {
        // Carregar tamanhos existentes via API
        const response = await fetch(`/menu/${pratoId}/tamanhos`);
        
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const tamanhos = await response.json();
        console.log('Tamanhos carregados:', tamanhos);
        
        const container = document.getElementById('tamanhosEditList');
        const emptyState = document.getElementById('emptyState');
        
        // Limpar container
        container.innerHTML = '';
        contadorEdit = 0;
        
        if (tamanhos.length === 0) {
          // Mostrar estado vazio
          emptyState.style.display = 'block';
        } else {
          // Esconder estado vazio e carregar tamanhos
          emptyState.style.display = 'none';
          
          tamanhos.forEach((tamanho, index) => {
            const item = document.createElement('div');
            item.className = 'tamanho-item-card';
            item.innerHTML = `
              <select name="tamanhos[${index}][tamanho]" class="tamanho-select" required>
                <option value="">Selecione o tamanho...</option>
                <option value="P" ${tamanho.tamanho === 'P' ? 'selected' : ''}>Pequeno (P)</option>
                <option value="M" ${tamanho.tamanho === 'M' ? 'selected' : ''}>Médio (M)</option>
                <option value="G" ${tamanho.tamanho === 'G' ? 'selected' : ''}>Grande (G)</option>
                <option value="GG" ${tamanho.tamanho === 'GG' ? 'selected' : ''}>Gigante (GG)</option>
              </select>
              <input type="number" step="0.01" name="tamanhos[${index}][preco]" 
                     class="preco-input" placeholder="Preço (R$)" 
                     value="${tamanho.preco}" required />
              <button type="button" class="btn-remove-tamanho" onclick="removerTamanhoEdit(this)">
                <i class="fas fa-trash"></i>
              </button>
            `;
            container.appendChild(item);
            contadorEdit++;
          });
        }
        
        // Abrir modal
        document.getElementById('modalTamanhos').style.display = 'flex';
        
      } catch (error) {
        console.error('Erro ao carregar tamanhos:', error);
        Swal.fire({
          icon: 'error',
          title: 'Erro',
          text: 'Não foi possível carregar os tamanhos do produto. ' + error.message
        });
      }
    }
  });

  // ==========================================
  // Modais: Categoria e Produto
  // ==========================================
  const btnAbrirCategoria = document.getElementById("btnAbrirCategoria");
  const modalCategoria = document.getElementById("modalCategoria");
  const modalPedido = document.getElementById("modalPedido");
  const modalGerenciarCategorias = document.getElementById("modalGerenciarCategorias");
  const fecharCategoria = document.getElementById("fecharCategoria");
  const fecharModal = document.getElementById("fecharModal");
  const selectCategoria = document.getElementById("selectCategoria");
  const inputCategoria = document.getElementById("inputCategoria");
  const camposDinamicos = document.getElementById("camposDinamicos");
  const tituloModal = document.getElementById("tituloModal");

  if (btnAbrirCategoria) {
    // Abrir modal de categoria
    btnAbrirCategoria.onclick = () => {
      modalCategoria.style.display = "flex";
    };
  }

  // Botão Gerenciar Categorias
  const btnGerenciarCategorias = document.getElementById("btnGerenciarCategorias");
  if (btnGerenciarCategorias) {
    btnGerenciarCategorias.onclick = () => {
      carregarCategorias();
      modalCategoria.style.display = "none";
      modalGerenciarCategorias.style.display = "flex";
    };
  }

  if (fecharCategoria) {
    fecharCategoria.onclick = () => {
      modalCategoria.style.display = "none";
    };
  }

  if (fecharModal) {
    fecharModal.onclick = () => {
      modalPedido.style.display = "none";
    };
  }

  // ==========================================
  // Botão Avançar: Categoria → Cadastro
  // ==========================================
  const btnAvancar = document.getElementById("btnAvancar");
  if (btnAvancar) {
    btnAvancar.onclick = () => {
      const categoria = selectCategoria.value;
      
      if (!categoria) {
        Swal.fire({
          icon: 'warning',
          title: 'Atenção',
          text: 'Por favor, selecione uma categoria.'
        });
        return;
      }

      // Preencher campo oculto com a categoria
      inputCategoria.value = categoria;
      
      // Atualizar título do modal
      const categoriaFormatada = categoria.charAt(0).toUpperCase() + categoria.slice(1);
      tituloModal.innerText = "Novo Produto - " + categoriaFormatada;
      
      // Limpar campos dinâmicos (agora não há campos específicos, apenas um campo genérico opcional)
      camposDinamicos.innerHTML = `
        <input type="text" name="detalhes" placeholder="Detalhes adicionais (opcional)" class="form-box-input" />
      `;

      // Fechar modal de categoria e abrir modal de cadastro
      modalCategoria.style.display = "none";
      modalPedido.style.display = "flex";
    };
  }

  // ==========================================
  // Edição Inline de Campos (nome e preço)
  // ==========================================
  const grid = document.querySelector('.grid-cards');
  if (grid) {
    grid.addEventListener('dblclick', async (e) => {
      const editable = e.target.closest('.editable');
      if (!editable || editable.querySelector('input')) return;

      const card = editable.closest('.card');
      const id = card.dataset.id;
      const field = editable.dataset.field;
      const oldValue = editable.textContent.trim();

      // Criar input para edição
      const input = document.createElement('input');
      input.type = field === 'preco' ? 'number' : 'text';
      input.step = field === 'preco' ? '0.01' : undefined;
      input.value = field === 'preco' ? oldValue.replace('R$ ', '').replace(',', '.') : oldValue;
      input.style.cssText = 'width: 100%; padding: 4px; font-size: inherit; font-weight: inherit;';
      
      editable.textContent = '';
      editable.appendChild(input);
      input.focus();
      input.select();

      // Salvar ao perder foco ou pressionar Enter
      const salvar = async () => {
        const newValue = input.value.trim();
        if (!newValue || newValue === oldValue) {
          editable.textContent = oldValue;
          return;
        }

        try {
          const body = {};
          body[field] = field === 'preco' ? parseFloat(newValue) : newValue;

          const response = await fetch(`/menu/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          });

          const result = await response.json();

          if (result.ok) {
            if (field === 'preco') {
              editable.innerHTML = `<strong>R$ ${parseFloat(newValue).toFixed(2).replace('.', ',')}</strong>`;
            } else {
              editable.textContent = newValue;
            }
            
            Swal.fire({
              icon: 'success',
              title: 'Atualizado!',
              text: 'Alteração salva com sucesso.',
              timer: 1500,
              showConfirmButton: false
            });
          } else {
            throw new Error(result.msg || 'Erro ao atualizar');
          }
        } catch (error) {
          console.error('Erro ao salvar:', error);
          editable.textContent = oldValue;
          Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: 'Não foi possível salvar a alteração.'
          });
        }
      };

      input.addEventListener('blur', salvar);
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          salvar();
        }
      });
    });
  }

  // ==========================================
  // Confirmação de Exclusão
  // ==========================================
  document.querySelectorAll('.form-excluir').forEach(form => {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      
      Swal.fire({
        title: 'Confirmar exclusão',
        text: 'Deseja realmente excluir este produto? Esta ação não pode ser desfeita.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#e74c3c',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sim, excluir',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          this.submit();
        }
      });
    });
  });

  // ==========================================
  // Gerenciamento de Categorias
  // ==========================================

  /**
   * Carrega e exibe todas as categorias
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
              <button class="btn-editar-cat" onclick="editarCategoria(${cat.id}, '${cat.nome.replace(/'/g, "\\'")}', '${cat.icone}')" title="Editar">
                <i class="fas fa-edit"></i>
              </button>
              <button class="btn-excluir-cat" onclick="excluirCategoria(${cat.id}, '${cat.nome.replace(/'/g, "\\'")})" title="Excluir">
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

          // Limpar formulário
          document.getElementById('inputNomeCategoria').value = '';
          document.getElementById('inputIconeCategoria').value = '📦';

          // Recarregar lista
          await carregarCategorias();
          
          // Atualizar select do modal de categoria
          await atualizarSelectCategorias();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: result.msg
          });
        }
      } catch (error) {
        console.error('Erro ao criar categoria:', error);
        Swal.fire({
          icon: 'error',
          title: 'Erro',
          text: 'Não foi possível criar a categoria.'
        });
      }
    });
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
        select.innerHTML = '<option value="">Selecione...</option>' + 
          result.categorias.map(cat => 
            `<option value="${cat.nome}">${cat.icone} ${cat.nome}</option>`
          ).join('');
      }
    } catch (error) {
      console.error('Erro ao atualizar categorias:', error);
    }
  }

  // Fechar modal ao clicar fora
  window.onclick = (event) => {
    if (event.target === modalCategoria) {
      modalCategoria.style.display = "none";
    }
    if (event.target === modalPedido) {
      modalPedido.style.display = "none";
    }
    if (event.target === modalGerenciarCategorias) {
      modalGerenciarCategorias.style.display = "none";
    }
    if (event.target === document.getElementById('modalTamanhos')) {
      document.getElementById('modalTamanhos').style.display = "none";
    }
  };

  console.log('✅ Sistema de Gestão de Cardápio carregado com sucesso!');
});

// ==========================================
// Funções Globais para Gerenciar Categorias
// ==========================================

/**
 * Edita uma categoria
 */
async function editarCategoria(id, nomeAtual, iconeAtual) {
  const { value: formValues } = await Swal.fire({
    title: 'Editar Categoria',
    html:
      `<input id="swal-nome" class="swal2-input" value="${nomeAtual}" placeholder="Nome da categoria">` +
      `<input id="swal-icone" class="swal2-input" value="${iconeAtual}" placeholder="Ícone (emoji)">`,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'Salvar',
    cancelButtonText: 'Cancelar',
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

        // Recarregar lista
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

        // Recarregar lista
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
 * Atualiza o select de categorias (função auxiliar global)
 */
async function atualizarSelectCategorias() {
  try {
    const response = await fetch('/categorias');
    const result = await response.json();

    if (result.ok) {
      const select = document.getElementById('selectCategoria');
      if (select) {
        select.innerHTML = '<option value="">Selecione...</option>' + 
          result.categorias.map(cat => 
            `<option value="${cat.nome}">${cat.icone} ${cat.nome}</option>`
          ).join('');
      }
    }
  } catch (error) {
    console.error('Erro ao atualizar categorias:', error);
  }
}

/**
 * Carrega categorias (função auxiliar global)
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
            <button class="btn-editar-cat" onclick="editarCategoria(${cat.id}, '${cat.nome.replace(/'/g, "\\'")}', '${cat.icone}')" title="Editar">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn-excluir-cat" onclick="excluirCategoria(${cat.id}, '${cat.nome.replace(/'/g, "\\'")})" title="Excluir">
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
