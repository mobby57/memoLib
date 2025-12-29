#!/usr/bin/env python3
"""
Migration automatique SQLite vers PostgreSQL Supabase
Suit le plan gratuit IA - Phase 1
"""

import os
import json
import sqlite3
import psycopg2
from datetime import datetime
import uuid

class SQLiteToPostgresMigrator:
    def __init__(self):
        self.sqlite_db = 'data/app.db'
        self.postgres_url = os.getenv('SUPABASE_DB_URL', 'postgresql://postgres:password@localhost:5432/postgres')
        
    def migrate_data(self):
        """Migration complète des données"""
        print("🔄 Début migration SQLite → PostgreSQL")
        
        # 1. Créer les tables PostgreSQL
        self.create_postgres_tables()
        
        # 2. Migrer les données
        if os.path.exists(self.sqlite_db):
            self.migrate_emails()
            self.migrate_templates() 
            self.migrate_contacts()
        else:
            print("⚠️ Base SQLite non trouvée, création tables vides")
        
        print("✅ Migration terminée")
    
    def create_postgres_tables(self):
        """Crée les tables PostgreSQL"""
        sql = """
        -- Extension UUID
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        
        -- Table users
        CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            email VARCHAR(255) UNIQUE NOT NULL,
            name VARCHAR(100) NOT NULL,
            company VARCHAR(100),
            plan VARCHAR(20) DEFAULT 'starter',
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
        
        -- Index users
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_users_plan ON users(plan);
        CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
        
        -- Table emails
        CREATE TABLE IF NOT EXISTS emails (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            to_email VARCHAR(255) NOT NULL,
            subject VARCHAR(500) NOT NULL,
            content TEXT NOT NULL,
            status VARCHAR(20) DEFAULT 'pending',
            provider VARCHAR(50) DEFAULT 'smtp',
            error_message TEXT,
            sent_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT NOW()
        );
        
        -- Index emails
        CREATE INDEX IF NOT EXISTS idx_emails_user_id ON emails(user_id);
        CREATE INDEX IF NOT EXISTS idx_emails_status ON emails(status);
        CREATE INDEX IF NOT EXISTS idx_emails_created ON emails(created_at);
        CREATE INDEX IF NOT EXISTS idx_emails_composite ON emails(user_id, status, created_at);
        
        -- Table templates
        CREATE TABLE IF NOT EXISTS templates (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            name VARCHAR(100) NOT NULL,
            subject VARCHAR(500) NOT NULL,
            content TEXT NOT NULL,
            variables JSONB,
            category VARCHAR(50),
            is_public BOOLEAN DEFAULT false,
            usage_count INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT NOW()
        );
        
        -- Index templates
        CREATE INDEX IF NOT EXISTS idx_templates_user_id ON templates(user_id);
        CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
        CREATE INDEX IF NOT EXISTS idx_templates_public ON templates(is_public);
        
        -- Table contacts
        CREATE TABLE IF NOT EXISTS contacts (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(255) NOT NULL,
            company VARCHAR(100),
            phone VARCHAR(20),
            tags JSONB,
            custom_fields JSONB,
            created_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(user_id, email)
        );
        
        -- Index contacts
        CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
        CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
        """
        
        try:
            conn = psycopg2.connect(self.postgres_url)
            cur = conn.cursor()
            cur.execute(sql)
            conn.commit()
            cur.close()
            conn.close()
            print("✅ Tables PostgreSQL créées")
        except Exception as e:
            print(f"❌ Erreur création tables: {e}")
    
    def migrate_emails(self):
        """Migre les emails depuis SQLite"""
        try:
            # Lire depuis SQLite (JSON)
            emails_file = 'data/emails.json'
            if os.path.exists(emails_file):
                with open(emails_file, 'r', encoding='utf-8') as f:
                    emails = json.load(f)
                
                # Créer utilisateur par défaut
                default_user_id = self.create_default_user()
                
                # Insérer dans PostgreSQL
                conn = psycopg2.connect(self.postgres_url)
                cur = conn.cursor()
                
                for email in emails:
                    cur.execute("""
                        INSERT INTO emails (user_id, to_email, subject, content, status, created_at)
                        VALUES (%s, %s, %s, %s, %s, %s)
                        ON CONFLICT DO NOTHING
                    """, (
                        default_user_id,
                        email.get('to', ''),
                        email.get('subject', ''),
                        email.get('content', ''),
                        email.get('status', 'sent'),
                        email.get('date', datetime.now().isoformat())
                    ))
                
                conn.commit()
                cur.close()
                conn.close()
                print(f"✅ {len(emails)} emails migrés")
            
        except Exception as e:
            print(f"❌ Erreur migration emails: {e}")
    
    def migrate_templates(self):
        """Migre les templates depuis SQLite"""
        try:
            templates_file = 'data/templates.json'
            if os.path.exists(templates_file):
                with open(templates_file, 'r', encoding='utf-8') as f:
                    templates = json.load(f)
                
                default_user_id = self.create_default_user()
                
                conn = psycopg2.connect(self.postgres_url)
                cur = conn.cursor()
                
                for template in templates:
                    # Extraire variables du contenu
                    import re
                    variables = list(set(re.findall(r'\{([^}]+)\}', template.get('content', ''))))
                    
                    cur.execute("""
                        INSERT INTO templates (user_id, name, subject, content, variables, category)
                        VALUES (%s, %s, %s, %s, %s, %s)
                        ON CONFLICT DO NOTHING
                    """, (
                        default_user_id,
                        template.get('name', ''),
                        template.get('subject', ''),
                        template.get('content', ''),
                        json.dumps(variables),
                        'general'
                    ))
                
                conn.commit()
                cur.close()
                conn.close()
                print(f"✅ {len(templates)} templates migrés")
                
        except Exception as e:
            print(f"❌ Erreur migration templates: {e}")
    
    def migrate_contacts(self):
        """Migre les contacts depuis SQLite"""
        try:
            contacts_file = 'data/contacts.json'
            if os.path.exists(contacts_file):
                with open(contacts_file, 'r', encoding='utf-8') as f:
                    contacts = json.load(f)
                
                default_user_id = self.create_default_user()
                
                conn = psycopg2.connect(self.postgres_url)
                cur = conn.cursor()
                
                for contact in contacts:
                    cur.execute("""
                        INSERT INTO contacts (user_id, name, email, company)
                        VALUES (%s, %s, %s, %s)
                        ON CONFLICT (user_id, email) DO NOTHING
                    """, (
                        default_user_id,
                        contact.get('name', ''),
                        contact.get('email', ''),
                        contact.get('company', '')
                    ))
                
                conn.commit()
                cur.close()
                conn.close()
                print(f"✅ {len(contacts)} contacts migrés")
                
        except Exception as e:
            print(f"❌ Erreur migration contacts: {e}")
    
    def create_default_user(self):
        """Crée un utilisateur par défaut"""
        try:
            conn = psycopg2.connect(self.postgres_url)
            cur = conn.cursor()
            
            # Vérifier si utilisateur existe
            cur.execute("SELECT id FROM users WHERE email = %s", ('admin@msconseils.fr',))
            result = cur.fetchone()
            
            if result:
                user_id = result[0]
            else:
                # Créer utilisateur
                user_id = str(uuid.uuid4())
                cur.execute("""
                    INSERT INTO users (id, email, name, company, plan)
                    VALUES (%s, %s, %s, %s, %s)
                """, (user_id, 'admin@msconseils.fr', 'MS CONSEILS', 'MS CONSEILS', 'enterprise'))
                conn.commit()
            
            cur.close()
            conn.close()
            return user_id
            
        except Exception as e:
            print(f"❌ Erreur création utilisateur: {e}")
            return str(uuid.uuid4())

def main():
    """Exécute la migration"""
    migrator = SQLiteToPostgresMigrator()
    migrator.migrate_data()

if __name__ == "__main__":
    main()