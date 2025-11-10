/**
 * ============================================
 * MENU - GERENCIAMENTO DE PRODUTOS
 * ============================================
 * Edição inline, toggle de disponibilidade,
 * arquivar/restaurar e exclusão de produtos
 */

/**
 * Envia uma requisição PATCH para atualizar produto
 */
async function atualizarProduto(id, dados) {
  const response = await fetch(`/menu/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados)
  });
  return response.json();
}

/**
 * Inicializa funcionalidades de gerenciamento de produtos
 */
function initProdutos() {
  const grid = document.querySelector('.grid-cards');
  if (!grid) return;

  // ==========================================
  // Toggle de Disponibilidade
  // ==========================================
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

  // ==========================================
  // Arquivar / Restaurar
  // ==========================================
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

      // Atualizar visualização do card
      card.classList.toggle('is-archived', isArchived);

      // Badge de arquivado
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

      // Toggle de disponibilidade
      const toggle = card.querySelector('.toggle-disponivel');
      if (toggle) toggle.checked = !!isOn;

      // Badge de disponibilidade
      const availBadge = card.querySelector('.linha-topo .badge:not(.badge-archived)');
      if (availBadge) {
        availBadge.classList.toggle('badge-on', isOn);
        availBadge.classList.toggle('badge-off', !isOn);
        availBadge.innerText = isOn ? 'Disponível' : 'Indisponível';
      }

      // Opacidade do switch
      const switchEl = card.querySelector('.switch');
      if (switchEl) {
        switchEl.classList.toggle('switch-disabled', isArchived);
      }

      // Desabilitar edição inline quando arquivado
      const editableEls = card.querySelectorAll('.editable');
      editableEls.forEach(el => {
        el.style.pointerEvents = isArchived ? 'none' : '';
      });

      // Trocar botão arquivar/restaurar
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

  // ==========================================
  // Edição Inline (duplo clique)
  // ==========================================
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
    input.style.cssText = 'width: 100%; padding: 4px; font-size: inherit; font-weight: inherit; border: 2px solid #1abc9c; border-radius: 4px;';
    
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

  console.log('✅ Módulo de Produtos carregado');
}

// Exportar função
window.initProdutos = initProdutos;
