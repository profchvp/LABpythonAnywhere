from flask import Flask
from flask_cors import CORS
from flasgger import Swagger

from create_tables import create_tables
from routes.unidade_routes import unidade_bp
from routes.usuario_routes import usuario_bp
from routes.professor_routes import professor_bp

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)
swagger = Swagger(app, template_file='swagger/swagger.yaml')

# cria tabelas ao iniciar
create_tables()

# registra os blueprints
app.register_blueprint(unidade_bp, url_prefix="/unidades")
app.register_blueprint(usuario_bp, url_prefix="/usuarios")
app.register_blueprint(professor_bp, url_prefix="/professores")


@app.get("/health")
def health():
    return {"status": "ok"}

@app.route('/')
def index():
    return 'API funcionando com Swagger'

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
