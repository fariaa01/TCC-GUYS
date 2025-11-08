document.addEventListener('DOMContentLoaded', () => {
  const cnpjCreateInput = document.getElementById('cnpj');
  if(cnpjCreateInput) IMask(cnpjCreateInput, { mask: '00.000.000/0000-00' });

  const telCreateInput = document.getElementById('telefone');
  if(telCreateInput) IMask(telCreateInput, { mask: '(00) 00000-0000' });

  const selectTelAltCreate = document.getElementById('temTelefoneAlternativoCreate');
  const telAltInputCreate = document.getElementById('telefoneAlternativoCreate');
  if(telAltInputCreate) IMask(telAltInputCreate, { mask: '(00) 00000-0000' });

  if(selectTelAltCreate && telAltInputCreate) {
    selectTelAltCreate.addEventListener('change', function() {
      if(this.value === 'sim') {
        telAltInputCreate.style.display = 'block';
        telAltInputCreate.style.opacity = '0';
        setTimeout(() => {
          telAltInputCreate.style.opacity = '1';
        }, 50);
      } else {
        telAltInputCreate.style.opacity = '0';
        setTimeout(() => {
          telAltInputCreate.style.display = 'none';
          telAltInputCreate.value = '';
        }, 200);
      }
    });
  }

  const modalCreate = document.getElementById("modalFornecedor");
  const btnOpenCreate = document.getElementById("btnAdicionarFornecedor");
  const btnFecharCreate = document.getElementById("fecharModalFornecedor");
  const formCreate = document.getElementById("formFornecedor");

  console.log('Elementos encontrados:', {
    modalCreate: !!modalCreate,
    btnOpenCreate: !!btnOpenCreate,
    btnFecharCreate: !!btnFecharCreate,
    formCreate: !!formCreate
  });

  if (btnOpenCreate) {
    btnOpenCreate.addEventListener('click', () => {
      console.log('Redirecionando para página de novo fornecedor...');
      // Redireciona para a página de detalhes em modo de criação
      window.location.href = '/dados-fornecedor/novo';
    });
  } else {
    console.error('Botão "btnAdicionarFornecedor" não encontrado!');
  }

  if (btnFecharCreate) {
    btnFecharCreate.addEventListener('click', () => {
      if (modalCreate) modalCreate.style.display = 'none';
    });
  }

  window.addEventListener('click', e => { 
    if(modalCreate && e.target === modalCreate) modalCreate.style.display = 'none'; 
  });

  if (formCreate) {
    formCreate.addEventListener('submit', e => {
      if (modalCreate) modalCreate.style.display = 'none';
      Swal.fire({ title: 'Adicionando fornecedor...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    });
  }

  const formDelete = document.createElement('form');
  formDelete.method = 'POST';
  formDelete.style.display = 'none';
  document.body.appendChild(formDelete);

  document.querySelectorAll('.deletar-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      const id = btn.dataset.id;
      Swal.fire({
        title: 'Tem certeza?',
        text: 'Esta ação não pode ser desfeita!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sim, deletar!',
        cancelButtonText: 'Cancelar'
      }).then(result => {
        if(result.isConfirmed) {
          formDelete.setAttribute('action', `/fornecedores/${id}/delete`);
          formDelete.submit();
        }
      });
    });
  });
});