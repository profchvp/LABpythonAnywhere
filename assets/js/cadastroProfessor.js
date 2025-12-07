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
      const res = await fetch(
        "https://profVerissimoFatec.pythonanywhere.com/professores",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();
      console.log("📨 Resposta da API:", data);

      // ============================================
      // TRATAMENTO DE ERROS ESPECÍFICOS
      // ============================================
      if (!res.ok) {

        // ERRO 409 – matrícula duplicada
        if (res.status === 409) {
          Toast.show("Número de Matrícula Cadastrada Anteriormente", "error");
          console.warn("⚠ Matrícula duplicada:", data);
          return;
        }

        // Outros erros genéricos
        Toast.show(`Erro: ${data.erro || "Falha ao salvar"}`, "error");
        console.error("❌ Erro retornado pela API", data);
        return;
      }

      // ============================================
      // SUCESSO
      // ============================================
      Toast.show("Professor salvo com sucesso!", "success");
      console.log("✅ Cadastro realizado com sucesso!");

      form.reset();
      // ----------------------------------------------
      // Redireciona para a página principal após 1.2s
      // ----------------------------------------------
      setTimeout(() => {
        window.location.href = "./index.html"; // ou "./pages/dashboard.html"
      }, 1200);
      
    } catch (err) {
      console.error("❌ ERRO ao enviar requisição:", err);
      Toast.show("Erro ao conectar com o servidor!", "error");
    }
  });
})();
