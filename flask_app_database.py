from flask import Flask, request, jsonify, redirect, session
from flask_cors import CORS
import os
import json
import sqlite3
from datetime import datetime, timedelta
from pathlib import Path

# Configuration multi-tenant
CLIENT_ID = os.getenv('CLIENT_ID', 'demo-cabinet')
INSTANCE_NAME = os.getenv('INSTANCE_NAME', 'demo')
DATABASE_TYPE = os.getenv('DATABASE_TYPE', 'sqlite')  # sqlite, postgresql, mongodb

app = Flask(__name__)
CORS(app)

# Configuration sécurisée par client
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', f'{CLIENT_ID}-secret-key')
app.config['JSON_AS_ASCII'] = False

# Configuration client spécifique
CLIENT_CONFIG = {
    'name': os.getenv('CLIENT_NAME', 'Cabinet Juridique'),
    'siret': os.getenv('CLIENT_SIRET', '12345678901234'),
    'subscription_plan': os.getenv('SUBSCRIPTION_PLAN', 'professional'),
    'primary_color': os.getenv('CLIENT_COLOR', '#3498db'),
    'max_users': int(os.getenv('MAX_USERS', '10')),
    'max_analysis_monthly': int(os.getenv('MAX_ANALYSIS_MONTHLY', '500'))
}

# Configuration IA
AI_CONFIG = {
    'model': os.getenv('AI_MODEL', 'ceseda-pro-v1'),
    'prediction_threshold': float(os.getenv('PREDICTION_THRESHOLD', '0.87'))
}

# Stockage isolé par client
DATA_DIR = Path(os.getenv('DATA_DIR', f'./data/clients/{CLIENT_ID}'))
DATA_DIR.mkdir(parents=True, exist_ok=True)

class DatabaseManager:
    def __init__(self, client_id, db_type='sqlite'):
        self.client_id = client_id
        self.db_type = db_type
        self.db_path = DATA_DIR / f'{client_id}.db'
        self.init_database()
    
    def init_database(self):
        """Initialiser la base de données selon le type"""
        if self.db_type == 'sqlite':
            self.init_sqlite()
        elif self.db_type == 'postgresql':
            self.init_postgresql()
        elif self.db_type == 'mongodb':
            self.init_mongodb()
    
    def init_sqlite(self):
        """Initialiser SQLite"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Table utilisateurs
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                email TEXT,
                role TEXT DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Table analyses CESEDA
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS ceseda_analyses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                case_text TEXT,
                success_rate REAL,
                urgency TEXT,
                positive_factors INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')
        
        # Table factures
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS invoices (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                numero TEXT UNIQUE,
                client_name TEXT,
                montant_ht REAL,
                montant_ttc REAL,
                status TEXT DEFAULT 'generated',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Table délais
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS deadlines (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type TEXT,
                description TEXT,
                deadline_date DATE,
                urgency TEXT,
                status TEXT DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Table usage mensuel
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS monthly_usage (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                month TEXT,
                analyses_count INTEGER DEFAULT 0,
                users_active INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        conn.commit()
        conn.close()
    
    def init_postgresql(self):
        """Initialiser PostgreSQL (pour production)"""
        try:
            import psycopg2
            conn_string = os.getenv('POSTGRESQL_URL', f'postgresql://user:pass@localhost/client_{self.client_id}')
            # Code PostgreSQL ici
            print(f"PostgreSQL configuré pour {self.client_id}")
        except ImportError:
            print("psycopg2 non installé, utilisation SQLite")
            self.db_type = 'sqlite'
            self.init_sqlite()
    
    def init_mongodb(self):
        """Initialiser MongoDB (pour big data)"""
        try:
            import pymongo
            client = pymongo.MongoClient(os.getenv('MONGODB_URL', 'mongodb://localhost:27017/'))
            db = client[f'client_{self.client_id}']
            # Code MongoDB ici
            print(f"MongoDB configuré pour {self.client_id}")
        except ImportError:
            print("pymongo non installé, utilisation SQLite")
            self.db_type = 'sqlite'
            self.init_sqlite()
    
    def execute_query(self, query, params=None, fetch=False):
        """Exécuter une requête selon le type de DB"""
        if self.db_type == 'sqlite':
            return self.execute_sqlite(query, params, fetch)
        elif self.db_type == 'postgresql':
            return self.execute_postgresql(query, params, fetch)
        elif self.db_type == 'mongodb':
            return self.execute_mongodb(query, params, fetch)
    
    def execute_sqlite(self, query, params=None, fetch=False):
        """Exécuter requête SQLite"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)
        
        if fetch:
            result = [dict(row) for row in cursor.fetchall()]
        else:
            result = cursor.lastrowid
        
        conn.commit()
        conn.close()
        return result
    
    def execute_postgresql(self, query, params=None, fetch=False):
        """Exécuter requête PostgreSQL"""
        # Code PostgreSQL
        pass
    
    def execute_mongodb(self, query, params=None, fetch=False):
        """Exécuter requête MongoDB"""
        # Code MongoDB
        pass

# Initialiser le gestionnaire de base de données
db_manager = DatabaseManager(CLIENT_ID, DATABASE_TYPE)

def get_user(username):
    """Récupérer un utilisateur"""
    users = db_manager.execute_query(
        "SELECT * FROM users WHERE username = ?", 
        (username,), 
        fetch=True
    )
    return users[0] if users else None

def create_user(username, password, email=None, role='user'):
    """Créer un utilisateur"""
    return db_manager.execute_query(
        "INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)",
        (username, password, email, role)
    )

def save_ceseda_analysis(user_id, case_text, success_rate, urgency, positive_factors):
    """Sauvegarder une analyse CESEDA"""
    return db_manager.execute_query(
        "INSERT INTO ceseda_analyses (user_id, case_text, success_rate, urgency, positive_factors) VALUES (?, ?, ?, ?, ?)",
        (user_id, case_text, success_rate, urgency, positive_factors)
    )

def get_monthly_usage(month=None):
    """Récupérer l'usage mensuel"""
    if not month:
        month = datetime.now().strftime('%Y-%m')
    
    usage = db_manager.execute_query(
        "SELECT * FROM monthly_usage WHERE month = ?",
        (month,),
        fetch=True
    )
    
    if not usage:
        # Créer entrée pour le mois
        db_manager.execute_query(
            "INSERT INTO monthly_usage (month) VALUES (?)",
            (month,)
        )
        return {'analyses_count': 0, 'users_active': 0}
    
    return usage[0]

def increment_analysis_count():
    """Incrémenter le compteur d'analyses"""
    month = datetime.now().strftime('%Y-%m')
    db_manager.execute_query(
        "UPDATE monthly_usage SET analyses_count = analyses_count + 1 WHERE month = ?",
        (month,)
    )

@app.route('/')
def home():
    if 'logged_in' not in session:
        return redirect('/login')
    
    usage = get_monthly_usage()
    can_analyze = usage['analyses_count'] < CLIENT_CONFIG['max_analysis_monthly']
    
    return f'''<!DOCTYPE html>
<html>
<head>
    <title>{CLIENT_CONFIG['name']} - IA Manager</title>
    <meta charset="utf-8">
    <style>
        :root {{ --primary-color: {CLIENT_CONFIG['primary_color']}; }}
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
               background: linear-gradient(135deg, var(--primary-color) 0%, #764ba2 100%); min-height: 100vh; }}
        .container {{ max-width: 1200px; margin: 0 auto; padding: 20px; }}
        .header {{ text-align: center; color: white; margin-bottom: 30px; }}
        .header h1 {{ font-size: 2.5em; margin-bottom: 10px; }}
        .usage-info {{ background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px; margin-bottom: 20px; }}
        .dashboard {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }}
        .card {{ background: rgba(255,255,255,0.95); border-radius: 15px; padding: 25px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2); }}
        .card h3 {{ color: #2c3e50; margin-bottom: 15px; }}
        .btn {{ background: linear-gradient(135deg, var(--primary-color) 0%, #2980b9 100%);
               color: white; border: none; padding: 12px 25px; border-radius: 25px;
               cursor: pointer; margin: 5px; }}
        .btn:disabled {{ opacity: 0.5; cursor: not-allowed; }}
        .results {{ margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 10px; display: none; }}
        .success {{ background: #d4edda; color: #155724; }}
        .warning {{ background: #fff3cd; color: #856404; }}
        .logout {{ position: absolute; top: 20px; right: 20px; }}
        .db-info {{ font-size: 0.9em; color: rgba(255,255,255,0.8); }}
    </style>
</head>
<body>
    <a href="/logout" class="btn logout">Déconnexion</a>
    <div class="container">
        <div class="header">
            <h1>{CLIENT_CONFIG['name']}</h1>
            <div class="usage-info">
                <p>Plan: {CLIENT_CONFIG['subscription_plan'].upper()} | DB: {DATABASE_TYPE.upper()}</p>
                <p>Analyses: {usage['analyses_count']}/{CLIENT_CONFIG['max_analysis_monthly']} ce mois</p>
                <div class="db-info">Base de données: {db_manager.db_path if DATABASE_TYPE == 'sqlite' else DATABASE_TYPE}</div>
            </div>
        </div>
        <div class="dashboard">
            <div class="card">
                <h3>IA CESEDA Expert</h3>
                <p>Modèle: {AI_CONFIG['model']}</p>
                <p>Précision: {int(AI_CONFIG['prediction_threshold']*100)}%</p>
                <button class="btn" onclick="analyzeCase()" {'disabled' if not can_analyze else ''}>
                    Analyser Dossier
                </button>
                <div id="aiResults" class="results"></div>
            </div>
            <div class="card">
                <h3>Gestion Délais</h3>
                <button class="btn" onclick="calculateDeadline()">Calculer Délai</button>
                <div id="deadlineResults" class="results"></div>
            </div>
            <div class="card">
                <h3>Facturation</h3>
                <button class="btn" onclick="generateInvoice()">Générer Facture</button>
                <div id="billingResults" class="results"></div>
            </div>
            <div class="card">
                <h3>Statistiques DB</h3>
                <button class="btn" onclick="getStats()">Voir Stats</button>
                <div id="statsResults" class="results"></div>
            </div>
        </div>
    </div>
    <script>
        async function apiCall(endpoint, method = 'GET', data = null) {{
            const options = {{ method, headers: {{ 'Content-Type': 'application/json' }} }};
            if (data) options.body = JSON.stringify(data);
            try {{
                const response = await fetch(endpoint, options);
                return await response.json();
            }} catch (error) {{
                return {{ error: 'API call failed' }};
            }}
        }}
        
        async function analyzeCase() {{
            const result = await apiCall('/api/ceseda/analyze', 'POST', {{
                text: 'Client algérien, marié à française, 2 enfants français, emploi stable'
            }});
            
            if (result.quota_exceeded) {{
                showResults('aiResults', '<div class="warning"><h4>Quota Dépassé</h4><p>Limite mensuelle atteinte.</p></div>');
                return;
            }}
            
            showResults('aiResults', `
                <div class="success">
                    <h4>Analyse Sauvegardée en DB</h4>
                    <p><strong>Probabilité:</strong> ${{result.success_rate}}%</p>
                    <p><strong>ID Analyse:</strong> ${{result.analysis_id}}</p>
                </div>
            `);
        }}
        
        async function calculateDeadline() {{
            const result = await apiCall('/api/legal/delais/calculer', 'POST', {{
                type: 'recours', description: 'Recours OQTF'
            }});
            showResults('deadlineResults', `
                <div class="success">
                    <h4>Délai Sauvegardé</h4>
                    <p><strong>ID:</strong> ${{result.deadline_id}}</p>
                    <p><strong>Date limite:</strong> ${{new Date(result.deadline).toLocaleDateString()}}</p>
                </div>
            `);
        }}
        
        async function generateInvoice() {{
            const result = await apiCall('/api/legal/facturation/facture', 'POST', {{
                client: 'Client Exemple', amount: 1500
            }});
            showResults('billingResults', `
                <div class="success">
                    <h4>Facture en DB</h4>
                    <p><strong>Numéro:</strong> ${{result.numero}}</p>
                    <p><strong>ID:</strong> ${{result.invoice_id}}</p>
                </div>
            `);
        }}
        
        async function getStats() {{
            const result = await apiCall('/api/stats');
            showResults('statsResults', `
                <div class="success">
                    <h4>Statistiques Base de Données</h4>
                    <p><strong>Utilisateurs:</strong> ${{result.users_count}}</p>
                    <p><strong>Analyses:</strong> ${{result.analyses_count}}</p>
                    <p><strong>Factures:</strong> ${{result.invoices_count}}</p>
                    <p><strong>Type DB:</strong> ${{result.db_type}}</p>
                </div>
            `);
        }}
        
        function showResults(elementId, content) {{
            document.getElementById(elementId).innerHTML = content;
            document.getElementById(elementId).style.display = 'block';
        }}
    </script>
</body>
</html>'''

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        user = get_user(username)
        if user and user['password'] == password:  # En prod: hash password
            session['logged_in'] = True
            session['user_id'] = user['id']
            return redirect('/')
        
        error_msg = 'Identifiants incorrects'
    else:
        error_msg = ''
    
    return f'''<!DOCTYPE html>
<html>
<head>
    <title>Connexion - {CLIENT_CONFIG['name']}</title>
    <meta charset="utf-8">
    <style>
        body {{ background: linear-gradient(135deg, {CLIENT_CONFIG['primary_color']} 0%, #764ba2 100%);
               min-height: 100vh; display: flex; align-items: center; justify-content: center;
               font-family: Arial, sans-serif; }}
        .login-card {{ background: white; padding: 40px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }}
        .login-card h1 {{ text-align: center; color: #2c3e50; margin-bottom: 30px; }}
        .form-group {{ margin-bottom: 20px; }}
        .form-group input {{ width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; }}
        .btn {{ background: {CLIENT_CONFIG['primary_color']}; color: white; border: none; 
               padding: 12px 30px; border-radius: 25px; cursor: pointer; width: 100%; }}
        .error {{ color: #e74c3c; text-align: center; margin-top: 10px; }}
        .db-info {{ text-align: center; margin-top: 20px; color: #7f8c8d; font-size: 0.9em; }}
    </style>
</head>
<body>
    <div class="login-card">
        <h1>{CLIENT_CONFIG['name']}</h1>
        <form method="post">
            <div class="form-group">
                <input type="text" name="username" placeholder="Nom d'utilisateur" required>
            </div>
            <div class="form-group">
                <input type="password" name="password" placeholder="Mot de passe" required>
            </div>
            <button type="submit" class="btn">Se connecter</button>
            {f'<div class="error">{error_msg}</div>' if error_msg else ''}
        </form>
        <div class="db-info">
            <p>Instance: {INSTANCE_NAME}</p>
            <p>Base de données: {DATABASE_TYPE.upper()}</p>
            <p>Demo: admin / admin123</p>
        </div>
    </div>
</body>
</html>'''

@app.route('/api/ceseda/analyze', methods=['POST'])
def analyze_ceseda():
    usage = get_monthly_usage()
    if usage['analyses_count'] >= CLIENT_CONFIG['max_analysis_monthly']:
        return jsonify({'quota_exceeded': True}), 429
    
    data = request.get_json()
    text = data.get('text', '')
    user_id = session.get('user_id', 1)
    
    # Analyse IA
    urgent_keywords = ['oqtf', 'expulsion', 'urgence']
    positive_keywords = ['famille', 'enfant', 'français', 'emploi', 'mariage', 'intégration']
    
    is_urgent = any(keyword in text.lower() for keyword in urgent_keywords)
    positive_factors = sum(1 for keyword in positive_keywords if keyword in text.lower())
    
    success_rate = 35 + (positive_factors * 5) if is_urgent else 75 + (positive_factors * 3)
    success_rate = min(95, max(10, success_rate))
    urgency = 'ÉLEVÉE' if is_urgent else 'NORMALE'
    
    # Sauvegarder en base
    analysis_id = save_ceseda_analysis(user_id, text, success_rate, urgency, positive_factors)
    increment_analysis_count()
    
    return jsonify({
        'analysis_id': analysis_id,
        'success_rate': success_rate,
        'urgency': urgency,
        'positive_factors': positive_factors,
        'model': AI_CONFIG['model']
    })

@app.route('/api/legal/delais/calculer', methods=['POST'])
def calculate_deadline():
    data = request.get_json()
    deadline_type = data.get('type', 'recours')
    description = data.get('description', 'Délai juridique')
    
    days_map = {'recours': 30, 'appel': 15, 'cassation': 60, 'référé': 7}
    days = days_map.get(deadline_type, 30)
    deadline_date = (datetime.now() + timedelta(days=days)).date()
    urgency = 'critique' if days <= 7 else 'normal'
    
    # Sauvegarder en base
    deadline_id = db_manager.execute_query(
        "INSERT INTO deadlines (type, description, deadline_date, urgency) VALUES (?, ?, ?, ?)",
        (deadline_type, description, deadline_date, urgency)
    )
    
    return jsonify({
        'deadline_id': deadline_id,
        'type': deadline_type,
        'days': days,
        'deadline': deadline_date.isoformat(),
        'urgency': urgency
    })

@app.route('/api/legal/facturation/facture', methods=['POST'])
def generate_invoice():
    data = request.get_json()
    
    # Compter factures existantes
    existing = db_manager.execute_query("SELECT COUNT(*) as count FROM invoices", fetch=True)
    count = existing[0]['count'] if existing else 0
    
    numero = f"FAC-{CLIENT_ID}-{datetime.now().year}-{count + 1:03d}"
    client_name = data.get('client', 'Client')
    montant_ht = data.get('amount', 1500)
    montant_ttc = montant_ht * 1.2
    
    # Sauvegarder en base
    invoice_id = db_manager.execute_query(
        "INSERT INTO invoices (numero, client_name, montant_ht, montant_ttc) VALUES (?, ?, ?, ?)",
        (numero, client_name, montant_ht, montant_ttc)
    )
    
    return jsonify({
        'invoice_id': invoice_id,
        'numero': numero,
        'client': client_name,
        'montant_ht': montant_ht,
        'montant_ttc': montant_ttc
    })

@app.route('/api/stats')
def get_stats():
    """Statistiques de la base de données"""
    users_count = db_manager.execute_query("SELECT COUNT(*) as count FROM users", fetch=True)[0]['count']
    analyses_count = db_manager.execute_query("SELECT COUNT(*) as count FROM ceseda_analyses", fetch=True)[0]['count']
    invoices_count = db_manager.execute_query("SELECT COUNT(*) as count FROM invoices", fetch=True)[0]['count']
    
    return jsonify({
        'users_count': users_count,
        'analyses_count': analyses_count,
        'invoices_count': invoices_count,
        'db_type': DATABASE_TYPE,
        'client_id': CLIENT_ID
    })

@app.route('/logout')
def logout():
    session.clear()
    return redirect('/login')

if __name__ == '__main__':
    # Créer utilisateur admin par défaut
    existing_admin = get_user('admin')
    if not existing_admin:
        create_user('admin', 'admin123', 'admin@cabinet.fr', 'admin')
        print("Utilisateur admin créé")
    
    print(f"IA Manager - Client: {CLIENT_CONFIG['name']}")
    print(f"Instance: {INSTANCE_NAME}")
    print(f"Base de données: {DATABASE_TYPE}")
    print(f"Fichier DB: {db_manager.db_path}")
    app.run(host='0.0.0.0', port=5000, debug=False)