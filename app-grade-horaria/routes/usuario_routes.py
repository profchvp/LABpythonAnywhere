from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from database import get_conn, now_iso

usuario_bp = Blueprint("usuarios", __name__)

@usuario_bp.post("/")
def criar_usuario():
    data = request.get_json(force=True)

    required = ["emailFatec", "codigoUnidade", "nomeFuncionario"]
    missing = [k for k in required if k not in data]

    if missing:
        return jsonify(erro=f"Campos obrigatórios ausentes: {', '.join(missing)}"), 400

    email = data["emailFatec"].strip().lower()
    codigo_unidade = data["codigoUnidade"]
    nome = data["nomeFuncionario"]
    numero_matricula = data.get("numeroMatricula")
    senha_clara = data.get("senhaLogin") or data.get("senha")

    if not senha_clara:
        return jsonify(erro="Senha é obrigatória"), 400

    senha_hash = generate_password_hash(senha_clara)

    with get_conn() as conn:

        # verifica unidade existente
        cur = conn.execute("SELECT 1 FROM unidade WHERE codigoUnidade = ?", (codigo_unidade,))
        if not cur.fetchone():
            return jsonify(erro="codigoUnidade inexistente"), 422

        # verifica e-mail duplicado
        cur = conn.execute("SELECT 1 FROM usuario WHERE emailFatec = ?", (email,))
        if cur.fetchone():
            return jsonify(erro="email já existe"), 409

        # insere o novo usuário
        conn.execute("""
            INSERT INTO usuario
                (emailFatec, numeroMatricula, codigoUnidade, nomeFuncionario,
                 senhaLogin, indicadorAtivo, dataInclusao)
            VALUES (?, ?, ?, ?, ?, 1, ?)
        """, (
            email, numero_matricula, codigo_unidade, nome, senha_hash, now_iso()
        ))

    return jsonify(status="OK", mensagem="Usuário criado"), 201


@usuario_bp.post("/login")
def login():
    data = request.get_json(force=True)

    email = data["email"].strip().lower()
    senha = data["senha"]

    with get_conn() as conn:
        cur = conn.execute("SELECT * FROM usuario WHERE emailFatec = ?", (email,))
        row = cur.fetchone()

        if not row:
            return jsonify(erro="Usuário não encontrado"), 404

        if not check_password_hash(row["senhaLogin"], senha):
            return jsonify(erro="Senha inválida"), 401

        # retorna dados essenciais
        return jsonify({
            "nomeFuncionario": row["nomeFuncionario"],
            "numeroMatricula": row["numeroMatricula"],
            "codigoUnidade": row["codigoUnidade"],
            "emailFatec": row["emailFatec"]
        })


@usuario_bp.delete("/<path:emailFatec>")
def excluir_usuario(emailFatec):
    with get_conn() as conn:
        cur = conn.execute("DELETE FROM usuario WHERE emailFatec = ?", (emailFatec.lower(),))
        if cur.rowcount == 0:
            return jsonify(erro="Usuário não encontrado"), 404

    return jsonify(status="OK", mensagem="Usuário removido com sucesso"), 200

@usuario_bp.route("/login", methods=["OPTIONS"])
def login_options():
    return "", 200

