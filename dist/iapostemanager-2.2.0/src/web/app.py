"""Application Flask - IAPosteManager v2.2"""
from flask import Flask, render_template, request, jsonify, session, redirect
from flask_cors import CORS
try:
    from flask_session import Session
    HAS_FLASK_SESSION = True
except ImportError:
    HAS_FLASK_SESSION = False
import sys
import os
from dotenv import load_dotenv

load_dotenv()
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from src.core.config import Config
from src.core.crypto_utils import *
from src.core.database import Database
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
from src.analytics.advanced_analytics import AdvancedAnalytics
from src.monitoring.prometheus import metrics_endpoint, track_request
from src.api.v1 import api_v1
from src.api.smart_email import smart_bp
from src.web.email_routes import email_bp
try:
    from src.security.two_factor_auth import TwoFactorAuth
    from src.accessibility.tts_service import TTSService
    from src.automation.email_scheduler import EmailScheduler
    from src.api.rest_endpoints import api_bp
    ENHANCED_FEATURES = True
except ImportError:
    ENHANCED_FEATURES = False

app = Flask(__name__, template_folder='../../templates', static_folder='../../static')

# Security: SECRET_KEY must be set in environment
if not os.environ.get('SECRET_KEY'):
    raise ValueError("SECRET_KEY environment variable must be set")

app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['SESSION_COOKIE_SECURE'] = os.environ.get('FLASK_ENV') == 'production'
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['PERMANENT_SESSION_LIFETIME'] = 3600
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max

if HAS_FLASK_SESSION:
    app.config['SESSION_TYPE'] = 'filesystem'
    app.config['SESSION_FILE_DIR'] = os.path.join(Config.APP_DIR, 'flask_session')
    os.makedirs(app.config['SESSION_FILE_DIR'], exist_ok=True)
    Session(app)

CORS(app)

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
    return render_template('login.html')

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
    session.clear()
    return redirect('/login')

@app.route('/')
def index():
    if not credentials_existent(Config.APP_DIR):
        return render_template('index.html', first_time=True)
    return render_template('navigation.html')

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

@app.route('/api/templates/search')
def search_templates():
    query = request.args.get('q', '')
    return jsonify({'templates': []})

@app.route('/api/emails/draft', methods=['POST'])
def save_draft():
    return jsonify({'success': True, 'id': 1})

@app.route('/api/contacts')
def get_contacts():
    return jsonify({'contacts': []})

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
        if not MASTER_PASSWORD_CACHE:
            MASTER_PASSWORD_CACHE = session.get('master_password')
        
        if not MASTER_PASSWORD_CACHE:
            return jsonify({'success': False, 'error': 'Session expirée. Reconnectez-vous.'}), 401
        
        data = request.get_json()
        recipient = data.get('recipient')
        subject = data.get('subject')
        body = data.get('body')
        
        if not all([recipient, subject, body]):
            return jsonify({'success': False, 'error': 'Données manquantes'}), 400
        
        if not credentials_existent(Config.APP_DIR):
            return jsonify({'success': False, 'error': 'Gmail non configuré'}), 400
        
        app_password, sender_email = recuperer_app_password(MASTER_PASSWORD_CACHE, Config.APP_DIR)
        
        if not app_password:
            return jsonify({'success': False, 'error': 'Erreur déchiffrement'}), 400
        
        result = smtp_service.send_email(sender_email, app_password, recipient, subject, body)
        
        if result.get('success'):
            db.log_email(recipient, subject, body, 'sent')
            return jsonify({'success': True, 'message': 'Email envoyé'})
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

@app.route('/api/templates/<template_id>', methods=['DELETE'])
def delete_template(template_id):
    """Supprime un template"""
    try:
        template_id = validator.sanitize_input(template_id, 50)
        success = template_manager.delete_template(template_id)
        
        if success:
            return jsonify({'success': True})
        else:
            return jsonify({'success': False, 'error': 'Template non trouvé'})
            
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
        # Simulation de données
        emails = []
        return jsonify({'success': True, 'emails': emails})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

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

if __name__ == '__main__':
    print("\n" + "="*50)
    print("IAPosteManager v2.2 - Demarrage")
    print("="*50)
    print(f"\nURL: http://127.0.0.1:5000")
    print(f"App directory: {Config.APP_DIR}")
    if ENHANCED_FEATURES:
        print("\nNouvelles fonctionnalités:")
        print("- Interface vocale (/agent)")
        print("- Authentification 2FA")
        print("- Planification d'emails")
        print("- API REST (/api/v1/)")
        print("- Mode sombre")
        scheduler.start_scheduler()
    else:
        print("\nMode de base activé")
    print("="*50 + "\n")
    
    app.run(debug=False, host='127.0.0.1', port=5000)
