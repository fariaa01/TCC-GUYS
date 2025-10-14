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
    const dados = btn.dataset;
    
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
    form.action = `/funcionarios/${dados.id}/update`;
    
    modalEditar.style.display = "flex";
  }

function formatarDataBR(dataISO) {
  if (!dataISO) return '';
  const d = new Date(dataISO);
  return d.toLocaleDateString('pt-BR');
}

document.addEventListener('DOMContentLoaded', function() {
  const modal = document.getElementById("modalFuncionario");
  const modalEditar = document.getElementById("modalEditarFuncionario");
  const btnAbrir = document.getElementById("btnNovoFuncionario");
  const btnFechar = document.getElementById("fecharModal");
  const btnFecharEditar = modalEditar ? modalEditar.querySelector(".close") : null;

  if (btnAbrir) btnAbrir.addEventListener("click", () => modal.style.display = "flex");
  if (btnFechar) btnFechar.addEventListener("click", () => modal.style.display = "none");
  if (btnFecharEditar) btnFecharEditar.addEventListener("click", () => modalEditar.style.display = "none");

  document.addEventListener('click', function(e) {
    if (e.target.closest('.btn-editar')) {
      e.preventDefault();
      const btn = e.target.closest('.btn-editar');
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
});
