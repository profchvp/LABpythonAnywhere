from flask import Blueprint, request, jsonify
from database import get_conn, now_iso

unidade_bp = Blueprint("unidades", __name__)

@unidade_bp.post("/")
def criar_unidade():
    data = request.get_json(force=True)
    required = ["codigoUnidade", "nomeUnidadeFatec", "denominacaoOficial", "nomeDiretor"]
    missing = [k for k in required if k not in data]

    if missing:
        return jsonify(erro=f"Campos obrigatórios ausentes: {', '.join(missing)}"), 400

    codigo = data["codigoUnidade"]
    nome = data["nomeUnidadeFatec"]
    denom = data["denominacaoOficial"]
    diretor = data["nomeDiretor"]

    with get_conn() as conn:
        cur = conn.execute("SELECT 1 FROM unidade WHERE codigoUnidade = ?", (codigo,))
        if cur.fetchone():
            return jsonify(erro="codigoUnidade já existe"), 409

        conn.execute("""
            INSERT INTO unidade
                (codigoUnidade, nomeFatecUnidade, fatecDenominacaoOficial, nomeDiretor, dataInclusao)
            VALUES (?, ?, ?, ?, ?)
        """, (codigo, nome, denom, diretor, now_iso()))

    return jsonify(status="OK", mensagem="Unidade cadastrada com sucesso"), 201


@unidade_bp.get("/<int:codigoUnidade>")
def obter_unidade(codigoUnidade):
    with get_conn() as conn:
        cur = conn.execute("SELECT * FROM unidade WHERE codigoUnidade = ?", (codigoUnidade,))
        row = cur.fetchone()

        if not row:
            return jsonify(erro="Unidade não encontrada"), 404

        return jsonify(status="OK", dados=dict(row)), 200


@unidade_bp.delete("/<int:codigoUnidade>")
def excluir_unidade(codigoUnidade):
    try:
        with get_conn() as conn:
            cur = conn.execute("DELETE FROM unidade WHERE codigoUnidade = ?", (codigoUnidade,))
            if cur.rowcount == 0:
                return jsonify(erro="Unidade não encontrada"), 404

    except:
        return jsonify(erro="Exclusão negada: existem usuários vinculados"), 409

    return jsonify(status="OK", mensagem="Unidade excluída com sucesso"), 200

@unidade_bp.route("/", methods=["OPTIONS"])
def unidade_options():
    return "", 200
