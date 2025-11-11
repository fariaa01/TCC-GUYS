async function atualizarProduto(id, dados) {
  const response = await fetch(`/menu/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados)
  });
  return response.json();
}

function initProdutos() {
  const grid = document.querySelector('.grid-cards');
  if (!grid) return;

  document.querySelectorAll('.toggle-disponivel').forEach(toggle => {
    toggle.addEventListener('change', async function() {
      const id = this.dataset.id;
      const isAvailable = this.checked ? 1 : 0;
      
      try {
        const result = await atualizarProduto(id, { is_disponivel: isAvailable });
        
        if (result.ok) {
          const card = this.closest('.card');
          const badge = card.querySelector('.badge:not(.badge-archived)');
          
          if (badge) {
            badge.classList.toggle('badge-on', isAvailable === 1);
            badge.classList.toggle('badge-off', isAvailable === 0);
            badge.textContent = isAvailable === 1 ? 'Disponível' : 'Indisponível';
          }
          
          Swal.fire({
            icon: 'success',
            title: 'Atualizado!',
            text: `Produto ${isAvailable === 1 ? 'disponibilizado' : 'indisponibilizado'} para venda.`,
            timer: 2000,
            showConfirmButton: false
          });
        } else {
          throw new Error(result.msg || 'Erro ao atualizar');
        }
      } catch (error) {
        console.error('Erro:', error);
        this.checked = !this.checked;
        Swal.fire({
          icon: 'error',
          title: 'Erro',
          text: 'Não foi possível atualizar a disponibilidade do produto.'
        });
      }
    });
  });

  grid.addEventListener('click', async (e) => {
    const btnArq = e.target.closest('.btn-arquivar');
    const btnRes = e.target.closest('.btn-restaurar');
    
    if (!btnArq && !btnRes) return;

    const card = e.target.closest('.card');
    const id = (btnArq || btnRes).dataset.id;
    const wantArchive = !!btnArq;

    try {
      const result = await atualizarProduto(id, { arquivado: wantArchive ? 1 : 0 });
      
      if (!result.ok) {
        throw new Error(result.msg || 'Erro ao atualizar');
      }

      const data = result.data || {};
      const isArchived = Number(data.arquivado) === 1;
      const isOn = Number(data.is_disponivel) === 1;

      card.classList.toggle('is-archived', isArchived);

      let badgeArch = card.querySelector('.badge-archived');
      if (isArchived && !badgeArch) {
        const span = document.createElement('span');
        span.className = 'badge badge-archived';
        span.innerHTML = '<i class="fa-solid fa-box-archive"></i> Arquivado';
        card.querySelector('.linha-topo').appendChild(span);
      }
      if (!isArchived && badgeArch) {
        badgeArch.remove();
      }

      const toggle = card.querySelector('.toggle-disponivel');
      if (toggle) toggle.checked = !!isOn;

      const availBadge = card.querySelector('.linha-topo .badge:not(.badge-archived)');
      if (availBadge) {
        availBadge.classList.toggle('badge-on', isOn);
        availBadge.classList.toggle('badge-off', !isOn);
        availBadge.innerText = isOn ? 'Disponível' : 'Indisponível';
      }

      const switchEl = card.querySelector('.switch');
      if (switchEl) {
        switchEl.classList.toggle('switch-disabled', isArchived);
      }

      const editableEls = card.querySelectorAll('.editable');
      editableEls.forEach(el => {
        el.style.pointerEvents = isArchived ? 'none' : '';
      });

      const actions = card.querySelector('.actions');
      if (actions) {
        if (isArchived) {
          const old = actions.querySelector('.btn-arquivar');
          if (old) {
            old.outerHTML = `<button type="button" class="btn-restaurar" data-id="${id}"><i class="fa-solid fa-rotate-left"></i> Restaurar</button>`;
          }
        } else {
          const old = actions.querySelector('.btn-restaurar');
          if (old) {
            old.outerHTML = `<button type="button" class="btn-arquivar" data-id="${id}"><i class="fa-solid fa-box-archive"></i> Arquivar</button>`;
          }
        }
      }

      Swal.fire({
        icon: 'success',
        title: 'Atualizado!',
        text: `Produto ${isArchived ? 'arquivado' : 'restaurado'} com sucesso.`,
        timer: 2000,
        showConfirmButton: false
      });

    } catch (error) {
      console.error('Erro:', error);
      Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: 'Não foi possível atualizar o produto.'
      });
    }
  });

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
    input.style.cssText = 'width: 100%; padding: 4px; font-size: inherit; font-weight: inherit; border: 2px solid #1abc9c; border-radius: 4px;';
    
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
        const dados = {};
        dados[field] = field === 'preco' ? parseFloat(newValue) : newValue;

        const result = await atualizarProduto(id, dados);

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

}

// Funções para editar produto
async function abrirModalEditarProduto(produtoId) {
  try {
    // Buscar dados do produto
    const response = await fetch(`/menu/${produtoId}`);
    const result = await response.json();
    
    if (!result.ok) {
      throw new Error(result.msg || 'Erro ao carregar produto');
    }
    
    const produto = result.produto;
    
    // Preencher o modal com os dados
    document.getElementById('editarProdutoId').value = produto.id;
    document.getElementById('editarNome').value = produto.nome_prato || produto.pedido || produto.nome || '';
    document.getElementById('editarCategoria').value = produto.categoria || '';
    document.getElementById('editarDescricao').value = produto.ingredientes || produto.descricao || '';
    
    // Configurar preço e tamanhos
    const temTamanhos = produto.tamanhos && produto.tamanhos.length > 0;
    const temPrecoUnico = produto.preco && Number(produto.preco) > 0 && !temTamanhos;
    
    document.getElementById('editarMultiplosPrecos').checked = temTamanhos;
    
    if (temPrecoUnico) {
      document.getElementById('editarPreco').value = produto.preco;
      document.getElementById('editarPrecoUnico').style.display = 'block';
    } else {
      document.getElementById('editarPreco').value = '';
      document.getElementById('editarPrecoUnico').style.display = 'none';
      document.getElementById('editarMultiplosPrecosList').style.display = 'block';
      
      // Carregar tamanhos existentes
      carregarTamanhosParaEdicao(produto.tamanhos || []);
    }
    
    // Configurar checkboxes
    document.getElementById('editarDestaque').checked = produto.destaque == 1;
    document.getElementById('editarDisponivel').checked = produto.is_disponivel == 1;
    
    // Mostrar imagem atual se existir
    const imagemAtual = document.getElementById('editarImagemAtual');
    const imagemPreview = document.getElementById('editarImagemPreview');
    
    if (produto.imagem) {
      imagemPreview.src = `/uploads/${produto.imagem}`;
      imagemAtual.style.display = 'block';
    } else {
      imagemAtual.style.display = 'none';
    }
    
    // Abrir modal
    document.getElementById('modalEditarProduto').style.display = 'flex';
    
  } catch (error) {
    console.error('Erro ao carregar produto:', error);
    Swal.fire({
      icon: 'error',
      title: 'Erro',
      text: 'Não foi possível carregar os dados do produto.'
    });
  }
}

function fecharModalEditarProduto() {
  document.getElementById('modalEditarProduto').style.display = 'none';
}

// Event listener para o formulário de edição
document.addEventListener('DOMContentLoaded', function() {
  const formEditarProduto = document.getElementById('formEditarProduto');
  if (formEditarProduto) {
    formEditarProduto.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const produtoId = document.getElementById('editarProdutoId').value;
      const formData = new FormData(this);
      
      // Se tem múltiplos preços, também salvar tamanhos separadamente
      const temMultiplosPrecos = document.getElementById('editarMultiplosPrecos').checked;
      
      try {
        // Primeiro, atualizar o produto
        const response = await fetch(`/menu/${produtoId}`, {
          method: 'PUT',
          body: formData
        });
        
        const result = await response.json();
        
        if (!result.ok) {
          throw new Error(result.msg || 'Erro ao atualizar produto');
        }
        
        // Se tem múltiplos preços, salvar tamanhos separadamente
        if (temMultiplosPrecos) {
          const tamanhos = [];
          const tamanhoInputs = document.querySelectorAll('#editarTamanhosLista .tamanho-item-card');
          
          tamanhoInputs.forEach((item) => {
            const tamanho = item.querySelector('select[name*="tamanho"]').value;
            const preco = item.querySelector('input[name*="preco"]').value;
            
            if (tamanho && preco) {
              tamanhos.push({ tamanho, preco: parseFloat(preco) });
            }
          });
          
          // Salvar tamanhos
          const tamanhosResponse = await fetch(`/menu/${produtoId}/tamanhos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tamanhos })
          });
          
          const tamanhosResult = await tamanhosResponse.json();
          
          if (!tamanhosResult.ok) {
            throw new Error(tamanhosResult.msg || 'Erro ao salvar tamanhos');
          }
        }
        
        Swal.fire({
          icon: 'success',
          title: 'Sucesso!',
          text: 'Produto atualizado com sucesso.',
          timer: 2000,
          showConfirmButton: false
        });
        
        fecharModalEditarProduto();
        setTimeout(() => location.reload(), 2000);
        
      } catch (error) {
        console.error('Erro ao atualizar produto:', error);
        Swal.fire({
          icon: 'error',
          title: 'Erro',
          text: 'Não foi possível atualizar o produto.'
        });
      }
    });
  }
});

// Funções para gerenciar tamanhos na edição
let contadorEdicaoTamanhos = 0;

function carregarTamanhosParaEdicao(tamanhos) {
  const container = document.getElementById('editarTamanhosLista');
  const emptyState = document.getElementById('editarEmptyState');
  
  container.innerHTML = '';
  contadorEdicaoTamanhos = 0;
  
  if (tamanhos.length === 0) {
    emptyState.style.display = 'block';
  } else {
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
        <button type="button" class="btn-remove-tamanho" onclick="removerTamanhoEdicao(this)">
          <i class="fas fa-trash"></i>
        </button>
      `;
      container.appendChild(item);
      contadorEdicaoTamanhos++;
    });
  }
}

function adicionarTamanhoParaEdicao() {
  const container = document.getElementById('editarTamanhosLista');
  const emptyState = document.getElementById('editarEmptyState');
  
  const novoItem = document.createElement('div');
  novoItem.className = 'tamanho-item-card';
  novoItem.innerHTML = `
    <select name="tamanhos[${contadorEdicaoTamanhos}][tamanho]" class="tamanho-select" required>
      <option value="">Selecione o tamanho...</option>
      <option value="P">Pequeno (P)</option>
      <option value="M">Médio (M)</option>
      <option value="G">Grande (G)</option>
      <option value="GG">Gigante (GG)</option>
    </select>
    <input type="number" step="0.01" name="tamanhos[${contadorEdicaoTamanhos}][preco]" 
           class="preco-input" placeholder="Preço (R$)" required />
    <button type="button" class="btn-remove-tamanho" onclick="removerTamanhoEdicao(this)">
      <i class="fas fa-trash"></i>
    </button>
  `;
  
  container.appendChild(novoItem);
  contadorEdicaoTamanhos++;
  
  if (emptyState) {
    emptyState.style.display = 'none';
  }
}

function removerTamanhoEdicao(btn) {
  const container = document.getElementById('editarTamanhosLista');
  const emptyState = document.getElementById('editarEmptyState');
  
  btn.closest('.tamanho-item-card').remove();
  
  if (container.children.length === 0 && emptyState) {
    emptyState.style.display = 'block';
  }
}

// Event listener para o checkbox de múltiplos preços na edição
document.addEventListener('DOMContentLoaded', function() {
  const editarMultiplosPrecos = document.getElementById('editarMultiplosPrecos');
  if (editarMultiplosPrecos) {
    editarMultiplosPrecos.addEventListener('change', function() {
      const precoUnico = document.getElementById('editarPrecoUnico');
      const multiplosPrecosList = document.getElementById('editarMultiplosPrecosList');
      
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
});

window.abrirModalEditarProduto = abrirModalEditarProduto;
window.fecharModalEditarProduto = fecharModalEditarProduto;
window.adicionarTamanhoParaEdicao = adicionarTamanhoParaEdicao;
window.removerTamanhoEdicao = removerTamanhoEdicao;
window.initProdutos = initProdutos;
