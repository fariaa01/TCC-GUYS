// Sistema de Upload de Imagens com Drag & Drop
class UploadZone {
  constructor(dropzoneSelector, fileInputSelector, previewSelector) {
    this.dropzone = document.querySelector(dropzoneSelector);
    this.fileInput = document.querySelector(fileInputSelector);
    this.preview = document.querySelector(previewSelector);
    this.currentFile = null;

    if (this.dropzone && this.fileInput) {
      this.init();
    }
  }

  init() {
    // Eventos de drag & drop
    this.dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.dropzone.classList.add('dragover');
    });

    this.dropzone.addEventListener('dragleave', () => {
      this.dropzone.classList.remove('dragover');
    });

    this.dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      this.dropzone.classList.remove('dragover');

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        this.handleFile(files[0]);
      }
    });

    // Evento de clique
    this.dropzone.addEventListener('click', () => {
      this.fileInput.click();
    });

    // Evento de mudança no input
    this.fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        this.handleFile(e.target.files[0]);
      }
    });
  }

  handleFile(file) {
    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      this.showError('Por favor, selecione apenas arquivos de imagem.');
      return;
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      this.showError('A imagem deve ter no máximo 5MB.');
      return;
    }

    this.currentFile = file;
    this.showPreview(file);
  }

  showPreview(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (this.preview) {
        this.preview.src = e.target.result;
        this.preview.style.display = 'block';
      }

      // Atualizar nome do arquivo
      const fileNameElement = this.dropzone.querySelector('.file-name');
      if (fileNameElement) {
        fileNameElement.textContent = file.name;
      }
    };
    reader.readAsDataURL(file);
  }

  showError(message) {
    Swal.fire({
      icon: 'error',
      title: 'Erro no upload',
      text: message
    });
  }

  getFile() {
    return this.currentFile;
  }

  clear() {
    this.currentFile = null;
    if (this.preview) {
      this.preview.style.display = 'none';
      this.preview.src = '';
    }
    if (this.fileInput) {
      this.fileInput.value = '';
    }
    const fileNameElement = this.dropzone.querySelector('.file-name');
    if (fileNameElement) {
      fileNameElement.textContent = '';
    }
  }
}

// Inicializar upload zones quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
  // Upload zone principal
  const uploadZone = new UploadZone('#dropzone', '#foto', '#dzThumb');

  // Upload zone de edição
  const editUploadZone = new UploadZone('#editarDropzone', '#editarFoto', '#editarImagemPreview');
});
