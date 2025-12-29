"""Application Flask - IAPosteManager v2.2"""
from flask import Flask, render_template, request, jsonify, session, redirect, send_file
from flask_cors import CORS
try:
    from flask_socketio import SocketIO, emit
    HAS_SOCKETIO = True
except ImportError:
    HAS_SOCKETIO = False
# Disable Flask-Session for better compatibility
HAS_FLASK_SESSION = False
import sys
import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from src.core.config import Config
from src.core.crypto_utils import *
from src.core.database import Database

# Import intégration accessible
try:
    sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'accessibility'))
    from accessible_integration import register_accessible_routes, get_accessible_navigation
    HAS_ACCESSIBLE_INTEGRATION = True
except ImportError:
    HAS_ACCESSIBLE_INTEGRATION = False
from src.core.logging_config import setup_logging
from src.core.session_manager import SessionManager
from src.core.template_manager import TemplateManager
from src.core.validation import EmailValidator
from src.core.user_manager import UserManager
from src.core.jwt_manager import jwt_manager
from src.core.rate_limiter import rate_limiter
from src.core.cache_manager import cache
from src.services.smtp_service import SMTPService
from src.services.openai_service import OpenAIService
from src.services.email_service import EmailService
from src.services.ai_service import AIService
from src.services.inbox_manager import InboxManager
try:
    from src.services.realtime_transcription import RealtimeTranscriptionWebSocket, RealtimeTranscription
    HAS_REALTIME_TRANSCRIPTION = True
except ImportError:
    HAS_REALTIME_TRANSCRIPTION = False
from src.analytics.advanced_analytics import AdvancedAnalytics
from src.monitoring.prometheus import metrics_endpoint, track_request
from src.api.v1 import api_v1
from src.api.smart_email import smart_bp
from src.web.email_routes import email_bp
try:
    from src.security.two_factor_auth import TwoFactorAuth
    from src.accessibility.tts_service import TTSService
    from src.accessibility.universal_access import accessibility_service
    from src.automation.email_scheduler import EmailScheduler
    from src.api.rest_endpoints import api_bp
    ENHANCED_FEATURES = True
except ImportError:
    ENHANCED_FEATURES = False
    accessibility_service = None

app = Flask(__name__, template_folder='../../templates', static_folder='../../static')

# Enregistrer routes accessibles si disponible
if HAS_ACCESSIBLE_INTEGRATION:
    register_accessible_routes(app)

# Security: SECRET_KEY must be set in environment
if not os.environ.get('SECRET_KEY'):
    raise ValueError("SECRET_KEY environment variable must be set")

app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['SESSION_COOKIE_SECURE'] = os.environ.get('FLASK_ENV') == 'production'
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['PERMANENT_SESSION_LIFETIME'] = 3600
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max

# Use built-in Flask sessions for better compatibility
# No additional session configuration needed

CORS(app, origins=['http://localhost:3000', 'http://127.0.0.1:5000'])

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

# SocketIO pour WebSocket
if HAS_SOCKETIO:
    socketio = SocketIO(app, cors_allowed_origins="*")
else:
    socketio = None

# Setup logging
logger = setup_logging(app)

# Register blueprints
app.register_blueprint(api_v1)
app.register_blueprint(smart_bp)
app.register_blueprint(email_bp)

# Services
db = Database(os.path.join(Config.APP_DIR, 'app.db'))
session_manager = SessionManager(Config.APP_DIR)
smtp_service = SMTPService()
email_service = EmailService()
inbox_manager = InboxManager(Config.APP_DIR)

# Service de transcription temps réel
if HAS_REALTIME_TRANSCRIPTION and HAS_SOCKETIO:
    realtime_transcription = RealtimeTranscriptionWebSocket(socketio)
else:
    realtime_transcription = None

# Cache mot de passe maître en mémoire
MASTER_PASSWORD_CACHE = None
template_manager = TemplateManager(Config.APP_DIR)
validator = EmailValidator()
user_manager = UserManager()
advanced_analytics = AdvancedAnalytics()
ai_service = None  # Initialisé dynamiquement

# Enhanced features (optional)
if ENHANCED_FEATURES:
    two_fa = TwoFactorAuth()
    tts_service = TTSService()
    scheduler = EmailScheduler()
    app.register_blueprint(api_bp)
else:
    two_fa = None
    tts_service = None
    scheduler = None

try:
    from src.security.audit_trail import AuditTrail
    from src.analytics.dashboard import AnalyticsDashboard
    audit = AuditTrail(Config.APP_DIR)
    analytics = AnalyticsDashboard(Config.APP_DIR)
except ImportError:
    audit = None
    analytics = None

try:
    from src.accessibility.routes import accessibility_bp
    app.register_blueprint(accessibility_bp)
except ImportError:
    pass

@app.errorhandler(404)
def not_found(error):
    if request.path.startswith('/api/'):
        return jsonify({'success': False, 'error': 'Route non trouvée'}), 404
    return render_template('index.html'), 200

@app.errorhandler(Exception)
def handle_error(error):
    import traceback
    app.logger.error(f"Error: {error}\n{traceback.format_exc()}")
    # Don't expose internal errors in production
    if app.config.get('DEBUG'):
        return jsonify({'success': False, 'error': str(error)}), 500
    return jsonify({'success': False, 'error': 'Internal server error'}), 500

@app.before_request
def check_auth():
    public = ['/login', '/api/login', '/static', '/favicon.ico']
    if any(request.path.startswith(p) for p in public):
        return
    if not session.get('authenticated'):
        if request.path.startswith('/api/'):
            pass  # Les API gèrent leur propre auth
        else:
            return redirect('/login')

@app.route('/login', methods=['GET'])
def login():
    if session.get('authenticated'):
        return redirect('/')
    # Proposer interface accessible
    show_accessible = request.args.get('accessible') == '1'
    return render_template('login.html', show_accessible_option=True)

@app.route('/api/login', methods=['POST'])
def api_login():
    global MASTER_PASSWORD_CACHE
    try:
        data = request.json
        password = data.get('password', '')
        
        if not credentials_existent(Config.APP_DIR):
            MASTER_PASSWORD_CACHE = password
            session['master_password'] = password
            session['authenticated'] = True
            session.permanent = True
            return jsonify({'success': True, 'redirect': '/'})
        
        app_password, email = recuperer_app_password(password, Config.APP_DIR)
        
        if app_password and email:
            MASTER_PASSWORD_CACHE = password
            session['master_password'] = password
            session['authenticated'] = True
            session.permanent = True
            return jsonify({'success': True, 'redirect': '/'})
        else:
            return jsonify({'success': False, 'error': 'Mot de passe incorrect'}), 401
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/logout')
def logout():
    global MASTER_PASSWORD_CACHE
    MASTER_PASSWORD_CACHE = None
    
    # Sauvegarder préférences d'accessibilité avant nettoyage
    accessibility_prefs = session.get('accessibility_mode', False)
    session.clear()
    
    # Restaurer préférences d'accessibilité pour prochaine connexion
    if accessibility_prefs:
        session['accessibility_preferred'] = True
    
    return redirect('/login')

@app.route('/')
def index():
    # Détecter si l'utilisateur préfère l'interface accessible
    if session.get('accessibility_mode') or request.args.get('accessible') == '1':
        return redirect('/accessible/')
    
    if not credentials_existent(Config.APP_DIR):
        return render_template('index.html', first_time=True, show_accessible_option=True)
    return render_template('navigation.html', show_accessible_option=True)

@app.route('/setup')
def setup():
    return render_template('index.html')

@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

@app.route('/send')
def send():
    return render_template('simple.html')

@app.route('/simple')
def simple():
    return render_template('simple.html')

@app.route('/generator')
def generator():
    return render_template('generator.html')

@app.route('/api/session/validate')
def validate_session():
    return jsonify({'valid': True, 'authenticated': True})

@app.route('/api/user/profile')
def user_profile():
    return jsonify({'username': 'user', 'email': 'user@example.com'})

@app.route('/api/templates', methods=['GET'])
def get_templates():
    """Récupère tous les templates"""
    try:
        templates = template_manager.list_templates()
        return jsonify({'success': True, 'templates': templates})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/templates', methods=['POST'])
def save_template():
    """Sauvegarde un nouveau template"""
    try:
        data = request.get_json()
        name = data.get('name')
        subject = data.get('subject')
        body = data.get('body')
        category = data.get('category', 'general')
        
        if not name or not subject or not body:
            return jsonify({'success': False, 'error': 'Données manquantes'})
        
        template_id = template_manager.save_template(name, subject, body, category)
        return jsonify({'success': True, 'id': template_id, 'message': 'Template sauvegardé'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/templates/<int:template_id>', methods=['DELETE'])
def delete_template(template_id):
    """Supprime un template"""
    try:
        template_manager.delete_template(template_id)
        return jsonify({'success': True, 'message': 'Template supprimé'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/templates/search')
def search_templates():
    query = request.args.get('q', '')
    try:
        templates = template_manager.search_templates(query)
        return jsonify({'success': True, 'templates': templates})
    except Exception as e:
        return jsonify({'success': False, 'templates': []})

@app.route('/api/emails/draft', methods=['POST'])
def save_draft():
    return jsonify({'success': True, 'id': 1})

@app.route('/api/contacts', methods=['GET'])
def get_contacts():
    """Récupère tous les contacts"""
    try:
        contacts = db.get_all_contacts()
        return jsonify({
            'success': True,
            'contacts': contacts or {'custom': [], 'frequent': [], 'institutions': {}}
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/contacts', methods=['POST'])
def add_contact():
    """Ajoute un nouveau contact"""
    try:
        data = request.get_json()
        name = data.get('name')
        email = data.get('email')
        organization = data.get('organization', '')
        category = data.get('category', 'custom')
        
        if not name or not email:
            return jsonify({'success': False, 'error': 'Nom et email requis'})
        
        db.add_contact(name, email, organization, category)
        return jsonify({'success': True, 'message': 'Contact ajouté'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/contacts/<email>', methods=['DELETE'])
def delete_contact(email):
    """Supprime un contact"""
    try:
        db.delete_contact(email)
        return jsonify({'success': True, 'message': 'Contact supprimé'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/contacts/search', methods=['POST'])
def search_contacts():
    """Recherche des contacts"""
    try:
        data = request.get_json()
        query = data.get('query', '')
        results = db.search_contacts(query)
        return jsonify({'success': True, 'results': results})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/agent')
def agent():
    return render_template('voice_agent.html')

@app.route('/api/health')
@rate_limiter.limit('api')
def health():
    return jsonify({'status': 'ok', 'version': '3.0.0'})



@app.route('/metrics')
def metrics():
    return metrics_endpoint()





@app.route('/api/stats')
def stats():
    try:
        return jsonify({
            'envois': {'total': db.get_email_stats(30)},
            'ia': {'total_generations': db.get_ai_stats(30)}
        })
    except Exception as e:
        return jsonify({'envois': {'total': 0}, 'ia': {'total_generations': 0}})

@app.route('/api/dashboard/stats')
def dashboard_stats():
    try:
        return jsonify({
            'success': True,
            'stats': {
                'emails_sent': 0,
                'ai_generations': 0,
                'templates': 0
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/config/settings', methods=['GET', 'POST'])
def config_settings():
    try:
        if request.method == 'GET':
            return jsonify({
                'success': True,
                'settings': {
                    'theme': 'light',
                    'language': 'fr',
                    'notifications': True
                }
            })
        else:
            return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/check-credentials')
def check_credentials():
    return jsonify({
        'gmail_exists': credentials_existent(Config.APP_DIR),
        'openai_exists': api_key_existe(Config.APP_DIR),
        'metadata': recuperer_metadata(Config.APP_DIR)
    })

@app.route('/api/verify-password', methods=['POST'])
def verify_password():
    try:
        data = request.json or {}
        password = data.get('password', '')
        
        if len(password) >= 8:
            session['master_password'] = password
            session['authenticated'] = True
            return jsonify({'success': True})
        return jsonify({'success': False, 'error': 'Mot de passe invalide'}), 401
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/save-gmail', methods=['POST'])
def save_gmail():
    try:
        data = request.json or {}
        master_password = data.get('master_password', '')
        
        success = sauvegarder_app_password(
            data.get('app_password', ''),
            master_password,
            Config.APP_DIR,
            data.get('email', '')
        )
        
        if success:
            session['master_password'] = master_password
            session['authenticated'] = True
            return jsonify({'success': True})
        return jsonify({'success': False, 'error': 'Erreur sauvegarde'}), 500
    except Exception as e:
        return jsonify({'success': False, 'error': 'Erreur interne'}), 500

@app.route('/api/save-openai', methods=['POST'])
def save_openai():
    try:
        data = request.json or {}
        success = sauvegarder_api_key(
            data.get('api_key', ''),
            data.get('org_id', ''),
            data.get('master_password', ''),
            Config.APP_DIR
        )
        if success:
            if audit:
                audit.log_event('openai_configured', '', {})
            return jsonify({'success': True})
        return jsonify({'success': False, 'error': 'Erreur sauvegarde'}), 500
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/delete-credentials', methods=['POST'])
def delete_credentials():
    try:
        success = supprimer_credentials(Config.APP_DIR)
        if success:
            session.clear()
            return jsonify({'success': True})
        return jsonify({'success': False, 'error': 'Erreur suppression'}), 500
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/export-backup', methods=['POST'])
def export_backup():
    try:
        data = request.get_json() or {}
        master_password = data.get('master_password', '')
        
        if not master_password:
            return jsonify({'success': False, 'error': 'Mot de passe requis'}), 400
        
        # Simulation d'export
        backup_data = {
            'version': '2.2.0',
            'export_date': '2024-01-01',
            'credentials': 'encrypted_data',
            'metadata': {}
        }
        
        return jsonify({'success': True, 'backup': backup_data})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/text-to-speech', methods=['POST'])
def text_to_speech():
    try:
        data = request.get_json() or {}
        texte = data.get('texte', '')
        voice = data.get('voice', 'fr')
        
        if not texte:
            return jsonify({'success': False, 'error': 'Texte requis'}), 400
        
        # Simulation - retourner un fichier audio vide
        from flask import Response
        import io
        
        # Créer un fichier audio vide (silence)
        audio_data = b'\x00' * 1024  # Données audio vides
        
        return Response(
            audio_data,
            mimetype='audio/wav',
            headers={'Content-Disposition': 'attachment; filename=tts.wav'}
        )
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/speech-to-text', methods=['POST'])
def speech_to_text():
    try:
        if 'audio' not in request.files:
            return jsonify({'success': False, 'error': 'Fichier audio requis'}), 400
        
        audio_file = request.files['audio']
        master_password = request.form.get('master_password', '')
        
        if not master_password:
            return jsonify({'success': False, 'error': 'Mot de passe maître requis'}), 400
        
        # Simulation de transcription
        return jsonify({
            'success': True,
            'texte': 'Transcription simulée du fichier audio.'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/destinataires', methods=['GET', 'POST'])
@rate_limiter.limit('api')
def destinataires():
    if request.method == 'POST':
        return jsonify({'success': True, 'message': 'Destinataire ajouté'})
    return jsonify({'success': True, 'destinataires': []})

@app.route('/api/destinataires/<int:recipient_id>', methods=['PUT', 'DELETE'])
def manage_recipient(recipient_id):
    try:
        if request.method == 'DELETE':
            # Simulation de suppression
            return jsonify({'success': True, 'message': 'Destinataire supprimé'})
        
        elif request.method == 'PUT':
            data = request.get_json() or {}
            # Simulation de modification
            return jsonify({'success': True, 'message': 'Destinataire modifié'})
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/workflows')
@rate_limiter.limit('api')
def workflows():
    return jsonify({'success': True, 'workflows': []})

@app.route('/favicon.ico')
def favicon():
    return '', 204

@app.route('/api/email/send', methods=['POST'])
def send_email():
    try:
        data = request.get_json()
        recipient = data.get('recipient')
        subject = data.get('subject')
        body = data.get('body')
        scheduled_at = data.get('scheduled_at')  # ISO 8601 format datetime
        
        # Si email programmé
        if scheduled_at and ENHANCED_FEATURES:
            try:
                from datetime import datetime
                # Valider le format de date
                scheduled_time = datetime.fromisoformat(scheduled_at.replace('Z', '+00:00'))
                
                # Enregistrer l'email programmé
                scheduler.schedule_email(recipient, subject, body, scheduled_at)
                
                return jsonify({
                    'success': True, 
                    'message': f'Email programmé pour le {scheduled_time.strftime("%d/%m/%Y à %H:%M")}',
                    'scheduled': True
                })
            except ValueError as e:
                return jsonify({'success': False, 'error': 'Format de date invalide'}), 400
        
        # Envoi immédiat
        # Récupérer credentials
        password = session.get('master_password')
        if not password:
            return jsonify({'success': False, 'error': 'Session expirée'}), 401
            
        app_password, email = recuperer_app_password(password, Config.APP_DIR)
        if not app_password:
            return jsonify({'success': False, 'error': 'Credentials non trouvés'}), 400
        
        success, message = email_service.send_email((email, app_password), recipient, subject, body)
        
        if success:
            db.log_email(recipient, subject, body, 'sent')
        
        return jsonify({'success': success, 'message': message})
        
    except Exception as e:
        return jsonify({'success': False, 'error': 'Erreur interne'}), 500

@app.route('/api/ai/generate', methods=['POST'])
def generate_ai():
    global ai_service
    try:
        if not ai_service:
            password = session.get('master_password')
            api_key, _ = recuperer_api_key(password, Config.APP_DIR)
            if api_key:
                ai_service = AIService(api_key)
            else:
                return jsonify({'success': False, 'error': 'Clé OpenAI non configurée'}), 400
        
        data = request.get_json()
        context = data.get('context')
        tone = data.get('tone', 'professionnel')
        
        success, result = ai_service.generate_email(context, tone)
        
        if success:
            db.log_ai_generation(context, tone, result)
        
        return jsonify({'success': success, 'result': result})
        
    except Exception as e:
        return jsonify({'success': False, 'error': 'Erreur IA'}), 500

@app.route('/api/audit/logs')
def audit_logs():
    try:
        return jsonify({'logs': []})
    except:
        return jsonify({'logs': []})

@app.route('/api/email/history')
def email_history():
    return jsonify({'success': True, 'emails': []})

@app.route('/composer')
def composer():
    return render_template('smart_composer.html')

@app.route('/api/generate-email', methods=['POST'])
def generate_email():
    """Génère un email avec IA"""
    try:
        data = request.get_json()
        context = data.get('context', '')
        tone = data.get('tone', 'professionnel')
        
        if not context:
            return jsonify({'success': False, 'error': 'Contexte requis'})
        
        # Simulation de génération IA
        templates = {
            'professionnel': f"Objet: {context}\n\nBonjour,\n\nJ'espère que vous allez bien. Je vous écris concernant {context}.\n\nCordialement",
            'amical': f"Salut !\n\nJ'espère que tu vas bien. Je voulais te parler de {context}.\n\nÀ bientôt !",
            'formel': f"Madame, Monsieur,\n\nJ'ai l'honneur de vous écrire au sujet de {context}.\n\nVeuillez agréer mes salutations distinguées.",
            'urgent': f"URGENT - {context}\n\nBonjour,\n\nIl est important que nous discutions rapidement de {context}.\n\nMerci de me recontacter."
        }
        
        template = templates.get(tone, templates['professionnel'])
        lines = template.split('\n')
        subject = context if not template.startswith('Objet:') else lines[0].replace('Objet: ', '')
        body = '\n'.join(lines[1:]) if template.startswith('Objet:') else template
        
        return jsonify({
            'success': True,
            'subject': subject,
            'body': body.strip()
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/send-email', methods=['POST'])
@rate_limiter.limit('api')
def send_email_api():
    global MASTER_PASSWORD_CACHE
    try:
        data = request.get_json()
        recipient = data.get('recipient')
        subject = data.get('subject')
        body = data.get('body')
        master_password_input = data.get('password')  # Mot de passe depuis le frontend
        
        # Vérifier si mot de passe fourni dans la requête
        if master_password_input:
            MASTER_PASSWORD_CACHE = master_password_input
            session['master_password'] = master_password_input
        elif not MASTER_PASSWORD_CACHE:
            MASTER_PASSWORD_CACHE = session.get('master_password')
        
        if not MASTER_PASSWORD_CACHE:
            return jsonify({
                'success': False, 
                'error': 'Mot de passe maître requis',
                'needsPassword': True
            }), 401
        
        if not all([recipient, subject, body]):
            return jsonify({'success': False, 'error': 'Données manquantes'}), 400
        
        if not credentials_existent(Config.APP_DIR):
            return jsonify({
                'success': False, 
                'error': 'Configuration Gmail requise. Allez dans Configuration pour ajouter vos identifiants.',
                'needsSetup': True
            }), 400
        
        app_password, sender_email = recuperer_app_password(MASTER_PASSWORD_CACHE, Config.APP_DIR)
        
        if not app_password:
            return jsonify({'success': False, 'error': 'Erreur déchiffrement. Vérifiez votre mot de passe maître.'}), 400
        
        result = smtp_service.send_email(sender_email, app_password, recipient, subject, body)
        
        if result.get('success'):
            db.log_email(recipient, subject, body, 'sent')
            return jsonify({'success': True, 'message': 'Email envoyé avec succès ✅'})
        else:
            return jsonify({'success': False, 'error': result.get('error')})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/nav')
def navigation():
    """Page de navigation principale"""
    return render_template('navigation.html')

@app.route('/generate')
def generate():
    """Page de génération IA"""
    return render_template('generate.html')

@app.route('/compose')
def compose():
    """Page de composition d'emails"""
    return render_template('compose.html')

@app.route('/send')
def send_page():
    """Page d'envoi d'emails"""
    return render_template('send.html')

@app.route('/history')
def history():
    """Page d'historique des emails"""
    return render_template('history.html')

@app.route('/editor')
def editor():
    """Éditeur rich text"""
    return render_template('editor.html')

@app.route('/templates')
def templates_page():
    """Gestion des templates"""
    return render_template('templates.html')

@app.route('/api/templates', methods=['GET', 'POST'])
def api_templates():
    """API gestion templates"""
    try:
        if request.method == 'GET':
            templates = template_manager.get_templates()
            return jsonify({'success': True, 'templates': templates})
        
        elif request.method == 'POST':
            data = request.get_json()
            
            # Validation
            template_id = validator.sanitize_input(data.get('id', ''), 50)
            name = validator.sanitize_input(data.get('name', ''), 100)
            subject = validator.sanitize_input(data.get('subject', ''), 200)
            body = validator.sanitize_input(data.get('body', ''), 5000)
            category = validator.sanitize_input(data.get('category', 'general'), 50)
            
            if not all([template_id, name, subject, body]):
                return jsonify({'success': False, 'error': 'Données manquantes'})
            
            success = template_manager.save_template(template_id, name, subject, body, category)
            
            if success:
                return jsonify({'success': True})
            else:
                return jsonify({'success': False, 'error': 'Erreur sauvegarde'})
                
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})



@app.route('/api/generate-content', methods=['POST'])
def generate_content():
    """Génère du contenu avec IA réelle"""
    try:
            
        data = request.get_json()
        context = data.get('context', '')
        email_type = data.get('emailType', 'general')
        tone = data.get('tone', 'professionnel')
        
        if not context:
            return jsonify({'success': False, 'error': 'Contexte requis'})
        
        # Récupérer clé OpenAI
        master_password = session_manager.get_master_password()
        api_key, org_id = recuperer_api_key(master_password, Config.APP_DIR)
        
        if api_key:
            try:
                # Utiliser OpenAI réel
                openai_service = OpenAIService(api_key, org_id)
                result = openai_service.generate_email(context, tone, email_type)
                
                if result.get('success'):
                    db.save_ai_generation(context, tone, result['subject'], result['body'])
                    return jsonify(result)
            except:
                pass
        
        # Templates améliorés avec développement
        templates = {
            'professionnel': f"Objet: Demande concernant {context}\n\nBonjour,\n\nJ'espère que vous allez bien.\n\nJe me permets de vous contacter aujourd'hui concernant {context}. Cette demande revêt une importance particulière pour moi et j'aimerais pouvoir compter sur votre bienveillance.\n\nPourriez-vous m'indiquer la procédure à suivre ainsi que les éléments nécessaires pour traiter cette demande dans les meilleurs délais ?\n\nJe reste à votre disposition pour tout complément d'information.\n\nEn vous remerciant par avance,\nCordialement",
            'amical': f"Salut !\n\nJ'espère que tu vas bien et que tout se passe bien de ton côté.\n\nJe voulais te parler de {context}. C'est quelque chose d'important pour moi et j'aimerais vraiment pouvoir compter sur ton aide ou tes conseils.\n\nEst-ce que tu penses que c'est possible ? Si tu as besoin de plus de détails, n'hésite pas à me demander.\n\nMerci d'avance pour ton temps !\n\nÀ bientôt !",
            'formel': f"Objet: Demande officielle - {context}\n\nMadame, Monsieur,\n\nJ'ai l'honneur de m'adresser à vous afin de vous présenter une demande concernant {context}.\n\nCette demande s'inscrit dans le cadre de mes droits et obligations, et je souhaiterais pouvoir bénéficier de votre expertise pour la traiter dans les règles de l'art.\n\nJe vous serais reconnaissant de bien vouloir m'indiquer les modalités et les pièces justificatives nécessaires pour donner suite à ma demande.\n\nDans l'attente de votre retour, je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.",
            'urgent': f"Objet: URGENT - {context}\n\nBonjour,\n\nJe me permets de vous contacter en urgence concernant {context}.\n\nCette situation nécessite une attention immédiate car elle impacte directement mes activités/obligations. Je comprends que vous êtes certainement très occupé(e), mais j'aurais vraiment besoin de votre aide rapidement.\n\nPourriez-vous me confirmer la réception de ce message et m'indiquer quand nous pourrions échanger à ce sujet ?\n\nJe reste joignable par téléphone si nécessaire.\n\nMerci infiniment pour votre réactivité.\n\nCordialement"
        }
        
        template = templates.get(tone, templates['professionnel'])
        lines = template.split('\n')
        subject = lines[0].replace('Objet: ', '')
        body = '\n'.join(lines[1:])
        
        return jsonify({
            'success': True,
            'subject': subject,
            'body': body.strip(),
            'source': 'template'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/email-history')
def get_email_history():
    """Récupère l'historique réel des emails"""
    try:
        if not session_manager.validate_session():
            return jsonify({'success': False, 'error': 'Session expirée'})
            
        emails = db.get_email_history()
        return jsonify({'success': True, 'emails': emails})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/admin')
def admin():
    """Page d'administration"""
    return render_template('admin.html')

@app.route('/api/admin/users', methods=['GET', 'POST'])
def admin_users():
    """Gestion des utilisateurs"""
    try:
        if request.method == 'GET':
            users = user_manager.get_users()
            return jsonify({'success': True, 'users': users})
        
        elif request.method == 'POST':
            data = request.get_json()
            username = data.get('username')
            email = data.get('email')
            password = data.get('password')
            role = data.get('role', 'user')
            
            success, message = user_manager.create_user(username, email, password, role)
            
            if success:
                return jsonify({'success': True})
            else:
                return jsonify({'success': False, 'error': message})
                
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/admin/analytics')
def admin_analytics():
    """Analytics pour l'administration"""
    try:
        report = advanced_analytics.generate_report('weekly')
        return jsonify({'success': True, 'analytics': report})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/analyze-document', methods=['POST'])
def analyze_document():
    """Analyse un document avec IA"""
    try:
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'Aucun fichier fourni'})
        
        file = request.files['file']
        context = request.form.get('context', '')
        
        if file.filename == '':
            return jsonify({'success': False, 'error': 'Fichier invalide'})
        
        # Lire le contenu du fichier
        file_content = file.read().decode('utf-8', errors='ignore')
        
        # Analyse simple du document
        analysis = {
            'summary': f'Analyse du document: {file.filename}',
            'key_points': ['Point 1', 'Point 2', 'Point 3'],
            'suggested_action': 'Envoyer un email de suivi',
            'context': context
        }
        
        # Suggestions de destinataires
        suggested_recipients = [
            {'name': 'Contact 1', 'email': 'contact1@example.com', 'relevance': 'Haut'},
            {'name': 'Contact 2', 'email': 'contact2@example.com', 'relevance': 'Moyen'}
        ]
        
        return jsonify({
            'success': True,
            'analysis': analysis,
            'suggested_recipients': suggested_recipients
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/generate-email-from-analysis', methods=['POST'])
def generate_email_from_analysis():
    """Génère un email basé sur l'analyse d'un document"""
    try:
        data = request.get_json()
        analysis = data.get('analysis', {})
        recipient = data.get('recipient', {})
        
        # Génération d'email basée sur l'analyse
        email = {
            'sujet': f"Suite à l'analyse - {analysis.get('summary', '')[:50]}",
            'corps': f"Bonjour {recipient.get('name', '')},\n\nSuite à l'analyse du document, voici les points clés:\n\n" + 
                     '\n'.join([f'- {point}' for point in analysis.get('key_points', [])]) + 
                     f"\n\n{analysis.get('suggested_action', '')}\n\nCordialement"
        }
        
        return jsonify({'success': True, 'email': email})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/automation')
def automation():
    """Page d'automatisation"""
    return render_template('automation.html')

@app.route('/security')
def security():
    """Page de sécurité"""
    return render_template('security.html')

@app.route('/api/schedule-email', methods=['POST'])
def schedule_email():
    """Programme un email"""
    try:
        data = request.get_json()
        # Simulation de programmation
        return jsonify({'success': True, 'id': 1})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/create-campaign', methods=['POST'])
def create_campaign():
    """Crée une campagne d'emails"""
    try:
        data = request.get_json()
        # Simulation de création
        return jsonify({'success': True, 'id': 1})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

if ENHANCED_FEATURES:
    @app.route('/api/voice/speak', methods=['POST'])
    def voice_speak():
        """Text-to-speech endpoint"""
        try:
            data = request.get_json()
            text = data.get('text', '')
            tts_service.speak(text)
            return jsonify({'success': True})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)})

    @app.route('/api/2fa/setup', methods=['POST'])
    def setup_2fa():
        """Setup 2FA for user"""
        try:
            data = request.get_json()
            email = data.get('email')
            secret = two_fa.generate_secret(email)
            qr_code = two_fa.get_qr_code(email, secret)
            return jsonify({'success': True, 'secret': secret, 'qr_code': qr_code})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)})

    @app.route('/api/schedule/email', methods=['POST'])
    def schedule_email_endpoint():
        """Schedule email for later sending"""
        try:
            data = request.get_json()
            success = scheduler.schedule_email(
                data.get('recipient'),
                data.get('subject'),
                data.get('body'),
                data.get('send_time')
            )
            return jsonify({'success': success})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)})

@app.route('/api/scheduled-emails')
def get_scheduled_emails():
    """Récupère les emails programmés"""
    try:
        if not ENHANCED_FEATURES:
            return jsonify({'success': False, 'error': 'Feature non disponible'}), 501
        
        emails = scheduler.get_all_scheduled_emails()
        return jsonify({'success': True, 'emails': emails})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/scheduled-emails/<int:email_id>', methods=['DELETE'])
def cancel_scheduled_email(email_id):
    """Annule un email programmé"""
    try:
        if not ENHANCED_FEATURES:
            return jsonify({'success': False, 'error': 'Feature non disponible'}), 501
        
        success = scheduler.cancel_scheduled_email(email_id)
        if success:
            return jsonify({'success': True, 'message': 'Email annulé'})
        else:
            return jsonify({'success': False, 'error': 'Email non trouvé ou déjà envoyé'}), 404
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/smart')
def smart_composer():
    return render_template('smart_form.html')

@app.route('/api/analyze-documents', methods=['POST'])
def analyze_documents():
    try:
        from src.services.document_analyzer import DocumentAnalyzer
        analyzer = DocumentAnalyzer()
        
        files = request.files.getlist('files')
        content = ""
        
        for file in files:
            if file.filename:
                temp_path = f"uploads/{file.filename}"
                os.makedirs('uploads', exist_ok=True)
                file.save(temp_path)
                
                text = analyzer.analyze_document(temp_path)
                content += f"Fichier {file.filename}:\n{text}\n\n"
                
                os.remove(temp_path)
        
        return jsonify({'success': True, 'content': content})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/analyze-image', methods=['POST'])
def analyze_image():
    """Analyse une image avec GPT-4 Vision"""
    try:
        # Récupérer la clé API OpenAI
        password = session.get('master_password')
        if not password:
            return jsonify({'success': False, 'error': 'Session expirée'}), 401
        
        api_key, _ = recuperer_api_key(password, Config.APP_DIR)
        if not api_key:
            return jsonify({'success': False, 'error': 'Clé OpenAI non configurée'}), 400
        
        # Importer et initialiser le service
        from src.services.multimodal_service import MultimodalService
        multimodal_service = MultimodalService(api_key)
        
        # Récupérer les fichiers et paramètres
        files = request.files.getlist('images')
        analysis_type = request.form.get('type', 'general')  # general, ocr, email_context
        tone = request.form.get('tone', 'professionnel')
        recipient_context = request.form.get('recipient_context', '')
        
        if not files:
            return jsonify({'success': False, 'error': 'Aucune image fournie'}), 400
        
        results = []
        os.makedirs('uploads', exist_ok=True)
        
        for file in files:
            if file.filename:
                # Sauvegarder temporairement
                temp_path = os.path.join('uploads', f'temp_{file.filename}')
                file.save(temp_path)
                
                try:
                    if analysis_type == 'ocr':
                        # Extraction de texte uniquement
                        result = multimodal_service.extract_text_from_image(temp_path)
                    elif analysis_type == 'email_context':
                        # Analyse pour contexte email
                        result = multimodal_service.analyze_for_email_context(temp_path)
                    elif analysis_type == 'generate_email':
                        # Génération complète d'email
                        email_data = multimodal_service.generate_email_from_image(
                            temp_path, 
                            tone=tone, 
                            recipient_context=recipient_context
                        )
                        result = email_data
                    else:
                        # Analyse générale
                        result = multimodal_service.analyze_image(temp_path)
                    
                    results.append({
                        'filename': file.filename,
                        'analysis': result
                    })
                    
                finally:
                    # Nettoyer le fichier temporaire
                    if os.path.exists(temp_path):
                        os.remove(temp_path)
        
        # Formater la réponse selon le type d'analyse
        if analysis_type == 'generate_email' and results:
            # Retourner directement l'email généré
            return jsonify({
                'success': True,
                'subject': results[0]['analysis'].get('subject', ''),
                'body': results[0]['analysis'].get('body', ''),
                'images_analyzed': len(results)
            })
        else:
            # Retourner les analyses
            return jsonify({
                'success': True,
                'analyses': results,
                'total_images': len(results)
            })
        
    except ValueError as e:
        return jsonify({'success': False, 'error': str(e)}), 400
    except Exception as e:
        return jsonify({'success': False, 'error': f'Erreur analyse image: {str(e)}'}), 500

@app.route('/api/transcribe-audio', methods=['POST'])
def transcribe_audio():
    try:
        from src.services.document_analyzer import DocumentAnalyzer
        analyzer = DocumentAnalyzer()
        
        audio_file = request.files['audio']
        temp_path = "uploads/temp_audio.wav"
        os.makedirs('uploads', exist_ok=True)
        audio_file.save(temp_path)
        
        text = analyzer.transcribe_audio(temp_path)
        os.remove(temp_path)
        
        return jsonify({'success': True, 'text': text})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/generate-smart-email', methods=['POST'])
def generate_smart_email():
    try:
        data = request.get_json()
        context = data.get('context', '')
        email_type = data.get('emailType', 'demande')
        tone = data.get('tone', 'professionnel')
        
        enhanced_prompt = f"Analyse ces données et crée un email {tone} de type {email_type}:\n\n{context}\n\nUtilise TOUTES les informations pertinentes."
        
        master_password = session_manager.get_master_password()
        if master_password:
            api_key, org_id = recuperer_api_key(master_password, Config.APP_DIR)
            if api_key:
                try:
                    openai_service = OpenAIService(api_key, org_id)
                    result = openai_service.generate_email(enhanced_prompt, tone, email_type)
                    if result.get('success'):
                        return jsonify(result)
                except:
                    pass
        
        subject = f"Demande concernant les éléments transmis"
        body = f"Bonjour,\n\nSuite à l'analyse des éléments transmis:\n\n{context[:300]}...\n\nJe reste à votre disposition.\n\nCordialement"
        
        return jsonify({'success': True, 'subject': subject, 'body': body})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

# ==================== INBOX MANAGEMENT ROUTES ====================

@app.route('/api/inbox', methods=['GET'])
def get_inbox():
    """Récupère tous les emails de la boîte de réception"""
    try:
        emails = inbox_manager.emails
        threads = inbox_manager.threads
        
        return jsonify({
            'success': True,
            'emails': emails,
            'threads': threads
        })
    except Exception as e:
        logger.error(f"Erreur récupération inbox: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/inbox/sync', methods=['POST'])
def sync_inbox():
    """Synchronise les emails depuis Gmail"""
    try:
        data = request.json or {}
        days_back = data.get('days_back', 30)
        
        # Récupérer les identifiants Gmail
        if MASTER_PASSWORD_CACHE:
            app_password, email_address = recuperer_app_password(MASTER_PASSWORD_CACHE, Config.APP_DIR)
            
            if app_password and email_address:
                
                # Synchroniser
                fetched = inbox_manager.fetch_emails(email_address, app_password, days_back)
                
                return jsonify({
                    'success': True,
                    'fetched_count': len(fetched),
                    'message': f'{len(fetched)} emails synchronisés'
                })
            else:
                return jsonify({
                    'success': False,
                    'error': 'Identifiants Gmail non configurés'
                }), 400
        else:
            return jsonify({
                'success': False,
                'error': 'Session expirée, veuillez vous reconnecter'
            }), 401
            
    except Exception as e:
        logger.error(f"Erreur synchronisation inbox: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/inbox/statistics', methods=['GET'])
def get_inbox_statistics():
    """Récupère les statistiques de la boîte de réception"""
    try:
        stats = inbox_manager.get_statistics()
        
        return jsonify({
            'success': True,
            'statistics': stats
        })
    except Exception as e:
        logger.error(f"Erreur statistiques inbox: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/inbox/filter', methods=['POST'])
def filter_inbox():
    """Filtre les emails selon des critères"""
    try:
        filters = request.json or {}
        
        filtered_emails = inbox_manager.filter_emails(filters)
        
        return jsonify({
            'success': True,
            'emails': filtered_emails,
            'count': len(filtered_emails)
        })
    except Exception as e:
        logger.error(f"Erreur filtrage inbox: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/inbox/<message_id>/read', methods=['POST'])
def mark_email_read(message_id):
    """Marque un email comme lu"""
    try:
        inbox_manager.mark_as_read(message_id)
        
        return jsonify({
            'success': True,
            'message': 'Email marqué comme lu'
        })
    except Exception as e:
        logger.error(f"Erreur marquer comme lu: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/inbox/<message_id>/replied', methods=['POST'])
def mark_email_replied(message_id):
    """Marque un email comme répondu"""
    try:
        inbox_manager.mark_as_replied(message_id)
        
        return jsonify({
            'success': True,
            'message': 'Email marqué comme répondu'
        })
    except Exception as e:
        logger.error(f"Erreur marquer comme répondu: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/inbox/<message_id>/tag', methods=['POST'])
def add_email_tag(message_id):
    """Ajoute un tag à un email"""
    try:
        data = request.json or {}
        tag = data.get('tag')
        
        if not tag:
            return jsonify({'success': False, 'error': 'Tag requis'}), 400
        
        inbox_manager.add_tag(message_id, tag)
        
        return jsonify({
            'success': True,
            'message': f'Tag "{tag}" ajouté'
        })
    except Exception as e:
        logger.error(f"Erreur ajout tag: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/inbox/<message_id>/note', methods=['POST'])
def add_email_note(message_id):
    """Ajoute une note à un email"""
    try:
        data = request.json or {}
        note = data.get('note')
        
        if not note:
            return jsonify({'success': False, 'error': 'Note requise'}), 400
        
        inbox_manager.add_note(message_id, note)
        
        return jsonify({
            'success': True,
            'message': 'Note ajoutée'
        })
    except Exception as e:
        logger.error(f"Erreur ajout note: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/inbox/thread/<message_id>', methods=['GET'])
def get_email_thread(message_id):
    """Récupère tous les emails d'un fil de discussion"""
    try:
        thread_emails = inbox_manager.get_thread(message_id)
        
        return jsonify({
            'success': True,
            'thread': thread_emails,
            'count': len(thread_emails)
        })
    except Exception as e:
        logger.error(f"Erreur récupération thread: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

# ==================== END INBOX ROUTES ====================

# ==================== VOICE TRANSCRIPTION ROUTES ====================

@app.route('/api/voice/devices', methods=['GET'])
def get_voice_devices():
    """Liste les périphériques audio disponibles"""
    try:
        if not realtime_transcription:
            return jsonify({
                'success': False,
                'error': 'Service de transcription non disponible'
            }), 503
        
        devices = realtime_transcription.get_devices()
        
        return jsonify({
            'success': True,
            'devices': devices
        })
    except Exception as e:
        logger.error(f"Erreur liste périphériques: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/voice/start', methods=['POST'])
def start_voice_recording():
    """Démarre l'enregistrement et la transcription en temps réel"""
    try:
        if not realtime_transcription:
            return jsonify({
                'success': False,
                'error': 'Service de transcription non disponible'
            }), 503
        
        data = request.json or {}
        device_index = data.get('device_index')
        
        result = realtime_transcription.start_session(device_index)
        
        return jsonify(result)
    except Exception as e:
        logger.error(f"Erreur démarrage enregistrement: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/voice/stop', methods=['POST'])
def stop_voice_recording():
    """Arrête l'enregistrement et retourne la transcription"""
    try:
        if not realtime_transcription:
            return jsonify({
                'success': False,
                'error': 'Service de transcription non disponible'
            }), 503
        
        # Sauvegarder dans dossier uploads
        uploads_dir = os.path.join(Config.APP_DIR, 'uploads')
        os.makedirs(uploads_dir, exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_file = os.path.join(uploads_dir, f"voice_{timestamp}.wav")
        
        result = realtime_transcription.stop_session(output_file)
        
        return jsonify(result)
    except Exception as e:
        logger.error(f"Erreur arrêt enregistrement: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/voice/download/<filename>', methods=['GET'])
def download_voice_file(filename):
    """Télécharge un fichier audio enregistré"""
    try:
        uploads_dir = os.path.join(Config.APP_DIR, 'uploads')
        file_path = os.path.join(uploads_dir, filename)
        
        if not os.path.exists(file_path):
            return jsonify({'success': False, 'error': 'Fichier introuvable'}), 404
        
        return send_file(file_path, as_attachment=True)
    except Exception as e:
        logger.error(f"Erreur téléchargement audio: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

# ==================== END VOICE ROUTES ====================

# ==================== ACCESSIBILITY ROUTES ====================

@app.route('/api/accessibility/speak', methods=['POST'])
def accessibility_speak():
    """Prononce un texte (pour aveugles)"""
    try:
        if not accessibility_service:
            return jsonify({'success': False, 'error': 'Service non disponible'}), 503
        
        data = request.json or {}
        text = data.get('text', '')
        priority = data.get('priority', 'normal')
        
        if not text:
            return jsonify({'success': False, 'error': 'Texte requis'}), 400
        
        accessibility_service.speak(text, priority)
        
        return jsonify({
            'success': True,
            'message': 'Texte prononcé',
            'text': text
        })
    except Exception as e:
        logger.error(f"Erreur TTS: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/accessibility/transcripts', methods=['GET'])
def get_accessibility_transcripts():
    """Récupère les transcriptions visuelles (pour sourds)"""
    try:
        if not accessibility_service:
            return jsonify({'success': False, 'error': 'Service non disponible'}), 503
        
        limit = request.args.get('limit', 50, type=int)
        transcripts = accessibility_service.get_transcripts(limit)
        
        return jsonify({
            'success': True,
            'transcripts': transcripts,
            'count': len(transcripts)
        })
    except Exception as e:
        logger.error(f"Erreur transcripts: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/accessibility/announce', methods=['POST'])
def accessibility_announce():
    """Annonce une action de manière universelle"""
    try:
        if not accessibility_service:
            return jsonify({'success': False, 'error': 'Service non disponible'}), 503
        
        data = request.json or {}
        action = data.get('action', '')
        details = data.get('details', '')
        speak = data.get('speak', True)
        show = data.get('show', True)
        
        result = accessibility_service.announce_action(action, details, speak, show)
        
        return jsonify({
            'success': True,
            'result': result
        })
    except Exception as e:
        logger.error(f"Erreur announce: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/accessibility/keyboard-shortcuts', methods=['GET'])
def get_keyboard_shortcuts():
    """Retourne les raccourcis clavier"""
    try:
        if not accessibility_service:
            return jsonify({'success': False, 'error': 'Service non disponible'}), 503
        
        shortcuts = accessibility_service.get_keyboard_shortcuts()
        
        return jsonify({
            'success': True,
            'shortcuts': shortcuts
        })
    except Exception as e:
        logger.error(f"Erreur shortcuts: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/accessibility/settings', methods=['GET', 'POST'])
def accessibility_settings():
    """Gère les paramètres d'accessibilité"""
    try:
        if not accessibility_service:
            return jsonify({'success': False, 'error': 'Service non disponible'}), 503
        
        if request.method == 'POST':
            data = request.json or {}
            
            # Paramètres TTS
            if 'tts_rate' in data or 'tts_volume' in data:
                accessibility_service.set_tts_settings(
                    rate=data.get('tts_rate'),
                    volume=data.get('tts_volume')
                )
            
            # Taille de police
            if 'font_size' in data:
                accessibility_service.set_font_size(data['font_size'])
            
            # Haut contraste
            if 'toggle_contrast' in data and data['toggle_contrast']:
                accessibility_service.toggle_high_contrast()
            
            # Toggle TTS
            if 'toggle_tts' in data and data['toggle_tts']:
                accessibility_service.toggle_tts()
        
        # Retourner les paramètres actuels
        return jsonify({
            'success': True,
            'settings': {
                'tts_enabled': accessibility_service.tts_enabled,
                'tts_rate': accessibility_service.tts_rate,
                'tts_volume': accessibility_service.tts_volume,
                'font_size': accessibility_service.font_size,
                'high_contrast': accessibility_service.high_contrast
            }
        })
    except Exception as e:
        logger.error(f"Erreur settings: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

# ==================== SIGNATURE ROUTES ====================

@app.route('/signature')
def signature_page():
    """Page de signature numérique"""
    return render_template('signature_pad.html')

@app.route('/api/signatures', methods=['GET', 'POST'])
def manage_signatures():
    """Gestion des signatures numériques"""
    try:
        from src.services.signature_service import SignatureService
        signature_service = SignatureService(Config.APP_DIR)
        
        if request.method == 'GET':
            signatures = signature_service.get_signatures()
            # Ajouter les données d'image pour l'affichage
            for sig in signatures:
                sig['image_data'] = signature_service.get_signature_image(sig['id'])
            
            return jsonify({
                'success': True,
                'signatures': signatures
            })
        
        elif request.method == 'POST':
            data = request.get_json()
            signature_data = data.get('signature_data')
            name = data.get('name')
            
            if not signature_data or not name:
                return jsonify({
                    'success': False,
                    'error': 'Données manquantes'
                }), 400
            
            result = signature_service.save_signature(signature_data, name)
            return jsonify(result)
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/signatures/<signature_id>', methods=['DELETE'])
def delete_signature(signature_id):
    """Supprime une signature"""
    try:
        from src.services.signature_service import SignatureService
        signature_service = SignatureService(Config.APP_DIR)
        
        result = signature_service.delete_signature(signature_id)
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/document-types', methods=['GET'])
def get_document_types():
    """Récupère les types de documents officiels"""
    try:
        from src.services.signature_service import SignatureService
        signature_service = SignatureService(Config.APP_DIR)
        
        types = signature_service.get_document_types()
        return jsonify({
            'success': True,
            'types': types
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/sign-document', methods=['POST'])
def sign_document():
    """Applique une signature sur un document"""
    try:
        from src.services.signature_service import SignatureService
        signature_service = SignatureService(Config.APP_DIR)
        
        data = request.get_json()
        document_path = data.get('document_path')
        signature_id = data.get('signature_id')
        position = data.get('position')
        
        if not document_path or not signature_id:
            return jsonify({
                'success': False,
                'error': 'Document et signature requis'
            }), 400
        
        result = signature_service.apply_signature_to_document(
            document_path, signature_id, position
        )
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ==================== END SIGNATURE ROUTES ====================

# ==================== OFFICIAL DOCUMENTS ROUTES ====================

@app.route('/documents-officiels')
def official_documents():
    """Page des documents officiels"""
    return render_template('official_documents.html')

@app.route('/api/official-templates', methods=['GET'])
def get_official_templates():
    """Récupère les templates de documents officiels"""
    try:
        from src.services.official_documents import OfficialDocumentService
        doc_service = OfficialDocumentService(Config.APP_DIR)
        
        templates = doc_service.get_official_templates()
        return jsonify({
            'success': True,
            'templates': templates
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/official-documents', methods=['POST'])
def create_official_document():
    """Crée un document officiel avec valeur légale"""
    try:
        from src.services.official_documents import OfficialDocumentService
        doc_service = OfficialDocumentService(Config.APP_DIR)
        
        data = request.get_json()
        doc_type = data.get('doc_type')
        content = data.get('content')
        sender_info = data.get('sender_info')
        recipient_info = data.get('recipient_info')
        
        if not all([doc_type, content, sender_info, recipient_info]):
            return jsonify({
                'success': False,
                'error': 'Données manquantes'
            }), 400
        
        result = doc_service.create_official_document(
            doc_type, content, sender_info, recipient_info
        )
        
        if result['success'] and audit:
            audit.log_event('official_document_created', '', {
                'document_id': result['document_id'],
                'type': doc_type,
                'recipient': recipient_info.get('organization', '')
            })
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/verify-document/<doc_id>', methods=['GET'])
def verify_document(doc_id):
    """Vérifie l'authenticité d'un document officiel"""
    try:
        from src.services.official_documents import OfficialDocumentService
        doc_service = OfficialDocumentService(Config.APP_DIR)
        
        result = doc_service.verify_document_authenticity(doc_id)
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/legal-proof/<doc_id>', methods=['GET'])
def get_legal_proof(doc_id):
    """Génère un package de preuves légales"""
    try:
        from src.services.official_documents import OfficialDocumentService
        doc_service = OfficialDocumentService(Config.APP_DIR)
        
        result = doc_service.get_legal_proof_package(doc_id)
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ==================== END OFFICIAL DOCUMENTS ROUTES ====================

# ==================== LOCAL AI ROUTES ====================

@app.route('/ia-privee')
def private_ai():
    """Page de l'IA privée"""
    return render_template('privacy_ai.html')

@app.route('/ia-personnalisee')
def personalized_ai():
    """Page de l'IA personnalisée basée sur votre historique"""
    return render_template('ai_training.html')

@app.route('/api/generate-local-ai', methods=['POST'])
def generate_local_ai():
    """Génère du contenu avec l'IA locale (AUCUN envoi externe)"""
    try:
        from src.services.local_ai_service import LocalAIService
        local_ai = LocalAIService(Config.APP_DIR)
        
        data = request.get_json()
        context = data.get('context', '')
        tone = data.get('tone', 'professionnel')
        email_type = data.get('email_type', 'general')
        
        if not context:
            return jsonify({
                'success': False,
                'error': 'Contexte requis'
            }), 400
        
        # Génération 100% locale
        result = local_ai.generate_email_local(context, tone, email_type)
        
        if result['success'] and audit:
            audit.log_event('local_ai_generation', '', {
                'context_length': len(context),
                'tone': tone,
                'privacy_protected': True
            })
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/privacy-report', methods=['GET'])
def get_privacy_report():
    """Rapport de protection des données"""
    try:
        from src.services.local_ai_service import LocalAIService
        local_ai = LocalAIService(Config.APP_DIR)
        
        report = local_ai.get_privacy_report()
        return jsonify({
            'success': True,
            'report': report
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/ai-feedback', methods=['POST'])
def submit_ai_feedback():
    """Soumet un feedback pour améliorer l'IA locale"""
    try:
        from src.services.local_ai_service import LocalAIService
        local_ai = LocalAIService(Config.APP_DIR)
        
        data = request.get_json()
        context = data.get('context', '')
        generated_content = data.get('generated_content', '')
        feedback = data.get('feedback', 0)  # 1=bon, 0=mauvais
        improvements = data.get('improvements', '')
        
        result = local_ai.improve_with_feedback(
            context, generated_content, feedback, improvements
        )
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/ai-statistics', methods=['GET'])
def get_ai_statistics():
    """Statistiques de l'IA locale"""
    try:
        from src.services.local_ai_service import LocalAIService
        local_ai = LocalAIService(Config.APP_DIR)
        
        stats = local_ai.get_statistics()
        return jsonify({
            'success': True,
            'statistics': stats
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ==================== END LOCAL AI ROUTES ====================

# ==================== AI TRAINING ROUTES ====================

@app.route('/api/train-ai-from-database', methods=['POST'])
def train_ai_from_database():
    """Entraîne l'IA avec les emails de votre base de données"""
    try:
        from src.services.ai_training_service import AITrainingService
        training_service = AITrainingService(Config.APP_DIR)
        
        # Alimenter l'IA avec l'historique des emails
        result = training_service.feed_from_email_history()
        
        if result['success'] and audit:
            audit.log_event('ai_training_from_db', '', {
                'emails_processed': result.get('processed', 0),
                'privacy_protected': True
            })
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/generate-from-history', methods=['POST'])
def generate_from_history():
    """Génère un email basé sur vos patterns d'emails précédents"""
    try:
        from src.services.ai_training_service import AITrainingService
        training_service = AITrainingService(Config.APP_DIR)
        
        data = request.get_json()
        context = data.get('context', '')
        tone = data.get('tone', 'professionnel')
        
        if not context:
            return jsonify({
                'success': False,
                'error': 'Contexte requis'
            }), 400
        
        # Générer basé sur l'historique
        result = training_service.generate_with_learned_patterns(context, tone)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/training-statistics', methods=['GET'])
def get_training_statistics():
    """Statistiques de l'entraînement IA"""
    try:
        from src.services.ai_training_service import AITrainingService
        training_service = AITrainingService(Config.APP_DIR)
        
        stats = training_service.get_training_statistics()
        return jsonify(stats)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ==================== END AI TRAINING ROUTES ====================

# ==================== BULK TRAINING ROUTES ====================

@app.route('/api/feed-ai-massive', methods=['POST'])
def feed_ai_massive():
    """Alimente massivement l'IA avec des centaines d'exemples"""
    try:
        from src.services.bulk_training_service import BulkTrainingService
        bulk_service = BulkTrainingService(Config.APP_DIR)
        
        # Alimenter avec des exemples massifs
        result1 = bulk_service.feed_massive_examples()
        result2 = bulk_service.add_professional_templates()
        
        total_added = result1.get('total_examples', 0) + result2.get('added', 0)
        
        if audit:
            audit.log_event('bulk_ai_training', '', {
                'examples_added': total_added,
                'training_type': 'massive_feed'
            })
        
        return jsonify({
            'success': True,
            'total_added': total_added,
            'message': f'{total_added} exemples ajoutés pour entraînement massif',
            'details': {
                'basic_examples': result1.get('total_examples', 0),
                'professional_templates': result2.get('added', 0)
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/training-count', methods=['GET'])
def get_training_count():
    """Compte le nombre d'exemples d'entraînement"""
    try:
        from src.services.bulk_training_service import BulkTrainingService
        bulk_service = BulkTrainingService(Config.APP_DIR)
        
        result = bulk_service.get_training_count()
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ==================== END BULK TRAINING ROUTES ====================

@app.route('/api/accessibility/profile', methods=['POST'])
def create_accessibility_profile():
    """Crée un profil d'accessibilité personnalisé"""
    try:
        if not accessibility_service:
            return jsonify({'success': False, 'error': 'Service non disponible'}), 503
        
        data = request.json or {}
        user_needs = data.get('needs', [])
        
        profile = accessibility_service.create_accessibility_profile(user_needs)
        
        # Appliquer automatiquement les paramètres recommandés
        if profile['settings'].get('tts_enabled'):
            accessibility_service.tts_enabled = True
        if profile['settings'].get('high_contrast'):
            accessibility_service.high_contrast = True
        if profile['settings'].get('font_size'):
            accessibility_service.font_size = profile['settings']['font_size']
        
        return jsonify({
            'success': True,
            'profile': profile
        })
    except Exception as e:
        logger.error(f"Erreur profile: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/accessibility/describe-screen', methods=['POST'])
def describe_screen():
    """Décrit l'écran courant (pour aveugles)"""
    try:
        if not accessibility_service:
            return jsonify({'success': False, 'error': 'Service non disponible'}), 503
        
        data = request.json or {}
        context = data.get('context', {})
        
        description = accessibility_service.generate_audio_description(context)
        accessibility_service.speak(description)
        
        return jsonify({
            'success': True,
            'description': description
        })
    except Exception as e:
        logger.error(f"Erreur describe: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

# ==================== END ACCESSIBILITY ROUTES ====================

# Routes pour basculer vers interface accessible
@app.route('/switch_to_accessible')
def switch_to_accessible():
    """Basculer vers l'interface accessible"""
    session['accessibility_mode'] = True
    return redirect('/accessible/')

@app.route('/switch_to_standard')
def switch_to_standard():
    """Basculer vers l'interface standard"""
    session.pop('accessibility_mode', None)
    return redirect('/')

@app.context_processor
def inject_accessibility_context():
    """Injecter contexte d'accessibilité dans tous les templates"""
    context = {
        'accessibility_mode': session.get('accessibility_mode', False),
        'show_accessibility_toggle': session.get('authenticated', False)
    }
    
    if HAS_ACCESSIBLE_INTEGRATION and session.get('accessibility_mode'):
        context['accessible_navigation'] = get_accessible_navigation()
    
    return context

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    host = os.environ.get('HOST', '127.0.0.1')
    
    print("\n" + "="*50)
    print("IAPosteManager v2.2 - Demarrage")
    print("="*50)
    print(f"\nURL: http://{host}:{port}")
    print(f"App directory: {Config.APP_DIR}")
    
    if HAS_ACCESSIBLE_INTEGRATION:
        print("\nInterface Accessible intégrée:")
        print("- /accessible/ - Interface universelle")
        print("- Navigation vocale complète")
        print("- Auto-ajustements utilisateur")
    
    if ENHANCED_FEATURES:
        print("\nNouvelles fonctionnalités:")
        print("- Interface vocale (/agent)")
        print("- Authentification 2FA")
        print("- Planification d'emails")
        print("- API REST (/api/v1/)")
        print("- Mode sombre")
        if scheduler:
            scheduler.start_scheduler()
    else:
        print("\nMode de base activé")
    
    if HAS_REALTIME_TRANSCRIPTION and HAS_SOCKETIO:
        print("\nTranscription temps réel activée:")
        print("- WebSocket pour streaming vocal")
        print("- Affichage texte en temps réel")
    
    print("="*50 + "\n")
    
    # Use standard Flask server for better compatibility
    print(f"Starting server on {host}:{port}...")
    app.run(debug=False, host=host, port=port, threaded=True)

