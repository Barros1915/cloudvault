#!/usr/bin/env python3
"""
Script de migração para adicionar funcionalidades de organização ao CloudVault
"""

import sqlite3
import os
from datetime import datetime

def migrate_database():
    """Executar migração do banco de dados"""
    
    # Caminho do banco de dados
    db_path = 'instance/cloud_storage.db'
    
    # Verificar se o banco existe
    if not os.path.exists(db_path):
        print("❌ Banco de dados não encontrado!")
        return False
    
    try:
        # Conectar ao banco
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("🔄 Iniciando migração do banco de dados...")
        
        # 1. Adicionar coluna shared_folder_id à tabela file se não existir
        try:
            cursor.execute("ALTER TABLE file ADD COLUMN shared_folder_id INTEGER REFERENCES shared_folder(id)")
            print("✅ Coluna shared_folder_id adicionada à tabela file")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print("ℹ️  Coluna shared_folder_id já existe na tabela file")
            else:
                raise e
        
        # 2. Criar tabela organization
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS organization (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                owner_id INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (owner_id) REFERENCES user (id)
            )
        """)
        print("✅ Tabela organization criada")
        
        # 3. Criar tabela team
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS team (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                organization_id INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (organization_id) REFERENCES organization (id)
            )
        """)
        print("✅ Tabela team criada")
        
        # 4. Criar tabela team_member
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS team_member (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                team_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                role VARCHAR(50) DEFAULT 'member',
                joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (team_id) REFERENCES team (id),
                FOREIGN KEY (user_id) REFERENCES user (id)
            )
        """)
        print("✅ Tabela team_member criada")
        
        # 5. Criar tabela project
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS project (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                organization_id INTEGER NOT NULL,
                created_by INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (organization_id) REFERENCES organization (id),
                FOREIGN KEY (created_by) REFERENCES user (id)
            )
        """)
        print("✅ Tabela project criada")
        
        # 6. Criar tabela shared_folder
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS shared_folder (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                organization_id INTEGER NOT NULL,
                created_by INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (organization_id) REFERENCES organization (id),
                FOREIGN KEY (created_by) REFERENCES user (id)
            )
        """)
        print("✅ Tabela shared_folder criada")
        
        # 7. Criar organização padrão se não existir
        cursor.execute("SELECT COUNT(*) FROM organization")
        org_count = cursor.fetchone()[0]
        
        if org_count == 0:
            # Buscar primeiro usuário para ser dono da organização padrão
            cursor.execute("SELECT id, username FROM user ORDER BY id LIMIT 1")
            user_result = cursor.fetchone()
            
            if user_result:
                user_id, username = user_result
                
                # Criar organização padrão
                cursor.execute("""
                    INSERT INTO organization (name, description, owner_id, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?)
                """, (
                    f"Organização de {username}",
                    "Organização padrão criada automaticamente",
                    user_id,
                    datetime.utcnow(),
                    datetime.utcnow()
                ))
                
                org_id = cursor.lastrowid
                print(f"✅ Organização padrão criada (ID: {org_id})")
                
                # Criar equipe padrão
                cursor.execute("""
                    INSERT INTO team (name, description, organization_id, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?)
                """, (
                    "Equipe Principal",
                    "Equipe padrão da organização",
                    org_id,
                    datetime.utcnow(),
                    datetime.utcnow()
                ))
                
                team_id = cursor.lastrowid
                print(f"✅ Equipe padrão criada (ID: {team_id})")
                
                # Adicionar usuário como membro da equipe
                cursor.execute("""
                    INSERT INTO team_member (team_id, user_id, role, joined_at)
                    VALUES (?, ?, ?, ?)
                """, (
                    team_id,
                    user_id,
                    'owner',
                    datetime.utcnow()
                ))
                
                print(f"✅ Usuário {username} adicionado como dono da equipe")
        
        # Commit das alterações
        conn.commit()
        print("✅ Migração concluída com sucesso!")
        
        # Mostrar estatísticas
        cursor.execute("SELECT COUNT(*) FROM organization")
        org_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM team")
        team_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM team_member")
        member_count = cursor.fetchone()[0]
        
        print(f"\n📊 Estatísticas:")
        print(f"   • Organizações: {org_count}")
        print(f"   • Equipes: {team_count}")
        print(f"   • Membros: {member_count}")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro durante a migração: {str(e)}")
        conn.rollback()
        return False
        
    finally:
        conn.close()

if __name__ == '__main__':
    print("🚀 CloudVault - Migração de Organizações")
    print("=" * 50)
    
    success = migrate_database()
    
    if success:
        print("\n🎉 Migração concluída! O sistema está pronto para usar organizações.")
        print("💡 Acesse /organizations para gerenciar suas organizações.")
    else:
        print("\n💥 Falha na migração. Verifique os erros acima.") 