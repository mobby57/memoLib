import sqlite3
import json
from datetime import datetime
import os

class Database:
    def __init__(self, db_path="data/securevault.db"):
        self.db_path = db_path
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        self.init_db()
    
    def init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            conn.executescript('''
                CREATE TABLE IF NOT EXISTS emails (
                    id INTEGER PRIMARY KEY,
                    recipient TEXT NOT NULL,
                    subject TEXT NOT NULL,
                    body TEXT NOT NULL,
                    status TEXT DEFAULT 'pending',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    sent_at TIMESTAMP,
                    error_message TEXT
                );
                
                CREATE TABLE IF NOT EXISTS templates (
                    id INTEGER PRIMARY KEY,
                    name TEXT NOT NULL,
                    subject TEXT,
                    body TEXT NOT NULL,
                    category TEXT DEFAULT 'general',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                
                CREATE TABLE IF NOT EXISTS ai_generations (
                    id INTEGER PRIMARY KEY,
                    context TEXT NOT NULL,
                    tone TEXT,
                    generated_subject TEXT,
                    generated_body TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                
                CREATE TABLE IF NOT EXISTS received_emails (
                    id TEXT PRIMARY KEY,
                    subject TEXT,
                    sender TEXT,
                    date TEXT,
                    body TEXT,
                    domain TEXT,
                    has_attachments BOOLEAN,
                    category TEXT,
                    priority TEXT,
                    folder TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                
                CREATE INDEX IF NOT EXISTS idx_emails_date ON received_emails(date);
                CREATE INDEX IF NOT EXISTS idx_emails_domain ON received_emails(domain);
                CREATE INDEX IF NOT EXISTS idx_emails_category ON received_emails(category);
                CREATE INDEX IF NOT EXISTS idx_emails_priority ON received_emails(priority);
                CREATE INDEX IF NOT EXISTS idx_emails_sender ON received_emails(sender);
                
                CREATE TABLE IF NOT EXISTS email_folders (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT UNIQUE,
                    auto_rules TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            ''')
    
    def save_email(self, recipient, subject, body, status='pending'):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO emails (recipient, subject, body, status)
                VALUES (?, ?, ?, ?)
            ''', (recipient, subject, body, status))
            return cursor.lastrowid
    
    def log_email(self, recipient, subject, body, status='sent'):
        """Alias pour save_email"""
        return self.save_email(recipient, subject, body, status)
    
    def update_email_status(self, email_id, status, error_message=None):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute('''
                UPDATE emails 
                SET status = ?, sent_at = CURRENT_TIMESTAMP, error_message = ?
                WHERE id = ?
            ''', (status, error_message, email_id))
    
    def get_email_history(self, limit=50):
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute('''
                SELECT * FROM emails 
                ORDER BY created_at DESC 
                LIMIT ?
            ''', (limit,))
            return [dict(row) for row in cursor.fetchall()]
    
    def save_template(self, name, subject, body, category='general'):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO templates (name, subject, body, category)
                VALUES (?, ?, ?, ?)
            ''', (name, subject, body, category))
            return cursor.lastrowid
    
    def get_templates(self):
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM templates ORDER BY name')
            return [dict(row) for row in cursor.fetchall()]
    
    def save_ai_generation(self, context, tone, subject, body):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO ai_generations (context, tone, generated_subject, generated_body)
                VALUES (?, ?, ?, ?)
            ''', (context, tone, subject, body))
            return cursor.lastrowid
    
    def get_email_stats(self, days=30):
        """Statistiques des emails envoyés"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT COUNT(*) FROM emails 
                WHERE created_at > datetime('now', '-{} days')
            '''.format(days))
            return cursor.fetchone()[0]
    
    def get_ai_stats(self, days=30):
        """Statistiques des générations IA"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT COUNT(*) FROM ai_generations 
                WHERE created_at > datetime('now', '-{} days')
            '''.format(days))
            return cursor.fetchone()[0]

# Fonction helper pour compatibilité
def get_db_connection(db_path="data/securevault.db"):
    """Retourne une connexion à la base de données"""
    return sqlite3.connect(db_path)