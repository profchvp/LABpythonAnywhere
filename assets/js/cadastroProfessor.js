(() => {
  console.log("📌 cadastroProfessor.js carregado!");

  const form = document.getElementById("formProfessor");

  if (!form) {
    console.error("❌ ERRO: formProfessor NÃO encontrado no DOM!");
    return;
  }

  console.log("✅ formProfessor encontrado, registrando listener...");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    console.log("🚀 Evento SUBMIT disparado!");

    const payload = {
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

    console.log("📦 Payload pronto:", payload);

    try {
      Toast.show("Professor salvo com sucesso!", "success");
      console.log("✅ Toast.show foi chamado!");
    } catch (err) {
      console.error("❌ ERRO ao chamar Toast.show:", err);
    }
  });
})();
