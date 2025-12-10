
// assets/js/api.js

// ---------------------------------------------
// Helpers HTTP (JSON)
// ---------------------------------------------
async function httpPost(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    mode: 'cors',
    body: JSON.stringify(body),
  });

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : null;

  return { status: res.status, data };
}

async function httpGet(url) {
  const res = await fetch(url, { method: 'GET', mode: 'cors' });
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : null;

  return { status: res.status, data };
}

// ---------------------------------------------
// Helper HTTP (FormData upload)
// ---------------------------------------------
// NÃO definir 'Content-Type' aqui: o browser define corretamente com boundary
async function httpUploadFormData(url, formData, extraOptions = {}) {
  const res = await fetch(url, {
    method: 'POST',
    body: formData,
    mode: 'cors',
    ...extraOptions,
  });

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : null;

  return { status: res.status, data };
}

// ---------------------------------------------
// Resolvedor de base da API
// Prioriza API_BASE; se não existir, tenta Config.API_BASE_URL; senão, ''.
// ---------------------------------------------
function resolveApiBase() {
  // API_BASE (global) já é usado neste projeto
  if (typeof API_BASE !== 'undefined' && API_BASE) return API_BASE;
  // fallback: Config.API_BASE_URL
  if (window.Config && typeof Config.API_BASE_URL === 'string' && Config.API_BASE_URL) {
    return Config.API_BASE_URL;
  }
  // fallback final
  return '';
}

/* ========================================================
   API PROFESSORES — usando base resolvida acima
=========================================================== */

const professores = {
  async create(professorData) {
    const BASE = resolveApiBase();
    return await httpPost(`${BASE}/professores`, professorData);
  },

  async listar() {
    const BASE = resolveApiBase();
    return await httpGet(`${BASE}/professores`);
  },

  async obterPorMatricula(matricula) {
    const BASE = resolveApiBase();
    return await httpGet(`${BASE}/professores/${matricula}`);
  }
};

// ---------------------------------------------
// Upload em massa de professores (Excel)
// ---------------------------------------------
async function uploadProfessorMassa(formData) {
  const BASE = resolveApiBase();
  const url  = `${BASE}/api/importacoes/professor/massa`;

  const { status, data } = await httpUploadFormData(url, formData);

  // Normaliza o retorno para consumo no front
  if (status >= 200 && status < 300) {
    // Esperado: {status:'ok', message:'...', resumo:{...}}
    return data ?? { status: 'ok', message: 'Arquivo enviado com sucesso.' };
  }

  // Se houver payload de erro do servidor, aproveita a mensagem
  const message = (data && data.message)
    ? data.message
    : `Falha ao processar arquivo. Código: ${status}`;
  return { status: 'error', message };
}

// ---------------------------------------------
// Exposição pública em window.Api
// ---------------------------------------------
window.Api = window.Api || {};
window.Api.httpPost = httpPost;
window.Api.httpGet = httpGet;
window.Api.httpUploadFormData = httpUploadFormData;
window.Api.professores = professores;
