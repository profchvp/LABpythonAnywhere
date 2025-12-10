
// ./assets/js/cadastroProfessorMassa.js
(function () {
  console.log("📦 cadastroProfessorMassa.js inicializado");

  const arquivoInput   = document.getElementById('arquivoExcel');
  const btnProcessar   = document.getElementById('btnProcessar');
  const btnLimpar      = document.getElementById('btnLimpar');
  const fileInfo       = document.getElementById('fileInfo');
  const alertArea      = document.getElementById('alertArea');
  const processSpinner = document.getElementById('processSpinner');

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

  function showAlert(message, type = 'info') {
    // Preferência: usar Toast global do projeto para mensagens de estado
    if (window.Toast && typeof window.Toast.show === 'function') {
      window.Toast.show(message, type);
    }
    // Além do Toast, manter um resumo persistente na página, se necessário
    alertArea.innerHTML = `
      <div class="alert alert-${type} alert-dismissible fade show" role="alert">
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
      </div>
    `;
  }

  function resetUI() {
    arquivoInput.value = '';
    btnProcessar.disabled = true;
    fileInfo.classList.add('visually-hidden');
    fileInfo.textContent = '';
    alertArea.innerHTML = '';
  }

  function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  arquivoInput.addEventListener('change', () => {
    alertArea.innerHTML = '';
    const file = arquivoInput.files && arquivoInput.files[0];
    if (!file) {
      resetUI();
      return;
    }

    const name = file.name.toLowerCase();
    const isExcel  = name.endsWith('.xlsx') || name.endsWith('.xls');
    const isSizeOk = file.size <= MAX_FILE_SIZE;

    fileInfo.classList.remove('visually-hidden');

    if (!isExcel) {
      fileInfo.innerHTML = `<span class="text-danger fw-semibold">Arquivo inválido:</span> ${file.name} — somente .xlsx/.xls`;
      btnProcessar.disabled = true;
      return;
    }
    if (!isSizeOk) {
      fileInfo.innerHTML = `<span class="text-danger fw-semibold">Arquivo muito grande:</span> ${file.name} (${formatBytes(file.size)}) — limite ${formatBytes(MAX_FILE_SIZE)}`;
      btnProcessar.disabled = true;
      return;
    }

    fileInfo.innerHTML = `<span class="text-primary fw-semibold">Selecionado:</span> ${file.name} (${formatBytes(file.size)})`;
    btnProcessar.disabled = false;
  });

  btnLimpar.addEventListener('click', () => {
    resetUI();
    showAlert('Seleção de arquivo limpa.', 'secondary');
  });

  btnProcessar.addEventListener('click', async () => {
    const file = arquivoInput.files && arquivoInput.files[0];
    if (!file) {
      showAlert('Por favor, selecione um arquivo Excel antes de processar.', 'warning');
      return;
    }

    // Bloqueia o botão e mostra spinner
    btnProcessar.disabled = true;
    processSpinner.classList.remove('d-none');

    try {
      // Próximo prompt: faremos o backend.
      // Aqui já deixamos o uso da API preparada (assets/js/api.js):
      if (!window.Api || typeof Api.uploadProfessorMassa !== 'function') {
        // fallback: simulação até adicionarmos a função na api.js
        await new Promise(r => setTimeout(r, 800));
        showAlert('Arquivo validado localmente. Pronto para enviar ao backend (definiremos no próximo passo).', 'success');
      } else {
        const formData = new FormData();
        formData.append('arquivoExcel', file);

        const resp = await Api.uploadProfessorMassa(formData);
        // Espera-se que a API retorne {status, message, resumo}
        if (resp && resp.status === 'ok') {
          showAlert(resp.message || 'Arquivo enviado. Processamento iniciado com sucesso.', 'success');
          // Se quiser exibir um resumo:
          if (resp.resumo) {
            alertArea.insertAdjacentHTML('beforeend', `
              <div class="alert alert-info mt-2">
                <div><strong>Resumo:</strong></div>
                <pre class="mb-0">${JSON.stringify(resp.resumo, null, 2)}</pre>
              </div>
            `);
          }
        } else {
          const msg = (resp && resp.message) ? resp.message : 'Falha ao processar arquivo.';
          showAlert(msg, 'danger');
        }
      }
    } catch (err) {
      console.error(err);
      showAlert('Ocorreu um erro no envio. Verifique sua conexão e tente novamente.', 'danger');
    } finally {
      processSpinner.classList.add('d-none');
      btnProcessar.disabled = false;
    }
  });

  // Inicialização
  resetUI();
})();
