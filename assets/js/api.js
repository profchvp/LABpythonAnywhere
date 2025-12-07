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

/* ========================================================
   API PROFESSORES — usando API_BASE de config.js
=========================================================== */

const professores = {

  async create(professorData) {
    return await httpPost(`${API_BASE}/professores`, professorData);
  },

  async listar() {
    return await httpGet(`${API_BASE}/professores`);
  },

  async obterPorMatricula(matricula) {
    return await httpGet(`${API_BASE}/professores/${matricula}`);
  }
};

window.Api = { httpPost, httpGet, professores };
