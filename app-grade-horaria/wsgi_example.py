
import sys
from pathlib import Path

# Caminho do projeto
project_home = str(Path('/home/profVerissimoFatec/app-grade-horaria').resolve())
if project_home not in sys.path:
    sys.path.insert(0, project_home)

# Importa o Flask app
from app import app as application
