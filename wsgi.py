from app import app, db
from config import config
import os

# Configurar a aplicação baseada no ambiente
env = os.environ.get('FLASK_ENV', 'development')
app.config.from_object(config[env])

# Configurar diretório de uploads
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Criar tabelas se não existirem
with app.app_context():
    db.create_all()

if __name__ == "__main__":
    app.run() 