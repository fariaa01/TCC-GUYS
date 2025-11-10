if (typeof window !== 'undefined') {
  console.log('Carregando módulo de Tamanhos Personalizados...');

  let tamanhosPersonalizados = [];

  window.abrirModalGerenciarTamanhosPersonalizados = function() {
    const modal = document.getElementById('modalGerenciarTamanhos');
    if (modal) {
      modal.style.display = 'flex';
      carregarTamanhosPersonalizados();
    }
  };

  window.fecharModalGerenciarTamanhosPersonalizados = function() {
    const modal = document.getElementById('modalGerenciarTamanhos');
    if (modal) {
      modal.style.display = 'none';
    }
  };

  async function carregarTamanhosPersonalizados() {
    try {
      const response = await fetch('/tamanhos');
      const data = await response.json();
      
      if (data.ok) {
        tamanhosPersonalizados = data.tamanhos;
        renderizarListaTamanhosPersonalizados();
      }
    } catch (error) {
      console.error('Erro ao carregar tamanhos:', error);
      Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: 'Não foi possível carregar os tamanhos personalizados'
      });
    }
  }

  function renderizarListaTamanhosPersonalizados() {
    const lista = document.getElementById('listaTamanhosPersonalizados');
    const empty = document.getElementById('emptyTamanhosPersonalizados');
    
    if (!lista || !empty) return;

    if (tamanhosPersonalizados.length === 0) {
      lista.style.display = 'none';
      empty.style.display = 'flex';
      return;
    }

    lista.style.display = 'grid';
    empty.style.display = 'none';
    
    lista.innerHTML = tamanhosPersonalizados.map(tamanho => `
      <div class="categoria-item" data-id="${tamanho.id}">
        <div class="categoria-info">
          <span class="categoria-nome">${tamanho.nome}</span>
        </div>
        <div class="categoria-actions">
          <button type="button" class="btn-edit-cat" onclick="editarTamanhoPersonalizado(${tamanho.id}, '${tamanho.nome.replace(/'/g, "\\'")}')">
            <i class="fas fa-edit"></i>
          </button>
          <button type="button" class="btn-delete-cat" onclick="excluirTamanhoPersonalizado(${tamanho.id})">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `).join('');
  }

  const formAdicionarTamanho = document.getElementById('formAdicionarTamanho');
  if (formAdicionarTamanho) {
    formAdicionarTamanho.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const nomeInput = document.getElementById('novoTamanhoNome');
      const nome = nomeInput.value.trim();
      
      if (!nome) {
        Swal.fire({
          icon: 'warning',
          title: 'Atenção',
          text: 'Digite o nome do tamanho'
        });
        return;
      }
      
      try {
        const response = await fetch('/tamanhos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome })
        });
        
        const result = await response.json();
        
        if (result.ok) {
          Swal.fire({
            icon: 'success',
            title: 'Sucesso!',
            text: 'Tamanho adicionado com sucesso',
            timer: 1500,
            showConfirmButton: false
          });
          
          nomeInput.value = '';
          carregarTamanhosPersonalizados();

          if (typeof carregarTamanhosDisponiveis === 'function') {
            carregarTamanhosDisponiveis();
          }
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: result.msg || 'Não foi possível adicionar o tamanho'
          });
        }
      } catch (error) {
        console.error('Erro:', error);
        Swal.fire({
          icon: 'error',
          title: 'Erro',
          text: 'Erro ao adicionar tamanho'
        });
      }
    });
  }

  window.editarTamanhoPersonalizado = async function(id, nomeAtual) {
    const { value: novoNome } = await Swal.fire({
      title: 'Editar Tamanho',
      input: 'text',
      inputLabel: 'Nome do tamanho',
      inputValue: nomeAtual,
      showCancelButton: true,
      confirmButtonText: 'Salvar',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return 'Digite o nome do tamanho';
        }
      }
    });

    if (novoNome) {
      try {
        const response = await fetch(`/tamanhos/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome: novoNome })
        });

        const result = await response.json();

        if (result.ok) {
          Swal.fire({
            icon: 'success',
            title: 'Sucesso!',
            text: 'Tamanho atualizado',
            timer: 1500,
            showConfirmButton: false
          });
          carregarTamanhosPersonalizados();
          
          if (typeof carregarTamanhosDisponiveis === 'function') {
            carregarTamanhosDisponiveis();
          }
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: result.msg || 'Não foi possível atualizar o tamanho'
          });
        }
      } catch (error) {
        console.error('Erro:', error);
        Swal.fire({
          icon: 'error',
          title: 'Erro',
          text: 'Erro ao atualizar tamanho'
        });
      }
    }
  };

  window.excluirTamanhoPersonalizado = async function(id) {
    const result = await Swal.fire({
      title: 'Confirmar Exclusão',
      text: 'Deseja realmente excluir este tamanho?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, excluir',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#e74c3c'
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/tamanhos/${id}`, {
          method: 'DELETE'
        });

        const data = await response.json();

        if (data.ok) {
          Swal.fire({
            icon: 'success',
            title: 'Sucesso!',
            text: 'Tamanho excluído',
            timer: 1500,
            showConfirmButton: false
          });
          carregarTamanhosPersonalizados();

          if (typeof carregarTamanhosDisponiveis === 'function') {
            carregarTamanhosDisponiveis();
          }
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: data.msg || 'Não foi possível excluir o tamanho'
          });
        }
      } catch (error) {
        console.error('Erro:', error);
        Swal.fire({
          icon: 'error',
          title: 'Erro',
          text: 'Erro ao excluir tamanho'
        });
      }
    }
  };

  console.log('✅ Módulo de Tamanhos Personalizados carregado');
}
