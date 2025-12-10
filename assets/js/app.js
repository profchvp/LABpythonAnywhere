
// =====================================================
// FUNÇÃO PRINCIPAL DE CARREGAMENTO DE PÁGINAS (SPA)
// =====================================================

async function loadPage(path) {
  const container = document.getElementById('main-content');
  console.log("📄 loadPage() chamado →", path);
  try {
    const res = await fetch(path);
    console.log("📥 Resposta do fetch:", res.status, res.statusText);
    const html = await res.text();
    container.innerHTML = html;
    console.log("📌 Página carregada e inserida no DOM:", path);
    // ✅ sempre passar o path aqui:
    runPageScripts(path);
  } catch (err) {
    console.error("❌ Erro ao carregar página:", path, err);
    Toast.show("Erro ao carregar página.", "danger");
  }
}



// =====================================================
// CARREGAMENTO DE SCRIPTS ESPECÍFICOS POR ROTA
// =====================================================

function runPageScripts(path) {
  console.log("📦 runPageScripts() chamado →", path);

  // ✅ Guardas para evitar ReferenceError se path estiver undefined/null
  if (typeof path !== 'string' || path.length === 0) {
    console.warn("⚠ runPageScripts() chamado sem path válido.");
    return;
  }

  // Cadastro unitário de professor
  if (path.includes("cadastro-professor.html")) {
    console.log("🔎 Carregando cadastroProfessor.js como script da página...");
    const script = document.createElement("script");
    script.src = "./assets/js/cadastroProfessor.js";
    script.dataset.page = "cadastro-professor";
    script.defer = true;
    document.body.appendChild(script);
  }

  // Cadastro em massa de professor
  if (path.includes("cadastro-professor-massa.html")) {
    console.log("🔎 Carregando cadastroProfessorMassa.js...");
    const script = document.createElement("script");
    script.src = "./assets/js/cadastroProfessorMassa.js";
    script.dataset.page = "cadastro-professor-massa";
    script.defer = true;
    document.body.appendChild(script);
  }

  // (demais páginas seguem o mesmo padrão)
}

/*
carregar o JS dessa página "Cadastro de Professor em Massa" quando ela for exibida
// assets/js/app.js → dentro de runPageScripts(path)

// ❌ REMOVIDO: havia um bloco solto usando 'path' fora de função,
// o que gerava 'Uncaught ReferenceError: path is not defined'.
// Todo carregamento condicional de scripts deve ficar DENTRO de runPageScripts(path).
*/


// =====================================================
// NAVEGAÇÃO PARA USUÁRIOS NÃO AUTENTICADOS (PÚBLICO)
// =====================================================

async function navigatePublic() {
  console.log("🌐 Navegação pública iniciada");
  await loadPage('./pages/institucional.html');
  await Header.render();
  Auth.wireLoginForm();
}



// =====================================================
// NAVEGAÇÃO PARA USUÁRIOS AUTENTICADOS (PAINEL)
// =====================================================

async function navigatePrivate() {
  console.log("🔐 Navegação privada iniciada");
  await loadPage('./pages/dashboard.html');
  await Header.render();
  wireMenuLinks();
}



// =====================================================
// ROTAS INTERNAS DO MENU
// =====================================================

function wireMenuLinks() {
  console.log("🔗 wireMenuLinks() ativado → registrando handlers nos menus...");

  document.querySelectorAll('[data-route]').forEach(link => {

    const route = link.getAttribute('data-route');
    console.log("➡ Detectado link de rota:", route);

    link.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation(); // 🔥 impede Bootstrap de cancelar o clique

      console.log("🖱 Clique em rota:", route);

      let page = null;

      switch (route) {

        case 'cadastro-professor':
          page = './pages/cadastro-professor.html';
          break;

        case 'cadastro-disciplina':
          page = './pages/cadastro-disciplina.html';
          break;

        case 'cadastro-curso':
          page = './pages/cadastro-curso.html';
          break;

        case 'cadastro-turma':
          page = './pages/cadastro-turma.html';
          break;

        case 'cadastro-sala':
          page = './pages/cadastro-sala.html';
          break;

        case 'grade':
          page = './pages/grade.html';
          break;

        case 'frequencia':
          page = './pages/frequencia.html';
          break;

        case 'cadastro-professor-massa':
          page = './pages/cadastro-professor-massa.html';
          break;

        case 'cadastro-disciplina-massa':
          page = './pages/cadastro-disciplina-massa.html';
          break;

        case 'cadastro-curso-massa':
          page = './pages/cadastro-curso-massa.html';
          break;

        case 'cadastro-turma-massa':
          page = './pages/cadastro-turma-massa.html';
          break;

        case 'cadastro-sala-massa':
          page = './pages/cadastro-sala-massa.html';
          break;

        default:
          console.warn("⚠ Rota ainda não implementada:", route);
          Toast.show('Funcionalidade ainda não implementada.', 'info');
          return;
      }

      console.log("📄 Carregando página:", page);

      await loadPage(page);
      await Header.render();   // header é refeito
      wireMenuLinks();         // reanexa rotas
    });
  });
}



// =====================================================
// INICIALIZAÇÃO GERAL DA APLICAÇÃO
// =====================================================

async function init() {
  console.log("🚀 init() executado → inicializando aplicação...");

  await Header.render();

  if (Session.isAuthenticated()) {
    console.log("🔐 Usuário AUTENTICADO → indo para painel privado");
    await navigatePrivate();
  } else {
    console.log("🌐 Usuário NÃO autenticado → página pública");
    await navigatePublic();
  }
}

document.addEventListener('DOMContentLoaded', init);

window.App = { init, loadPage, navigatePublic, navigatePrivate, wireMenuLinks };
