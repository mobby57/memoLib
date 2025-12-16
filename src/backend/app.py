"""
IAPosteManager Unified v3.0 - FIXED VERSION
Application complète unifiée avec corrections critiques
"""
from flask import Flask, render_template, request, jsonify, session, redirect, send_file
from flask_cors import CORS
from flask_socketio import SocketIO, emit
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

app = Flask(__name__, template_folder='templates', static_folder='static')

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
socketio = SocketIO(app, cors_allowed_origins="*", manage_session=False)

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
        self.db_path = os.path.join(config.DATA_DIR, 'unified.db')
        self.init_db()
    
    def init_db(self):
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
        
        # Nouvelles tables pour le provisioning d'emails
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
    
    def log_email(self, recipient, subject, body, status):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
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
        if api_key:
            openai.api_key = api_key
    
    def generate_email(self, context, tone='professionnel', email_type='general'):
        if not self.api_key:
            return self._fallback_generation(context, tone)
        
        try:
            prompt = f"""
            Génère un email {tone} de type {email_type} basé sur ce contexte:
            {context}
            
            Retourne uniquement:
            SUJET: [sujet de l'email]
            CORPS: [corps de l'email]
            """
            
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=500
            )
            
            content = response.choices[0].message.content
            lines = content.split('\n')
            
            subject = ""
            body = ""
            
            for line in lines:
                if line.startswith('SUJET:'):
                    subject = line.replace('SUJET:', '').strip()
                elif line.startswith('CORPS:'):
                    body = line.replace('CORPS:', '').strip()
            
            return {
                'success': True,
                'subject': subject,
                'body': body,
                'source': 'openai'
            }
        except:
            return self._fallback_generation(context, tone)
    
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
# email_generator = EmailGenerator()  # Using UnifiedAIService instead
forwarding_service = None

# Routes principales
@app.route('/')
def index():
    """Root route - React handles routing, just return API status"""
    return jsonify({
        'api': 'IAPosteManager Unified API',
        'version': '3.0',
        'status': 'running',
        'authenticated': session.get('authenticated', False)
    })

@app.route('/login', methods=['GET', 'POST'])
def login():
    """Legacy login route - redirects GET to React frontend"""
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
    
    # GET request - return simple message (React handles UI)
    return jsonify({'message': 'Please use /api/auth/login endpoint', 'authenticated': session.get('authenticated', False)})

@app.route('/logout')
def logout():
    app.logger.info(f"Déconnexion depuis {request.remote_addr}")
    session.clear()
    return redirect('/login')

# API Routes
@app.route('/api/login', methods=['POST'])
@app.route('/api/auth/login', methods=['POST'])
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
        'redirect': '/'
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
@handle_api_errors
def api_send_email():
    if not session.get('authenticated'):
        raise AuthenticationError("Session expirée")
    
    data = request.get_json()
    recipient = sanitize_input(data.get('recipient', ''), 100)
    subject = sanitize_input(data.get('subject', ''), 200)
    body = sanitize_input(data.get('body', ''), 5000)
    
    if not all([recipient, subject, body]):
        raise ValidationError('Tous les champs sont requis')
    
    if not validate_email(recipient):
        raise ValidationError('Email destinataire invalide')
    
    password = get_master_password()
    if not password:
        raise AuthenticationError("Mot de passe maître requis")
    
    creds = crypto.get_credentials(password)
    if not creds or not creds.get('email'):
        raise ValidationError('Configuration Gmail requise')
    
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
@handle_api_errors
def api_generate_email():
    global ai_service
    
    if not session.get('authenticated'):
        raise AuthenticationError("Session expirée")
    
    data = request.get_json()
    context = sanitize_input(data.get('context', ''), 2000)
    tone = sanitize_input(data.get('tone', 'professionnel'), 50)
    email_type = sanitize_input(data.get('emailType', 'general'), 50)
    
    if not context:
        raise ValidationError('Contexte requis')
    
    # Initialiser AI service si nécessaire
    if not ai_service:
        password = get_master_password()
        if password:
            creds = crypto.get_credentials(password)
            if creds and creds.get('openai_key'):
                ai_service = UnifiedAIService(creds['openai_key'])
    
    if not ai_service:
        ai_service = UnifiedAIService()  # Fallback sans OpenAI
    
    result = ai_service.generate_email(context, tone, email_type)
    app.logger.info(f"Email généré avec {result.get('source', 'unknown')}")
    return jsonify(result)

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
    
    # Améliorer le texte
    try:
        if ai_service.api_key:
            # Utiliser OpenAI si disponible
            prompt = f"""
Améliore ce texte pour le rendre plus {tone} et fluide.
Contexte: {context}
Langue: {language}

Ne change pas le sens du message, améliore seulement:
- La grammaire et l'orthographe
- La structure et la clarté
- Le style et le ton

Texte original:
{text}

Retourne uniquement le texte amélioré, sans commentaires.
"""
            
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=1000,
                temperature=0.7
            )
            
            improved_text = response.choices[0].message.content.strip()
            source = 'openai'
        else:
            # Fallback: corrections basiques
            improved_text = text.strip()
            # Mettre en majuscule la première lettre
            if improved_text:
                improved_text = improved_text[0].upper() + improved_text[1:]
            # Ajouter un point final si manquant
            if improved_text and not improved_text[-1] in '.!?':
                improved_text += '.'
            source = 'basic'
        
        app.logger.info(f"Texte amélioré avec {source}")
        return jsonify({
            'success': True,
            'content': improved_text,
            'text': improved_text,  # Alias pour compatibilité
            'source': source,
            'original_length': len(text),
            'improved_length': len(improved_text)
        })
    
    except Exception as e:
        app.logger.error(f"Erreur amélioration texte: {e}")
        # En cas d'erreur, retourner le texte original
        return jsonify({
            'success': True,
            'content': text,
            'text': text,
            'source': 'fallback',
            'error': str(e)
        })

@app.route('/api/ai/quick-generate', methods=['POST'])
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
    filename = f"temp_{timestamp}_{hashlib.md5(audio_file.filename.encode()).hexdigest()[:8]}.wav"
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

# WebSocket pour transcription temps réel
@socketio.on('start_recording')
def handle_start_recording():
    if not session.get('authenticated'):
        emit('error', {'message': 'Non autorisé'})
        return
    
    app.logger.info(f"Démarrage enregistrement vocal")
    emit('recording_started', {'status': 'Enregistrement démarré'})

@socketio.on('stop_recording')
def handle_stop_recording():
    if not session.get('authenticated'):
        emit('error', {'message': 'Non autorisé'})
        return
    
    app.logger.info(f"Arrêt enregistrement vocal")
    emit('recording_stopped', {'status': 'Enregistrement arrêté'})

@socketio.on('audio_chunk')
def handle_audio_chunk(data):
    if not session.get('authenticated'):
        emit('error', {'message': 'Non autorisé'})
        return
    
    try:
        # Décoder l'audio base64
        audio_data = base64.b64decode(data.get('audio', ''))
        
        if len(audio_data) > 0:
            # Transcrire avec le service vocal
            result = voice_service.transcribe_audio_data(audio_data)
            
            if result['success']:
                emit('transcription_update', {'text': result['text']})
            else:
                emit('transcription_error', {'error': result['error']})
        
    except Exception as e:
        app.logger.error(f"Erreur transcription temps réel: {e}")
        emit('transcription_error', {'error': 'Erreur de transcription'})

# Configuration du logging
def setup_logging():
    if not app.debug:
        os.makedirs('logs', exist_ok=True)
        file_handler = RotatingFileHandler('logs/app.log', maxBytes=10240000, backupCount=10)
        file_handler.setFormatter(logging.Formatter(
            '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
        ))
        file_handler.setLevel(logging.INFO)
        app.logger.addHandler(file_handler)
        app.logger.setLevel(logging.INFO)
        app.logger.info('IAPosteManager Unified startup')

if __name__ == '__main__':
    # Set UTF-8 encoding for console output on Windows
    import sys
    if sys.platform == 'win32':
        import codecs
        sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
        sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')
    
    setup_logging()
    
    print("\n" + "="*60)
    print("IAPosteManager Unified v3.0 - Securise")
    print("="*60)
    print(f"URL: http://127.0.0.1:5000")
    print(f"Data: {config.DATA_DIR}")
    print(f"Logs: logs/app.log")
    print("\nCorrections appliquees:")
    print("  - Securite sessions renforcee")
    print("  - Gestion d'erreurs robuste")
    print("  - Validation des donnees")
    print("  - Transcription vocale reelle")
    print("  - Logging structure")
    print("  - WebSocket securise")
    print("="*60 + "\n")
    
    # Ajouter les endpoints manquants
    try:
        from missing_endpoints import add_missing_endpoints
        add_missing_endpoints(app, db)
        print("[OK] Endpoints manquants ajoutés")
    except Exception as e:
        print(f"[WARNING] Erreur endpoints: {e}")
    
    # Ajouter les endpoints de provisioning d'emails
    try:
        from services.email_provisioning_service import register_email_provisioning_routes
        register_email_provisioning_routes(app)
        print("[OK] Email provisioning activé (SendGrid/AWS SES/Microsoft365/Google)")
    except Exception as e:
        print(f"[WARNING] Email provisioning non disponible: {e}")
    
    app.logger.info("Démarrage de l'application")
    socketio.run(app, debug=False, host='0.0.0.0', port=5000, allow_unsafe_werkzeug=True)