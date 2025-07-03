"""
Configurações do CloudVault
Sistema de Armazenamento em Nuvem
"""

import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente do arquivo .env
load_dotenv()

class Config:
    # Configurações básicas da aplicação
    APP_NAME = os.environ.get('APP_NAME', 'CloudVault')
    APP_VERSION = os.environ.get('APP_VERSION', '1.0.0')
    APP_DESCRIPTION = 'Seu cofre digital seguro na nuvem'
    
    # Configurações de segurança
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'sua_chave_secreta_aqui_mude_em_producao'
    
    # Configurações do banco de dados - sempre SQLite para simplicidade
    SQLALCHEMY_DATABASE_URI = 'sqlite:///cloud_storage.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Configurações de upload
    UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER', 'uploads')
    MAX_CONTENT_LENGTH = int(os.environ.get('MAX_CONTENT_LENGTH', 500 * 1024 * 1024))  # 500MB
    MAX_CONTENT_PATH = None
    ALLOWED_EXTENSIONS = {
        'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg',
        'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
        'mp3', 'wav', 'mp4', 'avi', 'mov',
        'zip', 'rar', '7z', 'py', 'js', 'html', 'css', 'json'
    }
    
    # Configurações de segurança
    SESSION_COOKIE_SECURE = False
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    
    # Configurações de email (para futuras funcionalidades)
    MAIL_SERVER = os.environ.get('MAIL_SERVER') or 'smtp.gmail.com'
    MAIL_PORT = int(os.environ.get('MAIL_PORT') or 587)
    MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS', 'true').lower() in ['true', 'on', '1']
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')
    
    # Configurações de tema
    DEFAULT_THEME = 'auto'  # auto, light, dark
    
    # Configurações de limpeza automática
    CLEANUP_OLD_FILES = True
    FILE_RETENTION_DAYS = 30
    
    # Configurações de backup
    AUTO_BACKUP = True
    BACKUP_INTERVAL_HOURS = 24
    
    FLASK_ENV = os.environ.get('FLASK_ENV', 'development')
    FLASK_DEBUG = os.environ.get('FLASK_DEBUG', 'True').lower() == 'true'

class DevelopmentConfig(Config):
    DEBUG = True
    FLASK_DEBUG = True
    TESTING = False

class ProductionConfig(Config):
    DEBUG = False
    FLASK_DEBUG = False
    TESTING = False
    SESSION_COOKIE_SECURE = True

class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    WTF_CSRF_ENABLED = False

# Configuração baseada no ambiente
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
} 