async function renderHeader() {
  const container = document.getElementById('site-header');
  const res = await fetch('./components/header.html');
  container.innerHTML = await res.text();

  console.log("🔁 Header renderizado — registrando eventos de rota...");

  // 🔥 REATIVAR AS ROTAS DEPOIS DE RECRIAÇÃO DO HEADER
  if (window.App && typeof App.wireMenuLinks === "function") {
    console.log("🔗 Chamando App.wireMenuLinks() após renderHeader()");
    App.wireMenuLinks();
  } else {
    console.error("❌ ERRO: App.wireMenuLinks() NÃO encontrado!");
  }

  const isAuth = Session.isAuthenticated();

  // Esconde/mostra links conforme login
  document.querySelectorAll('[data-route]').forEach(el => {
    el.style.display = isAuth ? 'block' : 'none';
  });

  // BRAND (lado esquerdo) - badge
  const brandUnidade = document.getElementById('brand-unidade');

  // Área do usuário (lado direito)
  const userArea = document.getElementById('user-area');

  if (!isAuth) {
    if (brandUnidade) {
      brandUnidade.classList.add('d-none');
      brandUnidade.textContent = '';
    }
    userArea.innerHTML = `
      <button class="btn btn-outline-light" data-bs-toggle="modal" data-bs-target="#loginModal">
        Login
      </button>
    `;
    return;
  }

  // Autenticado: leia info da sessão
  const u = Session.getUser();
  const codigoUnidade = (u?.codigoUnidade ?? '').toString().trim();
  const nomeUnidade   = (u?.nomeUnidade ?? '').toString().trim();

  let textoUnidadeFormatado = '';
  if (codigoUnidade && nomeUnidade) {
    textoUnidadeFormatado = `${codigoUnidade} - ${nomeUnidade}`;
  } else if (codigoUnidade) {
    textoUnidadeFormatado = `Unidade ${codigoUnidade}`;
  } else if (nomeUnidade) {
    textoUnidadeFormatado = nomeUnidade;
  }

  if (brandUnidade) {
    brandUnidade.classList.add('d-none');
    brandUnidade.textContent = '';
  }

  const unidadeSuffix = textoUnidadeFormatado ? `<div>${textoUnidadeFormatado}</div>` : '';
  userArea.innerHTML = `
    <div class="fw-semibold">${u.nomeFuncionario} (${u.numeroMatricula})</div>
      ${unidadeSuffix}
    <button class="btn btn-outline-light mt-1" id="logout-btn">Sair</button>
  `;

  document.getElementById('logout-btn').addEventListener('click', () => {
    Session.clear();
    App.navigatePublic();
    Toast.show('Sessão encerrada.', 'success');
  });
}

window.Header = { render: renderHeader };
