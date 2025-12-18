
// ./assets/js/cadastroProfessorMassa.js
(function () {
  console.log("📦 cadastroProfessorMassa.js inicializado");

  // ---------------------------------------------------------------------------
  // Loader resiliente para garantir que a biblioteca XLSX (SheetJS) exista
  // ---------------------------------------------------------------------------
  async function ensureXLSXLoaded() {
    if (window.XLSX) {
      console.log('[Professor-Massa] XLSX já disponível (global).');
      return;
    }
    console.log('[Professor-Massa] XLSX não encontrado; carregando do CDN...');

    const existing = document.querySelector('script[data-sheetjs="xlsx"]');
    if (!existing) {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js';
      s.async = true;
      s.defer = true;
      s.setAttribute('data-sheetjs', 'xlsx');
      document.head.appendChild(s);
    }

    const startedAt = Date.now();
    await new Promise((resolve, reject) => {
      const check = () => {
        if (window.XLSX) return resolve();
        if (Date.now() - startedAt > 10000) {
          return reject(new Error('Timeout ao carregar SheetJS (XLSX) após 10s.'));
        }
        setTimeout(check, 200);
      };
      setTimeout(check, 200);
    });

    console.log('[Professor-Massa] XLSX carregado com sucesso.');
  }

  // ---------------------------------------------------------------------------
  // Elementos da UI
  // ---------------------------------------------------------------------------
  const arquivoInput   = document.getElementById('arquivoExcel');
  const btnProcessar   = document.getElementById('btnProcessar');
  const btnLimpar      = document.getElementById('btnLimpar');
  const fileInfo       = document.getElementById('fileInfo');
  const alertArea      = document.getElementById('alertArea');
  const processSpinner = document.getElementById('processSpinner');

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

  function showAlert(message, type = 'info') {
    if (window.Toast && typeof window.Toast.show === 'function') {
      window.Toast.show(message, type);
    }
    alertArea.innerHTML = `<div class="alert alert-${type} mb-2" role="alert">${message}</div>`;
  }

  function resetUI() {
    arquivoInput.value = '';
    if (btnProcessar) btnProcessar.disabled = true;
    fileInfo?.classList.add('visually-hidden');
    fileInfo && (fileInfo.textContent = '');
    alertArea && (alertArea.innerHTML = '');
  }

  function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // ---------------------------------------------------------------------------
  // Seleção de arquivo
  // ---------------------------------------------------------------------------
  arquivoInput?.addEventListener('change', () => {
    alertArea && (alertArea.innerHTML = '');
    const file = arquivoInput.files && arquivoInput.files[0];
    if (!file) {
      resetUI();
      return;
    }
    const name = file.name.toLowerCase();
    const isExcel = name.endsWith('.xlsx') || name.endsWith('.xls'); // ✅ corrigido
    const isSizeOk = file.size <= MAX_FILE_SIZE;

    fileInfo?.classList.remove('visually-hidden');

    if (!isExcel) {
      fileInfo && (fileInfo.innerHTML = `Arquivo inválido: ${file.name} — somente .xlsx/.xls`);
      btnProcessar && (btnProcessar.disabled = true);
      return;
    }
    if (!isSizeOk) {
      fileInfo && (fileInfo.innerHTML = `Arquivo muito grande: ${file.name} (${formatBytes(file.size)}) — limite ${formatBytes(MAX_FILE_SIZE)}`);
      btnProcessar && (btnProcessar.disabled = true);
      return;
    }
    fileInfo && (fileInfo.innerHTML = `Selecionado: ${file.name} (${formatBytes(file.size)})`);
    btnProcessar && (btnProcessar.disabled = false);
  });

  btnLimpar?.addEventListener('click', () => {
    resetUI();
    showAlert('Seleção de arquivo limpa.', 'secondary');
  });

  // ---------------------------------------------------------------------------
  // Helpers de tipo e mapeamento do Excel
  // ---------------------------------------------------------------------------
  function toIntOrNull(v) {
    if (v === '' || v === null || v === undefined) return null;
    const s = String(v).trim().replace(',', '.'); // aceita "12,00" e "12.00"
    const n = Number.parseInt(s, 10);
    return Number.isFinite(n) ? n : null;
  }
  function toStrOrEmpty(v) {
    return (v === undefined || v === null) ? '' : String(v).trim();
  }

  // Cabeçalho esperado (linha 12), ordem A..L
  const HEADER_EXPECTED = [
    '#Sequencia',           // A (ignorado no payload)
    'Matrícula',            // B -> matricula
    'Nome do Professor',    // C -> nomeProfessor
    'Regime Jurídico',      // D -> regimeJuridico
    'Categoria',            // E -> ignorado no payload
    'Carga Horária',        // F -> cargaHoraria
    'Hora Atividade',       // G -> horaAtividade
    'HAE-o',                // H -> HAE_O
    'HAE-c',                // I -> HAE_C
    'Observação Manha',     // J -> obsManha
    'Observação Tarde',     // K -> obsTarde
    'Observação Noite'      // L -> obsNoite
  ];

  function rowToProfessor(rowObj) {
    return {
      matricula:     toStrOrEmpty(rowObj['Matrícula']),
      nomeProfessor: toStrOrEmpty(rowObj['Nome do Professor']),
      statusSituacao:1, // numerico inteiro, consistente com o contrato
      regimeJuridico:toStrOrEmpty(rowObj['Regime Jurídico']),
      cargaHoraria:  toIntOrNull(rowObj['Carga Horária']),
      horaAtividade: toIntOrNull(rowObj['Hora Atividade']),
      HAE_O:         toIntOrNull(rowObj['HAE-o']),
      HAE_C:         toIntOrNull(rowObj['HAE-c']),
      obsManha:      toStrOrEmpty(rowObj['Observação Manha']),
      obsTarde:      toStrOrEmpty(rowObj['Observação Tarde']),
      obsNoite:      toStrOrEmpty(rowObj['Observação Noite'])
    };
  }

  // ---------------------------------------------------------------------------
  // Handler do botão "Processar" — nomeado (evita duplicidade)
  // ---------------------------------------------------------------------------
  async function onProcessarClick() {
    console.log('onProcessarClick disparado');

    // Proteção contra duplo clique/dupla chamada simultânea
    if (window.__cadastroProfessorMassaProcessing) {
      console.warn('Processamento já em andamento; ignorando clique duplicado.');
      return;
    }
    window.__cadastroProfessorMassaProcessing = true;

    const file = arquivoInput.files && arquivoInput.files[0];
    if (!file) {
      showAlert('Por favor, selecione um arquivo Excel antes de processar.', 'warning');
      window.__cadastroProfessorMassaProcessing = false;
      return;
    }

    // UI: trava botão e mostra spinner
    btnProcessar && (btnProcessar.disabled = true);
    processSpinner?.classList.remove('d-none');

    try {
      // 1) Garante XLSX antes de qualquer uso
      await ensureXLSXLoaded();
      console.log('[Professor-Massa] typeof XLSX =', typeof XLSX);
      if (typeof XLSX === 'undefined') {
        showAlert('Biblioteca XLSX não disponível. Verifique conexão e políticas de conteúdo (CSP).', 'danger');
        return;
      }

      // 2) Ler o Excel diretamente no browser (robusto a linhas vazias)
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });

      // Tenta localizar a aba 'docentes' (case-insensitive)
      const sheet = workbook.Sheets['docentes']
                 || workbook.Sheets['Docentes']
                 || workbook.Sheets['DOCENTES'];
      if (!sheet) {
        showAlert('A aba "docentes" não foi encontrada no arquivo.', 'danger');
        return;
      }

      // Utilitários de endereço
      const decode_range = XLSX.utils.decode_range;
      const encode_cell  = XLSX.utils.encode_cell;

      // Range físico da planilha
      const range = decode_range(sheet['!ref']); // {s:{c,r}, e:{c,r}}
      const startCol = range.s.c;
      const HEADER_ROW_IDX = 11;     // linha 12 (0-based)
      const FIRST_DATA_ROW_IDX = 12; // linha 13 (0-based)

      // Lê o cabeçalho físico da linha 12 (A12..L12)
      const headerRow = [];
      for (let j = 0; j < HEADER_EXPECTED.length; j++) {
        const addr = encode_cell({ c: startCol + j, r: HEADER_ROW_IDX });
        const cell = sheet[addr];
        headerRow.push(cell ? String(cell.v).trim() : '');
      }

      // Valida cabeçalho (A..L)
      const headerOk = HEADER_EXPECTED.every((h, idx) => ((headerRow[idx] || '') === h));
      if (!headerOk) {
        showAlert('Cabeçalho da linha 12 não confere com o esperado. Verifique nomes e ordem das colunas.', 'danger');
        console.error('Cabeçalho lido (linha 12):', headerRow);
        return;
      }

      // Lê até 200 linhas de dados a partir da linha 13, por células
      const rowsAsObjects = [];
      for (let r = FIRST_DATA_ROW_IDX; r <= range.e.r && rowsAsObjects.length < 200; r++) {
        const obj = {};
        let rowHasData = false;

        for (let j = 0; j < HEADER_EXPECTED.length; j++) {
          const addr = encode_cell({ c: startCol + j, r });
          const cell = sheet[addr];
          let val = cell ? cell.v : '';
          if (typeof val === 'string') val = val.trim();
          obj[HEADER_EXPECTED[j]] = (val === undefined || val === null) ? '' : val;
          if (obj[HEADER_EXPECTED[j]] !== '') rowHasData = true;
        }

        if (rowHasData) rowsAsObjects.push(obj);
      }

      // Converte para o modelo do Swagger e filtra inválidos (matrícula/nome)
      const professoresPayload = rowsAsObjects
        .map(rowToProfessor)
        .filter(p => p.matricula && p.nomeProfessor);

      if (professoresPayload.length === 0) {
        showAlert('Nenhum professor válido encontrado após a linha 12.', 'warning');
        return;
      }

      console.log('Payload (amostra):', professoresPayload.slice(0, 1));

      // 3) Chamada da API (POST JSON conforme swagger)
      const API_BASE = 'https://profverissimofatec.pythonanywhere.com';
      const endpoint = `${API_BASE}/professores/importacao-massa`;

      const controller = new AbortController();
      const timeoutId  = setTimeout(() => controller.abort(), 30000);

      let resp;
      try {
        resp = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(professoresPayload),
          signal: controller.signal
        });
      } catch (e) {
        clearTimeout(timeoutId);
        if (e && e.name === 'AbortError') {
          showAlert('Tempo de espera excedido ao chamar a API (timeout 30s).', 'danger');
          return;
        }
        showAlert('Falha ao iniciar a chamada à API. Verifique conexão e CORS.', 'danger');
        console.error('Erro no fetch:', e);
        return;
      }
      clearTimeout(timeoutId);

      if (!resp.ok) {
        const text = await resp.text().catch(() => '');
        showAlert(`Falha ao chamar API: ${resp.status} - ${text}`, 'danger');
        return;
      }

      const resultado = await resp.json().catch(e => {
        showAlert('Resposta da API não é JSON válido.', 'danger');
        console.error('Erro parse JSON:', e);
        return null;
      });
      if (!resultado) return;

      showAlert('Importação enviada. Resultado recebido do backend.', 'success');

      if (Array.isArray(resultado) && resultado.length > 0) {
        const linhas = resultado.map((r) => {
          const matricula = (r && r.matricula) ? r.matricula : '';
          const nome      = (r && r.nome) ? r.nome : '';
          const sucesso   = (r && r.sucesso) ? '✅' : '❌';
          const mensagem  = (r && r.mensagem) ? r.mensagem : '';
          return `<tr>
            <td>${matricula}</td>
            <td>${nome}</td>
            <td>${sucesso}</td>
            <td>${mensagem}</td>
          </tr>`;
        }).join('');

        alertArea.insertAdjacentHTML('beforeend', `
          <div class="mt-3">
            <h6>Resumo da Importação</h6>
            <div class="table-responsive">
              <table class="table table-sm table-bordered">
                <thead>
                  <tr>
                    <th>Matrícula</th>
                    <th>Nome</th>
                    <th>Sucesso</th>
                    <th>Mensagem</th>
                  </tr>
                </thead>
                <tbody>${linhas}</tbody>
              </table>
            </div>
          </div>
        `);
      }

    } catch (err) {
      console.error(err);
      showAlert('Ocorreu um erro no envio. Verifique sua conexão e tente novamente.', 'danger');
    } finally {
      processSpinner?.classList.add('d-none');
      btnProcessar && (btnProcessar.disabled = false);
      window.__cadastroProfessorMassaProcessing = false; // libera para próximos cliques
    }
  }

  // ---------------------------------------------------------------------------
  // Liga o listener uma única vez por elemento (evita chamadas duplicadas)
  // ---------------------------------------------------------------------------
  if (btnProcessar && !btnProcessar.__profMassaBound) {
    btnProcessar.addEventListener('click', onProcessarClick);
    btnProcessar.__profMassaBound = true;
  }

  // ---------------------------------------------------------------------------
  // Inicialização
  // ---------------------------------------------------------------------------
   resetUI();
})();
