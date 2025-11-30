// Sistema de Edição Inline para Produtos do Menu
class InlineEditor {
  constructor() {
    this.init();
  }

  init() {
    this.bindEditableFields();
    this.bindFormSubmissions();
  }

  bindEditableFields() {
    document.addEventListener('dblclick', (e) => {
      const editable = e.target.closest('.editable');
      if (!editable || editable.querySelector('input')) return;

      const field = editable.dataset.field;
      const currentValue = editable.textContent.trim();
      this.createInputField(editable, field, currentValue);
    });
  }

  createInputField(editable, field, currentValue) {
    const input = document.createElement('input');
    input.type = field === 'preco' ? 'number' : 'text';
    input.step = field === 'preco' ? '0.01' : undefined;
    input.value = field === 'preco' ? currentValue.replace('R$ ', '').replace(',', '.') : currentValue;
    input.className = 'inline-edit-input';

    input.style.cssText = `
      width: 100%;
      padding: 4px 8px;
      font-size: inherit;
      font-weight: inherit;
      border: 2px solid #1abc9c;
      border-radius: 4px;
      background: white;
      color: inherit;
    `;

    editable.textContent = '';
    editable.appendChild(input);
    input.focus();
    input.select();

    this.bindInputEvents(input, editable, field, currentValue);
  }

  bindInputEvents(input, editable, field, originalValue) {
    const save = async () => {
      const newValue = input.value.trim();

      if (!newValue || newValue === originalValue) {
        this.restoreOriginalValue(editable, originalValue);
        return;
      }

      try {
        const card = editable.closest('.card');
        const id = card.dataset.id;

        const updateData = {};
        updateData[field] = field === 'preco' ? parseFloat(newValue) : newValue;

        const response = await fetch(`/menu/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData)
        });

        const result = await response.json();

        if (result.ok) {
          this.updateDisplayValue(editable, field, newValue);
          this.showSuccess('Alteração salva com sucesso.');
        } else {
          throw new Error(result.msg || 'Erro ao atualizar');
        }
      } catch (error) {
        console.error('Erro ao salvar:', error);
        this.restoreOriginalValue(editable, originalValue);
        this.showError('Não foi possível salvar a alteração.');
      }
    };

    input.addEventListener('blur', save);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        save();
      } else if (e.key === 'Escape') {
        this.restoreOriginalValue(editable, originalValue);
      }
    });
  }

  updateDisplayValue(editable, field, value) {
    if (field === 'preco') {
      editable.innerHTML = `<strong>R$ ${parseFloat(value).toFixed(2).replace('.', ',')}</strong>`;
    } else {
      editable.textContent = value;
    }
  }

  restoreOriginalValue(editable, value) {
    editable.textContent = value;
  }

  bindFormSubmissions() {
    // Bind delete confirmations
    document.addEventListener('submit', (e) => {
      const form = e.target;
      if (!form.classList.contains('form-excluir')) return;

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
          form.submit();
        }
      });
    });
  }

  showSuccess(message) {
    Swal.fire({
      icon: 'success',
      title: 'Sucesso!',
      text: message,
      timer: 1500,
      showConfirmButton: false
    });
  }

  showError(message) {
    Swal.fire({
      icon: 'error',
      title: 'Erro',
      text: message
    });
  }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
  new InlineEditor();
});
