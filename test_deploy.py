#!/usr/bin/env python3
"""
Script para testar a configuração de deploy
Execute este script antes de fazer deploy para verificar se tudo está correto
"""

import os
import sys
from dotenv import load_dotenv

def test_imports():
    """Testa se todas as dependências podem ser importadas"""
    print("🔍 Testando imports...")
    
    try:
        import flask
        print("✅ Flask")
    except ImportError as e:
        print(f"❌ Flask: {e}")
        return False
    
    try:
        import flask_sqlalchemy
        print("✅ Flask-SQLAlchemy")
    except ImportError as e:
        print(f"❌ Flask-SQLAlchemy: {e}")
        return False
    
    try:
        import flask_login
        print("✅ Flask-Login")
    except ImportError as e:
        print(f"❌ Flask-Login: {e}")
        return False
    
    try:
        import gunicorn
        print("✅ gunicorn")
    except ImportError as e:
        print(f"❌ gunicorn: {e}")
        return False
    
    return True

def test_config():
    """Testa se a configuração está correta"""
    print("\n🔍 Testando configuração...")
    
    try:
        from config import config
        print("✅ config.py carregado")
        
        # Testar configuração de desenvolvimento
        dev_config = config['development']
        print(f"✅ Configuração de desenvolvimento: {dev_config.SQLALCHEMY_DATABASE_URI}")
        
        # Testar configuração de produção
        prod_config = config['production']
        print(f"✅ Configuração de produção: {prod_config.SQLALCHEMY_DATABASE_URI}")
        
        return True
    except Exception as e:
        print(f"❌ Erro na configuração: {e}")
        return False

def test_app_creation():
    """Testa se a aplicação Flask pode ser criada"""
    print("\n🔍 Testando criação da aplicação...")
    
    try:
        from app import app, db
        print("✅ Aplicação Flask criada")
        print(f"✅ Configuração: {app.config['SQLALCHEMY_DATABASE_URI']}")
        print(f"✅ Upload folder: {app.config['UPLOAD_FOLDER']}")
        print(f"✅ Max content length: {app.config['MAX_CONTENT_LENGTH']}")
        
        return True
    except Exception as e:
        print(f"❌ Erro ao criar aplicação: {e}")
        return False

def test_database_connection():
    """Testa conexão com banco de dados"""
    print("\n🔍 Testando conexão com banco...")
    
    try:
        from app import app, db
        
        with app.app_context():
            # Testar conexão usando a sintaxe correta do SQLAlchemy
            with db.engine.connect() as conn:
                result = conn.execute(db.text("SELECT 1"))
                result.fetchone()
            print("✅ Conexão com banco OK")
            
            # Verificar se as tabelas existem
            with db.engine.connect() as conn:
                result = conn.execute(db.text("""
                    SELECT name FROM sqlite_master 
                    WHERE type='table' AND name NOT LIKE 'sqlite_%'
                """))
                tables = result.fetchall()
            
            expected_tables = [
                'user', 'file', 'file_share', 'organization', 
                'team', 'team_member', 'project', 'shared_folder'
            ]
            
            existing_tables = [table[0] for table in tables]
            print(f"✅ Tabelas encontradas: {existing_tables}")
            
            missing_tables = [table for table in expected_tables if table not in existing_tables]
            if missing_tables:
                print(f"⚠️  Tabelas faltando: {missing_tables}")
                print("💡 Execute: python migrate_organizations.py")
            else:
                print("✅ Todas as tabelas necessárias existem")
        
        return True
    except Exception as e:
        print(f"❌ Erro na conexão com banco: {e}")
        return False

def test_wsgi():
    """Testa se o arquivo WSGI está correto"""
    print("\n🔍 Testando WSGI...")
    
    try:
        import wsgi
        print("✅ wsgi.py carregado corretamente")
        return True
    except Exception as e:
        print(f"❌ Erro no wsgi.py: {e}")
        return False

def test_requirements():
    """Testa se requirements.txt existe e tem as dependências necessárias"""
    print("\n🔍 Testando requirements.txt...")
    
    if not os.path.exists('requirements.txt'):
        print("❌ requirements.txt não encontrado")
        return False
    
    with open('requirements.txt', 'r') as f:
        content = f.read()
    
    required_packages = [
        'Flask',
        'Flask-SQLAlchemy', 
        'Flask-Login',
        'python-dotenv',
        'gunicorn'
    ]
    
    missing_packages = []
    for package in required_packages:
        if package not in content:
            missing_packages.append(package)
    
    if missing_packages:
        print(f"❌ Pacotes faltando no requirements.txt: {missing_packages}")
        return False
    else:
        print("✅ requirements.txt OK")
        return True

def test_render_config():
    """Testa se render.yaml existe"""
    print("\n🔍 Testando render.yaml...")
    
    if not os.path.exists('render.yaml'):
        print("❌ render.yaml não encontrado")
        return False
    
    print("✅ render.yaml encontrado")
    return True

def main():
    """Executa todos os testes"""
    print("🚀 Teste de Configuração para Deploy")
    print("=" * 50)
    
    tests = [
        test_requirements,
        test_config,
        test_imports,
        test_app_creation,
        test_database_connection,
        test_wsgi,
        test_render_config
    ]
    
    results = []
    for test in tests:
        try:
            result = test()
            results.append(result)
        except Exception as e:
            print(f"❌ Erro no teste: {e}")
            results.append(False)
    
    print("\n" + "=" * 50)
    print("📊 RESULTADO DOS TESTES")
    print("=" * 50)
    
    passed = sum(results)
    total = len(results)
    
    if passed == total:
        print("🎉 TODOS OS TESTES PASSARAM!")
        print("✅ Seu projeto está pronto para deploy!")
        print("\n📋 Próximos passos:")
        print("1. Faça commit dos arquivos")
        print("2. Push para o GitHub")
        print("3. Configure no Render")
        print("4. Deploy!")
    else:
        print(f"⚠️  {passed}/{total} testes passaram")
        print("❌ Corrija os problemas antes do deploy")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 