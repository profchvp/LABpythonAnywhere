
# Fatec Admin (Centro Paula Souza)

Arquitetura front-end (HTML + Bootstrap/CSS + JavaScript) com padrão visual CPS/Fatec e fluxo de login integrado à API.

## Estrutura de pastas

```
fatec-admin/
├── index.html
├── pages/
│   ├── institucional.html
│   └── dashboard.html
├── components/
│   └── header.html
├── assets/
│   ├── css/
│   │   └── cps-theme.css
│   ├── img/
│   │   └── logos/
│   │       ├── cps-logo.svg
│   │       └── fatec-logo.svg
│   └── js/
│       ├── config.js
│       ├── api.js
│       ├── session.js
│       ├── auth.js
│       ├── app.js
│       └── ui/
│           ├── header.js
│           └── toast.js
```

## Como executar localmente
1. Sirva a pasta com um servidor estático (ex.: `npx serve` ou `python -m http.server`).
2. Acesse `http://localhost:PORT/index.html`.
3. Clique em **Login** e informe credenciais válidas para a API.

## Configuração da API
O `API_BASE` está configurado para `https://profverissimofatec.pythonanywhere.com` em `assets/js/config.js`.

## Tratamento de respostas de login
- 200: Exibe nome e matrícula; busca nome da unidade por `codigoUnidade`.
- 404/401: Toast "Usuário ou senha inválidos".
- 403: Toast "Este Usuário está Inativo - Contate o Administrador do Sistema".

