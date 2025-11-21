document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Inicializando Sistema de Gestão de Cardápio...');
  
  try {
    if (typeof initTamanhos === 'function') {
      initTamanhos();
    } else {
      console.warn('⚠️ Módulo de Tamanhos não carregado');
    }

    if (typeof initCategorias === 'function') {
      initCategorias();
    } else {
      console.warn('⚠️ Módulo de Categorias não carregado');
    }

    if (typeof initModais === 'function') {
      initModais();
    } else {
      console.warn('⚠️ Módulo de Modais não carregado');
    }

    if (typeof initProdutos === 'function') {
      initProdutos();
    } else {
      console.warn('⚠️ Módulo de Produtos não carregado');
    }

    console.log('✅ Sistema de Gestão de Cardápio carregado com sucesso!');
    console.log('📊 Módulos ativos:', {
      tamanhos: typeof initTamanhos === 'function',
      categorias: typeof initCategorias === 'function',
      modais: typeof initModais === 'function',
      produtos: typeof initProdutos === 'function'
    });

  } catch (error) {
    console.error('❌ Erro ao inicializar sistema:', error);
    Swal.fire({
      icon: 'error',
      title: 'Erro de Inicialização',
      text: 'Ocorreu um erro ao carregar o sistema. Por favor, recarregue a página.',
      confirmButtonText: 'Recarregar',
      confirmButtonColor: '#e74c3c'
    }).then(() => {
      location.reload();
    });
  }
});

window.mostrarSucesso = function(titulo, texto, tempo = 2000) {
  Swal.fire({
    icon: 'success',
    title: titulo,
    text: texto,
    timer: tempo,
    showConfirmButton: false
  });
};

window.mostrarErro = function(titulo, texto) {
  Swal.fire({
    icon: 'error',
    title: titulo,
    text: texto
  });
};

/**
 * Exibe mensagem de aviso
 */
window.mostrarAviso = function(titulo, texto) {
  Swal.fire({
    icon: 'warning',
    title: titulo,
    text: texto
  });
};

/**
 * Confirma ação do usuário
 */
window.confirmarAcao = async function(titulo, texto, textoConfirmar = 'Sim', textoCancelar = 'Cancelar') {
  const result = await Swal.fire({
    title: titulo,
    text: texto,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#1abc9c',
    cancelButtonColor: '#6c757d',
    confirmButtonText: textoConfirmar,
    cancelButtonText: textoCancelar
  });
  return result.isConfirmed;
};

/**
 * Formata valor monetário
 */
window.formatarPreco = function(valor) {
  return 'R$ ' + parseFloat(valor).toFixed(2).replace('.', ',');
};

/**
 * Parse de preço (converte string para número)
 */
window.parsePreco = function(valor) {
  return parseFloat(String(valor).replace(',', '.'));
};

// ============================================
// LOGS E DEBUGGING (DESENVOLVIMENTO)
// ============================================

if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  console.log('%c🎨 Sistema de Gestão de Cardápio', 'font-size: 20px; font-weight: bold; color: #1abc9c;');
  console.log('%cModo de Desenvolvimento Ativo', 'color: #3498db;');
  console.log('Comandos disponíveis no console:');
  console.log('- carregarCategorias(): Recarrega lista de categorias');
  console.log('- atualizarSelectCategorias(): Atualiza select de categorias');
  console.log('- mostrarSucesso(titulo, texto): Exibe alerta de sucesso');
  console.log('- mostrarErro(titulo, texto): Exibe alerta de erro');
  console.log('- formatarPreco(valor): Formata valor em R$');
}
