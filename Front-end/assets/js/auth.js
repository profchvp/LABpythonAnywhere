function extractField(obj, ...keys) {
  for (const k of keys) {
    const parts = k.split('.');
    let v = obj;
    for (const p of parts) {
      if (v && p in v) v = v[p]; else { v = undefined; break; }
    }
    if (v !== undefined && v !== null) return v;
  }
  return undefined;
}

async function handleLoginSubmit(e) {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const senha = document.getElementById('senha').value;

  if (!email || !senha) {
    Toast.show('Informe e-mail e senha.', 'danger');
    return;
  }

  const { status, data } = await Api.httpPost(Config.ENDPOINTS.login, { email, senha });

  if (status === 200) {

    const numeroMatricula = extractField(data, 'numeroMatricula', 'matricula');
    const nomeFuncionario = extractField(data, 'nomeFuncionario', 'nome', 'usuario.nome');
    const codigoUnidade = extractField(data, 'codigoUnidade', 'usuario.codigoUnidade', 'codUnidade');

    if (!numeroMatricula || !nomeFuncionario) {
      Toast.show('Resposta de login sem campos esperados. Verifique a API.', 'danger');
      return;
    }

    let nomeUnidade = '';
if (codigoUnidade !== undefined) {
  const { status: stU, data: dadosUn } = 
    await Api.httpGet(Config.ENDPOINTS.unidade(codigoUnidade));

  if (stU === 200 && dadosUn && dadosUn.dados) {
    // Nome correto conforme API PythonAnywhere
    nomeUnidade = extractField(
      dadosUn.dados,
      'nomeFatecUnidade',
      'fatecDenominacaoOficial'
    ) || '';
  }
}

    // Salvar tudo na sessão
    Session.setUser({
      email,
      numeroMatricula,
      nomeFuncionario,
      codigoUnidade,
      nomeUnidade
    });

    const modalEl = document.getElementById('loginModal');
    bootstrap.Modal.getInstance(modalEl)?.hide();
    await Header.render();
    App.navigatePrivate();
    Toast.show('Login realizado com sucesso.', 'success');

  } else if (status === 404 || status === 401) {
    Toast.show('Usuário ou senha inválidos', 'danger');
  } else if (status === 403) {
    Toast.show('Este Usuário está Inativo - Contate o Administrador do Sistema', 'warning');
  } else {
    Toast.show(`Falha ao autenticar (HTTP ${status}).`, 'danger');
  }
}

function wireLoginForm() {
  const form = document.getElementById('login-form');
  if (form) form.addEventListener('submit', handleLoginSubmit);
}

window.Auth = { wireLoginForm };
