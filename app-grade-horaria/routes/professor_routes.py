
from flask import Blueprint, request, jsonify, make_response
from database import get_conn, now_iso

# Blueprint
professor_bp = Blueprint("professores", __name__)

# ===============================================================
# CORREÇÃO DE CORS PARA EVITAR REDIRECT EM PRE-FLIGHT
# ===============================================================
def build_cors_response(status=200, body=""):
    """Constrói resposta OPTIONS com headers CORS."""
    response = make_response(body, status)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "POST, GET, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    return response

# OPTIONS para /professores (SEM barra final)
@professor_bp.route("", methods=["OPTIONS"])
def options_professores_sem_barra():
    return build_cors_response()

# OPTIONS para /professores/ (COM barra final)
@professor_bp.route("/", methods=["OPTIONS"])
def options_professores_com_barra():
    return build_cors_response()


# ===============================================================
# NOVA ROTA: LISTAR PROFESSORES (apenas matricula, nomeProfessor, status)
# ===============================================================
@professor_bp.get("/")
def listar_professores():
    """
    Lista professores, retornando somente:
      - matricula
      - nomeProfessor
      - status  (mapeado de statusSituacao)
    Query params opcionais:
      - page (int >=1)         default=1
      - page_size (int 1..200) default=50
      - order_by (matricula|nomeProfessor|status) default=nomeProfessor
      - order_dir (asc|desc)   default=asc
    """
    # Sanitização básica de paginação e ordenação
    try:
        page = int(request.args.get("page", 1))
        page_size = int(request.args.get("page_size", 50))
        if page < 1:
            page = 1
        if page_size < 1:
            page_size = 50
        if page_size > 200:
            page_size = 200
    except ValueError:
        return jsonify(erro="Parâmetros de paginação inválidos"), 400

    order_by_map = {
        "matricula": "matricula",
        "nomeProfessor": "nomeProfessor",
        "status": "statusSituacao",
    }
    order_by_req = request.args.get("order_by", "nomeProfessor")
    order_by_col = order_by_map.get(order_by_req, "nomeProfessor")

    order_dir_req = request.args.get("order_dir", "asc").lower()
    order_dir_sql = "ASC" if order_dir_req == "asc" else "DESC"

    offset = (page - 1) * page_size

    with get_conn() as conn:
        # Consulta total para meta de paginação (opcional)
        total = conn.execute("SELECT COUNT(1) AS total FROM professor").fetchone()["total"]

        # Consulta das linhas solicitadas
        cur = conn.execute(
            f"""
            SELECT
                matricula,
                nomeProfessor,
                statusSituacao
            FROM professor
            ORDER BY {order_by_col} {order_dir_sql}
            LIMIT ? OFFSET ?
            """,
            (page_size, offset),
        )
        rows = cur.fetchall()

    # Monta resposta no formato requerido
    lista = [
        {
            "matricula": row["matricula"],
            "nomeProfessor": row["nomeProfessor"],
            "status": row["statusSituacao"],  # mapeia para 'status'
        }
        for row in rows
    ]

    meta = {
        "page": page,
        "page_size": page_size,
        "total": total,
        "pages": (total // page_size) + (1 if total % page_size else 0),
        "order_by": order_by_req,
        "order_dir": order_dir_req,
    }

    return jsonify(status="OK", dados=lista, meta=meta), 200


# ===============================================================
# ROTAS PRINCIPAIS EXISTENTES
# ===============================================================
@professor_bp.post("/")
def criar_professor():
    """Cria um novo professor."""
    data = request.get_json(force=True)
    required = [
        "matricula", "nomeProfessor", "statusSituacao", "regimeJuridico",
        "cargaHoraria", "horaAtividade", "HAE_O", "HAE_C",
        "obsManha", "obsTarde", "obsNoite"
    ]
    missing = [k for k in required if k not in data]
    if missing:
        return jsonify(erro=f"Campos ausentes: {', '.join(missing)}"), 400

    with get_conn() as conn:
        # Verifica duplicidade de matrícula
        cur = conn.execute(
            "SELECT 1 FROM professor WHERE matricula = ?",
            (data["matricula"],)
        )
        if cur.fetchone():
            return jsonify(erro="Matrícula já cadastrada"), 409

        # Inserção
        conn.execute("""
            INSERT INTO professor (
                matricula, nomeProfessor, statusSituacao, regimeJuridico,
                cargaHoraria, horaAtividade, HAE_O, HAE_C,
                obsManha, obsTarde, obsNoite, dataInclusao
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            data["matricula"], data["nomeProfessor"], data["statusSituacao"],
            data["regimeJuridico"], data["cargaHoraria"], data["horaAtividade"],
            data["HAE_O"], data["HAE_C"], data["obsManha"], data["obsTarde"],
            data["obsNoite"], now_iso()
        ))
    return jsonify(status="OK", mensagem="Professor cadastrado"), 201


@professor_bp.get("/<int:matricula>")
def consultar_professor(matricula):
    """Consulta detalhes de um professor."""
    with get_conn() as conn:
        cur = conn.execute(
            "SELECT * FROM professor WHERE matricula = ?",
            (matricula,)
        )
        row = cur.fetchone()
    if not row:
        return jsonify(erro="Professor não encontrado"), 404
    return jsonify(status="OK", dados=dict(row)), 200


@professor_bp.delete("/<int:matricula>")
def excluir_professor(matricula):
    """Exclui professor pelo número de matrícula."""
    with get_conn() as conn:
        cur = conn.execute(
            "DELETE FROM professor WHERE matricula = ?",
            (matricula,)
        )
        if cur.rowcount == 0:
            return jsonify(erro="Professor não encontrado"), 404
    return jsonify(status="OK", mensagem="Professor excluído"), 200
'''
================================================
Tratamento para inclusao EM MASSA de professores
================================================
'''
@professor_bp.post("/importacao-massa")
def importar_professores_em_massa():
    professores = request.get_json(force=True)

    if not isinstance(professores, list):
        return jsonify(erro="O corpo da requisição deve ser uma lista de professores"), 400

    resultados = []

    campos_obrigatorios = [
        "matricula", "nomeProfessor", "statusSituacao", "regimeJuridico",
        "cargaHoraria", "horaAtividade", "HAE_O", "HAE_C",
        "obsManha", "obsTarde", "obsNoite"
    ]

    with get_conn() as conn:
        for prof in professores:
            matricula = prof.get("matricula")
            nome = prof.get("nomeProfessor")

            try:
                # Validação de campos
                faltantes = [c for c in campos_obrigatorios if c not in prof]
                if faltantes:
                    raise ValueError(f"Campos ausentes: {', '.join(faltantes)}")

                # Verifica duplicidade
                cur = conn.execute(
                    "SELECT 1 FROM professor WHERE matricula = ?",
                    (matricula,)
                )
                if cur.fetchone():
                    raise ValueError("Matrícula já cadastrada")

                # Inserção
                conn.execute("""
                    INSERT INTO professor (
                        matricula, nomeProfessor, statusSituacao, regimeJuridico,
                        cargaHoraria, horaAtividade, HAE_O, HAE_C,
                        obsManha, obsTarde, obsNoite, dataInclusao
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    prof["matricula"], prof["nomeProfessor"], prof["statusSituacao"],
                    prof["regimeJuridico"], prof["cargaHoraria"], prof["horaAtividade"],
                    prof["HAE_O"], prof["HAE_C"], prof["obsManha"], prof["obsTarde"],
                    prof["obsNoite"], now_iso()
                ))

                resultados.append({
                    "matricula": matricula,
                    "nome": nome,
                    "sucesso": True,
                    "mensagem": "Professor incluído com sucesso"
                })

            except Exception as e:
                resultados.append({
                    "matricula": matricula,
                    "nome": nome,
                    "sucesso": False,
                    "mensagem": str(e)
                })

    return jsonify(resultados), 200

