function confirmarExclusao(id) {
  Swal.fire({
    title: 'Excluir Funcionário?',
    text: "Esta ação não pode ser desfeita!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#e74c3c',
    cancelButtonColor: '#6c757d',
    confirmButtonText: '<i class="fas fa-trash-alt"></i> Sim, excluir!',
    cancelButtonText: '<i class="fas fa-times"></i> Cancelar',
    buttonsStyling: false,
    customClass: {
      popup: 'swal-popup-custom',
      title: 'swal-title-custom',
      confirmButton: 'swal-confirm-btn',
      cancelButton: 'swal-cancel-btn'
    },
    reverseButtons: true,
    focusCancel: true
  }).then((result) => {
    if (result.isConfirmed) {
      Swal.fire({
        title: 'Excluindo...',
        text: 'Aguarde um momento',
        icon: 'info',
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
      setTimeout(() => {
        window.location.href = `/funcionarios/deletar/${id}`;
      }, 500);
    }
  });
}

function abrirModalEdicao(btn) {
    console.log('Abrindo modal de edição');
    const dados = btn.dataset;
    const modalEditar = document.getElementById("modalEditarFuncionario");
    
    if (!modalEditar) {
      console.error('Modal de edição não encontrado!');
      return;
    }
    
    document.getElementById('editarId').value = dados.id;
    document.getElementById('editarNome').value = dados.nome;
    document.getElementById('editarCargo').value = dados.cargo;
    document.getElementById('editarEmail').value = dados.email;
    document.getElementById('editarSalario').value = dados.salario;
    document.getElementById('editarCpf').value = dados.cpf;
    document.getElementById('editarTelefone').value = dados.telefone;
    document.getElementById('editarEstado').value = dados.estado;
    
    if (dados.data_admissao) {
      const data = new Date(dados.data_admissao);
      const dataFormatada = data.toISOString().split('T')[0];
      document.getElementById('editarDataAdmissao').value = dataFormatada;
    }
    
    const form = modalEditar.querySelector('form');
    if (form) {
      form.action = `/funcionarios/${dados.id}/update`;
    }
    
    console.log('Mostrando modal de edição');
    modalEditar.style.display = "flex";
  }

function formatarDataBR(dataISO) {
  if (!dataISO) return '';
  const d = new Date(dataISO);
  return d.toLocaleDateString('pt-BR');
}

// Função para inicializar os modais
function inicializarModais() {
  console.log('Inicializando modais do funcionário');
  
  const modal = document.getElementById("modalFuncionario");
  const modalEditar = document.getElementById("modalEditarFuncionario");
  const btnAbrir = document.getElementById("btnNovoFuncionario");
  const btnFechar = document.getElementById("fecharModal");
  const btnFecharEditar = modalEditar ? modalEditar.querySelector(".close") : null;

  console.log('Elementos encontrados:', {
    modal: !!modal,
    modalEditar: !!modalEditar,
    btnAbrir: !!btnAbrir,
    btnFechar: !!btnFechar,
    btnFecharEditar: !!btnFecharEditar
  });

  // Event listener para abrir modal
  if (btnAbrir) {
    // Remove event listeners anteriores
    btnAbrir.replaceWith(btnAbrir.cloneNode(true));
    const novoBtnAbrir = document.getElementById("btnNovoFuncionario");
    
    novoBtnAbrir.addEventListener("click", function(e) {
      console.log('Botão de abrir modal clicado');
      e.preventDefault();
      e.stopPropagation();
      
      if (modal) {
        modal.style.display = "flex";
        console.log('Modal aberto');
      } else {
        console.error('Modal não encontrado!');
      }
    });
    console.log('Event listener do botão abrir adicionado');
  } else {
    console.error('Botão de abrir modal não encontrado!');
  }
  
  // Event listener para fechar modal
  if (btnFechar && modal) {
    btnFechar.addEventListener("click", function(e) {
      console.log('Botão de fechar modal clicado');
      e.preventDefault();
      modal.style.display = "none";
    });
  }
  
  // Event listener para fechar modal de edição
  if (btnFecharEditar && modalEditar) {
    btnFecharEditar.addEventListener("click", function(e) {
      console.log('Botão de fechar modal editar clicado');
      e.preventDefault();
      modalEditar.style.display = "none";
    });
  }

  return { modal, modalEditar, btnAbrir, btnFechar };
}

document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM carregado - iniciando JavaScript do funcionário');
  
  // Pequeno delay para garantir que tudo está carregado
  setTimeout(() => {
    const elementos = inicializarModais();
  }, 100);

  // Configurar eventos adicionais
  const modal = document.getElementById("modalFuncionario");
  const modalEditar = document.getElementById("modalEditarFuncionario");
  
  // Fechar modal clicando fora dele
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        console.log('Clique fora do modal - fechando');
        modal.style.display = "none";
      }
    });
  }
  
  if (modalEditar) {
    modalEditar.addEventListener('click', function(e) {
      if (e.target === modalEditar) {
        console.log('Clique fora do modal editar - fechando');
        modalEditar.style.display = "none";
      }
    });
  }

  document.addEventListener('click', function(e) {
    if (e.target.closest('.btn-editar')) {
      e.preventDefault();
      const btn = e.target.closest('.btn-editar');
      console.log('Botão editar clicado:', btn.dataset);
      abrirModalEdicao(btn);
    }
  });

  const urlParams = new URLSearchParams(window.location.search);
  const ok = urlParams.get('ok');
  const msg = urlParams.get('msg');
  
  if (ok === '1' && msg) {
    Swal.fire({ 
      icon: 'success', 
      title: 'Tudo certo!', 
      text: msg, 
      buttonsStyling: false, 
      customClass: { confirmButton: 'btn btn-voltar' } 
    });
    history.replaceState({}, document.title, location.pathname);
  } else if (ok === '0' && msg) {
    Swal.fire({ 
      icon: 'error', 
      title: 'Ops...', 
      text: msg, 
      buttonsStyling: false, 
      customClass: { confirmButton: 'btn btn-voltar' } 
    });
    history.replaceState({}, document.title, location.pathname);
  }

  if (urlParams.get('success') === '1') {
    Swal.fire({
      icon: 'success',
      title: 'Tudo certo!',
      text: 'Funcionário cadastrado com sucesso!',
      buttonsStyling: false,
      customClass: { confirmButton: 'btn btn-voltar' }
    });
    history.replaceState({}, document.title, location.pathname);
  }

  if (urlParams.get('updated') === '1') {
    Swal.fire({
      icon: 'success',
      title: 'Tudo certo!',
      text: 'Funcionário atualizado com sucesso!',
      buttonsStyling: false,
      customClass: { confirmButton: 'btn btn-voltar' }
    });
    history.replaceState({}, document.title, location.pathname);
  }
  
  if (urlParams.get('erro') === 'cpf') {
    Swal.fire({
      icon: 'error',
      title: 'Ops...',
      text: 'Este CPF já está vinculado a um funcionário.',
      buttonsStyling: false,
      customClass: { confirmButton: 'btn btn-voltar' }
    });
    modal.style.display = "flex";
  }
  
  if (urlParams.get('erro') === '1') {
    Swal.fire({
      icon: 'error',
      title: 'Ops...',
      text: 'Ocorreu um erro ao processar a operação.',
        buttonsStyling: false,
      customClass: { confirmButton: 'btn btn-voltar' }
    });
  }

  const cpfInput = document.getElementById('cpf');
  if (cpfInput) {
    IMask(cpfInput, {
      mask: '000.000.000-00'
    });
  }

  const telInput = document.getElementById('telefone');
  if (telInput) {
    IMask(telInput, {
      mask: '(00) 00000-0000'
    });
  }

  const cpfEditInput = document.getElementById('editarCpf');
  if (cpfEditInput) {
    IMask(cpfEditInput, {
      mask: '000.000.000-00'
    });
  }

  const telEditInput = document.getElementById('editarTelefone');
  if (telEditInput) {
    IMask(telEditInput, {
      mask: '(00) 00000-0000'
    });
  }

  console.log('JavaScript do funcionário carregado com sucesso!');
  console.log('Elementos finais check:', {
    btnNovoFuncionario: !!document.getElementById("btnNovoFuncionario"),
    modalFuncionario: !!document.getElementById("modalFuncionario"),
    fecharModal: !!document.getElementById("fecharModal")
  });
});

window.addEventListener('load', function() {
  console.log('Window load - verificando elementos novamente');
  
  const btnAbrir = document.getElementById("btnNovoFuncionario");
  const modal = document.getElementById("modalFuncionario");
  
  if (btnAbrir && modal && !btnAbrir.hasAttribute('data-listener-added')) {
    console.log('Adicionando event listener via window.load');
    btnAbrir.setAttribute('data-listener-added', 'true');
    
    btnAbrir.addEventListener("click", function(e) {
      console.log('Modal aberto via fallback');
      e.preventDefault();
      modal.style.display = "flex";
    });
  }
});

// Função global como último recurso
window.abrirModalFuncionario = function() {
  console.log('Função global chamada');
  const modal = document.getElementById("modalFuncionario");
  if (modal) {
    modal.style.display = "flex";
  }
};
