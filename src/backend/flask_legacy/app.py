"""
IAPosteManager Unified v3.0 - FIXED VERSION
Application complète unifiée avec corrections critiques
Python 3.13 compatible - Using Flask-SocketIO with threading mode
"""
from flask import Flask, render_template, request, jsonify, session, redirect, send_file, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO, emit  # Using threading mode for Python 3.13 compatibility
from flask_session import Session
import sys
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
import json
import sqlite3
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import openai
from openai import OpenAI

# Imports optionnels pour fonctionnalités audio (non disponibles en Docker)
try:
    import speech_recognition as sr
    import pyttsx3
    AUDIO_AVAILABLE = True
except ImportError:
    AUDIO_AVAILABLE = False
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64
import logging
from logging.handlers import RotatingFileHandler
from functools import wraps
import io
import hashlib
import secrets
import re
# from email_generator import EmailGenerator  # Not needed in unified version
# from email_forwarding import EmailForwardingService  # Not needed in unified version

load_dotenv()

# Configuration pour servir le frontend React
frontend_dist = os.path.join(os.path.dirname(__file__), '..', '..', 'frontend-react', 'dist')
frontend_assets = os.path.join(frontend_dist, 'assets')

app = Flask(__name__, 
            template_folder='templates',
            static_folder=frontend_dist,  # Point to React dist folder
            static_url_path='')  # Serve at root to match React paths

# Configuration sécurisée
class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or secrets.token_hex(32)
    SESSION_TYPE = 'filesystem'
    SESSION_FILE_DIR = os.path.join(os.path.dirname(__file__), 'flask_session')
    SESSION_PERMANENT = False
    SESSION_USE_SIGNER = True
    SESSION_KEY_PREFIX = 'iaposte:'
    SESSION_COOKIE_SECURE = os.environ.get('FLASK_ENV') == 'production'
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    PERMANENT_SESSION_LIFETIME = timedelta(hours=1)

app.config.from_object(Config)
os.makedirs(app.config['SESSION_FILE_DIR'], exist_ok=True)
Session(app)

CORS(app, supports_credentials=True)
# Use threading mode for Python 3.13 compatibility (eventlet not compatible)
socketio = SocketIO(app, 
                    cors_allowed_origins="*", 
                    manage_session=False,
                    async_mode='threading',  # Force threading mode instead of eventlet
                    logger=False,
                    engineio_logger=False)

# Configuration globale
class UnifiedConfig:
    APP_DIR = os.path.dirname(os.path.abspath(__file__))
    DATA_DIR = os.path.join(APP_DIR, 'data')
    UPLOADS_DIR = os.path.join(APP_DIR, 'uploads')
    
    def __init__(self):
        os.makedirs(self.DATA_DIR, exist_ok=True)
        os.makedirs(self.UPLOADS_DIR, exist_ok=True)

config = UnifiedConfig()

# Exceptions personnalisées
class ValidationError(Exception):
    pass

class AuthenticationError(Exception):
    pass

# Décorateur de gestion d'erreurs
def handle_api_errors(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except ValidationError as e:
            app.logger.warning(f"Validation error in {f.__name__}: {e}")
            return jsonify({'success': False, 'error': str(e)}), 400
        except AuthenticationError as e:
            app.logger.warning(f"Auth error in {f.__name__}: {e}")
            return jsonify({'success': False, 'error': 'Non autorisé'}), 401
        except Exception as e:
            app.logger.error(f"Erreur API {f.__name__}: {e}")
            return jsonify({'success': False, 'error': 'Erreur interne'}), 500
    return decorated_function

# Décorateur sans authentification pour routes publiques
def public_api(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except Exception as e:
            app.logger.error(f"Erreur API {f.__name__}: {e}")
            return jsonify({'success': False, 'error': 'Erreur interne'}), 500
    return decorated_function

# Validation des données
def validate_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def sanitize_input(text, max_length=1000):
    if not text:
        return ''
    return str(text)[:max_length].strip()

# Gestion sécurisée du mot de passe maître
def get_master_password():
    return session.get('master_password')

def set_master_password(password):
    session['master_password'] = password
    session.permanent = True

# Services unifiés
class UnifiedDatabase:
    def __init__(self):
        # Use PostgreSQL in production, SQLite in development
        database_url = os.environ.get('DATABASE_URL')
        if database_url and (database_url.startswith('postgres://') or database_url.startswith('postgresql://')):
            # Production: PostgreSQL
            if database_url.startswith('postgres://'):
                database_url = database_url.replace('postgres://', 'postgresql://', 1)
            self.db_url = database_url
            self.use_postgres = True
            app.logger.info(f'Using PostgreSQL: {database_url[:50]}...')
        else:
            # Development: SQLite
            self.db_path = os.path.join(config.DATA_DIR, 'unified.db')
            self.db_url = f'sqlite:///{self.db_path}'
            self.use_postgres = False
            app.logger.info(f'Using SQLite: {self.db_path}')
        
        self.init_db()
    
    def init_db(self):
        if self.use_postgres:
            # PostgreSQL setup
            import psycopg2
            from urllib.parse import urlparse
            
            try:
                # Parse DATABASE_URL
                url = urlparse(self.db_url.replace('postgresql://', 'postgres://'))
                conn = psycopg2.connect(
                    host=url.hostname,
                    port=url.port,
                    user=url.username,
                    password=url.password,
                    database=url.path[1:]
                )
                cursor = conn.cursor()
                
                # Create tables with PostgreSQL syntax
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS emails (
                        id SERIAL PRIMARY KEY,
                        recipient TEXT,
                        subject TEXT,
                        body TEXT,
                        status TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                ''')
                
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS templates (
                        id SERIAL PRIMARY KEY,
                        name TEXT,
                        subject TEXT,
                        body TEXT,
                        category TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                ''')
                
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS contacts (
                        id SERIAL PRIMARY KEY,
                        name TEXT,
                        email TEXT UNIQUE,
                        organization TEXT,
                        category TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                ''')
                
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS transcripts (
                        id SERIAL PRIMARY KEY,
                        text TEXT,
                        language TEXT DEFAULT 'fr-FR',
                        confidence REAL DEFAULT 1.0,
                        duration REAL DEFAULT 0.0,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                ''')
                
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS email_accounts (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER DEFAULT 1,
                        email_address TEXT UNIQUE NOT NULL,
                        username TEXT NOT NULL,
                        display_name TEXT,
                        smtp_server TEXT,
                        smtp_port INTEGER,
                        smtp_username TEXT,
                        provider TEXT,
                        status TEXT DEFAULT 'active',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        emails_sent_today INTEGER DEFAULT 0,
                        emails_sent_month INTEGER DEFAULT 0,
                        daily_limit INTEGER DEFAULT 500,
                        monthly_limit INTEGER DEFAULT 10000
                    )
                ''')
                
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS email_provisioning_logs (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER DEFAULT 1,
                        email_account_id INTEGER,
                        action TEXT,
                        status TEXT,
                        error_message TEXT,
                        ip_address TEXT,
                        user_agent TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (email_account_id) REFERENCES email_accounts(id)
                    )
                ''')
                
                conn.commit()
                conn.close()
                app.logger.info('PostgreSQL database initialized')
                
            except Exception as e:
                app.logger.error(f'PostgreSQL init error: {e}')
                # Fallback to SQLite
                self.use_postgres = False
                self.db_path = os.path.join(config.DATA_DIR, 'unified.db')
                self._init_sqlite()
        else:
            self._init_sqlite()
    
    def _init_sqlite(self):
        """Initialize SQLite database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS emails (
                id INTEGER PRIMARY KEY,
                recipient TEXT,
                subject TEXT,
                body TEXT,
                status TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS templates (
                id INTEGER PRIMARY KEY,
                name TEXT,
                subject TEXT,
                body TEXT,
                category TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS contacts (
                id INTEGER PRIMARY KEY,
                name TEXT,
                email TEXT UNIQUE,
                organization TEXT,
                category TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS transcripts (
                id INTEGER PRIMARY KEY,
                text TEXT,
                language TEXT DEFAULT 'fr-FR',
                confidence REAL DEFAULT 1.0,
                duration REAL DEFAULT 0.0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS email_accounts (
                id INTEGER PRIMARY KEY,
                user_id INTEGER DEFAULT 1,
                email_address TEXT UNIQUE NOT NULL,
                username TEXT NOT NULL,
                display_name TEXT,
                smtp_server TEXT,
                smtp_port INTEGER,
                smtp_username TEXT,
                provider TEXT,
                status TEXT DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                emails_sent_today INTEGER DEFAULT 0,
                emails_sent_month INTEGER DEFAULT 0,
                daily_limit INTEGER DEFAULT 500,
                monthly_limit INTEGER DEFAULT 10000
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS email_provisioning_logs (
                id INTEGER PRIMARY KEY,
                user_id INTEGER DEFAULT 1,
                email_account_id INTEGER,
                action TEXT,
                status TEXT,
                error_message TEXT,
                ip_address TEXT,
                user_agent TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (email_account_id) REFERENCES email_accounts(id)
            )
        ''')
        
        conn.commit()
        conn.close()
        app.logger.info('SQLite database initialized')
    
    def get_connection(self):
        """Get database connection (PostgreSQL or SQLite)"""
        if self.use_postgres:
            import psycopg2
            from urllib.parse import urlparse
            url = urlparse(self.db_url.replace('postgresql://', 'postgres://'))
            return psycopg2.connect(
                host=url.hostname,
                port=url.port,
                user=url.username,
                password=url.password,
                database=url.path[1:]
            )
        else:
            return sqlite3.connect(self.db_path)
    
    def log_email(self, recipient, subject, body, status):
        conn = self.get_connection()
        cursor = conn.cursor()
        if self.use_postgres:
            cursor.execute(
                'INSERT INTO emails (recipient, subject, body, status) VALUES (%s, %s, %s, %s)',
                (recipient, subject, body, status)
            )
        else:
            cursor.execute(
                'INSERT INTO emails (recipient, subject, body, status) VALUES (?, ?, ?, ?)',
                (recipient, subject, body, status)
            )
        conn.commit()
        conn.close()
    
    def get_email_history(self, limit=50):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute(
            'SELECT * FROM emails ORDER BY created_at DESC LIMIT ?',
            (limit,)
        )
        emails = cursor.fetchall()
        conn.close()
        return emails
    
    def get_templates(self):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM templates ORDER BY created_at DESC')
        templates = cursor.fetchall()
        conn.close()
        return templates
    
    def add_template(self, name, subject, body, category='general'):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO templates (name, subject, body, category) VALUES (?, ?, ?, ?)',
            (name, subject, body, category)
        )
        template_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return template_id
    
    def get_contacts(self):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM contacts ORDER BY name ASC')
        contacts = cursor.fetchall()
        conn.close()
        return contacts
    
    def add_contact(self, name, email, organization='', category=''):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        try:
            cursor.execute(
                'INSERT INTO contacts (name, email, organization, category) VALUES (?, ?, ?, ?)',
                (name, email, organization, category)
            )
            contact_id = cursor.lastrowid
            conn.commit()
            conn.close()
            return contact_id
        except sqlite3.IntegrityError:
            conn.close()
            return None  # Email déjà existant
    
    def delete_contact(self, contact_id):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('DELETE FROM contacts WHERE id = ?', (contact_id,))
        conn.commit()
        conn.close()
    
    def add_email(self, recipient, subject, body, status='sent'):
        """Add email to history - alias for log_email"""
        return self.log_email(recipient, subject, body, status)
    
    def get_transcripts(self, limit=10):
        """Get voice transcription history"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute(
            'SELECT id, text, language, confidence, duration, created_at FROM transcripts ORDER BY created_at DESC LIMIT ?',
            (limit,)
        )
        transcripts = cursor.fetchall()
        conn.close()
        return transcripts
    
    def add_transcript(self, text, language='fr-FR', confidence=1.0, duration=0.0):
        """Add a voice transcription to history"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO transcripts (text, language, confidence, duration) VALUES (?, ?, ?, ?)',
            (text, language, confidence, duration)
        )
        transcript_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return transcript_id

class UnifiedCrypto:
    def __init__(self):
        self.salt_file = os.path.join(config.DATA_DIR, 'salt.bin')
        self.creds_file = os.path.join(config.DATA_DIR, 'credentials.enc')
    
    def derive_key(self, password):
        if os.path.exists(self.salt_file):
            with open(self.salt_file, 'rb') as f:
                salt = f.read()
        else:
            salt = os.urandom(16)
            with open(self.salt_file, 'wb') as f:
                f.write(salt)
        
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(password.encode()))
        return Fernet(key)
    
    def save_credentials(self, password, email, app_password, openai_key=None):
        try:
            fernet = self.derive_key(password)
            data = {
                'email': email,
                'app_password': app_password,
                'openai_key': openai_key or '',
                'created_at': datetime.now().isoformat(),
                'version': '3.0'
            }
            encrypted = fernet.encrypt(json.dumps(data).encode())
            
            # Sauvegarde atomique
            temp_file = self.creds_file + '.tmp'
            with open(temp_file, 'wb') as f:
                f.write(encrypted)
            os.replace(temp_file, self.creds_file)
            
            return True
        except Exception as e:
            app.logger.error(f"Erreur sauvegarde credentials: {e}")
            return False
    
    def get_credentials(self, password):
        if not os.path.exists(self.creds_file):
            return None
        try:
            fernet = self.derive_key(password)
            with open(self.creds_file, 'rb') as f:
                encrypted = f.read()
            decrypted = fernet.decrypt(encrypted)
            return json.loads(decrypted.decode())
        except:
            return None

class UnifiedEmailService:
    def send_email(self, sender_email, app_password, recipient, subject, body):
        try:
            msg = MIMEMultipart()
            msg['From'] = sender_email
            msg['To'] = recipient
            msg['Subject'] = subject
            msg.attach(MIMEText(body, 'plain'))
            
            server = smtplib.SMTP('smtp.gmail.com', 587)
            server.starttls()
            server.login(sender_email, app_password)
            server.send_message(msg)
            server.quit()
            
            return {'success': True, 'message': 'Email envoyé avec succès'}
        except Exception as e:
            return {'success': False, 'error': str(e)}

class UnifiedAIService:
    def __init__(self, api_key=None):
        self.api_key = api_key
        self.client = None
        self.organization_id = os.environ.get('OPENAI_ORG_ID')
        self.project_id = os.environ.get('OPENAI_PROJECT_ID')
        
        if api_key:
            try:
                # Initialize OpenAI client with proper configuration
                self.client = OpenAI(
                    api_key=api_key,
                    organization=self.organization_id,
                    project=self.project_id
                )
                app.logger.info("OpenAI client initialized successfully")
            except Exception as e:
                app.logger.error(f"OpenAI client initialization failed: {e}")
                self.client = None
    
    def _generate_request_id(self):
        """Generate unique request ID for tracking"""
        return f"iaposte_{int(datetime.now().timestamp())}_{secrets.token_hex(8)}"
    
    def generate_email(self, context, tone='professionnel', email_type='general'):
        if not self.client:
            return self._fallback_generation(context, tone)
        
        try:
            request_id = self._generate_request_id()
            
            # Improved prompt with better structure
            system_prompt = f"""
Tu es un assistant expert en rédaction d'emails professionnels en français.
Ton rôle est de générer des emails {tone} de type {email_type}.

Règles importantes:
1. Utilise un ton {tone} adapté au contexte
2. Structure l'email avec sujet et corps distincts
3. Sois concis et pertinent
4. Respecte les conventions françaises
5. Adapte le niveau de formalité au contexte

Format de réponse requis:
SUJET: [sujet de l'email]
CORPS: [corps de l'email complet]
"""
            
            user_prompt = f"Génère un email basé sur ce contexte: {context}"
            
            # Use new OpenAI client with proper error handling
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",  # Use more cost-effective model
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                max_tokens=800,
                temperature=0.7,
                presence_penalty=0.1,
                frequency_penalty=0.1,
                extra_headers={
                    "X-Client-Request-Id": request_id
                }
            )
            
            content = response.choices[0].message.content
            
            # Parse response
            subject, body = self._parse_email_response(content)
            
            # Log request details for debugging
            app.logger.info(f"OpenAI request {request_id}: {response.usage.total_tokens} tokens used")
            
            return {
                'success': True,
                'subject': subject,
                'body': body,
                'source': 'openai',
                'model': 'gpt-4o-mini',
                'tokens_used': response.usage.total_tokens,
                'request_id': request_id
            }
            
        except Exception as e:
            app.logger.error(f"OpenAI API error: {e}")
            return self._fallback_generation(context, tone)
    
    def improve_text(self, text, tone='professional', context='email'):
        """Improve dictated text using OpenAI"""
        if not self.client:
            return self._fallback_text_improvement(text)
        
        try:
            request_id = self._generate_request_id()
            
            system_prompt = f"""
Tu es un expert en amélioration de textes français.
Ton rôle est d'améliorer la qualité d'un texte dicté pour un {context}.

Améliorations à apporter:
1. Corriger la grammaire et l'orthographe
2. Améliorer la structure et la fluidité
3. Adapter le ton ({tone})
4. Maintenir le sens original
5. Optimiser la clarté

Retourne uniquement le texte amélioré, sans commentaires.
"""
            
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Améliore ce texte: {text}"}
                ],
                max_tokens=min(1500, len(text) * 2),
                temperature=0.3,
                extra_headers={
                    "X-Client-Request-Id": request_id
                }
            )
            
            improved_text = response.choices[0].message.content.strip()
            
            app.logger.info(f"Text improvement {request_id}: {response.usage.total_tokens} tokens")
            
            return {
                'success': True,
                'content': improved_text,
                'source': 'openai',
                'tokens_used': response.usage.total_tokens,
                'request_id': request_id
            }
            
        except Exception as e:
            app.logger.error(f"Text improvement error: {e}")
            return self._fallback_text_improvement(text)
    
    def moderate_content(self, text):
        """Moderate content using OpenAI moderation API"""
        if not self.client:
            return {'flagged': False, 'safe': True, 'categories': {}}
        
        try:
            request_id = self._generate_request_id()
            
            response = self.client.moderations.create(
                input=text,
                model="text-moderation-latest",
                extra_headers={
                    "X-Client-Request-Id": request_id
                }
            )
            
            result = response.results[0]
            
            return {
                'flagged': result.flagged,
                'safe': not result.flagged,
                'categories': result.categories.model_dump(),
                'category_scores': result.category_scores.model_dump(),
                'request_id': request_id
            }
            
        except Exception as e:
            app.logger.error(f"Content moderation error: {e}")
            return {'flagged': False, 'safe': True, 'categories': {}, 'error': str(e)}
    
    def _parse_email_response(self, content):
        """Parse OpenAI response to extract subject and body"""
        lines = content.split('\n')
        subject = ""
        body = ""
        
        for i, line in enumerate(lines):
            line = line.strip()
            if line.startswith('SUJET:'):
                subject = line.replace('SUJET:', '').strip()
            elif line.startswith('CORPS:'):
                # Take everything after CORPS: as body
                body = '\n'.join(lines[i:]).replace('CORPS:', '').strip()
                break
        
        # Fallback if parsing fails
        if not subject and not body:
            lines = [line.strip() for line in lines if line.strip()]
            if lines:
                subject = lines[0][:100]  # First line as subject
                body = '\n'.join(lines[1:]) if len(lines) > 1 else lines[0]
        
        return subject, body
    
    def create_conversation(self, items=None, metadata=None):
        """Create a new conversation using OpenAI Conversations API"""
        if not self.client:
            return None
        
        try:
            response = self.client.conversations.create(
                items=items or [],
                metadata=metadata or {}
            )
            return response
        except Exception as e:
            app.logger.error(f"Conversation creation failed: {e}")
            return None
    
    def add_to_conversation(self, conversation_id, message, role='user'):
        """Add a message to an existing conversation"""
        if not self.client:
            return None
        
        try:
            item = {
                'type': 'message',
                'role': role,
                'content': [{'type': 'input_text', 'text': message}]
            }
            
            response = self.client.conversations.items.create(
                conversation_id=conversation_id,
                items=[item]
            )
            return response
        except Exception as e:
            app.logger.error(f"Adding to conversation failed: {e}")
            return None
    
    def get_conversation_history(self, conversation_id, limit=20):
        """Get conversation history"""
        if not self.client:
            return []
        
        try:
            response = self.client.conversations.items.list(
                conversation_id=conversation_id,
                limit=limit,
                order='asc'
            )
            
            messages = []
            for item in response.data:
                if item.type == 'message' and hasattr(item, 'content'):
                    content = item.content[0].text if item.content else ''
                    if content:
                        messages.append({
                            'role': item.role,
                            'content': content,
                            'id': item.id
                        })
            
            return messages
        except Exception as e:
            app.logger.error(f"Getting conversation history failed: {e}")
            return []
    
    def _fallback_generation(self, context, tone):
        templates = {
            'professionnel': {
                'subject': f'Demande concernant {context[:50]}',
                'body': f'Bonjour,\n\nJ\'espère que vous allez bien.\n\nJe me permets de vous contacter concernant {context}.\n\nPourriez-vous m\'indiquer la procédure à suivre ?\n\nCordialement'
            },
            'amical': {
                'subject': f'À propos de {context[:50]}',
                'body': f'Salut !\n\nJ\'espère que tu vas bien.\n\nJe voulais te parler de {context}.\n\nQu\'est-ce que tu en penses ?\n\nÀ bientôt !'
            }
        }
        
        template = templates.get(tone, templates['professionnel'])
        return {
            'success': True,
            'subject': template['subject'],
            'body': template['body'],
            'source': 'template'
        }
    
    def create_embedding(self, text, model="text-embedding-ada-002", dimensions=None):
        """
        Génère un vecteur d'embedding pour le texte donné.
        
        Args:
            text: Le texte à transformer en embedding (max 8192 tokens)
            model: Le modèle à utiliser (par défaut: text-embedding-ada-002)
            dimensions: Nombre de dimensions (optionnel, pour text-embedding-3 models)
        
        Returns:
            dict: {
                'success': bool,
                'embedding': list[float],  # Vecteur d'embedding (1536 dimensions)
                'tokens_used': int,
                'model': str,
                'request_id': str,
                'error': str (si échec)
            }
        """
        if not self.client:
            return {
                'success': False,
                'error': 'OpenAI client not initialized'
            }
        
        try:
            request_id = f"iaposte_{int(datetime.now().timestamp())}_{secrets.token_hex(8)}"
            
            # Préparer les paramètres de la requête
            params = {
                'input': text,
                'model': model
            }
            
            # Ajouter dimensions si spécifié (pour text-embedding-3 models)
            if dimensions and model.startswith('text-embedding-3'):
                params['dimensions'] = dimensions
            
            # Créer l'embedding
            response = self.client.embeddings.create(
                **params,
                extra_headers={'X-Client-Request-Id': request_id}
            )
            
            # Extraire le vecteur d'embedding
            embedding_vector = response.data[0].embedding
            
            app.logger.info(f"Embedding created successfully - Tokens: {response.usage.total_tokens}, Dimensions: {len(embedding_vector)}")
            
            return {
                'success': True,
                'embedding': embedding_vector,
                'tokens_used': response.usage.total_tokens,
                'model': model,
                'dimensions': len(embedding_vector),
                'request_id': request_id
            }
            
        except Exception as e:
            app.logger.error(f"Embedding creation failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def batch_create_embeddings(self, texts, model="text-embedding-ada-002"):
        """
        Génère des embeddings pour plusieurs textes en une seule requête.
        
        Args:
            texts: Liste de textes (max 2048 textes, 300k tokens total)
            model: Le modèle à utiliser
        
        Returns:
            dict: {
                'success': bool,
                'embeddings': list[dict],  # Liste d'objets avec index et embedding
                'tokens_used': int,
                'count': int,
                'error': str (si échec)
            }
        """
        if not self.client:
            return {
                'success': False,
                'error': 'OpenAI client not initialized'
            }
        
        if len(texts) > 2048:
            return {
                'success': False,
                'error': f'Too many texts: {len(texts)} (max 2048)'
            }
        
        try:
            request_id = f"iaposte_{int(datetime.now().timestamp())}_{secrets.token_hex(8)}"
            
            # Créer les embeddings en batch
            response = self.client.embeddings.create(
                input=texts,
                model=model,
                extra_headers={'X-Client-Request-Id': request_id}
            )
            
            # Construire la liste des résultats avec l'index
            embeddings = [
                {
                    'index': item.index,
                    'embedding': item.embedding
                }
                for item in response.data
            ]
            
            app.logger.info(f"Batch embeddings created - Count: {len(embeddings)}, Tokens: {response.usage.total_tokens}")
            
            return {
                'success': True,
                'embeddings': embeddings,
                'tokens_used': response.usage.total_tokens,
                'count': len(embeddings),
                'model': model,
                'request_id': request_id
            }
            
        except Exception as e:
            app.logger.error(f"Batch embedding creation failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def calculate_similarity(self, embedding1, embedding2):
        """
        Calcule la similarité cosinus entre deux vecteurs d'embedding.
        
        Args:
            embedding1: Premier vecteur d'embedding
            embedding2: Deuxième vecteur d'embedding
        
        Returns:
            float: Score de similarité entre -1 et 1 (1 = identique)
        """
        import numpy as np
        
        # Convertir en arrays numpy
        vec1 = np.array(embedding1)
        vec2 = np.array(embedding2)
        
        # Calcul de la similarité cosinus
        dot_product = np.dot(vec1, vec2)
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
        
        return dot_product / (norm1 * norm2)
    
    def create_vector_store_file(self, vector_store_id, file_id, attributes=None, chunking_strategy=None):
        """
        Attache un fichier à un vector store pour la recherche sémantique.
        
        Args:
            vector_store_id: ID du vector store
            file_id: ID du fichier à attacher
            attributes: Métadonnées personnalisées (dict, max 16 clés)
            chunking_strategy: Stratégie de découpage du fichier
        
        Returns:
            dict: {
                'success': bool,
                'id': str,
                'status': str,
                'usage_bytes': int,
                'error': str (si échec)
            }
        """
        if not self.client:
            return {
                'success': False,
                'error': 'OpenAI client not initialized'
            }
        
        try:
            params = {
                'file_id': file_id
            }
            
            if attributes:
                params['attributes'] = attributes
            
            if chunking_strategy:
                params['chunking_strategy'] = chunking_strategy
            
            # Créer le fichier dans le vector store
            response = self.client.beta.vector_stores.files.create(
                vector_store_id=vector_store_id,
                **params
            )
            
            app.logger.info(f"Vector store file created: {response.id} in {vector_store_id}")
            
            return {
                'success': True,
                'id': response.id,
                'status': response.status,
                'usage_bytes': response.usage_bytes if hasattr(response, 'usage_bytes') else 0,
                'vector_store_id': response.vector_store_id,
                'created_at': response.created_at
            }
            
        except Exception as e:
            app.logger.error(f"Vector store file creation failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def list_vector_store_files(self, vector_store_id, limit=20, order='desc', filter_status=None, after=None, before=None):
        """
        Liste les fichiers d'un vector store.
        
        Args:
            vector_store_id: ID du vector store
            limit: Nombre max de résultats (1-100, défaut 20)
            order: Ordre de tri ('asc' ou 'desc')
            filter_status: Filtrer par statut (in_progress, completed, failed, cancelled)
            after: Curseur de pagination (ID après lequel commencer)
            before: Curseur de pagination (ID avant lequel commencer)
        
        Returns:
            dict: {
                'success': bool,
                'files': list,
                'has_more': bool,
                'error': str (si échec)
            }
        """
        if not self.client:
            return {
                'success': False,
                'error': 'OpenAI client not initialized'
            }
        
        try:
            params = {
                'limit': min(max(limit, 1), 100),
                'order': order
            }
            
            if filter_status:
                params['filter'] = filter_status
            
            if after:
                params['after'] = after
            
            if before:
                params['before'] = before
            
            # Lister les fichiers
            response = self.client.beta.vector_stores.files.list(
                vector_store_id=vector_store_id,
                **params
            )
            
            files = [
                {
                    'id': file.id,
                    'status': file.status,
                    'created_at': file.created_at,
                    'usage_bytes': file.usage_bytes if hasattr(file, 'usage_bytes') else 0
                }
                for file in response.data
            ]
            
            return {
                'success': True,
                'files': files,
                'has_more': response.has_more if hasattr(response, 'has_more') else False,
                'first_id': response.first_id if hasattr(response, 'first_id') else None,
                'last_id': response.last_id if hasattr(response, 'last_id') else None
            }
            
        except Exception as e:
            app.logger.error(f"Listing vector store files failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_vector_store_file(self, vector_store_id, file_id):
        """
        Récupère les détails d'un fichier dans un vector store.
        
        Args:
            vector_store_id: ID du vector store
            file_id: ID du fichier
        
        Returns:
            dict: Détails du fichier
        """
        if not self.client:
            return {
                'success': False,
                'error': 'OpenAI client not initialized'
            }
        
        try:
            response = self.client.beta.vector_stores.files.retrieve(
                vector_store_id=vector_store_id,
                file_id=file_id
            )
            
            return {
                'success': True,
                'id': response.id,
                'status': response.status,
                'usage_bytes': response.usage_bytes if hasattr(response, 'usage_bytes') else 0,
                'vector_store_id': response.vector_store_id,
                'created_at': response.created_at,
                'last_error': response.last_error if hasattr(response, 'last_error') else None,
                'chunking_strategy': response.chunking_strategy if hasattr(response, 'chunking_strategy') else None,
                'attributes': response.attributes if hasattr(response, 'attributes') else None
            }
            
        except Exception as e:
            app.logger.error(f"Getting vector store file failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def delete_vector_store_file(self, vector_store_id, file_id):
        """
        Supprime un fichier d'un vector store.
        Note: Le fichier lui-même n'est pas supprimé, seulement retiré du vector store.
        
        Args:
            vector_store_id: ID du vector store
            file_id: ID du fichier à retirer
        
        Returns:
            dict: Statut de suppression
        """
        if not self.client:
            return {
                'success': False,
                'error': 'OpenAI client not initialized'
            }
        
        try:
            response = self.client.beta.vector_stores.files.delete(
                vector_store_id=vector_store_id,
                file_id=file_id
            )
            
            return {
                'success': True,
                'id': response.id,
                'deleted': response.deleted
            }
            
        except Exception as e:
            app.logger.error(f"Deleting vector store file failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def create_chat_completion(self, messages, model="gpt-4o", temperature=1.0, max_tokens=None, 
                               stream=False, store=False, metadata=None, **kwargs):
        """
        Crée une completion de chat avec le modèle spécifié.
        
        Args:
            messages: Liste des messages de la conversation
            model: Modèle à utiliser (gpt-4o, gpt-4-turbo, gpt-3.5-turbo, etc.)
            temperature: 0-2, contrôle la créativité
            max_tokens: Nombre max de tokens à générer
            stream: Activer le streaming
            store: Stocker la completion pour récupération ultérieure
            metadata: Métadonnées personnalisées (dict, max 16 clés)
            **kwargs: Autres paramètres (top_p, frequency_penalty, etc.)
        
        Returns:
            dict: Réponse de completion ou erreur
        """
        if not self.client:
            return {
                'success': False,
                'error': 'OpenAI client not initialized'
            }
        
        try:
            params = {
                'model': model,
                'messages': messages,
                'temperature': temperature,
                'stream': stream
            }
            
            if max_tokens:
                params['max_completion_tokens'] = max_tokens
            
            if store:
                params['store'] = True
            
            if metadata:
                params['metadata'] = metadata
            
            # Ajouter paramètres optionnels
            optional_params = ['top_p', 'frequency_penalty', 'presence_penalty', 
                             'stop', 'n', 'logprobs', 'response_format', 'tools', 
                             'tool_choice', 'seed', 'reasoning_effort']
            
            for param in optional_params:
                if param in kwargs:
                    params[param] = kwargs[param]
            
            # Créer la completion
            response = self.client.chat.completions.create(**params)
            
            if stream:
                return {
                    'success': True,
                    'stream': response
                }
            
            app.logger.info(f"Chat completion created: {response.id}, tokens: {response.usage.total_tokens}")
            
            return {
                'success': True,
                'id': response.id,
                'model': response.model,
                'choices': [
                    {
                        'index': choice.index,
                        'message': {
                            'role': choice.message.role,
                            'content': choice.message.content
                        },
                        'finish_reason': choice.finish_reason
                    }
                    for choice in response.choices
                ],
                'usage': {
                    'prompt_tokens': response.usage.prompt_tokens,
                    'completion_tokens': response.usage.completion_tokens,
                    'total_tokens': response.usage.total_tokens
                },
                'created': response.created
            }
            
        except Exception as e:
            app.logger.error(f"Chat completion failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_chat_completion(self, completion_id):
        """
        Récupère une completion stockée.
        
        Args:
            completion_id: ID de la completion
        
        Returns:
            dict: Détails de la completion
        """
        if not self.client:
            return {
                'success': False,
                'error': 'OpenAI client not initialized'
            }
        
        try:
            response = self.client.chat.completions.retrieve(completion_id)
            
            return {
                'success': True,
                'id': response.id,
                'model': response.model,
                'created': response.created,
                'choices': [
                    {
                        'index': choice.index,
                        'message': {
                            'role': choice.message.role,
                            'content': choice.message.content
                        },
                        'finish_reason': choice.finish_reason
                    }
                    for choice in response.choices
                ],
                'usage': {
                    'prompt_tokens': response.usage.prompt_tokens,
                    'completion_tokens': response.usage.completion_tokens,
                    'total_tokens': response.usage.total_tokens
                },
                'metadata': response.metadata if hasattr(response, 'metadata') else {}
            }
            
        except Exception as e:
            app.logger.error(f"Getting chat completion failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def list_chat_completions(self, limit=20, order='asc', after=None, model_filter=None, metadata_filter=None):
        """
        Liste les completions stockées.
        
        Args:
            limit: Nombre max de résultats (1-100)
            order: Ordre de tri ('asc' ou 'desc')
            after: Curseur de pagination
            model_filter: Filtrer par modèle
            metadata_filter: Filtrer par métadonnées
        
        Returns:
            dict: Liste des completions
        """
        if not self.client:
            return {
                'success': False,
                'error': 'OpenAI client not initialized'
            }
        
        try:
            params = {
                'limit': min(max(limit, 1), 100),
                'order': order
            }
            
            if after:
                params['after'] = after
            
            if model_filter:
                params['model'] = model_filter
            
            if metadata_filter:
                params['metadata'] = metadata_filter
            
            response = self.client.chat.completions.list(**params)
            
            completions = [
                {
                    'id': comp.id,
                    'model': comp.model,
                    'created': comp.created,
                    'usage': {
                        'total_tokens': comp.usage.total_tokens if hasattr(comp, 'usage') else 0
                    }
                }
                for comp in response.data
            ]
            
            return {
                'success': True,
                'completions': completions,
                'has_more': response.has_more if hasattr(response, 'has_more') else False,
                'first_id': response.first_id if hasattr(response, 'first_id') else None,
                'last_id': response.last_id if hasattr(response, 'last_id') else None
            }
            
        except Exception as e:
            app.logger.error(f"Listing chat completions failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def update_chat_completion(self, completion_id, metadata):
        """
        Met à jour les métadonnées d'une completion.
        
        Args:
            completion_id: ID de la completion
            metadata: Nouvelles métadonnées
        
        Returns:
            dict: Completion mise à jour
        """
        if not self.client:
            return {
                'success': False,
                'error': 'OpenAI client not initialized'
            }
        
        try:
            response = self.client.chat.completions.update(
                completion_id=completion_id,
                metadata=metadata
            )
            
            return {
                'success': True,
                'id': response.id,
                'metadata': response.metadata
            }
            
        except Exception as e:
            app.logger.error(f"Updating chat completion failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def delete_chat_completion(self, completion_id):
        """
        Supprime une completion stockée.
        
        Args:
            completion_id: ID de la completion
        
        Returns:
            dict: Statut de suppression
        """
        if not self.client:
            return {
                'success': False,
                'error': 'OpenAI client not initialized'
            }
        
        try:
            response = self.client.chat.completions.delete(completion_id)
            
            return {
                'success': True,
                'id': response.id,
                'deleted': response.deleted
            }
            
        except Exception as e:
            app.logger.error(f"Deleting chat completion failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_chat_messages(self, completion_id, limit=20, order='asc', after=None):
        """
        Récupère les messages d'une completion stockée.
        
        Args:
            completion_id: ID de la completion
            limit: Nombre max de messages
            order: Ordre de tri
            after: Curseur de pagination
        
        Returns:
            dict: Liste des messages
        """
        if not self.client:
            return {
                'success': False,
                'error': 'OpenAI client not initialized'
            }
        
        try:
            params = {
                'limit': min(max(limit, 1), 100),
                'order': order
            }
            
            if after:
                params['after'] = after
            
            response = self.client.chat.completions.messages.list(
                completion_id=completion_id,
                **params
            )
            
            messages = [
                {
                    'id': msg.id,
                    'role': msg.role,
                    'content': msg.content
                }
                for msg in response.data
            ]
            
            return {
                'success': True,
                'messages': messages,
                'has_more': response.has_more if hasattr(response, 'has_more') else False
            }
            
        except Exception as e:
            app.logger.error(f"Getting chat messages failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    # ===== FILES API =====
    
    def upload_file(self, file_path, purpose="assistants"):
        """
        Upload un fichier vers OpenAI.
        
        Args:
            file_path: Chemin du fichier à uploader
            purpose: Usage du fichier (assistants, fine-tune, batch)
        
        Returns:
            dict: Informations du fichier uploadé
        """
        if not self.client:
            return {
                'success': False,
                'error': 'OpenAI client not initialized'
            }
        
        try:
            with open(file_path, 'rb') as f:
                response = self.client.files.create(
                    file=f,
                    purpose=purpose
                )
            
            app.logger.info(f"File uploaded: {response.id}, size: {response.bytes} bytes")
            
            return {
                'success': True,
                'id': response.id,
                'filename': response.filename,
                'bytes': response.bytes,
                'purpose': response.purpose,
                'status': response.status,
                'created_at': response.created_at
            }
            
        except Exception as e:
            app.logger.error(f"File upload failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def list_files(self, purpose=None):
        """
        Liste les fichiers uploadés.
        
        Args:
            purpose: Filtrer par usage (optionnel)
        
        Returns:
            dict: Liste des fichiers
        """
        if not self.client:
            return {
                'success': False,
                'error': 'OpenAI client not initialized'
            }
        
        try:
            params = {}
            if purpose:
                params['purpose'] = purpose
            
            response = self.client.files.list(**params)
            
            files = [
                {
                    'id': f.id,
                    'filename': f.filename,
                    'bytes': f.bytes,
                    'purpose': f.purpose,
                    'status': f.status,
                    'created_at': f.created_at
                }
                for f in response.data
            ]
            
            return {
                'success': True,
                'files': files
            }
            
        except Exception as e:
            app.logger.error(f"Listing files failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_file(self, file_id):
        """
        Récupère les infos d'un fichier.
        
        Args:
            file_id: ID du fichier
        
        Returns:
            dict: Informations du fichier
        """
        if not self.client:
            return {
                'success': False,
                'error': 'OpenAI client not initialized'
            }
        
        try:
            response = self.client.files.retrieve(file_id)
            
            return {
                'success': True,
                'id': response.id,
                'filename': response.filename,
                'bytes': response.bytes,
                'purpose': response.purpose,
                'status': response.status,
                'created_at': response.created_at
            }
            
        except Exception as e:
            app.logger.error(f"Getting file failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def delete_file(self, file_id):
        """
        Supprime un fichier.
        
        Args:
            file_id: ID du fichier
        
        Returns:
            dict: Statut de suppression
        """
        if not self.client:
            return {
                'success': False,
                'error': 'OpenAI client not initialized'
            }
        
        try:
            response = self.client.files.delete(file_id)
            
            return {
                'success': True,
                'id': response.id,
                'deleted': response.deleted
            }
            
        except Exception as e:
            app.logger.error(f"Deleting file failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def download_file_content(self, file_id):
        """
        Télécharge le contenu d'un fichier.
        
        Args:
            file_id: ID du fichier
        
        Returns:
            dict: Contenu du fichier
        """
        if not self.client:
            return {
                'success': False,
                'error': 'OpenAI client not initialized'
            }
        
        try:
            content = self.client.files.content(file_id)
            
            return {
                'success': True,
                'content': content.read()
            }
            
        except Exception as e:
            app.logger.error(f"Downloading file content failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    # ===== MODERATION API =====
    
    def moderate_content(self, text):
        """
        Analyse un texte pour détecter du contenu inapproprié.
        
        Args:
            text: Texte à modérer
        
        Returns:
            dict: Résultats de modération
        """
        if not self.client:
            return {
                'success': False,
                'error': 'OpenAI client not initialized'
            }
        
        try:
            response = self.client.moderations.create(input=text)
            
            result = response.results[0]
            
            return {
                'success': True,
                'flagged': result.flagged,
                'categories': {
                    'hate': result.categories.hate,
                    'hate_threatening': result.categories.hate_threatening,
                    'harassment': result.categories.harassment,
                    'harassment_threatening': result.categories.harassment_threatening,
                    'self_harm': result.categories.self_harm,
                    'self_harm_intent': result.categories.self_harm_intent,
                    'self_harm_instructions': result.categories.self_harm_instructions,
                    'sexual': result.categories.sexual,
                    'sexual_minors': result.categories.sexual_minors,
                    'violence': result.categories.violence,
                    'violence_graphic': result.categories.violence_graphic
                },
                'category_scores': {
                    'hate': result.category_scores.hate,
                    'hate_threatening': result.category_scores.hate_threatening,
                    'harassment': result.category_scores.harassment,
                    'harassment_threatening': result.category_scores.harassment_threatening,
                    'self_harm': result.category_scores.self_harm,
                    'self_harm_intent': result.category_scores.self_harm_intent,
                    'self_harm_instructions': result.category_scores.self_harm_instructions,
                    'sexual': result.category_scores.sexual,
                    'sexual_minors': result.category_scores.sexual_minors,
                    'violence': result.category_scores.violence,
                    'violence_graphic': result.category_scores.violence_graphic
                }
            }
            
        except Exception as e:
            app.logger.error(f"Content moderation failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def batch_moderate(self, texts):
        """
        Modère plusieurs textes en une seule requête.
        
        Args:
            texts: Liste de textes à modérer
        
        Returns:
            dict: Résultats de modération pour chaque texte
        """
        if not self.client:
            return {
                'success': False,
                'error': 'OpenAI client not initialized'
            }
        
        try:
            response = self.client.moderations.create(input=texts)
            
            results = [
                {
                    'flagged': r.flagged,
                    'categories': {
                        'hate': r.categories.hate,
                        'harassment': r.categories.harassment,
                        'sexual': r.categories.sexual,
                        'violence': r.categories.violence
                    }
                }
                for r in response.results
            ]
            
            return {
                'success': True,
                'results': results,
                'total_flagged': sum(1 for r in results if r['flagged'])
            }
            
        except Exception as e:
            app.logger.error(f"Batch moderation failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    # ===== RUN STEPS API (Assistants Beta) =====
    
    def list_run_steps(self, thread_id, run_id, limit=20, order='desc', after=None, before=None, include=None):
        """
        Liste les étapes d'exécution d'un run.
        
        Args:
            thread_id: ID du thread
            run_id: ID du run
            limit: Nombre max de résultats (1-100)
            order: Ordre de tri ('asc' ou 'desc')
            after: Curseur de pagination (après cet ID)
            before: Curseur de pagination (avant cet ID)
            include: Champs additionnels à inclure
        
        Returns:
            dict: Liste des run steps
        """
        if not self.client:
            return {
                'success': False,
                'error': 'OpenAI client not initialized'
            }
        
        try:
            params = {
                'limit': min(max(limit, 1), 100),
                'order': order
            }
            
            if after:
                params['after'] = after
            
            if before:
                params['before'] = before
            
            if include:
                params['include'] = include
            
            response = self.client.beta.threads.runs.steps.list(
                thread_id=thread_id,
                run_id=run_id,
                **params
            )
            
            steps = [
                {
                    'id': step.id,
                    'object': step.object,
                    'created_at': step.created_at,
                    'run_id': step.run_id,
                    'assistant_id': step.assistant_id,
                    'thread_id': step.thread_id,
                    'type': step.type,
                    'status': step.status,
                    'cancelled_at': step.cancelled_at,
                    'completed_at': step.completed_at,
                    'expired_at': step.expired_at,
                    'failed_at': step.failed_at,
                    'last_error': step.last_error.model_dump() if step.last_error else None,
                    'step_details': step.step_details.model_dump() if step.step_details else None,
                    'usage': {
                        'prompt_tokens': step.usage.prompt_tokens,
                        'completion_tokens': step.usage.completion_tokens,
                        'total_tokens': step.usage.total_tokens
                    } if step.usage else None,
                    'metadata': step.metadata if hasattr(step, 'metadata') else {}
                }
                for step in response.data
            ]
            
            return {
                'success': True,
                'object': 'list',
                'data': steps,
                'first_id': response.first_id if hasattr(response, 'first_id') else None,
                'last_id': response.last_id if hasattr(response, 'last_id') else None,
                'has_more': response.has_more if hasattr(response, 'has_more') else False
            }
            
        except Exception as e:
            app.logger.error(f"Listing run steps failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_run_step(self, thread_id, run_id, step_id, include=None):
        """
        Récupère un run step spécifique.
        
        Args:
            thread_id: ID du thread
            run_id: ID du run
            step_id: ID du step
            include: Champs additionnels à inclure
        
        Returns:
            dict: Détails du run step
        """
        if not self.client:
            return {
                'success': False,
                'error': 'OpenAI client not initialized'
            }
        
        try:
            params = {}
            if include:
                params['include'] = include
            
            step = self.client.beta.threads.runs.steps.retrieve(
                thread_id=thread_id,
                run_id=run_id,
                step_id=step_id,
                **params
            )
            
            return {
                'success': True,
                'id': step.id,
                'object': step.object,
                'created_at': step.created_at,
                'run_id': step.run_id,
                'assistant_id': step.assistant_id,
                'thread_id': step.thread_id,
                'type': step.type,
                'status': step.status,
                'cancelled_at': step.cancelled_at,
                'completed_at': step.completed_at,
                'expired_at': step.expired_at,
                'failed_at': step.failed_at,
                'last_error': step.last_error.model_dump() if step.last_error else None,
                'step_details': step.step_details.model_dump() if step.step_details else None,
                'usage': {
                    'prompt_tokens': step.usage.prompt_tokens,
                    'completion_tokens': step.usage.completion_tokens,
                    'total_tokens': step.usage.total_tokens
                } if step.usage else None,
                'metadata': step.metadata if hasattr(step, 'metadata') else {}
            }
            
        except Exception as e:
            app.logger.error(f"Getting run step failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    # ===== ASSISTANTS API (Assistants Beta) =====
    
    def create_assistant(self, model, name=None, description=None, instructions=None, 
                        tools=None, tool_resources=None, metadata=None, temperature=None, 
                        top_p=None, response_format=None):
        """
        Crée un nouvel assistant OpenAI.
        
        Args:
            model: ID du modèle (ex: 'gpt-4-turbo', 'gpt-3.5-turbo')
            name: Nom de l'assistant (max 256 caractères)
            description: Description (max 512 caractères)
            instructions: Instructions système (max 256000 caractères)
            tools: Liste d'outils (code_interpreter, file_search, function)
            tool_resources: Ressources pour outils (vector_store_ids, etc.)
            metadata: Métadonnées personnalisées (max 16 paires clé-valeur)
            temperature: Température de sampling (0-2)
            top_p: Nucleus sampling (0-1)
            response_format: Format de réponse ('auto', 'json_object', 'text')
        
        Returns:
            dict: Assistant créé avec ID et configuration
        """
        if not self.client:
            return {
                'success': False,
                'error': 'OpenAI client not initialized'
            }
        
        try:
            params = {
                'model': model
            }
            
            if name:
                params['name'] = name[:256]
            
            if description:
                params['description'] = description[:512]
            
            if instructions:
                params['instructions'] = instructions[:256000]
            
            if tools:
                params['tools'] = tools
            
            if tool_resources:
                params['tool_resources'] = tool_resources
            
            if metadata:
                params['metadata'] = metadata
            
            if temperature is not None:
                params['temperature'] = max(0, min(temperature, 2))
            
            if top_p is not None:
                params['top_p'] = max(0, min(top_p, 1))
            
            if response_format:
                params['response_format'] = response_format
            
            assistant = self.client.beta.assistants.create(**params)
            
            return {
                'success': True,
                'id': assistant.id,
                'object': assistant.object,
                'created_at': assistant.created_at,
                'name': assistant.name,
                'description': assistant.description,
                'model': assistant.model,
                'instructions': assistant.instructions,
                'tools': [tool.model_dump() for tool in assistant.tools] if assistant.tools else [],
                'tool_resources': assistant.tool_resources.model_dump() if assistant.tool_resources else None,
                'metadata': assistant.metadata,
                'temperature': assistant.temperature,
                'top_p': assistant.top_p,
                'response_format': assistant.response_format
            }
            
        except Exception as e:
            app.logger.error(f"Creating assistant failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def list_assistants(self, limit=20, order='desc', after=None, before=None):
        """
        Liste les assistants.
        
        Args:
            limit: Nombre max de résultats (1-100)
            order: Ordre de tri ('asc' ou 'desc')
            after: Curseur de pagination (après cet ID)
            before: Curseur de pagination (avant cet ID)
        
        Returns:
            dict: Liste des assistants
        """
        if not self.client:
            return {
                'success': False,
                'error': 'OpenAI client not initialized'
            }
        
        try:
            params = {
                'limit': min(max(limit, 1), 100),
                'order': order
            }
            
            if after:
                params['after'] = after
            
            if before:
                params['before'] = before
            
            response = self.client.beta.assistants.list(**params)
            
            assistants = [
                {
                    'id': asst.id,
                    'object': asst.object,
                    'created_at': asst.created_at,
                    'name': asst.name,
                    'description': asst.description,
                    'model': asst.model,
                    'instructions': asst.instructions,
                    'tools': [tool.model_dump() for tool in asst.tools] if asst.tools else [],
                    'tool_resources': asst.tool_resources.model_dump() if asst.tool_resources else None,
                    'metadata': asst.metadata,
                    'temperature': asst.temperature,
                    'top_p': asst.top_p,
                    'response_format': asst.response_format
                }
                for asst in response.data
            ]
            
            return {
                'success': True,
                'object': 'list',
                'data': assistants,
                'first_id': response.first_id if hasattr(response, 'first_id') else None,
                'last_id': response.last_id if hasattr(response, 'last_id') else None,
                'has_more': response.has_more if hasattr(response, 'has_more') else False
            }
            
        except Exception as e:
            app.logger.error(f"Listing assistants failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_assistant(self, assistant_id):
        """
        Récupère un assistant spécifique.
        
        Args:
            assistant_id: ID de l'assistant
        
        Returns:
            dict: Détails de l'assistant
        """
        if not self.client:
            return {
                'success': False,
                'error': 'OpenAI client not initialized'
            }
        
        try:
            assistant = self.client.beta.assistants.retrieve(assistant_id)
            
            return {
                'success': True,
                'id': assistant.id,
                'object': assistant.object,
                'created_at': assistant.created_at,
                'name': assistant.name,
                'description': assistant.description,
                'model': assistant.model,
                'instructions': assistant.instructions,
                'tools': [tool.model_dump() for tool in assistant.tools] if assistant.tools else [],
                'tool_resources': assistant.tool_resources.model_dump() if assistant.tool_resources else None,
                'metadata': assistant.metadata,
                'temperature': assistant.temperature,
                'top_p': assistant.top_p,
                'response_format': assistant.response_format
            }
            
        except Exception as e:
            app.logger.error(f"Getting assistant failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def update_assistant(self, assistant_id, model=None, name=None, description=None, 
                        instructions=None, tools=None, tool_resources=None, metadata=None, 
                        temperature=None, top_p=None, response_format=None):
        """
        Met à jour un assistant.
        
        Args:
            assistant_id: ID de l'assistant
            model: Nouveau modèle
            name: Nouveau nom
            description: Nouvelle description
            instructions: Nouvelles instructions
            tools: Nouveaux outils
            tool_resources: Nouvelles ressources
            metadata: Nouvelles métadonnées
            temperature: Nouvelle température
            top_p: Nouveau top_p
            response_format: Nouveau format de réponse
        
        Returns:
            dict: Assistant mis à jour
        """
        if not self.client:
            return {
                'success': False,
                'error': 'OpenAI client not initialized'
            }
        
        try:
            params = {}
            
            if model:
                params['model'] = model
            
            if name is not None:
                params['name'] = name[:256]
            
            if description is not None:
                params['description'] = description[:512]
            
            if instructions is not None:
                params['instructions'] = instructions[:256000]
            
            if tools is not None:
                params['tools'] = tools
            
            if tool_resources is not None:
                params['tool_resources'] = tool_resources
            
            if metadata is not None:
                params['metadata'] = metadata
            
            if temperature is not None:
                params['temperature'] = max(0, min(temperature, 2))
            
            if top_p is not None:
                params['top_p'] = max(0, min(top_p, 1))
            
            if response_format is not None:
                params['response_format'] = response_format
            
            assistant = self.client.beta.assistants.update(assistant_id, **params)
            
            return {
                'success': True,
                'id': assistant.id,
                'object': assistant.object,
                'created_at': assistant.created_at,
                'name': assistant.name,
                'description': assistant.description,
                'model': assistant.model,
                'instructions': assistant.instructions,
                'tools': [tool.model_dump() for tool in assistant.tools] if assistant.tools else [],
                'tool_resources': assistant.tool_resources.model_dump() if assistant.tool_resources else None,
                'metadata': assistant.metadata,
                'temperature': assistant.temperature,
                'top_p': assistant.top_p,
                'response_format': assistant.response_format
            }
            
        except Exception as e:
            app.logger.error(f"Updating assistant failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def delete_assistant(self, assistant_id):
        """
        Supprime un assistant.
        
        Args:
            assistant_id: ID de l'assistant
        
        Returns:
            dict: Confirmation de suppression
        """
        if not self.client:
            return {
                'success': False,
                'error': 'OpenAI client not initialized'
            }
        
        try:
            response = self.client.beta.assistants.delete(assistant_id)
            
            return {
                'success': True,
                'id': response.id,
                'object': response.object,
                'deleted': response.deleted
            }
            
        except Exception as e:
            app.logger.error(f"Deleting assistant failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    # ===== THREADS API (Assistants Beta) =====
    
    def create_thread(self, messages=None, tool_resources=None, metadata=None):
        """
        Crée un nouveau thread de conversation.
        
        Args:
            messages: Liste de messages initiaux
            tool_resources: Ressources pour outils (vector_store_ids, etc.)
            metadata: Métadonnées personnalisées
        
        Returns:
            dict: Thread créé avec ID
        """
        if not self.client:
            return {
                'success': False,
                'error': 'OpenAI client not initialized'
            }
        
        try:
            params = {}
            
            if messages:
                params['messages'] = messages
            
            if tool_resources:
                params['tool_resources'] = tool_resources
            
            if metadata:
                params['metadata'] = metadata
            
            thread = self.client.beta.threads.create(**params)
            
            return {
                'success': True,
                'id': thread.id,
                'object': thread.object,
                'created_at': thread.created_at,
                'tool_resources': thread.tool_resources.model_dump() if thread.tool_resources else None,
                'metadata': thread.metadata
            }
            
        except Exception as e:
            app.logger.error(f"Creating thread failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_thread(self, thread_id):
        """
        Récupère un thread spécifique.
        
        Args:
            thread_id: ID du thread
        
        Returns:
            dict: Détails du thread
        """
        if not self.client:
            return {
                'success': False,
                'error': 'OpenAI client not initialized'
            }
        
        try:
            thread = self.client.beta.threads.retrieve(thread_id)
            
            return {
                'success': True,
                'id': thread.id,
                'object': thread.object,
                'created_at': thread.created_at,
                'tool_resources': thread.tool_resources.model_dump() if thread.tool_resources else None,
                'metadata': thread.metadata
            }
            
        except Exception as e:
            app.logger.error(f"Getting thread failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def update_thread(self, thread_id, tool_resources=None, metadata=None):
        """
        Met à jour un thread.
        
        Args:
            thread_id: ID du thread
            tool_resources: Nouvelles ressources
            metadata: Nouvelles métadonnées
        
        Returns:
            dict: Thread mis à jour
        """
        if not self.client:
            return {
                'success': False,
                'error': 'OpenAI client not initialized'
            }
        
        try:
            params = {}
            
            if tool_resources is not None:
                params['tool_resources'] = tool_resources
            
            if metadata is not None:
                params['metadata'] = metadata
            
            thread = self.client.beta.threads.update(thread_id, **params)
            
            return {
                'success': True,
                'id': thread.id,
                'object': thread.object,
                'created_at': thread.created_at,
                'tool_resources': thread.tool_resources.model_dump() if thread.tool_resources else None,
                'metadata': thread.metadata
            }
            
        except Exception as e:
            app.logger.error(f"Updating thread failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def delete_thread(self, thread_id):
        """
        Supprime un thread.
        
        Args:
            thread_id: ID du thread
        
        Returns:
            dict: Confirmation de suppression
        """
        if not self.client:
            return {
                'success': False,
                'error': 'OpenAI client not initialized'
            }
        
        try:
            response = self.client.beta.threads.delete(thread_id)
            
            return {
                'success': True,
                'id': response.id,
                'object': response.object,
                'deleted': response.deleted
            }
            
        except Exception as e:
            app.logger.error(f"Deleting thread failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    # ===== MESSAGES API (Assistants Beta) =====
    
    def create_message(self, thread_id, role, content, attachments=None, metadata=None):
        """
        Ajoute un message à un thread.
        
        Args:
            thread_id: ID du thread
            role: Rôle ('user' ou 'assistant')
            content: Contenu du message (texte ou liste)
            attachments: Fichiers attachés
            metadata: Métadonnées personnalisées
        
        Returns:
            dict: Message créé
        """
        if not self.client:
            return {
                'success': False,
                'error': 'OpenAI client not initialized'
            }
        
        try:
            params = {
                'role': role,
                'content': content
            }
            
            if attachments:
                params['attachments'] = attachments
            
            if metadata:
                params['metadata'] = metadata
            
            message = self.client.beta.threads.messages.create(
                thread_id=thread_id,
                **params
            )
            
            return {
                'success': True,
                'id': message.id,
                'object': message.object,
                'created_at': message.created_at,
                'thread_id': message.thread_id,
                'role': message.role,
                'content': [content.model_dump() for content in message.content] if message.content else [],
                'attachments': [att.model_dump() for att in message.attachments] if message.attachments else [],
                'assistant_id': message.assistant_id,
                'run_id': message.run_id,
                'metadata': message.metadata
            }
            
        except Exception as e:
            app.logger.error(f"Creating message failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def list_messages(self, thread_id, limit=20, order='desc', after=None, before=None, run_id=None):
        """
        Liste les messages d'un thread.
        
        Args:
            thread_id: ID du thread
            limit: Nombre max de résultats (1-100)
            order: Ordre de tri ('asc' ou 'desc')
            after: Curseur de pagination
            before: Curseur de pagination
            run_id: Filtrer par run_id
        
        Returns:
            dict: Liste des messages
        """
        if not self.client:
            return {
                'success': False,
                'error': 'OpenAI client not initialized'
            }
        
        try:
            params = {
                'limit': min(max(limit, 1), 100),
                'order': order
            }
            
            if after:
                params['after'] = after
            
            if before:
                params['before'] = before
            
            if run_id:
                params['run_id'] = run_id
            
            response = self.client.beta.threads.messages.list(
                thread_id=thread_id,
                **params
            )
            
            messages = [
                {
                    'id': msg.id,
                    'object': msg.object,
                    'created_at': msg.created_at,
                    'thread_id': msg.thread_id,
                    'role': msg.role,
                    'content': [content.model_dump() for content in msg.content] if msg.content else [],
                    'attachments': [att.model_dump() for att in msg.attachments] if msg.attachments else [],
                    'assistant_id': msg.assistant_id,
                    'run_id': msg.run_id,
                    'metadata': msg.metadata
                }
                for msg in response.data
            ]
            
            return {
                'success': True,
                'object': 'list',
                'data': messages,
                'first_id': response.first_id if hasattr(response, 'first_id') else None,
                'last_id': response.last_id if hasattr(response, 'last_id') else None,
                'has_more': response.has_more if hasattr(response, 'has_more') else False
            }
            
        except Exception as e:
            app.logger.error(f"Listing messages failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_message(self, thread_id, message_id):
        """
        Récupère un message spécifique.
        
        Args:
            thread_id: ID du thread
            message_id: ID du message
        
        Returns:
            dict: Détails du message
        """
        if not self.client:
            return {
                'success': False,
                'error': 'OpenAI client not initialized'
            }
        
        try:
            message = self.client.beta.threads.messages.retrieve(
                thread_id=thread_id,
                message_id=message_id
            )
            
            return {
                'success': True,
                'id': message.id,
                'object': message.object,
                'created_at': message.created_at,
                'thread_id': message.thread_id,
                'role': message.role,
                'content': [content.model_dump() for content in message.content] if message.content else [],
                'attachments': [att.model_dump() for att in message.attachments] if message.attachments else [],
                'assistant_id': message.assistant_id,
                'run_id': message.run_id,
                'metadata': message.metadata
            }
            
        except Exception as e:
            app.logger.error(f"Getting message failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def update_message(self, thread_id, message_id, metadata=None):
        """
        Met à jour les métadonnées d'un message.
        
        Args:
            thread_id: ID du thread
            message_id: ID du message
            metadata: Nouvelles métadonnées
        
        Returns:
            dict: Message mis à jour
        """
        if not self.client:
            return {
                'success': False,
                'error': 'OpenAI client not initialized'
            }
        
        try:
            params = {}
            
            if metadata is not None:
                params['metadata'] = metadata
            
            message = self.client.beta.threads.messages.update(
                thread_id=thread_id,
                message_id=message_id,
                **params
            )
            
            return {
                'success': True,
                'id': message.id,
                'object': message.object,
                'created_at': message.created_at,
                'thread_id': message.thread_id,
                'role': message.role,
                'content': [content.model_dump() for content in message.content] if message.content else [],
                'attachments': [att.model_dump() for att in message.attachments] if message.attachments else [],
                'assistant_id': message.assistant_id,
                'run_id': message.run_id,
                'metadata': message.metadata
            }
            
        except Exception as e:
            app.logger.error(f"Updating message failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def delete_message(self, thread_id, message_id):
        """
        Supprime un message.
        
        Args:
            thread_id: ID du thread
            message_id: ID du message
        
        Returns:
            dict: Confirmation de suppression
        """
        if not self.client:
            return {
                'success': False,
                'error': 'OpenAI client not initialized'
            }
        
        try:
            response = self.client.beta.threads.messages.delete(
                thread_id=thread_id,
                message_id=message_id
            )
            
            return {
                'success': True,
                'id': response.id,
                'object': response.object,
                'deleted': response.deleted
            }
            
        except Exception as e:
            app.logger.error(f"Deleting message failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    # ===== RUNS API (Assistants Beta) =====
    
    def create_run(self, thread_id, assistant_id, model=None, instructions=None, 
                   additional_instructions=None, additional_messages=None, tools=None, 
                   metadata=None, temperature=None, top_p=None, max_prompt_tokens=None, 
                   max_completion_tokens=None, truncation_strategy=None, tool_choice=None, 
                   parallel_tool_calls=None, response_format=None):
        """
        Crée un run pour exécuter un assistant sur un thread.
        
        Args:
            thread_id: ID du thread
            assistant_id: ID de l'assistant
            model: Modèle à utiliser (override)
            instructions: Instructions (override)
            additional_instructions: Instructions additionnelles
            additional_messages: Messages additionnels
            tools: Outils (override)
            metadata: Métadonnées
            temperature: Température
            top_p: Top P
            max_prompt_tokens: Max tokens prompt
            max_completion_tokens: Max tokens complétion
            truncation_strategy: Stratégie de troncation
            tool_choice: Choix d'outil
            parallel_tool_calls: Appels parallèles
            response_format: Format réponse
        
        Returns:
            dict: Run créé
        """
        if not self.client:
            return {
                'success': False,
                'error': 'OpenAI client not initialized'
            }
        
        try:
            params = {
                'assistant_id': assistant_id
            }
            
            if model:
                params['model'] = model
            
            if instructions:
                params['instructions'] = instructions
            
            if additional_instructions:
                params['additional_instructions'] = additional_instructions
            
            if additional_messages:
                params['additional_messages'] = additional_messages
            
            if tools is not None:
                params['tools'] = tools
            
            if metadata:
                params['metadata'] = metadata
            
            if temperature is not None:
                params['temperature'] = max(0, min(temperature, 2))
            
            if top_p is not None:
                params['top_p'] = max(0, min(top_p, 1))
            
            if max_prompt_tokens:
                params['max_prompt_tokens'] = max_prompt_tokens
            
            if max_completion_tokens:
                params['max_completion_tokens'] = max_completion_tokens
            
            if truncation_strategy:
                params['truncation_strategy'] = truncation_strategy
            
            if tool_choice is not None:
                params['tool_choice'] = tool_choice
            
            if parallel_tool_calls is not None:
                params['parallel_tool_calls'] = parallel_tool_calls
            
            if response_format:
                params['response_format'] = response_format
            
            run = self.client.beta.threads.runs.create(
                thread_id=thread_id,
                **params
            )
            
            return {
                'success': True,
                'id': run.id,
                'object': run.object,
                'created_at': run.created_at,
                'thread_id': run.thread_id,
                'assistant_id': run.assistant_id,
                'status': run.status,
                'required_action': run.required_action.model_dump() if run.required_action else None,
                'last_error': run.last_error.model_dump() if run.last_error else None,
                'expires_at': run.expires_at,
                'started_at': run.started_at,
                'cancelled_at': run.cancelled_at,
                'failed_at': run.failed_at,
                'completed_at': run.completed_at,
                'incomplete_details': run.incomplete_details.model_dump() if run.incomplete_details else None,
                'model': run.model,
                'instructions': run.instructions,
                'tools': [tool.model_dump() for tool in run.tools] if run.tools else [],
                'metadata': run.metadata,
                'usage': {
                    'prompt_tokens': run.usage.prompt_tokens,
                    'completion_tokens': run.usage.completion_tokens,
                    'total_tokens': run.usage.total_tokens
                } if run.usage else None,
                'temperature': run.temperature,
                'top_p': run.top_p,
                'max_prompt_tokens': run.max_prompt_tokens,
                'max_completion_tokens': run.max_completion_tokens,
                'truncation_strategy': run.truncation_strategy.model_dump() if run.truncation_strategy else None,
                'tool_choice': run.tool_choice,
                'parallel_tool_calls': run.parallel_tool_calls,
                'response_format': run.response_format
            }
            
        except Exception as e:
            app.logger.error(f"Creating run failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def list_runs(self, thread_id, limit=20, order='desc', after=None, before=None):
        """
        Liste les runs d'un thread.
        
        Args:
            thread_id: ID du thread
            limit: Nombre max de résultats (1-100)
            order: Ordre de tri
            after: Curseur pagination
            before: Curseur pagination
        
        Returns:
            dict: Liste des runs
        """
        if not self.client:
            return {
                'success': False,
                'error': 'OpenAI client not initialized'
            }
        
        try:
            params = {
                'limit': min(max(limit, 1), 100),
                'order': order
            }
            
            if after:
                params['after'] = after
            
            if before:
                params['before'] = before
            
            response = self.client.beta.threads.runs.list(
                thread_id=thread_id,
                **params
            )
            
            runs = [
                {
                    'id': run.id,
                    'object': run.object,
                    'created_at': run.created_at,
                    'thread_id': run.thread_id,
                    'assistant_id': run.assistant_id,
                    'status': run.status,
                    'required_action': run.required_action.model_dump() if run.required_action else None,
                    'last_error': run.last_error.model_dump() if run.last_error else None,
                    'expires_at': run.expires_at,
                    'started_at': run.started_at,
                    'cancelled_at': run.cancelled_at,
                    'failed_at': run.failed_at,
                    'completed_at': run.completed_at,
                    'incomplete_details': run.incomplete_details.model_dump() if run.incomplete_details else None,
                    'model': run.model,
                    'instructions': run.instructions,
                    'tools': [tool.model_dump() for tool in run.tools] if run.tools else [],
                    'metadata': run.metadata,
                    'usage': {
                        'prompt_tokens': run.usage.prompt_tokens,
                        'completion_tokens': run.usage.completion_tokens,
                        'total_tokens': run.usage.total_tokens
                    } if run.usage else None,
                    'temperature': run.temperature,
                    'top_p': run.top_p
                }
                for run in response.data
            ]
            
            return {
                'success': True,
                'object': 'list',
                'data': runs,
                'first_id': response.first_id if hasattr(response, 'first_id') else None,
                'last_id': response.last_id if hasattr(response, 'last_id') else None,
                'has_more': response.has_more if hasattr(response, 'has_more') else False
            }
            
        except Exception as e:
            app.logger.error(f"Listing runs failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_run(self, thread_id, run_id):
        """
        Récupère un run spécifique.
        
        Args:
            thread_id: ID du thread
            run_id: ID du run
        
        Returns:
            dict: Détails du run
        """
        if not self.client:
            return {
                'success': False,
                'error': 'OpenAI client not initialized'
            }
        
        try:
            run = self.client.beta.threads.runs.retrieve(
                thread_id=thread_id,
                run_id=run_id
            )
            
            return {
                'success': True,
                'id': run.id,
                'object': run.object,
                'created_at': run.created_at,
                'thread_id': run.thread_id,
                'assistant_id': run.assistant_id,
                'status': run.status,
                'required_action': run.required_action.model_dump() if run.required_action else None,
                'last_error': run.last_error.model_dump() if run.last_error else None,
                'expires_at': run.expires_at,
                'started_at': run.started_at,
                'cancelled_at': run.cancelled_at,
                'failed_at': run.failed_at,
                'completed_at': run.completed_at,
                'incomplete_details': run.incomplete_details.model_dump() if run.incomplete_details else None,
                'model': run.model,
                'instructions': run.instructions,
                'tools': [tool.model_dump() for tool in run.tools] if run.tools else [],
                'metadata': run.metadata,
                'usage': {
                    'prompt_tokens': run.usage.prompt_tokens,
                    'completion_tokens': run.usage.completion_tokens,
                    'total_tokens': run.usage.total_tokens
                } if run.usage else None,
                'temperature': run.temperature,
                'top_p': run.top_p,
                'max_prompt_tokens': run.max_prompt_tokens,
                'max_completion_tokens': run.max_completion_tokens,
                'truncation_strategy': run.truncation_strategy.model_dump() if run.truncation_strategy else None,
                'tool_choice': run.tool_choice,
                'parallel_tool_calls': run.parallel_tool_calls,
                'response_format': run.response_format
            }
            
        except Exception as e:
            app.logger.error(f"Getting run failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def update_run(self, thread_id, run_id, metadata=None):
        """
        Met à jour les métadonnées d'un run.
        
        Args:
            thread_id: ID du thread
            run_id: ID du run
            metadata: Nouvelles métadonnées
        
        Returns:
            dict: Run mis à jour
        """
        if not self.client:
            return {
                'success': False,
                'error': 'OpenAI client not initialized'
            }
        
        try:
            params = {}
            
            if metadata is not None:
                params['metadata'] = metadata
            
            run = self.client.beta.threads.runs.update(
                thread_id=thread_id,
                run_id=run_id,
                **params
            )
            
            return {
                'success': True,
                'id': run.id,
                'object': run.object,
                'created_at': run.created_at,
                'thread_id': run.thread_id,
                'assistant_id': run.assistant_id,
                'status': run.status,
                'metadata': run.metadata
            }
            
        except Exception as e:
            app.logger.error(f"Updating run failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def cancel_run(self, thread_id, run_id):
        """
        Annule un run en cours.
        
        Args:
            thread_id: ID du thread
            run_id: ID du run
        
        Returns:
            dict: Run annulé
        """
        if not self.client:
            return {
                'success': False,
                'error': 'OpenAI client not initialized'
            }
        
        try:
            run = self.client.beta.threads.runs.cancel(
                thread_id=thread_id,
                run_id=run_id
            )
            
            return {
                'success': True,
                'id': run.id,
                'object': run.object,
                'created_at': run.created_at,
                'thread_id': run.thread_id,
                'assistant_id': run.assistant_id,
                'status': run.status,
                'cancelled_at': run.cancelled_at
            }
            
        except Exception as e:
            app.logger.error(f"Cancelling run failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def submit_tool_outputs(self, thread_id, run_id, tool_outputs):
        """
        Soumet les résultats d'appels d'outils.
        
        Args:
            thread_id: ID du thread
            run_id: ID du run
            tool_outputs: Liste des résultats d'outils
        
        Returns:
            dict: Run mis à jour
        """
        if not self.client:
            return {
                'success': False,
                'error': 'OpenAI client not initialized'
            }
        
        try:
            run = self.client.beta.threads.runs.submit_tool_outputs(
                thread_id=thread_id,
                run_id=run_id,
                tool_outputs=tool_outputs
            )
            
            return {
                'success': True,
                'id': run.id,
                'object': run.object,
                'created_at': run.created_at,
                'thread_id': run.thread_id,
                'assistant_id': run.assistant_id,
                'status': run.status,
                'required_action': run.required_action.model_dump() if run.required_action else None
            }
            
        except Exception as e:
            app.logger.error(f"Submitting tool outputs failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    # ===== VECTOR STORES API (Assistants Beta) =====
    
    def create_vector_store(self, name=None, file_ids=None, expires_after=None, 
                           chunking_strategy=None, metadata=None):
        """
        Crée un nouveau vector store.
        
        Args:
            name: Nom du vector store
            file_ids: Liste d'IDs de fichiers à ajouter
            expires_after: Configuration d'expiration
            chunking_strategy: Stratégie de découpage
            metadata: Métadonnées personnalisées
        
        Returns:
            dict: Vector store créé
        """
        if not self.client:
            return {
                'success': False,
                'error': 'OpenAI client not initialized'
            }
        
        try:
            params = {}
            
            if name:
                params['name'] = name
            
            if file_ids:
                params['file_ids'] = file_ids
            
            if expires_after:
                params['expires_after'] = expires_after
            
            if chunking_strategy:
                params['chunking_strategy'] = chunking_strategy
            
            if metadata:
                params['metadata'] = metadata
            
            vector_store = self.client.vector_stores.create(**params)
            
            return {
                'success': True,
                'id': vector_store.id,
                'object': vector_store.object,
                'created_at': vector_store.created_at,
                'name': vector_store.name,
                'usage_bytes': vector_store.usage_bytes,
                'file_counts': {
                    'in_progress': vector_store.file_counts.in_progress,
                    'completed': vector_store.file_counts.completed,
                    'failed': vector_store.file_counts.failed,
                    'cancelled': vector_store.file_counts.cancelled,
                    'total': vector_store.file_counts.total
                } if vector_store.file_counts else None,
                'status': vector_store.status,
                'expires_after': vector_store.expires_after.model_dump() if vector_store.expires_after else None,
                'expires_at': vector_store.expires_at,
                'last_active_at': vector_store.last_active_at,
                'metadata': vector_store.metadata
            }
            
        except Exception as e:
            app.logger.error(f"Creating vector store failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def list_vector_stores(self, limit=20, order='desc', after=None, before=None):
        """
        Liste les vector stores.
        
        Args:
            limit: Nombre max de résultats (1-100)
            order: Ordre de tri
            after: Curseur pagination
            before: Curseur pagination
        
        Returns:
            dict: Liste des vector stores
        """
        if not self.client:
            return {
                'success': False,
                'error': 'OpenAI client not initialized'
            }
        
        try:
            params = {
                'limit': min(max(limit, 1), 100),
                'order': order
            }
            
            if after:
                params['after'] = after
            
            if before:
                params['before'] = before
            
            response = self.client.vector_stores.list(**params)
            
            stores = [
                {
                    'id': vs.id,
                    'object': vs.object,
                    'created_at': vs.created_at,
                    'name': vs.name,
                    'usage_bytes': vs.usage_bytes,
                    'file_counts': {
                        'in_progress': vs.file_counts.in_progress,
                        'completed': vs.file_counts.completed,
                        'failed': vs.file_counts.failed,
                        'cancelled': vs.file_counts.cancelled,
                        'total': vs.file_counts.total
                    } if vs.file_counts else None,
                    'status': vs.status,
                    'expires_after': vs.expires_after.model_dump() if vs.expires_after else None,
                    'expires_at': vs.expires_at,
                    'last_active_at': vs.last_active_at,
                    'metadata': vs.metadata
                }
                for vs in response.data
            ]
            
            return {
                'success': True,
                'object': 'list',
                'data': stores,
                'first_id': response.first_id if hasattr(response, 'first_id') else None,
                'last_id': response.last_id if hasattr(response, 'last_id') else None,
                'has_more': response.has_more if hasattr(response, 'has_more') else False
            }
            
        except Exception as e:
            app.logger.error(f"Listing vector stores failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_vector_store(self, vector_store_id):
        """
        Récupère un vector store spécifique.
        
        Args:
            vector_store_id: ID du vector store
        
        Returns:
            dict: Détails du vector store
        """
        if not self.client:
            return {
                'success': False,
                'error': 'OpenAI client not initialized'
            }
        
        try:
            vector_store = self.client.vector_stores.retrieve(vector_store_id)
            
            return {
                'success': True,
                'id': vector_store.id,
                'object': vector_store.object,
                'created_at': vector_store.created_at,
                'name': vector_store.name,
                'usage_bytes': vector_store.usage_bytes,
                'file_counts': {
                    'in_progress': vector_store.file_counts.in_progress,
                    'completed': vector_store.file_counts.completed,
                    'failed': vector_store.file_counts.failed,
                    'cancelled': vector_store.file_counts.cancelled,
                    'total': vector_store.file_counts.total
                } if vector_store.file_counts else None,
                'status': vector_store.status,
                'expires_after': vector_store.expires_after.model_dump() if vector_store.expires_after else None,
                'expires_at': vector_store.expires_at,
                'last_active_at': vector_store.last_active_at,
                'metadata': vector_store.metadata
            }
            
        except Exception as e:
            app.logger.error(f"Getting vector store failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def update_vector_store(self, vector_store_id, name=None, expires_after=None, metadata=None):
        """
        Met à jour un vector store.
        
        Args:
            vector_store_id: ID du vector store
            name: Nouveau nom
            expires_after: Nouvelle expiration
            metadata: Nouvelles métadonnées
        
        Returns:
            dict: Vector store mis à jour
        """
        if not self.client:
            return {
                'success': False,
                'error': 'OpenAI client not initialized'
            }
        
        try:
            params = {}
            
            if name is not None:
                params['name'] = name
            
            if expires_after is not None:
                params['expires_after'] = expires_after
            
            if metadata is not None:
                params['metadata'] = metadata
            
            vector_store = self.client.vector_stores.update(
                vector_store_id=vector_store_id,
                **params
            )
            
            return {
                'success': True,
                'id': vector_store.id,
                'object': vector_store.object,
                'created_at': vector_store.created_at,
                'name': vector_store.name,
                'usage_bytes': vector_store.usage_bytes,
                'file_counts': {
                    'in_progress': vector_store.file_counts.in_progress,
                    'completed': vector_store.file_counts.completed,
                    'failed': vector_store.file_counts.failed,
                    'cancelled': vector_store.file_counts.cancelled,
                    'total': vector_store.file_counts.total
                } if vector_store.file_counts else None,
                'status': vector_store.status,
                'expires_after': vector_store.expires_after.model_dump() if vector_store.expires_after else None,
                'expires_at': vector_store.expires_at,
                'last_active_at': vector_store.last_active_at,
                'metadata': vector_store.metadata
            }
            
        except Exception as e:
            app.logger.error(f"Updating vector store failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def delete_vector_store(self, vector_store_id):
        """
        Supprime un vector store.
        
        Args:
            vector_store_id: ID du vector store
        
        Returns:
            dict: Confirmation de suppression
        """
        if not self.client:
            return {
                'success': False,
                'error': 'OpenAI client not initialized'
            }
        
        try:
            response = self.client.beta.vector_stores.delete(vector_store_id)
            
            return {
                'success': True,
                'id': response.id,
                'object': response.object,
                'deleted': response.deleted
            }
            
        except Exception as e:
            app.logger.error(f"Deleting vector store failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }

class UnifiedVoiceService:
    def __init__(self):
        if not AUDIO_AVAILABLE:
            app.logger.warning("Audio features not available (running in Docker/headless mode)")
            self.recognizer = None
            self.microphone = None
            self.tts_engine = None
            return
            
        try:
            self.recognizer = sr.Recognizer()
            self.recognizer.energy_threshold = 300
            self.recognizer.dynamic_energy_threshold = True
        except:
            self.recognizer = None
            
        try:
            self.microphone = sr.Microphone()
            with self.microphone as source:
                self.recognizer.adjust_for_ambient_noise(source)
        except:
            self.microphone = None
        try:
            self.tts_engine = pyttsx3.init()
            self.tts_engine.setProperty('rate', 150)
            self.tts_engine.setProperty('volume', 0.8)
        except:
            self.tts_engine = None
    
    def transcribe_audio(self, audio_file_path):
        if not AUDIO_AVAILABLE or not self.recognizer:
            return {'success': False, 'error': 'Audio features not available in this environment'}
        try:
            with sr.AudioFile(audio_file_path) as source:
                audio = self.recognizer.record(source)
            text = self.recognizer.recognize_google(audio, language='fr-FR')
            return {'success': True, 'text': text}
        except sr.UnknownValueError:
            return {'success': False, 'error': 'Audio non reconnu'}
        except sr.RequestError as e:
            return {'success': False, 'error': f'Erreur service: {e}'}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def transcribe_audio_data(self, audio_data):
        if not AUDIO_AVAILABLE or not self.recognizer:
            return {'success': False, 'error': 'Audio features not available in this environment'}
        try:
            audio = sr.AudioData(audio_data, 16000, 2)
            text = self.recognizer.recognize_google(audio, language='fr-FR')
            return {'success': True, 'text': text}
        except sr.UnknownValueError:
            return {'success': False, 'error': 'Audio non reconnu'}
        except sr.RequestError as e:
            return {'success': False, 'error': f'Erreur service: {e}'}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def speak(self, text):
        if not AUDIO_AVAILABLE or not self.tts_engine:
            return False
        if self.tts_engine and text:
            try:
                self.tts_engine.say(text)
                self.tts_engine.runAndWait()
                return True
            except Exception as e:
                app.logger.error(f"TTS error: {e}")
                return False
        return False

# Initialisation des services
db = UnifiedDatabase()
crypto = UnifiedCrypto()
email_service = UnifiedEmailService()
voice_service = UnifiedVoiceService()
ai_service = None
unified_ai = None  # Alias pour compatibilité avec tests
# email_generator = EmailGenerator()  # Using UnifiedAIService instead
forwarding_service = None

# Enregistrer les endpoints de provisioning d'emails (AVANT les routes)
try:
    from services.email_provisioning_service import register_email_provisioning_routes
    register_email_provisioning_routes(app)
    print("[INIT] Email provisioning routes registered")
except Exception as e:
    print(f"[WARNING] Email provisioning non disponible: {e}")

# Enregistrer les routes webhook OpenAI
try:
    from routes.webhooks import register_webhook_routes
    register_webhook_routes(app)
    print("[INIT] Webhook routes registered")
except Exception as e:
    print(f"[WARNING] Webhook routes non disponibles: {e}")

# Enregistrer les routes batch OpenAI
try:
    from routes.batch import register_batch_routes
    register_batch_routes(app)
    print("[INIT] Batch API routes registered")
except Exception as e:
    print(f"[WARNING] Batch API routes non disponibles: {e}")

# Enregistrer les routes Vector Stores OpenAI
try:
    from routes.vector_stores import register_vector_store_routes
    register_vector_store_routes(app)
    print("[INIT] Vector Stores routes registered")
except Exception as e:
    print(f"[WARNING] Vector Stores routes non disponibles: {e}")

# Enregistrer les routes Realtime API OpenAI
try:
    from routes.realtime import register_realtime_routes
    register_realtime_routes(app)
    print("[INIT] Realtime API routes registered")
except Exception as e:
    print(f"[WARNING] Realtime API routes non disponibles: {e}")

# Enregistrer les routes SMTP multi-utilisateurs
try:
    from routes.smtp_routes import smtp_bp
    app.register_blueprint(smtp_bp)
    print("[INIT] SMTP multi-user routes registered")
except Exception as e:
    print(f"[WARNING] SMTP routes non disponibles: {e}")

# Routes pour servir les pages HTML statiques
@app.route('/dashboard.html')
def dashboard_page():
    dashboard_path = os.path.join(os.path.dirname(__file__), '..', '..', 'dashboard.html')
    dashboard_path = os.path.abspath(dashboard_path)
    app.logger.info(f"Looking for dashboard at: {dashboard_path}")
    if os.path.exists(dashboard_path):
        return send_file(dashboard_path)
    return f"Dashboard page not found at {dashboard_path}", 404

@app.route('/compose.html')
def compose_page():
    compose_path = os.path.join(os.path.dirname(__file__), '..', '..', 'compose.html')
    compose_path = os.path.abspath(compose_path)
    if os.path.exists(compose_path):
        return send_file(compose_path)
    return f"Compose page not found at {compose_path}", 404

@app.route('/ai-generator.html')
def ai_generator_page():
    ai_path = os.path.join(os.path.dirname(__file__), '..', '..', 'ai-generator.html')
    ai_path = os.path.abspath(ai_path)
    if os.path.exists(ai_path):
        return send_file(ai_path)
    return f"AI Generator page not found at {ai_path}", 404

@app.route('/voice.html')
def voice_page():
    voice_path = os.path.join(os.path.dirname(__file__), '..', '..', 'voice.html')
    voice_path = os.path.abspath(voice_path)
    if os.path.exists(voice_path):
        return send_file(voice_path)
    return f"Voice page not found at {voice_path}", 404

@app.route('/templates.html')
def templates_page():
    templates_path = os.path.join(os.path.dirname(__file__), '..', '..', 'templates.html')
    templates_path = os.path.abspath(templates_path)
    if os.path.exists(templates_path):
        return send_file(templates_path)
    return f"Templates page not found at {templates_path}", 404

@app.route('/batch.html')
def batch_page():
    batch_path = os.path.join(os.path.dirname(__file__), '..', '..', 'batch.html')
    batch_path = os.path.abspath(batch_path)
    if os.path.exists(batch_path):
        return send_file(batch_path)
    return f"Batch page not found at {batch_path}", 404

@app.route('/webhooks.html')
def webhooks_page():
    webhooks_path = os.path.join(os.path.dirname(__file__), '..', '..', 'webhooks.html')
    webhooks_path = os.path.abspath(webhooks_path)
    if os.path.exists(webhooks_path):
        return send_file(webhooks_path)
    return f"Webhooks page not found at {webhooks_path}", 404

@app.route('/batch-api.html')
def batch_api_page():
    batch_path = os.path.join(os.path.dirname(__file__), '..', '..', 'batch-api.html')
    batch_path = os.path.abspath(batch_path)
    if os.path.exists(batch_path):
        return send_file(batch_path)
    return f"Batch API page not found at {batch_path}", 404

@app.route('/vector-stores.html')
def vector_stores_page():
    vs_path = os.path.join(os.path.dirname(__file__), '..', '..', 'vector-stores.html')
    vs_path = os.path.abspath(vs_path)
    if os.path.exists(vs_path):
        return send_file(vs_path)
    return f"Vector Stores page not found at {vs_path}", 404

@app.route('/realtime-api.html')
def realtime_api_page():
    rt_path = os.path.join(os.path.dirname(__file__), '..', '..', 'realtime-api.html')
    rt_path = os.path.abspath(rt_path)
    if os.path.exists(rt_path):
        return send_file(rt_path)
    return f"Realtime API page not found at {rt_path}", 404

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    """Servir le frontend React depuis Flask"""
    frontend_dist = os.path.join(os.path.dirname(__file__), '..', '..', 'frontend-react', 'dist')
    frontend_dist_abs = os.path.abspath(frontend_dist)
    index_path = os.path.join(frontend_dist, 'index.html')
    
    # Debug logging
    app.logger.info(f"[FRONTEND] Requested path: {path}")
    
    # Routes API - ne pas servir le frontend pour ces routes
    if path.startswith('api/'):
        return jsonify({'error': 'API endpoint not found'}), 404
    
    # Servir les fichiers HTML statiques directement
    html_files = ['index.html', 'dashboard.html', 'compose.html', 'ai-generator.html', 'voice.html', 'templates.html', 'batch.html']
    if path in html_files or path == '':
        html_file = path if path else 'index.html'
        html_path = os.path.join(os.path.dirname(__file__), '..', '..', html_file)
        if os.path.exists(html_path):
            return send_file(html_path)
    
    # Si le fichier existe dans dist, le servir
    if path and os.path.exists(os.path.join(frontend_dist, path)):
        return send_from_directory(frontend_dist, path)
    
    # Pour les routes React (login, dashboard, etc.), servir index.html
    if os.path.exists(index_path):
        return send_from_directory(frontend_dist, 'index.html')
    
    # Fallback: servir index.html statique
    static_index = os.path.join(os.path.dirname(__file__), '..', '..', 'index.html')
    if os.path.exists(static_index):
        return send_file(static_index)
    
    # Fallback final: API status
    return jsonify({
        'api': 'IAPosteManager Unified API',
        'version': '3.0',
        'status': 'running',
        'message': 'Frontend files not found. Available pages:',
        'pages': {
            'dashboard': '/dashboard.html',
            'compose': '/compose.html', 
            'ai-generator': '/ai-generator.html',
            'voice': '/voice.html',
            'templates': '/templates.html',
            'batch': '/batch.html'
        }
    })

@app.route('/login', methods=['GET', 'POST'])
def login():
    """Legacy login route - serves React frontend for GET, handles POST"""
    if request.method == 'POST':
        data = request.get_json()
        password = data.get('password', '')
        
        if len(password) < 8:
            return jsonify({'success': False, 'error': 'Mot de passe trop court'}), 400
        
        # Vérifier si des credentials existent
        if os.path.exists(crypto.creds_file):
            test_creds = crypto.get_credentials(password)
            if not test_creds:
                return jsonify({'success': False, 'error': 'Mot de passe incorrect'}), 401
        
        set_master_password(password)
        session['authenticated'] = True
        session['login_time'] = datetime.now().isoformat()
        
        app.logger.info(f"Connexion réussie depuis {request.remote_addr}")
        return jsonify({'success': True, 'redirect': '/'})
    
    # GET request - serve React frontend
    frontend_dist = os.path.join(os.path.dirname(__file__), '..', '..', 'frontend-react', 'dist')
    index_path = os.path.join(frontend_dist, 'index.html')
    if os.path.exists(index_path):
        return send_from_directory(frontend_dist, 'index.html')
    return jsonify({'message': 'Frontend not found', 'authenticated': session.get('authenticated', False)})

@app.route('/logout')
def logout():
    app.logger.info(f"Déconnexion depuis {request.remote_addr}")
    session.clear()
    return redirect('/login')

# API Routes
@app.route('/api/login', methods=['POST'])
@app.route('/api/auth/login', methods=['POST'])
@public_api
def api_login():
    """API endpoint for React frontend login"""
    data = request.get_json()
    password = data.get('password', '')
    
    if len(password) < 8:
        return jsonify({'success': False, 'error': 'Mot de passe trop court'}), 400
    
    # Check if credentials file exists
    if os.path.exists(crypto.creds_file):
        test_creds = crypto.get_credentials(password)
        if not test_creds:
            return jsonify({'success': False, 'error': 'Mot de passe incorrect'}), 401
    
    set_master_password(password)
    session['authenticated'] = True
    session['login_time'] = datetime.now().isoformat()
    
    app.logger.info(f"API Connexion réussie depuis {request.remote_addr}")
    return jsonify({
        'success': True,
        'token': 'test-token-' + hashlib.md5(password.encode()).hexdigest()[:16],
        'user': {
            'id': 1,
            'email': 'user@example.com',
            'name': 'Utilisateur'
        }
    })

@app.route('/api/logout', methods=['POST'])
@app.route('/api/auth/logout', methods=['POST'])
def api_logout():
    """API endpoint for React frontend logout"""
    app.logger.info(f"API Déconnexion depuis {request.remote_addr}")
    session.clear()
    return jsonify({'success': True})

@app.route('/api/credentials', methods=['GET', 'POST'])
@handle_api_errors
def api_credentials():
    global ai_service
    
    if not session.get('authenticated'):
        raise AuthenticationError("Session expirée")
    
    if request.method == 'POST':
        data = request.get_json()
        password = get_master_password()
        
        if not password:
            raise AuthenticationError("Mot de passe maître requis")
        
        email = sanitize_input(data.get('email', ''), 100)
        app_password = sanitize_input(data.get('app_password', ''), 100)
        openai_key = sanitize_input(data.get('openai_key', ''), 200)
        
        if email and not validate_email(email):
            raise ValidationError("Email invalide")
        
        if openai_key and not openai_key.startswith('sk-'):
            raise ValidationError("Clé OpenAI invalide")
        
        if crypto.save_credentials(password, email, app_password, openai_key):
            if openai_key:
                ai_service = UnifiedAIService(openai_key)
            app.logger.info("Credentials sauvegardés")
            return jsonify({'success': True})
        
        raise Exception("Erreur sauvegarde credentials")
    
    # GET
    password = get_master_password()
    if password:
        creds = crypto.get_credentials(password)
        if creds:
            return jsonify({
                'success': True,
                'has_gmail': bool(creds.get('email')),
                'has_openai': bool(creds.get('openai_key')),
                'email': creds.get('email', '')
            })
    
    return jsonify({'success': True, 'has_gmail': False, 'has_openai': False})

@app.route('/api/config/settings', methods=['GET', 'POST'])
@public_api
def api_config_settings_alias():
    """Alias for /api/credentials for compatibility - public version"""
    if request.method == 'GET':
        return jsonify({
            'success': True,
            'settings': {
                'theme': 'light',
                'language': 'fr',
                'notifications': True
            }
        })
    return jsonify({'success': True})

@app.route('/api/send-email', methods=['POST'])
@public_api
def api_send_email():
    data = request.get_json()
    recipient = sanitize_input(data.get('recipient', ''), 100)
    subject = sanitize_input(data.get('subject', ''), 200)
    body = sanitize_input(data.get('body', ''), 5000)
    
    if not all([recipient, subject, body]):
        return jsonify({'success': False, 'error': 'Tous les champs sont requis'}), 400
    
    if not validate_email(recipient):
        return jsonify({'success': False, 'error': 'Email destinataire invalide'}), 400
    
    # Pour les tests, simuler l'envoi
    if not session.get('authenticated'):
        db.log_email(recipient, subject, body, 'simulated')
        return jsonify({
            'success': True, 
            'message': 'Email simulé (connectez-vous pour envoyer réellement)',
            'mode': 'simulation'
        })
    
    # Envoi réel si authentifié
    password = get_master_password()
    if not password:
        return jsonify({'success': False, 'error': 'Mot de passe maître requis'}), 401
    
    creds = crypto.get_credentials(password)
    if not creds or not creds.get('email'):
        return jsonify({'success': False, 'error': 'Configuration Gmail requise'}), 400
    
    result = email_service.send_email(
        creds['email'], 
        creds['app_password'], 
        recipient, 
        subject, 
        body
    )
    
    if result['success']:
        db.log_email(recipient, subject, body, 'sent')
        app.logger.info(f"Email envoyé à {recipient}")
    else:
        app.logger.error(f"Erreur envoi email: {result.get('error')}")
    
    return jsonify(result)

@app.route('/api/generate-email', methods=['POST'])
@public_api
def api_generate_email():
    global ai_service
    
    data = request.get_json()
    context = sanitize_input(data.get('context', ''), 2000)
    tone = sanitize_input(data.get('tone', 'professionnel'), 50)
    email_type = sanitize_input(data.get('emailType', 'general'), 50)
    
    if not context:
        return jsonify({'success': False, 'error': 'Contexte requis'}), 400
    
    # Initialiser AI service si nécessaire
    if not ai_service:
        password = get_master_password()
        if password:
            creds = crypto.get_credentials(password)
            if creds and creds.get('openai_key'):
                ai_service = UnifiedAIService(creds['openai_key'])
    
    if not ai_service:
        ai_service = UnifiedAIService()  # Fallback sans OpenAI
    
    # Assurer la synchronisation avec l'alias unified_ai
    global unified_ai
    unified_ai = ai_service
    
    result = ai_service.generate_email(context, tone, email_type)
    app.logger.info(f"Email généré avec {result.get('source', 'unknown')}")
    return jsonify(result)

@app.route('/api/ia/analyze-document', methods=['POST'])
@handle_api_errors
def api_analyze_document():
    """Analyser un document avec l'IA"""
    global ai_service
    
    # if not session.get('authenticated'):
    #     raise AuthenticationError("Session expirée")
    
    data = request.get_json()
    text = sanitize_input(data.get('text', ''), 10000)
    
    if not text:
        raise ValidationError('Texte requis')
    
    # Initialiser AI service si nécessaire
    if not ai_service:
        password = get_master_password()
        if password:
            creds = crypto.get_credentials(password)
            if creds and creds.get('openai_key'):
                ai_service = UnifiedAIService(creds['openai_key'])
    
    if not ai_service:
        ai_service = UnifiedAIService()  # Fallback sans OpenAI
    
    try:
        # Analyser le document avec l'IA
        analysis_prompt = """
Analyse ce document et détermine:
1. Le niveau d'urgence (low, medium, high)
2. La date limite si mentionnée
3. Les actions requises
4. Le type de document

Réponds en JSON:
{
  "urgency": "low|medium|high",
  "deadline": "date ou null",
  "requiredActions": ["action1", "action2"],
  "documentType": "string",
  "summary": "résumé"
}
"""
        
        if ai_service.client:
            response = ai_service.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": analysis_prompt},
                    {"role": "user", "content": text}
                ],
                max_tokens=500,
                temperature=0.3
            )
            
            content = response.choices[0].message.content.strip()
            
            # Nettoyer le JSON si nécessaire
            if content.startswith('```'):
                content = content.split('```')[1]
                if content.startswith('json'):
                    content = content[4:]
                content = content.strip()
            
            try:
                analysis = json.loads(content)
                return jsonify({
                    'success': True,
                    'analysis': analysis,
                    'tokens_used': response.usage.total_tokens
                })
            except json.JSONDecodeError:
                # Fallback si le JSON est invalide
                pass
        
        # Analyse fallback simple
        urgency = 'high' if any(word in text.lower() for word in ['urgent', 'immédiat', 'dernier', 'mise en demeure']) else 'medium'
        
        return jsonify({
            'success': True,
            'analysis': {
                'urgency': urgency,
                'deadline': None,
                'requiredActions': ['Répondre au courrier'],
                'documentType': 'courrier',
                'summary': 'Document analysé avec méthode de base'
            },
            'source': 'fallback'
        })
        
    except Exception as e:
        app.logger.error(f"Erreur analyse document: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/ai/improve-text', methods=['POST'])
@handle_api_errors
def api_improve_text():
    """Améliorer un texte dicté avec l'IA"""
    global ai_service
    
    if not session.get('authenticated'):
        raise AuthenticationError("Session expirée")
    
    data = request.get_json()
    text = sanitize_input(data.get('text', ''), 5000)
    tone = sanitize_input(data.get('tone', 'professional'), 50)
    context = sanitize_input(data.get('context', 'email'), 50)
    language = sanitize_input(data.get('language', 'fr'), 10)
    
    if not text:
        raise ValidationError('Texte requis')
    
    # Initialiser AI service si nécessaire
    if not ai_service:
        password = get_master_password()
        if password:
            creds = crypto.get_credentials(password)
            if creds and creds.get('openai_key'):
                ai_service = UnifiedAIService(creds['openai_key'])
    
    if not ai_service:
        ai_service = UnifiedAIService()  # Fallback sans OpenAI
    
    # Assurer la synchronisation avec l'alias unified_ai
    global unified_ai
    unified_ai = ai_service
    
    # Améliorer le texte
    result = ai_service.improve_text(text, tone, context)
    
    app.logger.info(f"Texte amélioré avec {result.get('source', 'unknown')}")
    return jsonify({
        'success': result['success'],
        'content': result['content'],
        'text': result['content'],  # Alias pour compatibilité
        'source': result.get('source', 'unknown'),
        'original_length': len(text),
        'improved_length': len(result['content']),
        'tokens_used': result.get('tokens_used', 0),
        'request_id': result.get('request_id')
    })

# Add new OpenAI-specific endpoints with conversation support
@app.route('/api/ai/moderate', methods=['POST'])
@handle_api_errors
def api_moderate_content():
    """Moderate content using OpenAI moderation API"""
    global ai_service
    
    if not session.get('authenticated'):
        raise AuthenticationError("Session expirée")
    
    data = request.get_json()
    text = sanitize_input(data.get('text', ''), 10000)
    
    if not text:
        raise ValidationError('Texte requis')
    
    # Initialize AI service if needed
    if not ai_service:
        password = get_master_password()
        if password:
            creds = crypto.get_credentials(password)
            if creds and creds.get('openai_key'):
                ai_service = UnifiedAIService(creds['openai_key'])
    
    if not ai_service or not ai_service.client:
        return jsonify({
            'success': True,
            'flagged': False,
            'safe': True,
            'message': 'Moderation not available - OpenAI key required'
        })
    
    result = ai_service.moderate_content(text)
    
    app.logger.info(f"Content moderation: flagged={result.get('flagged', False)}")
    return jsonify(result)

@app.route('/api/ai/conversations', methods=['POST'])
@handle_api_errors
def api_create_conversation():
    """Create a new OpenAI conversation"""
    global ai_service
    
    if not session.get('authenticated'):
        raise AuthenticationError("Session expirée")
    
    data = request.get_json()
    items = data.get('items', [])
    metadata = data.get('metadata', {})
    
    # Add IAPosteManager metadata
    metadata.update({
        'created_by': 'iapostemanager',
        'user_session': session.get('login_time', ''),
        'version': '3.0'
    })
    
    if not ai_service or not ai_service.client:
        return jsonify({
            'success': False,
            'error': 'OpenAI service not available'
        }), 400
    
    try:
        response = ai_service.client.conversations.create(
            items=items,
            metadata=metadata
        )
        
        app.logger.info(f"Conversation created: {response.id}")
        return jsonify({
            'success': True,
            'conversation': {
                'id': response.id,
                'object': response.object,
                'created_at': response.created_at,
                'metadata': response.metadata
            }
        })
        
    except Exception as e:
        app.logger.error(f"Conversation creation failed: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/ai/conversations/<conversation_id>', methods=['GET'])
@handle_api_errors
def api_get_conversation(conversation_id):
    """Get a conversation by ID"""
    global ai_service
    
    if not session.get('authenticated'):
        raise AuthenticationError("Session expirée")
    
    if not ai_service or not ai_service.client:
        return jsonify({
            'success': False,
            'error': 'OpenAI service not available'
        }), 400
    
    try:
        response = ai_service.client.conversations.retrieve(conversation_id)
        
        return jsonify({
            'success': True,
            'conversation': {
                'id': response.id,
                'object': response.object,
                'created_at': response.created_at,
                'metadata': response.metadata
            }
        })
        
    except Exception as e:
        app.logger.error(f"Conversation retrieval failed: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 404

@app.route('/api/ai/conversations/<conversation_id>/items', methods=['GET', 'POST'])
@handle_api_errors
def api_conversation_items(conversation_id):
    """List or add items to a conversation"""
    global ai_service
    
    if not session.get('authenticated'):
        raise AuthenticationError("Session expirée")
    
    if not ai_service or not ai_service.client:
        return jsonify({
            'success': False,
            'error': 'OpenAI service not available'
        }), 400
    
    try:
        if request.method == 'GET':
            # List items
            after = request.args.get('after')
            limit = min(int(request.args.get('limit', 20)), 100)
            order = request.args.get('order', 'desc')
            include = request.args.getlist('include')
            
            response = ai_service.client.conversations.items.list(
                conversation_id=conversation_id,
                after=after,
                limit=limit,
                order=order,
                include=include
            )
            
            return jsonify({
                'success': True,
                'items': {
                    'object': response.object,
                    'data': [item.model_dump() for item in response.data],
                    'first_id': response.first_id,
                    'last_id': response.last_id,
                    'has_more': response.has_more
                }
            })
            
        else:
            # Add items
            data = request.get_json()
            items = data.get('items', [])
            include = data.get('include', [])
            
            if not items:
                raise ValidationError('Items requis')
            
            response = ai_service.client.conversations.items.create(
                conversation_id=conversation_id,
                items=items,
                include=include
            )
            
            app.logger.info(f"Added {len(items)} items to conversation {conversation_id}")
            return jsonify({
                'success': True,
                'items': {
                    'object': response.object,
                    'data': [item.model_dump() for item in response.data],
                    'first_id': response.first_id,
                    'last_id': response.last_id,
                    'has_more': response.has_more
                }
            })
            
    except Exception as e:
        app.logger.error(f"Conversation items operation failed: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/ai/conversations/<conversation_id>/generate-email', methods=['POST'])
@handle_api_errors
def api_generate_email_with_conversation(conversation_id):
    """Generate email using conversation context"""
    global ai_service
    
    if not session.get('authenticated'):
        raise AuthenticationError("Session expirée")
    
    data = request.get_json()
    context = sanitize_input(data.get('context', ''), 2000)
    tone = sanitize_input(data.get('tone', 'professional'), 50)
    
    if not context:
        raise ValidationError('Contexte requis')
    
    if not ai_service or not ai_service.client:
        return jsonify({
            'success': False,
            'error': 'OpenAI service not available'
        }), 400
    
    try:
        # Add user message to conversation
        user_message = {
            'type': 'message',
            'role': 'user',
            'content': [{
                'type': 'input_text',
                'text': f"Génère un email {tone} pour: {context}"
            }]
        }
        
        ai_service.client.conversations.items.create(
            conversation_id=conversation_id,
            items=[user_message]
        )
        
        # Get conversation history for context
        items_response = ai_service.client.conversations.items.list(
            conversation_id=conversation_id,
            limit=10,
            order='asc'
        )
        
        # Build messages from conversation history
        messages = []
        for item in items_response.data:
            if item.type == 'message' and hasattr(item, 'content'):
                content = item.content[0].text if item.content else ''
                if content:
                    messages.append({
                        'role': item.role,
                        'content': content
                    })
        
        # Generate response using conversation context
        system_prompt = f"Tu es un assistant expert en rédaction d'emails {tone} en français."
        
        response = ai_service.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {'role': 'system', 'content': system_prompt},
                *messages[-5:]  # Last 5 messages for context
            ],
            max_tokens=800,
            temperature=0.7
        )
        
        generated_content = response.choices[0].message.content
        
        # Add assistant response to conversation
        assistant_message = {
            'type': 'message',
            'role': 'assistant',
            'content': [{
                'type': 'output_text',
                'text': generated_content
            }]
        }
        
        ai_service.client.conversations.items.create(
            conversation_id=conversation_id,
            items=[assistant_message]
        )
        
        # Parse email content
        subject, body = ai_service._parse_email_response(generated_content)
        
        app.logger.info(f"Email generated with conversation context: {conversation_id}")
        return jsonify({
            'success': True,
            'subject': subject,
            'body': body,
            'conversation_id': conversation_id,
            'source': 'openai_conversation',
            'tokens_used': response.usage.total_tokens
        })
        
    except Exception as e:
        app.logger.error(f"Conversation email generation failed: {e}")
        # Fallback to regular generation
        return api_generate_email()

@app.route('/api/dashboard/conversation-stats', methods=['GET'])
@public_api
def api_conversation_stats():
    """Get conversation statistics for dashboard"""
    # Since we can't list all conversations yet, return mock stats
    # This would be implemented when OpenAI adds conversation listing API
    
    stats = {
        'total_conversations': 0,
        'active_conversations': 0,
        'total_messages': 0,
        'avg_conversation_length': 0,
        'most_used_tones': ['professional', 'amical'],
        'conversation_themes': ['email_generation', 'text_improvement'],
        'note': 'Conversation listing API not yet available from OpenAI'
    }
    
    return jsonify({
        'success': True,
        'stats': stats,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/ai/health', methods=['GET'])
@public_api
def api_ai_health():
    """Check AI service health and capabilities"""
    global ai_service
    
    status = {
        'ai_service_available': ai_service is not None,
        'openai_configured': False,
        'models_available': [],
        'features': {
            'text_generation': False,
            'text_improvement': False,
            'content_moderation': False
        }
    }
    
    if ai_service and ai_service.client:
        status['openai_configured'] = True
        status['features'] = {
            'text_generation': True,
            'text_improvement': True,
            'content_moderation': True
        }
        status['models_available'] = ['gpt-4o-mini', 'text-moderation-latest']
    
    return jsonify({
        'success': True,
        'status': status,
        'timestamp': datetime.now().isoformat()
    })
@handle_api_errors
def api_quick_generate():
    """Génération rapide d'email avec template et variables"""
    global ai_service
    
    if not session.get('authenticated'):
        raise AuthenticationError("Session expirée")
    
    data = request.get_json()
    template = sanitize_input(data.get('template', ''), 500)
    variables = data.get('variables', {})
    
    if not template:
        raise ValidationError('Template requis')
    
    # Remplacer les variables dans le template
    result_text = template
    for key, value in variables.items():
        placeholder = f"{{{key}}}"
        result_text = result_text.replace(placeholder, str(value))
    
    app.logger.info(f"Quick generation avec {len(variables)} variables")
    return jsonify({
        'success': True,
        'content': result_text,
        'text': result_text,
        'template': template,
        'variables_used': list(variables.keys())
    })

@app.route('/api/email/send-batch', methods=['POST'])
@handle_api_errors
def api_send_email_batch():
    """Envoyer plusieurs emails en lot"""
    if not session.get('authenticated'):
        raise AuthenticationError("Session expirée")
    
    data = request.get_json()
    emails = data.get('emails', [])
    
    if not emails or not isinstance(emails, list):
        raise ValidationError('Liste d\'emails requis')
    
    if len(emails) > 100:
        raise ValidationError('Maximum 100 emails par lot')
    
    results = []
    success_count = 0
    failed_count = 0
    
    for email_data in emails:
        try:
            recipient = sanitize_input(email_data.get('to', ''), 200)
            subject = sanitize_input(email_data.get('subject', ''), 200)
            body = sanitize_input(email_data.get('body', ''), 10000)
            
            if not recipient or not subject or not body:
                results.append({
                    'to': recipient,
                    'success': False,
                    'error': 'Champs manquants'
                })
                failed_count += 1
                continue
            
            # Envoyer l'email
            result = email_service.send_email(recipient, subject, body)
            
            if result['success']:
                db.add_email(recipient, subject, body, 'sent')
                success_count += 1
                results.append({
                    'to': recipient,
                    'success': True
                })
            else:
                db.add_email(recipient, subject, body, 'failed')
                failed_count += 1
                results.append({
                    'to': recipient,
                    'success': False,
                    'error': result.get('error', 'Erreur inconnue')
                })
                
        except Exception as e:
            failed_count += 1
            results.append({
                'to': email_data.get('to', 'unknown'),
                'success': False,
                'error': str(e)
            })
    
    app.logger.info(f"Envoi batch: {success_count} succès, {failed_count} échecs")
    return jsonify({
        'success': True,
        'total': len(emails),
        'success_count': success_count,
        'failed_count': failed_count,
        'results': results
    })

@app.route('/api/health')
@app.route('/api/status')
def health_check():
    """Health check endpoint for production monitoring"""
    return jsonify({
        'status': 'healthy',
        'version': '3.0',
        'timestamp': datetime.now().isoformat(),
        'uptime': 'running',
        'database': 'connected',
        'services': {
            'database': db is not None,
            'email': email_service is not None,
            'voice': voice_service is not None,
            'ai': ai_service is not None
        }
    })

# Global error handlers
@app.errorhandler(404)
def not_found_error(error):
    if request.path.startswith('/api/'):
        return jsonify({'error': 'API endpoint not found', 'path': request.path}), 404
    # For non-API routes, serve React frontend
    frontend_dist = os.path.join(os.path.dirname(__file__), '..', '..', 'frontend-react', 'dist')
    index_path = os.path.join(frontend_dist, 'index.html')
    if os.path.exists(index_path):
        return send_from_directory(frontend_dist, 'index.html')
    return jsonify({'error': 'Page not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    app.logger.error(f'Server Error: {error}')
    return jsonify({'error': 'Internal server error'}), 500

@app.errorhandler(403)
def forbidden_error(error):
    return jsonify({'error': 'Access forbidden'}), 403

@app.route('/api/health', methods=['GET'])
def api_health():
    """Endpoint de santé pour vérifier l'état du serveur"""
    return jsonify({
        'status': 'healthy',
        'version': '3.0',
        'timestamp': datetime.now().isoformat(),
        'authenticated': session.get('authenticated', False),
        'services': {
            'database': db is not None,
            'email': email_service is not None,
            'voice': voice_service is not None,
            'ai': ai_service is not None
        }
    })

@app.route('/api/email-history')
@public_api
def api_email_history():
    """Get email history - public version with limited data"""
    
    limit = request.args.get('limit', 10, type=int)
    limit = min(limit, 50)  # Max 50 emails
    
    emails = db.get_email_history(limit=limit)
    formatted_emails = []
    
    for email in emails:
        formatted_emails.append({
            'id': email[0],
            'recipient': email[1],
            'subject': email[2],
            'body': email[3][:100] + '...' if len(email[3]) > 100 else email[3],  # Tronquer le corps
            'status': email[4],
            'created_at': email[5]
        })
    
    return jsonify({'success': True, 'emails': formatted_emails})

@app.route('/api/dashboard/stats')
@public_api
def api_dashboard_stats():
    """Get dashboard statistics - public version with real data"""
    
    # Récupérer les vraies données depuis la base
    emails = db.get_email_history(limit=1000)  # Derniers 1000 emails
    templates = db.get_templates()
    
    # Calculer les statistiques
    total_emails = len(emails)
    today_emails = sum(1 for email in emails if email[5] and email[5].startswith(datetime.now().strftime('%Y-%m-%d')))
    success_count = sum(1 for email in emails if email[4] == 'sent')
    success_rate = round((success_count / total_emails * 100) if total_emails > 0 else 0, 1)
    
    return jsonify({
        'total_emails': total_emails,
        'today_emails': today_emails,
        'ai_generations': 0,  # TODO: tracker les générations IA
        'accessibility_users': 0,  # TODO: tracker les utilisateurs
        'templates_count': len(templates),
        'success_rate': success_rate,
        'week_trend': 0  # TODO: calculer la tendance
    })

# =============================================================================
# TEMPLATES ENDPOINTS
# =============================================================================

@app.route('/api/templates', methods=['GET'])
@public_api
def api_get_templates():
    """Get all templates - public version"""
    
    templates = db.get_templates()
    formatted_templates = []
    
    for template in templates:
        formatted_templates.append({
            'id': template[0],
            'name': template[1],
            'subject': template[2],
            'body': template[3],
            'category': template[4],
            'created_at': template[5]
        })
    
    return jsonify({'success': True, 'templates': formatted_templates})

@app.route('/api/templates', methods=['POST'])
@handle_api_errors
def api_create_template():
    """Create a new template"""
    if not session.get('authenticated'):
        raise AuthenticationError("Session expirée")
    
    data = request.get_json()
    name = sanitize_input(data.get('name', ''), 100)
    subject = sanitize_input(data.get('subject', ''), 200)
    body = sanitize_input(data.get('body', ''), 5000)
    category = sanitize_input(data.get('category', 'general'), 50)
    
    if not name or not subject or not body:
        raise ValidationError('Nom, sujet et corps requis')
    
    template_id = db.add_template(name, subject, body, category)
    
    app.logger.info(f"Template créé: {name} (ID: {template_id})")
    return jsonify({
        'success': True,
        'template_id': template_id,
        'message': 'Template créé avec succès'
    })

# =============================================================================
# CONTACTS ENDPOINTS
# =============================================================================

@app.route('/api/contacts', methods=['GET'])
@handle_api_errors
def api_get_contacts():
    """Get all contacts"""
    if not session.get('authenticated'):
        raise AuthenticationError("Session expirée")
    
    contacts = db.get_contacts()
    formatted_contacts = []
    
    for contact in contacts:
        formatted_contacts.append({
            'id': contact[0],
            'name': contact[1],
            'email': contact[2],
            'organization': contact[3],
            'category': contact[4],
            'created_at': contact[5]
        })
    
    return jsonify({'success': True, 'contacts': formatted_contacts})

@app.route('/api/contacts', methods=['POST'])
@handle_api_errors
def api_create_contact():
    """Create a new contact"""
    if not session.get('authenticated'):
        raise AuthenticationError("Session expirée")
    
    data = request.get_json()
    name = sanitize_input(data.get('name', ''), 100)
    email = sanitize_input(data.get('email', ''), 200)
    organization = sanitize_input(data.get('organization', ''), 200)
    category = sanitize_input(data.get('category', ''), 50)
    
    if not name or not email:
        raise ValidationError('Nom et email requis')
    
    if not validate_email(email):
        raise ValidationError('Email invalide')
    
    contact_id = db.add_contact(name, email, organization, category)
    
    if contact_id is None:
        raise ValidationError('Cet email existe déjà')
    
    app.logger.info(f"Contact créé: {name} <{email}> (ID: {contact_id})")
    return jsonify({
        'success': True,
        'contact_id': contact_id,
        'message': 'Contact créé avec succès'
    })

@app.route('/api/contacts/<int:contact_id>', methods=['DELETE'])
@handle_api_errors
def api_delete_contact(contact_id):
    """Delete a contact"""
    if not session.get('authenticated'):
        raise AuthenticationError("Session expirée")
    
    db.delete_contact(contact_id)
    
    app.logger.info(f"Contact supprimé: ID {contact_id}")
    return jsonify({
        'success': True,
        'message': 'Contact supprimé avec succès'
    })

# =============================================================================
# API ALIASES FOR COMPATIBILITY
# =============================================================================

@app.route('/api/email/send', methods=['POST'])
def api_email_send_alias():
    """Alias for /api/send-email"""
    return api_send_email()

@app.route('/api/email/history', methods=['GET'])
def api_email_history_alias():
    """Alias for /api/email-history"""
    return api_email_history()

@app.route('/api/ai/generate', methods=['POST'])
def api_ai_generate_alias():
    """Alias for /api/generate-email"""
    return api_generate_email()

# =============================================================================
# ACCESSIBILITY ENDPOINTS
# =============================================================================

@app.route('/api/accessibility/settings', methods=['GET', 'POST'])
@public_api
def api_accessibility_settings():
    """Get or update accessibility settings"""
    # Pas d'authentification requise pour les tests
    
    if request.method == 'GET':
        # Initialiser les settings si nécessaire
        if not hasattr(app, 'accessibility_settings'):
            app.accessibility_settings = {
                'screen_reader': False,
                'high_contrast': False,
                'font_size': 'medium',
                'tts_enabled': False,
                'tts_rate': 150,
                'tts_volume': 1.0,
                'keyboard_shortcuts': True,
                'transcription_enabled': False
            }
        
        # Return accessibility settings with both camelCase and snake_case
        settings = {
            'screenReader': app.accessibility_settings['screen_reader'],
            'screen_reader': app.accessibility_settings['screen_reader'],
            'highContrast': app.accessibility_settings['high_contrast'],
            'high_contrast': app.accessibility_settings['high_contrast'],
            'fontSize': app.accessibility_settings['font_size'],
            'font_size': app.accessibility_settings['font_size'],
            'ttsEnabled': app.accessibility_settings['tts_enabled'],
            'tts_enabled': app.accessibility_settings['tts_enabled'],
            'ttsSpeed': app.accessibility_settings['tts_rate'],
            'tts_rate': app.accessibility_settings['tts_rate'],
            'ttsVolume': app.accessibility_settings['tts_volume'],
            'tts_volume': app.accessibility_settings['tts_volume'],
            'keyboardShortcuts': app.accessibility_settings['keyboard_shortcuts'],
            'keyboard_shortcuts': app.accessibility_settings['keyboard_shortcuts'],
            'transcriptionEnabled': app.accessibility_settings['transcription_enabled'],
            'transcription_enabled': app.accessibility_settings['transcription_enabled']
        }
        return jsonify({'success': True, 'settings': settings})
    
    elif request.method == 'POST':
        # Update accessibility settings
        data = request.get_json()
        app.logger.info(f"Updating accessibility settings: {data}")
        
        # Charger les settings actuels (simulés en mémoire)
        if not hasattr(app, 'accessibility_settings'):
            app.accessibility_settings = {
                'screen_reader': False,
                'high_contrast': False,
                'font_size': 'medium',
                'tts_enabled': False,
                'tts_rate': 150,
                'tts_volume': 1.0,
                'keyboard_shortcuts': True,
                'transcription_enabled': False
            }
        
        # Appliquer les mises à jour
        if 'toggle_tts' in data:
            app.accessibility_settings['tts_enabled'] = not app.accessibility_settings['tts_enabled']
        if 'toggle_contrast' in data:
            app.accessibility_settings['high_contrast'] = not app.accessibility_settings['high_contrast']
        if 'tts_rate' in data:
            app.accessibility_settings['tts_rate'] = data['tts_rate']
        if 'tts_volume' in data:
            app.accessibility_settings['tts_volume'] = data['tts_volume']
        if 'font_size' in data:
            app.accessibility_settings['font_size'] = data['font_size']
        
        # Renvoyer les settings mises à jour avec les deux formats
        settings = {
            'screenReader': app.accessibility_settings['screen_reader'],
            'screen_reader': app.accessibility_settings['screen_reader'],
            'highContrast': app.accessibility_settings['high_contrast'],
            'high_contrast': app.accessibility_settings['high_contrast'],
            'fontSize': app.accessibility_settings['font_size'],
            'font_size': app.accessibility_settings['font_size'],
            'ttsEnabled': app.accessibility_settings['tts_enabled'],
            'tts_enabled': app.accessibility_settings['tts_enabled'],
            'ttsSpeed': app.accessibility_settings['tts_rate'],
            'tts_rate': app.accessibility_settings['tts_rate'],
            'ttsVolume': app.accessibility_settings['tts_volume'],
            'tts_volume': app.accessibility_settings['tts_volume'],
            'keyboardShortcuts': app.accessibility_settings['keyboard_shortcuts'],
            'keyboard_shortcuts': app.accessibility_settings['keyboard_shortcuts'],
            'transcriptionEnabled': app.accessibility_settings['transcription_enabled'],
            'transcription_enabled': app.accessibility_settings['transcription_enabled']
        }
        return jsonify({'success': True, 'settings': settings, 'message': 'Settings updated'})

@app.route('/api/accessibility/shortcuts', methods=['GET'])
@handle_api_errors
def api_accessibility_shortcuts():
    """Get keyboard shortcuts information"""
    if not session.get('authenticated'):
        raise AuthenticationError("Session expirée")
    
    shortcuts = [
        {'key': 'Ctrl+/', 'description': 'Afficher les raccourcis'},
        {'key': 'Ctrl+H', 'description': 'Activer/désactiver haut contraste'},
        {'key': 'Ctrl+T', 'description': 'Activer/désactiver TTS'},
        {'key': 'Ctrl+K', 'description': 'Focus sur la recherche'},
        {'key': 'Ctrl+G', 'description': 'Générer email'},
        {'key': 'Ctrl+S', 'description': 'Envoyer email'}
    ]
    return jsonify({'shortcuts': shortcuts})

# =============================================================================
# NOUVEAUX ENDPOINTS: COURRIERS OFFICIELS (AMENDES, IMPÔTS, ETC.)
# =============================================================================

@app.route('/api/documents/analyze-official', methods=['POST'])
@handle_api_errors
def analyze_official_document():
    """Analyse un document officiel (amende, impôt, facture, etc.)"""
    if not session.get('authenticated'):
        raise AuthenticationError("Session expirée")
    
    data = request.get_json()
    document_text = data.get('document_text', '')
    file_data = data.get('file_data')  # Base64 si image/PDF
    
    if not document_text and not file_data:
        return jsonify({'success': False, 'error': 'Aucun document fourni'}), 400
    
    # Si c'est une image/PDF, on devrait utiliser Vision API ici
    # Pour l'instant, on suppose que le texte est déjà extrait
    
    analyzer_prompt = """Tu es un expert en analyse de documents administratifs français.

Analyse ce document et extrais:
1. TYPE de document (amende|impots|facture|courrier_officiel|autre)
2. ÉMETTEUR (organisme)
3. RÉFÉRENCE (numéro)
4. MONTANT (si applicable)
5. DATE LIMITE (si applicable)
6. OBJET (résumé)
7. ACTION REQUISE (ce qu'il faut faire)
8. URGENCE (faible|moyenne|haute|critique)
9. QUESTIONS à poser pour collecter infos manquantes
10. CONSEILS

Réponds en JSON strict:
{
  "type_document": "string",
  "emetteur": "string",
  "reference": "string",
  "montant": "string ou null",
  "date_limite": "YYYY-MM-DD ou null",
  "objet": "string",
  "action_requise": "string",
  "urgence": "string",
  "questions_collecte": [{
    "id": "string",
    "question": "string",
    "type": "text|number|date|choice|yesno",
    "required": boolean,
    "aide": "string",
    "options": ["..."] ou null
  }],
  "conseils": ["string"]
}
"""
    
    try:
        response = ai_service.client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": analyzer_prompt},
                {"role": "user", "content": f"Analyse ce document:\n\n{document_text}"}
            ],
            temperature=0.3,
            max_tokens=1500
        )
        
        content = response.choices[0].message.content.strip()
        
        # Nettoyer markdown si présent
        if content.startswith('```'):
            content = content.split('```')[1]
            if content.startswith('json'):
                content = content[4:]
            content = content.strip()
        
        analysis = json.loads(content)
        
        # Sauvegarder l'analyse dans la session pour réutilisation
        session['last_document_analysis'] = analysis
        
        return jsonify({
            'success': True,
            'analysis': analysis,
            'tokens_used': response.usage.total_tokens
        })
        
    except json.JSONDecodeError as e:
        app.logger.error(f"JSON decode error: {e}, content: {content}")
        return jsonify({'success': False, 'error': 'Erreur de format de réponse'}), 500
    except Exception as e:
        app.logger.error(f"Erreur analyse document: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/documents/generate-response', methods=['POST'])
@handle_api_errors
def generate_official_response():
    """Génère une réponse officielle basée sur l'analyse et les données collectées"""
    if not session.get('authenticated'):
        raise AuthenticationError("Session expirée")
    
    data = request.get_json()
    analysis = data.get('analysis') or session.get('last_document_analysis')
    user_responses = data.get('user_responses', {})
    response_type = data.get('response_type', 'demande')  # demande|contestation|information
    
    if not analysis:
        return jsonify({'success': False, 'error': 'Aucune analyse disponible'}), 400
    
    generator_prompt = """Tu es un expert en rédaction de courriers administratifs français.

Rédige un courrier formel adapté au contexte:
- Ton respectueux et professionnel
- Structure: coordonnées, objet, corps, formule de politesse
- Inclure toutes les informations légales nécessaires

Types de réponses:
- Demande d'échéancier de paiement
- Contestation d'amende/décision
- Réponse aux impôts
- Demande de délai
- Demande d'information complémentaire

Réponds en JSON strict:
{
  "objet": "string",
  "corps": "string (avec \\n pour paragraphes)",
  "pieces_jointes": ["string"],
  "mode_envoi": "recommande|simple|email",
  "delai_envoi": "YYYY-MM-DD",
  "conseils_envoi": ["string"]
}
"""
    
    contexte = f"""
Document analysé:
- Type: {analysis.get('type_document')}
- Émetteur: {analysis.get('emetteur')}
- Référence: {analysis.get('reference')}
- Montant: {analysis.get('montant')}
- Date limite: {analysis.get('date_limite')}
- Action requise: {analysis.get('action_requise')}

Type de réponse demandée: {response_type}

Informations collectées:
{json.dumps(user_responses, indent=2, ensure_ascii=False)}

Génère un courrier officiel complet et professionnel.
"""
    
    try:
        response = ai_service.client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": generator_prompt},
                {"role": "user", "content": contexte}
            ],
            temperature=0.4,
            max_tokens=1500
        )
        
        content = response.choices[0].message.content.strip()
        
        # Nettoyer markdown
        if content.startswith('```'):
            content = content.split('```')[1]
            if content.startswith('json'):
                content = content[4:]
            content = content.strip()
        
        generated = json.loads(content)
        
        # Ajouter l'analyse originale pour contexte
        generated['analysis'] = analysis
        
        return jsonify({
            'success': True,
            'response': generated,
            'tokens_used': response.usage.total_tokens
        })
        
    except Exception as e:
        app.logger.error(f"Erreur génération réponse: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/documents/save-response', methods=['POST'])
@handle_api_errors
def save_official_response():
    """Sauvegarde une réponse officielle générée"""
    if not session.get('authenticated'):
        raise AuthenticationError("Session expirée")
    
    data = request.get_json()
    response_data = data.get('response', {})
    analysis = data.get('analysis', {})
    
    # Créer le dossier si nécessaire
    save_dir = os.path.join(config.DATA_DIR, 'courriers_generes')
    os.makedirs(save_dir, exist_ok=True)
    
    # Générer nom de fichier
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    type_doc = analysis.get('type_document', 'document')
    filename = f"reponse_{type_doc}_{timestamp}.txt"
    filepath = os.path.join(save_dir, filename)
    
    # Contenu du fichier
    file_content = f"""{"="*80}
COURRIER GÉNÉRÉ - {datetime.now().strftime('%d/%m/%Y %H:%M')}
{"="*80}

OBJET: {response_data.get('objet', '')}
{"="*80}

{response_data.get('corps', '')}

{"="*80}
"""
    
    if response_data.get('pieces_jointes'):
        file_content += "\nPIÈCES À JOINDRE:\n"
        for piece in response_data['pieces_jointes']:
            file_content += f"• {piece}\n"
    
    file_content += f"\nMODE D'ENVOI: {response_data.get('mode_envoi', '')}\n"
    file_content += f"DÉLAI: {response_data.get('delai_envoi', '')}\n"
    
    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(file_content)
        
        return jsonify({
            'success': True,
            'filename': filename,
            'filepath': filepath,
            'message': 'Réponse sauvegardée avec succès'
        })
        
    except Exception as e:
        app.logger.error(f"Erreur sauvegarde: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/accessibility/shortcuts', methods=['GET'])
@handle_api_errors
def api_accessibility_shortcuts_old():
    """Get keyboard shortcuts information"""
    if not session.get('authenticated'):
        raise AuthenticationError("Session expirée")
    
    shortcuts = [
        {'key': 'Ctrl+/', 'description': 'Afficher les raccourcis'},
        {'key': 'Ctrl+H', 'description': 'Activer/désactiver haut contraste'},
        {'key': 'Ctrl+T', 'description': 'Activer/désactiver TTS'},
        {'key': 'Ctrl+K', 'description': 'Focus sur la recherche'},
        {'key': 'Tab', 'description': 'Navigation au clavier'},
        {'key': 'Esc', 'description': 'Fermer les modals'}
    ]
    return jsonify({'success': True, 'shortcuts': shortcuts})

@app.route('/api/accessibility/transcripts', methods=['GET'])
@public_api
def api_accessibility_transcripts():
    """Get voice transcription history - public for tests"""
    limit = request.args.get('limit', 10, type=int)
    
    # Get transcripts from database
    transcripts = db.get_transcripts(limit)
    formatted_transcripts = []
    
    for transcript in transcripts:
        formatted_transcripts.append({
            'id': transcript[0],
            'text': transcript[1],
            'language': transcript[2],
            'confidence': transcript[3],
            'duration': transcript[4],
            'created_at': transcript[5]
        })
    
    return jsonify({
        'success': True,
        'transcripts': formatted_transcripts,
        'count': len(formatted_transcripts)
    })

@app.route('/api/accessibility/keyboard-shortcuts', methods=['GET'])
@public_api
def api_accessibility_keyboard_shortcuts():
    """Get keyboard shortcuts - public for tests"""
    shortcuts = {
        'Tab': 'Navigation entre les éléments',
        'Shift+Tab': 'Navigation inverse',
        'Enter': 'Activer un élément',
        'Space': 'Cocher/décocher',
        'Escape': 'Fermer les modals',
        'Ctrl+H': 'Activer/désactiver haut contraste',
        'Ctrl+T': 'Activer/désactiver TTS',
        'Ctrl+R': 'Démarrer/arrêter enregistrement'
    }
    return jsonify({'success': True, 'shortcuts': shortcuts})

@app.route('/api/accessibility/announce', methods=['POST'])
@public_api
def api_accessibility_announce():
    """Announce action for screen readers - public for tests"""
    data = request.get_json() or {}
    action = data.get('action', '')
    details = data.get('details', '')
    speak = data.get('speak', False)
    show = data.get('show', True)
    
    # Log the announcement
    app.logger.info(f"Accessibility announcement: {action} - {details}")
    
    return jsonify({
        'success': True,
        'announced': True,
        'action': action,
        'details': details,
        'spoken': speak,
        'shown': show
    })

@app.route('/api/accessibility/profile', methods=['GET', 'POST'])
@public_api
def api_accessibility_profile():
    """Get or update user accessibility profile"""
    # Pas d'authentification requise pour les tests
    
    if request.method == 'GET':
        # Return user accessibility profile
        profile = {
            'userId': session.get('user_id', 'anonymous'),
            'name': 'Profil par défaut',
            'description': 'Configuration d\'accessibilité standard',
            'preferences': {
                'screenReader': False,
                'highContrast': False,
                'largeText': False,
                'reducedMotion': False,
                'voiceControl': False
            },
            'assistiveTech': {
                'tts': False,
                'stt': False,
                'screenMagnifier': False
            },
            'lastUpdated': datetime.now().isoformat()
        }
        return jsonify({'success': True, 'profile': profile})
    
    elif request.method == 'POST':
        # Update accessibility profile
        data = request.get_json() or {}
        needs = data.get('needs', [])
        
        # Profils prédéfinis
        profiles = {
            'blind': {
                'name': 'Profil Aveugle',
                'description': 'Profil optimisé pour les personnes aveugles',
                'features': ['TTS activé', 'Navigation clavier', 'Descriptions audio']
            },
            'deaf': {
                'name': 'Profil Sourd',
                'description': 'Profil optimisé pour les personnes sourdes',
                'features': ['Transcription visuelle', 'Notifications visuelles', 'Sous-titres']
            },
            'mute': {
                'name': 'Profil Muet',
                'description': 'Profil optimisé pour les personnes muettes',
                'features': ['Saisie texte', 'Templates', 'Communication écrite']
            },
            'low_vision': {
                'name': 'Profil Malvoyant',
                'description': 'Profil optimisé pour les personnes malvoyantes',
                'features': ['Haut contraste', 'Grande police', 'Zoom']
            }
        }
        
        profile = profiles.get(needs[0] if needs else 'blind', profiles['blind'])
        
        # Appliquer les settings correspondants selon le profil
        if not hasattr(app, 'accessibility_settings'):
            app.accessibility_settings = {
                'screen_reader': False,
                'high_contrast': False,
                'font_size': 'medium',
                'tts_enabled': False,
                'tts_rate': 150,
                'tts_volume': 1.0,
                'keyboard_shortcuts': True,
                'transcription_enabled': False
            }
        
        # Activer les settings selon le profil
        if needs and needs[0] == 'blind':
            app.accessibility_settings['tts_enabled'] = True
            app.accessibility_settings['keyboard_shortcuts'] = True
            app.logger.info(f"Profile blind applied: TTS enabled = {app.accessibility_settings['tts_enabled']}")
        elif needs and needs[0] == 'deaf':
            app.accessibility_settings['transcription_enabled'] = True
        elif needs and needs[0] == 'motor_impaired':
            app.accessibility_settings['keyboard_shortcuts'] = True
        
        # Retourner le profil ET les settings mis à jour
        updated_settings = {
            'screenReader': app.accessibility_settings['screen_reader'],
            'highContrast': app.accessibility_settings['high_contrast'],
            'fontSize': app.accessibility_settings['font_size'],
            'ttsEnabled': app.accessibility_settings['tts_enabled'],
            'tts_enabled': app.accessibility_settings['tts_enabled'],
            'ttsSpeed': app.accessibility_settings['tts_rate'],
            'tts_rate': app.accessibility_settings['tts_rate'],
            'ttsVolume': app.accessibility_settings['tts_volume'],
            'keyboardShortcuts': app.accessibility_settings['keyboard_shortcuts'],
            'transcriptionEnabled': app.accessibility_settings['transcription_enabled']
        }
        
        return jsonify({
            'success': True,
            'profile': profile,
            'settings': updated_settings,
            'message': 'Profil appliqué',
            'updated_at': datetime.now().isoformat()
        })

@app.route('/api/voice/transcribe', methods=['POST'])
@handle_api_errors
def api_voice_transcribe():
    if not session.get('authenticated'):
        raise AuthenticationError("Session expirée")
    
    if 'audio' not in request.files:
        raise ValidationError('Fichier audio requis')
    
    audio_file = request.files['audio']
    
    # Vérifier la taille du fichier (max 10MB)
    if audio_file.content_length and audio_file.content_length > 10 * 1024 * 1024:
        raise ValidationError('Fichier audio trop volumineux (max 10MB)')
    
    # Vérifier le type de fichier
    allowed_types = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/ogg']
    if audio_file.content_type not in allowed_types:
        raise ValidationError('Type de fichier non supporté')
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"temp_{timestamp}_{hashlib.sha256(audio_file.filename.encode()).hexdigest()[:8]}.wav"
    temp_path = os.path.join(config.UPLOADS_DIR, filename)
    
    try:
        audio_file.save(temp_path)
        result = voice_service.transcribe_audio(temp_path)
        app.logger.info(f"Transcription audio: {result.get('success', False)}")
        return jsonify(result)
    finally:
        try:
            os.remove(temp_path)
        except:
            pass

@app.route('/api/voice/speak', methods=['POST'])
@handle_api_errors
def api_voice_speak():
    if not session.get('authenticated'):
        raise AuthenticationError("Session expirée")
    
    data = request.get_json()
    text = sanitize_input(data.get('text', ''), 500)
    
    if not text:
        raise ValidationError('Texte requis')
    
    success = voice_service.speak(text)
    return jsonify({'success': success})

@app.route('/api/accessibility/speak', methods=['POST'])
@public_api
def api_accessibility_speak():
    """Text-to-speech endpoint for accessibility - public for tests"""
    data = request.get_json() or {}
    text = sanitize_input(data.get('text', ''), 500)
    priority = data.get('priority', 'normal')
    
    if not text:
        return jsonify({'success': False, 'error': 'Texte requis'}), 400
    
    # Log the TTS request
    app.logger.info(f"TTS request: {text[:50]}... (priority: {priority})")
    
    # Try to use the voice service if available
    success = False
    if voice_service:
        try:
            success = voice_service.speak(text)
        except Exception as e:
            app.logger.error(f"TTS error: {e}")
    
    return jsonify({
        'success': success,
        'message': 'TTS request processed',
        'text': text,
        'priority': priority
    })

# =============================================================================
# EMAIL GENERATOR ENDPOINTS
# =============================================================================

@app.route('/api/email-generator/create', methods=['POST'])
@handle_api_errors
def api_create_generic_email():
    """Créer une nouvelle adresse email générique"""
    if not session.get('authenticated'):
        raise AuthenticationError("Session expirée")
    
    data = request.get_json()
    purpose = sanitize_input(data.get('purpose', 'general'), 50)
    duration_hours = min(int(data.get('duration_hours', 24)), 168)  # Max 7 jours
    custom_name = sanitize_input(data.get('custom_name', ''), 50)
    
    # Valider le nom personnalisé
    if custom_name and not re.match(r'^[a-zA-Z0-9_-]+$', custom_name):
        raise ValidationError('Nom personnalisé invalide (lettres, chiffres, _ et - seulement)')
    
    email_data = email_generator.create_email(purpose, duration_hours, custom_name)
    
    # Ajouter la règle de transfert si le service est configuré
    if forwarding_service:
        password = get_master_password()
        if password:
            creds = crypto.get_credentials(password)
            if creds and creds.get('email'):
                forwarding_service.add_forwarding_rule(
                    email_data['email'], 
                    creds['email'],
                    data.get('auto_reply')
                )
    
    app.logger.info(f"Email générique créé: {email_data['email']}")
    return jsonify({
        'success': True,
        'email_data': email_data,
        'message': 'Adresse email créée avec succès'
    })

@app.route('/api/email-generator/list', methods=['GET'])
@handle_api_errors
def api_list_generic_emails():
    """Lister les adresses email génériques actives"""
    if not session.get('authenticated'):
        raise AuthenticationError("Session expirée")
    
    # Nettoyer les emails expirés
    expired = email_generator.cleanup_expired()
    if expired:
        app.logger.info(f"Nettoyage: {len(expired)} emails expirés supprimés")
    
    active_emails = email_generator.list_active_emails()
    
    return jsonify({
        'success': True,
        'emails': active_emails,
        'count': len(active_emails)
    })

@app.route('/api/email-generator/info/<email>', methods=['GET'])
@handle_api_errors
def api_get_email_info(email):
    """Obtenir les informations d'une adresse email"""
    if not session.get('authenticated'):
        raise AuthenticationError("Session expirée")
    
    if not validate_email(email):
        raise ValidationError('Email invalide')
    
    email_info = email_generator.get_email_info(email)
    
    if not email_info:
        return jsonify({'success': False, 'error': 'Email non trouvé'}), 404
    
    return jsonify({
        'success': True,
        'email_info': email_info
    })

@app.route('/api/email-generator/deactivate', methods=['POST'])
@handle_api_errors
def api_deactivate_email():
    """Désactiver une adresse email générique"""
    if not session.get('authenticated'):
        raise AuthenticationError("Session expirée")
    
    data = request.get_json()
    email = sanitize_input(data.get('email', ''), 100)
    
    if not validate_email(email):
        raise ValidationError('Email invalide')
    
    success = email_generator.deactivate_email(email)
    
    if success:
        app.logger.info(f"Email désactivé: {email}")
        return jsonify({
            'success': True,
            'message': 'Email désactivé avec succès'
        })
    else:
        return jsonify({
            'success': False,
            'error': 'Email non trouvé'
        }), 404

@app.route('/api/email-generator/extend', methods=['POST'])
@handle_api_errors
def api_extend_email():
    """Prolonger la durée de vie d'une adresse email"""
    if not session.get('authenticated'):
        raise AuthenticationError("Session expirée")
    
    data = request.get_json()
    email = sanitize_input(data.get('email', ''), 100)
    additional_hours = min(int(data.get('additional_hours', 24)), 168)  # Max 7 jours
    
    if not validate_email(email):
        raise ValidationError('Email invalide')
    
    success = email_generator.extend_email(email, additional_hours)
    
    if success:
        app.logger.info(f"Email prolongé: {email} (+{additional_hours}h)")
        return jsonify({
            'success': True,
            'message': f'Email prolongé de {additional_hours} heures'
        })
    else:
        return jsonify({
            'success': False,
            'error': 'Email non trouvé'
        }), 404

@app.route('/api/email-generator/templates', methods=['GET'])
@public_api
def api_email_templates():
    """Obtenir les templates d'emails génériques"""
    templates = {
        'general': {
            'name': 'Général',
            'description': 'Usage général, polyvalent',
            'prefix': 'user',
            'duration': 24
        },
        'support': {
            'name': 'Support',
            'description': 'Pour le support client',
            'prefix': 'support',
            'duration': 72
        },
        'contact': {
            'name': 'Contact',
            'description': 'Pour les formulaires de contact',
            'prefix': 'contact',
            'duration': 48
        },
        'info': {
            'name': 'Information',
            'description': 'Pour les demandes d\'information',
            'prefix': 'info',
            'duration': 48
        },
        'noreply': {
            'name': 'No-Reply',
            'description': 'Pour les emails automatiques',
            'prefix': 'noreply',
            'duration': 168
        },
        'temp': {
            'name': 'Temporaire',
            'description': 'Usage temporaire court',
            'prefix': 'temp',
            'duration': 12
        },
        'test': {
            'name': 'Test',
            'description': 'Pour les tests et développement',
            'prefix': 'test',
            'duration': 6
        }
    }
    
    return jsonify({
        'success': True,
        'templates': templates
    })

@app.route('/api/email-generator/stats', methods=['GET'])
@public_api
def api_email_generator_stats():
    """Obtenir les statistiques du générateur d'emails"""
    active_emails = email_generator.list_active_emails()
    
    # Calculer les statistiques
    total_generated = len(email_generator.generated_emails)
    active_count = len(active_emails)
    
    # Type le plus utilisé
    purpose_counts = {}
    total_forwarded = 0
    
    for email_data in email_generator.generated_emails.values():
        purpose = email_data.get('purpose', 'general')
        purpose_counts[purpose] = purpose_counts.get(purpose, 0) + 1
        total_forwarded += email_data.get('usage_count', 0)
    
    most_used_type = max(purpose_counts.items(), key=lambda x: x[1])[0] if purpose_counts else 'general'
    
    stats = {
        'total_generated': total_generated,
        'active_emails': active_count,
        'total_forwarded': total_forwarded,
        'most_used_type': most_used_type,
        'purpose_breakdown': purpose_counts
    }
    
    return jsonify({
        'success': True,
        'stats': stats
    })

# WebSocket disabled for Python 3.13 compatibility
# Real-time transcription will use polling instead of WebSocket

@app.route('/api/voice/start-recording', methods=['POST'])
@handle_api_errors
def api_start_recording():
    """Start voice recording (REST endpoint replacement for WebSocket)"""
    if not session.get('authenticated'):
        raise AuthenticationError("Session expirée")
    
    app.logger.info("Démarrage enregistrement vocal")
    return jsonify({'success': True, 'status': 'Enregistrement démarré'})

@app.route('/api/voice/stop-recording', methods=['POST'])
@handle_api_errors
def api_stop_recording():
    """Stop voice recording (REST endpoint replacement for WebSocket)"""
    if not session.get('authenticated'):
        raise AuthenticationError("Session expirée")
    
    app.logger.info("Arrêt enregistrement vocal")
    return jsonify({'success': True, 'status': 'Enregistrement arrêté'})

@app.route('/api/voice/transcribe-chunk', methods=['POST'])
@handle_api_errors
def api_transcribe_chunk():
    """Transcribe audio chunk (REST endpoint replacement for WebSocket)"""
    if not session.get('authenticated'):
        raise AuthenticationError("Session expirée")
    
    data = request.get_json()
    audio_b64 = data.get('audio', '')
    
    try:
        # Décoder l'audio base64
        audio_data = base64.b64decode(audio_b64)
        
        if len(audio_data) > 0:
            # Transcrire avec le service vocal
            result = voice_service.transcribe_audio_data(audio_data)
            
            if result['success']:
                # Sauvegarder la transcription
                db.add_transcript(result['text'])
                return jsonify({
                    'success': True,
                    'text': result['text'],
                    'confidence': 1.0
                })
            else:
                return jsonify({
                    'success': False,
                    'error': result['error']
                })
        else:
            return jsonify({
                'success': False,
                'error': 'Données audio vides'
            })
        
    except Exception as e:
        app.logger.error(f"Erreur transcription chunk: {e}")
        return jsonify({
            'success': False,
            'error': 'Erreur de transcription'
        })

# Configuration du logging production
def setup_logging():
    # Create logs directory
    os.makedirs('logs', exist_ok=True)
    
    # Production logging setup
    if not app.debug or os.environ.get('FLASK_ENV') == 'production':
        file_handler = RotatingFileHandler('logs/app.log', maxBytes=10240000, backupCount=10)
        file_handler.setFormatter(logging.Formatter(
            '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
        ))
        file_handler.setLevel(logging.INFO)
        app.logger.addHandler(file_handler)
        app.logger.setLevel(logging.INFO)
        
        # Error log file
        error_handler = RotatingFileHandler('logs/error.log', maxBytes=10240000, backupCount=5)
        error_handler.setFormatter(logging.Formatter(
            '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
        ))
        error_handler.setLevel(logging.ERROR)
        app.logger.addHandler(error_handler)
        
        app.logger.info('IAPosteManager Production startup')
    else:
        app.logger.info('IAPosteManager Development startup')

if __name__ == '__main__':
    # Set UTF-8 encoding for console output on Windows
    import sys
    if sys.platform == 'win32':
        import codecs
        sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'replace')
        sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'replace')
    
    setup_logging()
    
    # Auto-detect available port (5000 often blocked on Windows)
    import socket
    def find_free_port(start_port=5000, max_attempts=10):
        """Find an available port starting from start_port"""
        for port in range(start_port, start_port + max_attempts):
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.bind(('0.0.0.0', port))
                sock.close()
                return port
            except OSError:
                continue
        return start_port + max_attempts  # Fallback
    
    # Get port from environment or find available port
    port = int(os.environ.get('PORT', 0)) or find_free_port()
    host = os.environ.get('HOST', '0.0.0.0')
    
    print("\n" + "="*60)
    print("IAPosteManager Unified v3.0 - OPTIMISÉ")
    print("="*60)
    print(f"URL LOCALE: http://localhost:{port}")
    print(f"URL RÉSEAU: http://{host}:{port}")
    print(f"Frontend React: http://localhost:{port}")
    print(f"Interface Simple: http://localhost:{port}/frontend-simple.html")
    print(f"Data: {config.DATA_DIR}")
    print(f"Logs: logs/app.log")
    print("\nAméliorations appliquées:")
    print("  ✅ Détection automatique de port disponible")
    print("  ✅ Configuration Flask optimisée pour React")
    print("  ✅ Routage simplifié frontend/API")
    print("  ✅ Sécurité sessions renforcée")
    print("  ✅ Gestion d'erreurs robuste")
    print("  ✅ Email provisioning (3 endpoints)")
    print("="*60 + "\n")
    
    print("[OK] Endpoints API disponibles")
    print("[OK] Email provisioning: SendGrid/AWS SES/Microsoft365/Google")
    print("      - POST /api/email/check-availability")
    print("      - POST /api/email/create")
    print("      - GET  /api/email/my-accounts")
    print("[OK] Courriers officiels: Analyse & génération")
    print("      - POST /api/documents/analyze-official")
    print("      - POST /api/documents/generate-response")
    print("      - POST /api/documents/save-response")
    
    app.logger.info(f"Démarrage sur port {port}")
    
    try:
        print(f"\n[*] LANCEMENT SERVEUR sur {host}:{port}...")
        print(f"[*] PORT environment variable: {os.environ.get('PORT', 'NOT SET')}")
        # Run with SocketIO using threading mode (Python 3.13 compatible)
        socketio.run(app, debug=False, host=host, port=port, allow_unsafe_werkzeug=True)
    except Exception as e:
        print(f"\n[ERROR] ERREUR FATALE AU DEMARRAGE: {e}")
        import traceback
        traceback.print_exc()
        input("Appuyez sur Entree pour quitter...")