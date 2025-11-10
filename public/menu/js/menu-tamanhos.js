let contadorTamanhos = 1;
let contadorEdit = 0;

let tamanhosDisponiveis = [];

async function carregarTamanhosDisponiveis() {
  try {
    const response = await fetch('/tamanhos');
    const data = await response.json();
    if (data.ok) {
      tamanhosDisponiveis = data.tamanhos;
      atualizarSelectsExistentes();
    }
  } catch (error) {
    console.error('Erro ao carregar tamanhos:', error);
  }
}

function gerarOptionsTamanhos() {
  if (tamanhosDisponiveis.length === 0) {
    return `
      <option value="">Nenhum tamanho cadastrado</option>
      <option value="" disabled>Configure em "Gerenciar Tamanhos Disponíveis"</option>
    `;
  }
  
  let options = '<option value="">Selecione o tamanho...</option>';
  tamanhosDisponiveis.forEach(tamanho => {
    options += `<option value="${tamanho.nome}">${tamanho.nome}</option>`;
  });
  return options;
}

function atualizarSelectsExistentes() {
  // Atualizar o primeiro select do formulário de cadastro
  const multiplosPrecosList = document.getElementById('multiplosPrecosList');
  if (multiplosPrecosList) {
    const primeiroSelect = multiplosPrecosList.querySelector('select[name="tamanhos[0][tamanho]"]');
    if (primeiroSelect) {
      primeiroSelect.innerHTML = gerarOptionsTamanhos();
    }
  }
}

carregarTamanhosDisponiveis();


function adicionarTamanho() {
  const container = document.getElementById('multiplosPrecosList');
  const novoItem = document.createElement('div');
  novoItem.className = 'tamanho-preco-item';
  novoItem.innerHTML = `
    <select name="tamanhos[${contadorTamanhos}][tamanho]" required>
      ${gerarOptionsTamanhos()}
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

async function abrirModalTamanhos(pratoId, pratoNome) {
  document.getElementById('editPratoId').value = pratoId;
  document.getElementById('pratoNomeModal').textContent = pratoNome;
  
  try {
    const response = await fetch(`/menu/${pratoId}/tamanhos`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const tamanhos = await response.json();
    console.log('Tamanhos carregados:', tamanhos);
    
    const container = document.getElementById('tamanhosEditList');
    const emptyState = document.getElementById('emptyState');
    
    container.innerHTML = '';
    contadorEdit = 0;
    
    if (tamanhos.length === 0) {
      emptyState.style.display = 'block';
    } else {
      emptyState.style.display = 'none';
      
      tamanhos.forEach((tamanho, index) => {
        const item = document.createElement('div');
        item.className = 'tamanho-item-card';
        
        // Gerar options com tamanho atual selecionado
        let optionsTamanhos = '<option value="">Selecione o tamanho...</option>';
        tamanhosDisponiveis.forEach(t => {
          const selected = t.nome === tamanho.tamanho ? 'selected' : '';
          optionsTamanhos += `<option value="${t.nome}" ${selected}>${t.nome}</option>`;
        });
        
        item.innerHTML = `
          <select name="tamanhos[${index}][tamanho]" class="tamanho-select" required>
            ${optionsTamanhos}
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

function fecharModalTamanhos() {
  document.getElementById('modalTamanhos').style.display = 'none';
}

function initTamanhos() {
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

  document.addEventListener('click', async function(e) {
    if (e.target.closest('.btn-editar-tamanhos')) {
      const btn = e.target.closest('.btn-editar-tamanhos');
      const pratoId = btn.dataset.id;
      const pratoCard = btn.closest('.card');
      const pratoNome = pratoCard.querySelector('h3').textContent;
      
      await abrirModalTamanhos(pratoId, pratoNome);
    }
  });

  const formEditarTamanhos = document.getElementById('formEditarTamanhos');
  if (formEditarTamanhos) {
    formEditarTamanhos.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const pratoId = document.getElementById('editPratoId').value;
      const tamanhos = [];
      const tamanhoInputs = document.querySelectorAll('#tamanhosEditList .tamanho-item-card');
      
      tamanhoInputs.forEach((item) => {
        const tamanho = item.querySelector(`select[name*="tamanho"]`).value;
        const preco = item.querySelector(`input[name*="preco"]`).value;
        
        if (tamanho && preco) {
          tamanhos.push({ tamanho, preco: parseFloat(preco) });
        }
      });
      
      try {
        const response = await fetch(`/menu/${pratoId}/tamanhos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tamanhos })
        });
        
        const result = await response.json();
        
        if (result.ok) {
          Swal.fire({
            icon: 'success',
            title: 'Sucesso!',
            text: 'Tamanhos atualizados com sucesso.',
            timer: 2000,
            showConfirmButton: false
          });
          
          fecharModalTamanhos();
          setTimeout(() => location.reload(), 2000);
        } else {
          throw new Error(result.msg || 'Erro ao salvar');
        }
      } catch (error) {
        console.error('Erro:', error);
        Swal.fire({
          icon: 'error',
          title: 'Erro',
          text: 'Não foi possível salvar os tamanhos.'
        });
      }
    });
  }

  console.log('Módulo de Tamanhos carregado');
}

window.adicionarTamanho = adicionarTamanho;
window.removerTamanho = removerTamanho;
window.adicionarTamanhoEdit = adicionarTamanhoEdit;
window.removerTamanhoEdit = removerTamanhoEdit;
window.fecharModalTamanhos = fecharModalTamanhos;
window.initTamanhos = initTamanhos;
