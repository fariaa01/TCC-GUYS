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

function removerTamanho(btn) {
  btn.closest('.tamanho-preco-item').remove();
}

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
  
  if (emptyState) {
    emptyState.style.display = 'none';
  }
}


function removerTamanhoEdit(btn) {
  const container = document.getElementById('tamanhosEditList');
  const emptyState = document.getElementById('emptyState');
  
  btn.closest('.tamanho-item-card').remove();
  
  if (container.children.length === 0 && emptyState) {
    emptyState.style.display = 'block';
  }
}

function fecharModalTamanhos() {
  document.getElementById('modalTamanhos').style.display = 'none';
}

function fecharModalGerenciarCategorias() {
  document.getElementById('modalGerenciarCategorias').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', function() {
  
  const multiplosPrecos = document.getElementById('multiplosPrecos');
  if (multiplosPrecos) {
    multiplosPrecos.addEventListener('change', function() {
      const precoUnico = document.getElementById('precoUnico');
      const multiplosPrecosList = document.getElementById('multiplosPrecosList');
      
      if (this.checked) {
        precoUnico.style.display = 'none';
        precoUnico.querySelector('input').removeAttribute('required');
        
        multiplosPrecosList.style.display = 'block';
        multiplosPrecosList.querySelectorAll('input, select').forEach(el => {
          el.setAttribute('required', 'required');
        });
      } else {
        precoUnico.style.display = 'block';
        precoUnico.querySelector('input').setAttribute('required', 'required');
        
        multiplosPrecosList.style.display = 'none';
        multiplosPrecosList.querySelectorAll('input, select').forEach(el => {
          el.removeAttribute('required');
        });
      }
    });
  }

  const btnAdicionarTamanho = document.getElementById('btnAdicionarTamanho');
  if (btnAdicionarTamanho) {
    btnAdicionarTamanho.addEventListener('click', adicionarTamanhoEdit);
  }


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
    btnAbrirCategoria.onclick = () => {
      modalCategoria.style.display = "flex";
    };
  }

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

      inputCategoria.value = categoria;

      const categoriaFormatada = categoria.charAt(0).toUpperCase() + categoria.slice(1);
      tituloModal.innerText = "Novo Produto - " + categoriaFormatada;

      camposDinamicos.innerHTML = `
        <input type="text" name="detalhes" placeholder="Detalhes adicionais (opcional)" class="form-box-input" />
      `;

      modalCategoria.style.display = "none";
      modalPedido.style.display = "flex";
    };
  }

  const grid = document.querySelector('.grid-cards');
  if (grid) {
    grid.addEventListener('dblclick', async (e) => {
      const editable = e.target.closest('.editable');
      if (!editable || editable.querySelector('input')) return;

      const card = editable.closest('.card');
      const id = card.dataset.id;
      const field = editable.dataset.field;
      const oldValue = editable.textContent.trim();

      const input = document.createElement('input');
      input.type = field === 'preco' ? 'number' : 'text';
      input.step = field === 'preco' ? '0.01' : undefined;
      input.value = field === 'preco' ? oldValue.replace('R$ ', '').replace(',', '.') : oldValue;
      input.style.cssText = 'width: 100%; padding: 4px; font-size: inherit; font-weight: inherit;';
      
      editable.textContent = '';
      editable.appendChild(input);
      input.focus();
      input.select();

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

          document.getElementById('inputNomeCategoria').value = '';
          document.getElementById('inputIconeCategoria').value = '📦';

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
        console.error('Erro ao criar categoria:', error);
        Swal.fire({
          icon: 'error',
          title: 'Erro',
          text: 'Não foi possível criar a categoria.'
        });
      }
    });
  }

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

});


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

async function excluirProduto(id, nome) {
  const result = await Swal.fire({
    title: 'Confirmar exclusão',
    text: `Deseja realmente excluir o produto "${nome}"?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#e74c3c',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Sim, excluir',
    cancelButtonText: 'Cancelar'
  });

  if (result.isConfirmed) {
    try {
      const response = await fetch(`/menu/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Excluído!',
          text: data.msg,
          timer: 1500,
          showConfirmButton: false
        });

        location.reload();
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Erro',
          text: data.msg || 'Erro ao excluir produto'
        });
      }
    } catch (error) {
      console.error('Erro:', error);
      Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: 'Erro ao excluir produto'
      });
    }
  }
}


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
