(() => {
  console.log("📌 cadastroProfessor.js carregado (CRUD COMPLETO / API COMPATÍVEL)!");

  const API = "https://profVerissimoFatec.pythonanywhere.com/professores/";
  let matriculaSelecionada = null;

  const form = document.getElementById("formProfessor");
  const tabela = document.getElementById("tabelaProfessores")?.querySelector("tbody");

  if (!form || !tabela) {
    console.error("❌ Formulário ou tabela não encontrados. Abortando JS.");
    return;
  }

  // ============================================
  // MONTAGEM DO PAYLOAD (conforme API exige)
  // ============================================
  function getPayload() {
    return {
      matricula: Number(document.getElementById("matricula").value),
      nomeProfessor: document.getElementById("nomeProfessor").value.trim(),
      statusSituacao: Number(document.getElementById("statusSituacao").value),
      regimeJuridico: document.getElementById("regimeJuridico").value.trim(),
      cargaHoraria: document.getElementById("cargaHoraria").value.trim(),
      horaAtividade: Number(document.getElementById("horaAtividade").value),
      HAE_O: document.getElementById("HAE_O").value.trim(),
      HAE_C: document.getElementById("HAE_C").value.trim(),
      obsManha: document.getElementById("obsManha").value.trim(),
      obsTarde: document.getElementById("obsTarde").value.trim(),
      obsNoite: document.getElementById("obsNoite").value.trim(),
    };
  }

  // util: garante que exista UM tbody e retorna ele
function ensureTbody() {
  const table = document.getElementById("tabelaProfessores");
  if (!table) return null;
  let tb = table.querySelector("tbody");
  if (!tb) {
    tb = document.createElement("tbody");
    table.appendChild(tb);
  }
  return tb;
}

// LOCK para evitar concorrência
let loading = false;

// CARREGAR TABELA (uso inicial)
async function carregarTabela() {
  const tb = ensureTbody();
  if (!tb) {
    console.error("Tabela não encontrada");
    return;
  }

  if (loading) return;
  loading = true;
  tb.innerHTML = `<tr><td colspan="3">Carregando...</td></tr>`;

  try {
    const res = await fetch(API);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const lista = Array.isArray(json.dados) ? json.dados : [];

    // limpa de forma segura
    tb.innerHTML = "";

    if (lista.length === 0) {
      tb.innerHTML = `<tr><td colspan="3" class="text-center">Nenhum professor cadastrado</td></tr>`;
      loading = false;
      return;
    }

    // monta linhas da lista principal (apenas resumo)
    for (const prof of lista) {
      const status = prof.statusSituacao ?? prof.status ?? 0;
      const tr = document.createElement("tr");
      tr.dataset.matricula = prof.matricula; // marca para debug
      tr.innerHTML = `
        <td>${prof.matricula}</td>
        <td>${prof.nomeProfessor}</td>
        <td>${status === 1 ? "Ativo" : "Inativo"}</td>
      `;
      tr.style.cursor = "pointer";

      // Ao clicar: buscar o detalhe (garante dados completos) e preencher
      tr.addEventListener("click", async () => {
        try {
          const det = await fetch(`${API}${prof.matricula}`);
          const detJson = await det.json();
          const full = detJson.dados ?? detJson;
          carregarNoFormulario(full);
        } catch (err) {
          console.error("Erro ao buscar detalhe:", err);
          Toast.show("Erro ao obter dados completos", "danger");
        }
      });

      tb.appendChild(tr);
    }

  } catch (err) {
    console.error("Erro ao listar professores:", err);
    tb.innerHTML = `<tr><td colspan="3" class="text-danger">Erro ao carregar lista</td></tr>`;
  } finally {
    loading = false;
  }
}


  // ============================================
  // CARREGAR NO FORMULÁRIO AO CLICAR NA LINHA
  // ============================================
  function carregarNoFormulario(prof) {
    matriculaSelecionada = prof.matricula;

    document.getElementById("matricula").value = prof.matricula;
    document.getElementById("nomeProfessor").value = prof.nomeProfessor;
    document.getElementById("statusSituacao").value = prof.statusSituacao ?? prof.status;
    document.getElementById("regimeJuridico").value = prof.regimeJuridico ?? "";
    document.getElementById("cargaHoraria").value = prof.cargaHoraria ?? "";
    document.getElementById("horaAtividade").value = prof.horaAtividade ?? "";
    document.getElementById("HAE_O").value = prof.HAE_O ?? "";
    document.getElementById("HAE_C").value = prof.HAE_C ?? "";
    document.getElementById("obsManha").value = prof.obsManha ?? "";
    document.getElementById("obsTarde").value = prof.obsTarde ?? "";
    document.getElementById("obsNoite").value = prof.obsNoite ?? "";

    Toast.show("Professor carregado para edição", "info");
  }

  // ============================================
  // SALVAR (POST)
  // ============================================
  form.addEventListener("submit", async e => {
    e.preventDefault();

    const payload = getPayload();

    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const json = await res.json();

      if (!res.ok) {
        Toast.show(json.erro || "Erro ao salvar", "danger");
        return;
      }

      Toast.show("Professor cadastrado com sucesso!", "success");

      form.reset();
      matriculaSelecionada = null;
      carregarTabela();

    } catch (err) {
      console.error("Erro no POST:", err);
      Toast.show("Erro de comunicação com API", "danger");
    }
  });

  // ============================================
  // ALTERAR (PUT)
  // ============================================
  document.getElementById("btnAlterar").addEventListener("click", async () => {

    if (!matriculaSelecionada) {
      Toast.show("Selecione um professor na lista", "warning");
      return;
    }

    const payload = getPayload();

    try {
      const res = await fetch(API + matriculaSelecionada, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const json = await res.json();

      if (!res.ok) {
        Toast.show(json.erro || "Erro ao alterar", "danger");
        return;
      }

      Toast.show("Professor atualizado!", "success");
      carregarTabela();

    } catch (err) {
      console.error("Erro no PUT:", err);
      Toast.show("Erro ao comunicar com API", "danger");
    }
  });

  // ============================================
  // EXCLUIR (DELETE)
  // ============================================
  document.getElementById("btnExcluir").addEventListener("click", async () => {

    if (!matriculaSelecionada) {
      Toast.show("Selecione um professor", "warning");
      return;
    }

    if (!confirm("Deseja realmente excluir este professor?")) return;

    try {
      const res = await fetch(API + matriculaSelecionada, { method: "DELETE" });

      if (!res.ok) {
        Toast.show("Erro ao excluir", "danger");
        return;
      }

      Toast.show("Professor excluído!", "success");

      form.reset();
      matriculaSelecionada = null;
      carregarTabela();

    } catch (err) {
      console.error("Erro no DELETE:", err);
      Toast.show("Erro ao comunicar com API", "danger");
    }
  });

 
  // ============================================
  // INICIAR LISTA AUTOMÁTICA
  // ============================================
  carregarTabela();

})();
