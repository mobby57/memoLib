from flask import Flask, request, jsonify, render_template_string, g
from flask_cors import CORS
from flask_migrate import Migrate
import os
import openai
from dotenv import load_dotenv
import json
import logging
from datetime import datetime
import secrets

# Import nouveaux modules
try:
    from config.supabase import SupabaseConfig, SQLALCHEMY_CONFIG
    from config.redis_free import UpstashRedis, FreeRateLimiter
    from generated_code.postgresql_migration import User, Email, Template, Contact, db
    from generated_code.security_production import SecurityMiddleware, require_auth
    POSTGRES_AVAILABLE = True
except ImportError as e:
    print(f"Modules PostgreSQL non disponibles: {e}")
    POSTGRES_AVAILABLE = False

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Configuration base de données
if POSTGRES_AVAILABLE and os.getenv('SUPABASE_DB_URL'):
    # Configuration PostgreSQL Supabase
    app.config.update(SQLALCHEMY_CONFIG)
    db.init_app(app)
    migrate = Migrate(app, db)
    print("PostgreSQL Supabase configure")
else:
    # Fallback SQLite
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///data/app.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    print("Fallback SQLite active")

# Configuration Redis
redis_client = None
rate_limiter = None
try:
    upstash = UpstashRedis()
    if upstash.test_connection():
        redis_client = upstash.get_client()
        rate_limiter = FreeRateLimiter(redis_client)
        print("Redis Upstash connecte")
except:
    print("Redis non disponible")

# Sécurité
security = None
if POSTGRES_AVAILABLE:
    try:
        security = SecurityMiddleware(app)
        print("Middleware securite active")
    except:
        print("Securite en mode degrade")

# CORS sécurisé
CORS(app, origins=[
    'http://localhost:3000',
    'http://localhost:5000', 
    'https://iapostemanager.railway.app',
    'https://*.supabase.co'
], supports_credentials=True)

# Configuration
secret_key = os.getenv('SECRET_KEY')
if not secret_key or secret_key == 'your_secret_key_here':
    secret_key = secrets.token_urlsafe(32)
    logger.warning("Using generated SECRET_KEY. Set SECRET_KEY in .env for production")
app.config['SECRET_KEY'] = secret_key

# SMTP Configuration
SMTP_SERVER = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
SMTP_PORT = int(os.getenv('SMTP_PORT', '587'))
SMTP_USER = os.getenv('SMTP_USER')
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD')
FROM_EMAIL = os.getenv('FROM_EMAIL', SMTP_USER)

# Initialize OpenAI client
openai_api_key = os.getenv('OPENAI_API_KEY')
if openai_api_key and openai_api_key != 'your_openai_api_key_here':
    client = openai.OpenAI(api_key=openai_api_key)
else:
    client = None
    logger.warning("OpenAI API key not configured - using fallback responses")

# Rate limiting avec Redis
def check_rate_limit():
    """Vérifie rate limit avec Redis ou fallback"""
    if rate_limiter:
        ip = request.remote_addr
        key = f"rate_limit:{ip}"
        return rate_limiter.rate_limit(key, max_requests=60, window=60)
    return True  # Pas de limite si Redis indisponible

@app.before_request
def apply_rate_limit():
    """Applique rate limiting sur les API"""
    if request.endpoint and request.endpoint.startswith('api') and not check_rate_limit():
        return jsonify({'error': 'Rate limit exceeded'}), 429

def send_smtp_email(to_email, subject, content, from_email=None):
    """Send email via SMTP with retry logic"""
    if not SMTP_USER or not SMTP_PASSWORD:
        raise ValueError("SMTP credentials not configured")
    
    from_email = from_email or FROM_EMAIL or SMTP_USER
    
    # Create message
    msg = MIMEMultipart()
    msg['From'] = from_email
    msg['To'] = to_email
    msg['Subject'] = subject
    msg.attach(MIMEText(content, 'plain', 'utf-8'))
    
    # Send with retry
    max_retries = 3
    for attempt in range(max_retries):
        try:
            with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
                server.starttls()
                server.login(SMTP_USER, SMTP_PASSWORD)
                server.send_message(msg)
            logger.info(f"Email sent successfully to {to_email} (attempt {attempt + 1})")
            return True
        except Exception as e:
            logger.error(f"SMTP error (attempt {attempt + 1}): {str(e)}")
            if attempt == max_retries - 1:
                raise e
    return False

# Persistent storage files
DATA_DIR = 'data'
os.makedirs(DATA_DIR, exist_ok=True)
EMAILS_FILE = os.path.join(DATA_DIR, 'emails.json')
TEMPLATES_FILE = os.path.join(DATA_DIR, 'templates.json')
CONTACTS_FILE = os.path.join(DATA_DIR, 'contacts.json')

def load_data(filename, default=None):
    if default is None:
        default = []
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return default

def save_data(filename, data):
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

# Load data
emails = load_data(EMAILS_FILE)
templates = load_data(TEMPLATES_FILE)
contacts = load_data(CONTACTS_FILE)

@app.route('/')
def home():
    return render_template_string('''
<!DOCTYPE html>
<html>
<head>
    <title>IA Poste Manager v2.3</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; min-height: 100vh; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 20px 0; }
        .tabs { display: flex; justify-content: center; margin: 20px 0; }
        .tab { background: rgba(255,255,255,0.2); padding: 10px 20px; margin: 0 5px; border-radius: 25px; cursor: pointer; border: none; color: white; }
        .tab.active { background: rgba(255,255,255,0.4); }
        .card { background: rgba(255,255,255,0.1); padding: 20px; border-radius: 15px; margin: 20px 0; backdrop-filter: blur(10px); }
        button { background: #4CAF50; color: white; border: none; padding: 12px 24px; border-radius: 25px; cursor: pointer; margin: 5px; }
        button:hover { background: #45a049; }
        input, textarea, select { width: 100%; padding: 12px; margin: 10px 0; border: none; border-radius: 8px; box-sizing: border-box; }
        .hidden { display: none; }
        .email-item { background: rgba(255,255,255,0.05); padding: 15px; margin: 10px 0; border-radius: 10px; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .stat { background: rgba(255,255,255,0.1); padding: 20px; border-radius: 15px; text-align: center; }
        .stat h3 { font-size: 2em; margin: 0; color: #ffd700; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 IA Poste Manager v2.3</h1>
            <p>MS CONSEILS - Sarra Boudjellal</p>
        </div>
        
        <div class="tabs">
            <button class="tab active" onclick="showTab('dashboard')">Dashboard</button>
            <button class="tab" onclick="showTab('compose')">Composer</button>
            <button class="tab" onclick="showTab('templates')">Templates</button>
            <button class="tab" onclick="showTab('contacts')">Contacts</button>
            <button class="tab" onclick="showTab('history')">Historique</button>
        </div>

        <div id="dashboard" class="tab-content">
            <div class="stats">
                <div class="stat">
                    <h3 id="emailCount">0</h3>
                    <p>Emails envoyés</p>
                </div>
                <div class="stat">
                    <h3 id="templateCount">0</h3>
                    <p>Templates</p>
                </div>
                <div class="stat">
                    <h3 id="contactCount">0</h3>
                    <p>Contacts</p>
                </div>
            </div>
        </div>

        <div id="compose" class="tab-content hidden">
            <div class="card">
                <h3>✍️ Composer un Email</h3>
                <input id="emailTo" placeholder="Destinataire (email)">
                <input id="emailSubject" placeholder="Sujet">
                <textarea id="emailContent" rows="8" placeholder="Contenu de l'email"></textarea>
                <div>
                    <button onclick="generateWithAI()">🤖 Générer avec IA</button>
                    <button onclick="sendEmail()">📧 Envoyer</button>
                </div>
            </div>
            
            <div class="card">
                <h3>🤖 Assistant IA</h3>
                <textarea id="aiPrompt" rows="3" placeholder="Décrivez l'email à générer..."></textarea>
                <button onclick="generateEmail()">Générer</button>
                <div id="aiResult"></div>
            </div>
        </div>

        <div id="templates" class="tab-content hidden">
            <div class="card">
                <h3>📝 Créer Template</h3>
                <input id="templateName" placeholder="Nom du template">
                <input id="templateSubject" placeholder="Sujet">
                <textarea id="templateContent" rows="6" placeholder="Contenu"></textarea>
                <button onclick="createTemplate()">Créer Template</button>
            </div>
            <div class="card">
                <h3>Templates Disponibles</h3>
                <div id="templatesList"></div>
            </div>
        </div>

        <div id="contacts" class="tab-content hidden">
            <div class="card">
                <h3>👥 Ajouter Contact</h3>
                <input id="contactName" placeholder="Nom">
                <input id="contactEmail" placeholder="Email">
                <input id="contactCompany" placeholder="Entreprise">
                <button onclick="addContact()">Ajouter Contact</button>
            </div>
            <div class="card">
                <h3>Liste des Contacts</h3>
                <div id="contactsList"></div>
            </div>
        </div>

        <div id="history" class="tab-content hidden">
            <div class="card">
                <h3>📊 Historique des Emails</h3>
                <div id="emailHistory"></div>
            </div>
        </div>
    </div>

    <script>
        function showTab(tabName) {
            document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
            document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
            document.getElementById(tabName).classList.remove('hidden');
            event.target.classList.add('active');
            
            if (tabName === 'dashboard') updateStats();
            if (tabName === 'templates') loadTemplates();
            if (tabName === 'contacts') loadContacts();
            if (tabName === 'history') loadHistory();
        }

        async function generateEmail() {
            const prompt = document.getElementById('aiPrompt').value;
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({prompt})
            });
            const data = await response.json();
            document.getElementById('aiResult').innerHTML = '<pre style="background:rgba(0,0,0,0.2);padding:15px;border-radius:8px;white-space:pre-wrap;">' + data.content + '</pre>';
        }

        async function generateWithAI() {
            const prompt = "Génère un email professionnel avec le sujet: " + document.getElementById('emailSubject').value;
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({prompt})
            });
            const data = await response.json();
            document.getElementById('emailContent').value = data.content;
        }

        async function sendEmail() {
            const emailData = {
                to: document.getElementById('emailTo').value,
                subject: document.getElementById('emailSubject').value,
                content: document.getElementById('emailContent').value
            };
            
            // Show loading state
            const sendButton = event.target;
            const originalText = sendButton.textContent;
            sendButton.textContent = '⏳ Envoi...';
            sendButton.disabled = true;
            
            try {
                const response = await fetch('/api/send-email', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(emailData)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert('Email envoye avec succes: ' + result.message);
                    document.getElementById('emailTo').value = '';
                    document.getElementById('emailSubject').value = '';
                    document.getElementById('emailContent').value = '';
                } else {
                    alert('Attention: ' + result.message);
                }
            } catch (error) {
                alert('Erreur de connexion: ' + error.message);
            } finally {
                sendButton.textContent = originalText;
                sendButton.disabled = false;
            }
        }

        async function createTemplate() {
            const template = {
                name: document.getElementById('templateName').value,
                subject: document.getElementById('templateSubject').value,
                content: document.getElementById('templateContent').value
            };
            
            await fetch('/api/templates', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(template)
            });
            
            loadTemplates();
            document.getElementById('templateName').value = '';
            document.getElementById('templateSubject').value = '';
            document.getElementById('templateContent').value = '';
        }

        async function addContact() {
            const contact = {
                name: document.getElementById('contactName').value,
                email: document.getElementById('contactEmail').value,
                company: document.getElementById('contactCompany').value
            };
            
            await fetch('/api/contacts', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(contact)
            });
            
            loadContacts();
            document.getElementById('contactName').value = '';
            document.getElementById('contactEmail').value = '';
            document.getElementById('contactCompany').value = '';
        }

        async function loadTemplates() {
            const response = await fetch('/api/templates');
            const templates = await response.json();
            document.getElementById('templatesList').innerHTML = templates.map(t => 
                '<div class="email-item"><strong>' + t.name + '</strong><br>Sujet: ' + t.subject + '<br><button onclick="useTemplate(' + t.id + ')">Utiliser</button></div>'
            ).join('');
        }

        async function loadContacts() {
            const response = await fetch('/api/contacts');
            const contacts = await response.json();
            document.getElementById('contactsList').innerHTML = contacts.map(c => 
                '<div class="email-item"><strong>' + c.name + '</strong> (' + c.company + ')<br>' + c.email + '<br><button onclick="composeToContact(\'' + c.email + '\')">Composer</button></div>'
            ).join('');
        }

        async function loadHistory() {
            const response = await fetch('/api/emails');
            const emails = await response.json();
            document.getElementById('emailHistory').innerHTML = emails.map(e => {
                const statusIcon = e.status === 'sent' ? 'OK' : 'WARN';
                const statusText = e.status === 'sent' ? 'Envoye' : 'Stocke seulement';
                return `<div class="email-item">
                    <strong>À:</strong> ${e.to}<br>
                    <strong>Sujet:</strong> ${e.subject}<br>
                    <strong>Date:</strong> ${e.date}<br>
                    <strong>Statut:</strong> ${statusIcon} ${statusText}
                    ${e.error ? `<br><small style="color: #ffaa00;">Erreur: ${e.error}</small>` : ''}
                </div>`;
            }).join('');
        }

        async function updateStats() {
            const [templates, contacts, emails] = await Promise.all([
                fetch('/api/templates').then(r => r.json()),
                fetch('/api/contacts').then(r => r.json()),
                fetch('/api/emails').then(r => r.json())
            ]);
            
            document.getElementById('templateCount').textContent = templates.length;
            document.getElementById('contactCount').textContent = contacts.length;
            document.getElementById('emailCount').textContent = emails.length;
        }

        function useTemplate(id) {
            fetch('/api/templates/' + id)
                .then(r => r.json())
                .then(template => {
                    document.getElementById('emailSubject').value = template.subject;
                    document.getElementById('emailContent').value = template.content;
                    showTab('compose');
                });
        }

        function composeToContact(email) {
            document.getElementById('emailTo').value = email;
            showTab('compose');
        }

        updateStats();
    </script>
</body>
</html>
    ''')

@app.route('/api/generate', methods=['POST'])
def generate_email():
    data = request.get_json()
    if not data or 'prompt' not in data:
        return jsonify({'error': 'Prompt is required'}), 400
    
    prompt = data.get('prompt', '').strip()
    if not prompt or len(prompt) > 500:
        return jsonify({'error': 'Prompt must be between 1 and 500 characters'}), 400
    
    try:
        if client:
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "Tu es un assistant IA pour générer des emails professionnels en français. Sois concis et professionnel."},
                    {"role": "user", "content": f"Génère un email professionnel pour: {prompt}"}
                ],
                max_tokens=300
            )
            content = response.choices[0].message.content
        else:
            content = f'Objet: {prompt}\n\nBonjour,\n\nJe vous contacte concernant votre demande.\n\nCordialement,\nMS CONSEILS'
        
        logger.info(f"Email generated for prompt: {prompt[:50]}...")
        return jsonify({'content': content})
    except Exception as e:
        logger.error(f"Error generating email: {str(e)}")
        return jsonify({'error': 'Failed to generate email'}), 500

@app.route('/api/send-email', methods=['POST'])
def send_email():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request data is required'}), 400
    
    required_fields = ['to', 'subject', 'content']
    for field in required_fields:
        if not data.get(field, '').strip():
            return jsonify({'error': f'{field} is required'}), 400
    
    # Validate email format
    import re
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_pattern, data['to']):
        return jsonify({'error': 'Invalid email format'}), 400
    
    try:
        # Try to send email via SMTP
        email_sent = False
        error_message = None
        
        if SMTP_USER and SMTP_PASSWORD:
            try:
                send_smtp_email(data['to'], data['subject'], data['content'])
                email_sent = True
            except Exception as smtp_error:
                error_message = f"SMTP Error: {str(smtp_error)}"
                logger.error(error_message)
        else:
            error_message = "SMTP not configured - email stored only"
            logger.warning(error_message)
        
        # Store email in history with status
        email_record = {
            'id': len(emails) + 1,
            'to': data['to'],
            'subject': data['subject'],
            'content': data['content'],
            'date': datetime.now().isoformat(),
            'status': 'sent' if email_sent else 'stored',
            'error': error_message if not email_sent else None
        }
        emails.append(email_record)
        save_data(EMAILS_FILE, emails)
        
        if email_sent:
            logger.info(f"Email sent and stored for {data['to']}")
            return jsonify({'success': True, 'message': 'Email envoyé avec succès!', 'status': 'sent'})
        else:
            logger.warning(f"Email stored but not sent for {data['to']}: {error_message}")
            return jsonify({'success': False, 'message': f'Email stocké mais non envoyé: {error_message}', 'status': 'stored'})
            
    except Exception as e:
        logger.error(f"Error processing email: {str(e)}")
        return jsonify({'error': 'Failed to process email'}), 500

@app.route('/api/templates', methods=['GET'])
def get_templates():
    return jsonify(templates)

@app.route('/api/templates/<int:template_id>', methods=['GET'])
def get_template(template_id):
    template = next((t for t in templates if t['id'] == template_id), None)
    return jsonify(template) if template else jsonify({'error': 'Template not found'}), 404

@app.route('/api/templates', methods=['POST'])
def create_template():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request data is required'}), 400
    
    required_fields = ['name', 'subject', 'content']
    for field in required_fields:
        if not data.get(field, '').strip():
            return jsonify({'error': f'{field} is required'}), 400
    
    try:
        template = {
            'id': len(templates) + 1,
            'name': data['name'].strip(),
            'subject': data['subject'].strip(),
            'content': data['content'].strip()
        }
        templates.append(template)
        save_data(TEMPLATES_FILE, templates)
        logger.info(f"Template created: {template['name']}")
        return jsonify(template)
    except Exception as e:
        logger.error(f"Error creating template: {str(e)}")
        return jsonify({'error': 'Failed to create template'}), 500

@app.route('/api/contacts', methods=['POST'])
def add_contact():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request data is required'}), 400
    
    required_fields = ['name', 'email']
    for field in required_fields:
        if not data.get(field, '').strip():
            return jsonify({'error': f'{field} is required'}), 400
    
    # Validate email format
    import re
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_pattern, data['email']):
        return jsonify({'error': 'Invalid email format'}), 400
    
    try:
        contact = {
            'id': len(contacts) + 1,
            'name': data['name'].strip(),
            'email': data['email'].strip(),
            'company': data.get('company', '').strip()
        }
        contacts.append(contact)
        save_data(CONTACTS_FILE, contacts)
        logger.info(f"Contact added: {contact['name']}")
        return jsonify(contact)
    except Exception as e:
        logger.error(f"Error adding contact: {str(e)}")
        return jsonify({'error': 'Failed to add contact'}), 500

@app.route('/api/emails', methods=['GET'])
def get_emails():
    return jsonify(emails)

@app.route('/health')
def health():
    return jsonify({'status': 'healthy', 'service': 'IA Poste Manager v2.3'})
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Internal server error: {str(error)}")
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    env = os.getenv('FLASK_ENV', 'production')
    debug_mode = env == 'development'
    app.run(host='0.0.0.0', port=5000, debug=debug_mode)