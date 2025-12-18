from database import get_conn, now_iso

def create_tables():
    with get_conn() as conn:

        # -------------------- TABELA UNIDADE --------------------
        conn.execute("""
            CREATE TABLE IF NOT EXISTS unidade (
                codigoUnidade INTEGER PRIMARY KEY,
                nomeFatecUnidade TEXT NOT NULL,
                fatecDenominacaoOficial TEXT,
                nomeDiretor TEXT,
                dataInclusao TEXT NOT NULL
            );
        """)

        # -------------------- TABELA USUARIO --------------------
        conn.execute("""
            CREATE TABLE IF NOT EXISTS usuario (
                emailFatec TEXT PRIMARY KEY,
                numeroMatricula INTEGER NOT NULL,
                codigoUnidade INTEGER NOT NULL,
                nomeFuncionario TEXT NOT NULL,
                senhaLogin TEXT NOT NULL,
                indicadorAtivo INTEGER NOT NULL DEFAULT 1,
                dataInclusao TEXT NOT NULL,
                FOREIGN KEY (codigoUnidade)
                    REFERENCES unidade(codigoUnidade)
                    ON DELETE RESTRICT
                    ON UPDATE CASCADE
            );
        """)

        # -------------------- TABELA PROFESSOR --------------------
        conn.execute("""
            CREATE TABLE IF NOT EXISTS professor (
                matricula INTEGER PRIMARY KEY,
                nomeProfessor TEXT NOT NULL,
                statusSituacao INTEGER NOT NULL,
                regimeJuridico TEXT,
                cargaHoraria TEXT,
                horaAtividade INTEGER,
                HAE_O TEXT,
                HAE_C TEXT,
                obsManha TEXT,
                obsTarde TEXT,
                obsNoite TEXT,
                dataInclusao TEXT NOT NULL
            );
        """)


if __name__ == "__main__":
    create_tables()
    print("Tabelas criadas.")
