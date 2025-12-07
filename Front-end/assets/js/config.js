
const API_BASE = 'https://profverissimofatec.pythonanywhere.com'; // padronizado minúsculo
const ENDPOINTS = {
  login: `${API_BASE}/usuarios/login`,
  unidade: (codigoUnidade) => `${API_BASE}/unidades/${codigoUnidade}`,
};
window.Config = { API_BASE, ENDPOINTS };
