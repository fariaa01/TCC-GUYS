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
      console.log('Botão clicado!');
      if (formCreate) formCreate.reset();
      if(selectTelAltCreate) {
        selectTelAltCreate.value = 'nao';
      }
      if(telAltInputCreate) {
        telAltInputCreate.style.display = 'none';
      }
      if (modalCreate) {
        modalCreate.style.display = 'flex';
        console.log('Modal deve estar visível agora');
      }
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
    formCreate.addEventListener('submit', async e => {
      e.preventDefault();
      if (modalCreate) modalCreate.style.display = 'none';
      Swal.fire({ title: 'Adicionando fornecedor...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

      try {
        const action = formCreate.getAttribute('action') || window.location.pathname;
        const body = new URLSearchParams(new FormData(formCreate));
        const resp = await fetch(action, {
          method: 'POST',
          body,
          credentials: 'same-origin',
          headers: { 'Accept': 'application/json' }
        });

        // Se o servidor redirecionou (por ex. para login), o fetch não segue visualmente o redirect
        if (resp.redirected) {
          window.location = resp.url;
          return;
        }

        const contentType = resp.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await resp.json();
          if (resp.ok && data.ok) {
            Swal.fire({ icon: 'success', title: 'Fornecedor adicionado', text: data.message || '' }).then(() => location.reload());
          } else {
            Swal.fire({ icon: 'error', title: 'Erro', text: data.error || 'Erro ao adicionar fornecedor.' });
          }
        } else {
          // Pode ser HTML (redirect page) ou um redirect status. Vamos pegar o texto e checar por padrão.
          const text = await resp.text();
          // Se o servidor respondeu com redirect via 302, o fetch pode retornar 200 com HTML de login.
          if (resp.status === 401 || text.toLowerCase().includes('login')) {
            Swal.fire({ icon: 'warning', title: 'Não autenticado', text: 'Você precisa estar logado para adicionar fornecedores.' }).then(() => { window.location = '/login'; });
          } else if (resp.status === 409 || text.toLowerCase().includes('já existe') || text.toLowerCase().includes('duplicate')) {
            Swal.fire({ icon: 'error', title: 'Duplicado', text: 'Fornecedor com mesmo CNPJ já existe.' });
          } else if (resp.ok) {
            // Se servidor retornou HTML mas com sucesso, recarrega
            location.reload();
          } else {
            Swal.fire({ icon: 'error', title: 'Erro', text: 'Erro ao adicionar fornecedor.' });
          }
        }
      } catch (err) {
        console.error('Erro no fetch de create fornecedor:', err);
        Swal.fire({ icon: 'error', title: 'Erro', text: 'Falha na comunicação com o servidor.' });
      }
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