window.addEventListener("click", (e) => {
    const modalHistoricoSalarial = document.getElementById('modalHistoricoSalarial');
    const modalNovoReajuste = document.getElementById('modalNovoReajuste');
    
    if (modalHistoricoSalarial && e.target === modalHistoricoSalarial) {
      modalHistoricoSalarial.classList.remove('show');
    }
    if (modalNovoReajuste && e.target === modalNovoReajuste) {
      modalNovoReajuste.style.display = "none";
    }
  });

const modalHistoricoSalarial = document.getElementById('modalHistoricoSalarial');
const modalNovoReajuste = document.getElementById('modalNovoReajuste');
let funcionarioSelecionadoHistorico = null;

document.addEventListener('DOMContentLoaded', function() {
  const btnFecharReajuste = document.getElementById('fecharModalReajuste');
  const btnFecharHistorico = document.getElementById('fecharModalHistorico');
  
  if (btnFecharReajuste) {
    btnFecharReajuste.addEventListener('click', function(e) {
      console.log('Event listener direto - fechar reajuste');
      e.preventDefault();
      e.stopPropagation();
      fecharModalReajuste();
    });
  }
  
  if (btnFecharHistorico) {
    btnFecharHistorico.addEventListener('click', function(e) {
      console.log('Event listener direto - fechar histórico');
      e.preventDefault();
      e.stopPropagation();
      fecharModalHistorico();
    });
  }
});

  const tipoReajusteSelect = document.getElementById('tipoReajuste');
  const duracaoBonusContainer = document.getElementById('duracaoBonusContainer');
  const duracaoBonusSelect = document.getElementById('duracaoBonus');
  const labelSalarioNovo = document.getElementById('labelSalarioNovo');
  const salarioNovoInput = document.getElementById('salarioNovo');
  
  if (tipoReajusteSelect && duracaoBonusContainer) {
    tipoReajusteSelect.addEventListener('change', function() {
      const cargoAnteriorLabel = document.querySelector('label[for="cargoAnterior"]');
      const cargoAnteriorInput = document.getElementById('cargoAnterior');
      const cargoNovoLabel = document.querySelector('label[for="cargoNovo"]');
      const cargoNovoInput = document.getElementById('cargoNovo');
      
      if (this.value === 'Bônus') {
        duracaoBonusContainer.style.display = 'block';
        duracaoBonusSelect.required = true;
        labelSalarioNovo.textContent = 'Valor do Bônus:';
        salarioNovoInput.placeholder = 'Ex: 200 (valor do bônus a ser adicionado)';
        salarioNovoInput.value = '';
        
        if (cargoAnteriorLabel) cargoAnteriorLabel.style.display = 'none';
        if (cargoAnteriorInput) cargoAnteriorInput.style.display = 'none';
        if (cargoNovoLabel) cargoNovoLabel.style.display = 'none';
        if (cargoNovoInput) cargoNovoInput.style.display = 'none';
      } else {
        duracaoBonusContainer.style.display = 'none';
        duracaoBonusSelect.required = false;
        duracaoBonusSelect.value = '';
        labelSalarioNovo.textContent = 'Novo Salário:';
        salarioNovoInput.placeholder = 'Ex: 1800 ou 1800.50';
        
        if (cargoAnteriorLabel) cargoAnteriorLabel.style.display = 'block';
        if (cargoAnteriorInput) cargoAnteriorInput.style.display = 'block';
        if (cargoNovoLabel) cargoNovoLabel.style.display = 'block';
        if (cargoNovoInput) cargoNovoInput.style.display = 'block';
      }
    });
  }
  
  const formNovoReajuste = document.getElementById('formNovoReajuste');
  if (formNovoReajuste) {
    formNovoReajuste.addEventListener('submit', function(e) {
      e.preventDefault();
      enviarReajuste(this);
    });
  }

document.addEventListener('click', function(e) {
  if (e.target.closest('.btn-historico')) {
    e.preventDefault();
    e.stopPropagation();
    const btn = e.target.closest('.btn-historico');
    const funcionarioId = btn.dataset.id;
    const funcionarioNome = btn.dataset.nome;
    abrirModalHistorico(funcionarioId, funcionarioNome);
  }

  if (e.target.id === 'btnNovoReajuste') {
    e.preventDefault();
    e.stopPropagation();
    abrirModalNovoReajuste();
  }
  
  if (e.target.id === 'fecharModalHistorico') {
    e.preventDefault();
    e.stopPropagation();
    fecharModalHistorico();
  }

  if (e.target.id === 'fecharModalReajuste') {
    e.preventDefault();
    e.stopPropagation();
    console.log('Clique no botão fechar modal reajuste detectado');
    fecharModalReajuste();
  }
});

async function abrirModalHistorico(funcionarioId, funcionarioNome) {
    funcionarioSelecionadoHistorico = {
      id: funcionarioId,
      nome: funcionarioNome
    };
    
    document.getElementById('tituloHistorico').textContent = `Histórico Salarial - ${funcionarioNome}`;
    
    try {
      const response = await fetch(`/funcionarios/historico/${funcionarioId}`);
      const data = await response.json();
      
      console.log('Dados recebidos do servidor para histórico:', data);
      
      if (data.success) {
        renderizarHistorico(data.historico, data.estatisticas);
        modalHistoricoSalarial.classList.add('show');
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      Swal.fire('Erro', 'Não foi possível carregar o histórico salarial', 'error');
    }
  }

  function calcularDiasRestantes(dataReajuste, duracaoMeses) {
    const dataInicio = new Date(dataReajuste);
    const dataFim = new Date(dataInicio);
    dataFim.setMonth(dataFim.getMonth() + duracaoMeses);
    
    const hoje = new Date();
    const diferenca = dataFim - hoje;
    const diasRestantes = Math.ceil(diferenca / (1000 * 60 * 60 * 24));
    
    return {
      diasRestantes: diasRestantes,
      dataFim: dataFim,
      expirado: diasRestantes <= 0
    };
  }

  function renderizarHistorico(historico, estatisticas) {
    console.log('renderizarHistorico chamada com:', { historico, estatisticas });
    const container = document.getElementById('historicoContent');
    
    let html = '';
    
    if (estatisticas && estatisticas.total_reajustes > 0) {
      html += `
        <div class="historico-stats">
          <div class="stat-item">
            <div class="stat-value">${estatisticas.total_reajustes}</div>
            <div class="stat-label">Total de Reajustes</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">R$ ${parseFloat(estatisticas.menor_salario || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
            <div class="stat-label">Menor Salário</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">R$ ${parseFloat(estatisticas.maior_salario || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
            <div class="stat-label">Maior Salário</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">R$ ${parseFloat(estatisticas.media_aumento || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
            <div class="stat-label">Média de Aumento</div>
          </div>
        </div>
      `;
    }
    
    if (historico && historico.length > 0) {
      historico.forEach(item => {
        const diferenca = item.salario_novo - item.salario_anterior;
        const percentual = ((diferenca / item.salario_anterior) * 100).toFixed(1);
        
        html += `
          <div class="historico-item">
            <div class="historico-header-item">
              <span class="historico-tipo ${item.tipo.toLowerCase()}">${item.tipo}</span>
              <span class="historico-data">${new Date(item.data_reajuste).toLocaleDateString('pt-BR')}</span>
            </div>
            
            <div class="historico-valores">
              <div class="valor-item valor-anterior">
                <div class="valor-numero">R$ ${parseFloat(item.salario_anterior).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                <div class="valor-label">Salário Anterior</div>
              </div>
              <div class="valor-item valor-novo">
                <div class="valor-numero">R$ ${parseFloat(item.salario_novo).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                <div class="valor-label">Novo Salário</div>
              </div>
            </div>
            
            <div class="historico-diferenca" style="text-align: center; margin-bottom: 15px;">
              ${item.tipo === 'Bônus' ? (() => {
                if (!item.duracao_meses) {
                  return `
                    <div style="color: #007bff; font-weight: bold; margin-bottom: 5px;">
                      <strong>Bônus: </strong> +R$ ${diferenca.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                    </div>
                  `;
                }
                
                const { diasRestantes, expirado } = calcularDiasRestantes(item.data_reajuste, item.duracao_meses);
                const corBonus = expirado ? '#6c757d' : diasRestantes <= 7 ? '#ff6b35' : '#007bff';
                const statusText = expirado ? '(EXPIRADO)' : diasRestantes <= 7 ? '(EXPIRA EM BREVE!)' : '';
                
                return `
                  <div style="color: ${corBonus}; font-weight: bold; margin-bottom: 5px;">
                    <strong> Bônus: </strong> +R$ ${diferenca.toLocaleString('pt-BR', {minimumFractionDigits: 2})} ${statusText} 
                  </div>
                `;
              })() : `
                <strong style="color: ${diferenca >= 0 ? '#28a745' : '#dc3545'}">
                  ${diferenca >= 0 ? '+' : ''}R$ ${diferenca.toLocaleString('pt-BR', {minimumFractionDigits: 2})} (${percentual}%)
                </strong>
              `}
            </div>
            
            ${item.cargo_anterior !== item.cargo_novo ? `
              <div class="historico-cargo" style="margin-bottom: 10px;">
                <strong>Cargo:</strong> ${item.cargo_anterior} → ${item.cargo_novo}
              </div>
            ` : ''}
            
            ${item.motivo ? `
              <div class="historico-motivo">
                <strong>Motivo:</strong> ${item.motivo}
              </div>
            ` : ''}
            
            ${item.tipo === 'Bônus' && item.duracao_meses ? (() => {
              const { diasRestantes, dataFim, expirado } = calcularDiasRestantes(item.data_reajuste, item.duracao_meses);
              
              if (expirado) {
                return `
                  <div class="historico-duracao" style="margin-top: 10px; color: #dc3545; font-weight: 500;">
                   <strong>Status:</strong> Bônus Expirado
                  </div>
                `;
              } else {
                const corStatus = diasRestantes <= 7 ? '#ff6b35' : diasRestantes <= 30 ? '#ffa500' : '#007bff';
                const iconeStatus = diasRestantes <= 7 ? 'fas fa-exclamation-triangle' : 'fas fa-clock';
                
                return `
                  <div class="historico-duracao" style="margin-top: 10px; color: ${corStatus}; font-weight: 500;">
                    <strong>Duração:</strong> ${item.duracao_meses} ${item.duracao_meses === 1 ? 'mês' : 'meses'}
                  </div>
                  <div class="historico-restante" style="margin-top: 5px; color: ${corStatus}; font-weight: 500; font-size: 0.9em;">
                    <strong>Restam:</strong> ${diasRestantes} ${diasRestantes === 1 ? 'dia' : 'dias'} 
                    (expira em ${dataFim.toLocaleDateString('pt-BR')})
                  </div>
                `;
              }
            })() : ''}
          </div>
        `;
      });
    } else {
      html += `
        <div class="historico-empty">
          <i class="fas fa-history"></i>
          <h4>Nenhum reajuste registrado</h4>
          <p>Este funcionário ainda não possui histórico de reajustes salariais.</p>
        </div>
      `;
    }
    
    container.innerHTML = html;
  }

  function abrirModalNovoReajuste() {
    if (!funcionarioSelecionadoHistorico) {
      Swal.fire('Erro', 'Nenhum funcionário selecionado', 'error');
      return;
    }
    
    console.log('Funcionário selecionado:', funcionarioSelecionadoHistorico);
    const funcionarioAtual = obterDadosFuncionarioAtual();
    
    console.log('Preenchendo campos do formulário...');
    
    const funcionarioIdField = document.getElementById('funcionarioIdReajuste');
    const salarioAnteriorField = document.getElementById('salarioAnterior');
    const cargoAnteriorField = document.getElementById('cargoAnterior');
    const cargoNovoField = document.getElementById('cargoNovo');
    
    funcionarioIdField.value = funcionarioSelecionadoHistorico.id;
    salarioAnteriorField.value = funcionarioAtual.salario;
    cargoAnteriorField.value = funcionarioAtual.cargo;
    cargoNovoField.value = funcionarioAtual.cargo;
    document.getElementById('dataReajuste').value = new Date().toISOString().split('T')[0];
    
    console.log('Campos preenchidos:', {
      funcionario_id: funcionarioIdField.value,
      salario_anterior_calculado: funcionarioAtual.salario,
      salario_anterior_no_campo: salarioAnteriorField.value,
      cargo_anterior: funcionarioAtual.cargo,
      cargo_novo: funcionarioAtual.cargo
    });
    
    modalNovoReajuste.style.display = 'flex';
    modalHistoricoSalarial.classList.remove('show');
  }

  function obterDadosFuncionarioAtual() {
    const linha = document.querySelector(`button[data-id="${funcionarioSelecionadoHistorico.id}"]`).closest('tr');
    console.log('Linha encontrada:', linha);
    
    const salarioElement = linha.querySelector('[data-label="Salário"]');
    const cargoElement = linha.querySelector('[data-label="Função"]');
    
    console.log('Elemento salário:', salarioElement);
    console.log('Elemento cargo:', cargoElement);
    
    let salarioText = salarioElement ? salarioElement.textContent.trim() : '0';
    console.log('Salário texto original:', salarioText);
    
    salarioText = salarioText.replace(/R\$\s*/g, '').replace(/\s/g, '');
    
    if (salarioText.includes(',')) {
      const partes = salarioText.split(',');
      const inteira = partes[0].replace(/\./g, ''); 
      const decimal = partes[1] || '00';
      salarioText = inteira + '.' + decimal;
    } else if (salarioText.includes('.')) {
      if (/\d{1,3}(\.\d{3})+$/.test(salarioText)) {
        salarioText = salarioText.replace(/\./g, '');
      }
    }
    
    const cargoText = cargoElement ? cargoElement.textContent.trim() : '';
    
    console.log('Salário texto processado:', salarioText);
    console.log('Cargo texto:', cargoText);
    
    const salarioNumerico = parseFloat(salarioText) || 0;
    
    const dados = {
      salario: salarioNumerico,
      cargo: cargoText
    };
    
    console.log('Dados do funcionário atual:', dados);
    return dados;
  }

  async function enviarReajuste(form) {
    try {
      const formData = new FormData(form);
      const dados = {};
      for (let [key, value] of formData.entries()) {
        dados[key] = value;
      }

      function limparValor(valor) {
        if (!valor) return valor;
        
        let valorLimpo = valor.toString()
          .replace(/R\$\s*/g, '')
          .replace(/\s/g, ''); 

        if (valorLimpo.includes(',')) {
          const partes = valorLimpo.split(',');
          const inteira = partes[0].replace(/\./g, ''); 
          const decimal = partes[1] || '';
          valorLimpo = decimal ? `${inteira}.${decimal}` : inteira;
        } else {
          if (!/\.\d{1,2}$/.test(valorLimpo)) {
            valorLimpo = valorLimpo.replace(/\./g, ''); 
          }
        }
        
        return valorLimpo;
      }
      
      if (dados.salario_anterior) {
        dados.salario_anterior = limparValor(dados.salario_anterior);
      }
      
      if (dados.salario_novo) {
        dados.salario_novo = limparValor(dados.salario_novo);
      }
      
      console.log('Dados do reajuste sendo enviados:', dados);
      console.log('Valores específicos:', {
        salario_anterior: dados.salario_anterior,
        salario_anterior_tipo: typeof dados.salario_anterior,
        salario_novo: dados.salario_novo,
        salario_novo_tipo: typeof dados.salario_novo,
        tipo: dados.tipo
      });
      
      const response = await fetch('/funcionarios/reajuste', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dados)
      });
      
      const data = await response.json();
      
      if (data.success) {
        Swal.fire('Sucesso', data.message, 'success').then(async () => {
          fecharModalReajuste();
          setTimeout(async () => {
            await abrirModalHistorico(funcionarioSelecionadoHistorico.id, funcionarioSelecionadoHistorico.nome);
          }, 500);
          setTimeout(() => location.reload(), 2000);
        });
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Erro ao registrar reajuste:', error);
      Swal.fire('Erro', 'Não foi possível registrar o reajuste: ' + error.message, 'error');
    }
  }

  function fecharModalHistorico() {
    console.log('Função fecharModalHistorico chamada');
    if (modalHistoricoSalarial) {
      modalHistoricoSalarial.classList.remove('show');
      funcionarioSelecionadoHistorico = null;
      console.log('Modal fechado com sucesso');
    } else {
      console.error('Modal não encontrado!');
    }
  }

  function fecharModalReajuste() {
    console.log('Função fecharModalReajuste chamada');
    modalNovoReajuste.style.display = 'none';
    document.getElementById('formNovoReajuste').reset();
  }

