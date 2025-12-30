#!/bin/bash
# 🚀 Script automatique de déploiement multi-tenant sur Render

set -e

echo "🚀 Déploiement Multi-Tenant Automatique sur Render"
echo "=================================================="

# Variables
PROJECT_NAME="iaposte-multitenant"
GITHUB_USER="votre-username"  # À modifier

# 1. Créer structure projet
echo "📁 Création structure projet..."
rm -rf $PROJECT_NAME
mkdir -p $PROJECT_NAME
cd $PROJECT_NAME

# 2. Créer requirements.txt
cat > requirements.txt << 'EOF'
Flask==3.0.3
Flask-Login==0.6.3
Werkzeug==3.0.3
gunicorn==21.2.0
EOF

# 3. Créer app Flask multi-tenant
cat > app.py << 'EOF'
import os
import json
from pathlib import Path
from datetime import datetime
from flask import Flask, request, jsonify, redirect, url_for, render_template_string
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash

CLIENT_ID = os.getenv('CLIENT_ID', 'cabinet-demo')
CLIENT_NAME = os.getenv('CLIENT_NAME', 'Cabinet Demo')
SUBSCRIPTION_PLAN = os.getenv('SUBSCRIPTION_PLAN', 'professional')

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'render-secret-key-123')

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

DATA_DIR = Path(f'/opt/render/project/data/{CLIENT_ID}')
DATA_DIR.mkdir(parents=True, exist_ok=True)
(DATA_DIR / 'users').mkdir(exist_ok=True)

class User(UserMixin):
    def __init__(self, id, username, password_hash):
        self.id = id
        self.username = username
        self.password_hash = password_hash

@login_manager.user_loader
def load_user(user_id):
    users_file = DATA_DIR / 'users' / 'users.json'
    if users_file.exists():
        try:
            with open(users_file, 'r') as f:
                users = json.load(f)
                if user_id in users:
                    user_data = users[user_id]
                    return User(user_id, user_data['username'], user_data['password_hash'])
        except:
            pass
    return None

def create_user():
    users_file = DATA_DIR / 'users' / 'users.json'
    if not users_file.exists():
        users = {'admin': {'username': 'admin', 'password_hash': generate_password_hash('admin123')}}
        with open(users_file, 'w') as f:
            json.dump(users, f)

create_user()

DASHBOARD = '''<!DOCTYPE html><html><head><title>{{name}}</title><meta charset="utf-8"><link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet"></head><body><nav class="navbar navbar-dark bg-success"><div class="container"><span class="navbar-brand">🚀 {{name}}</span><div><span class="navbar-text me-3">{{plan}}</span><a class="btn btn-outline-light btn-sm" href="/logout">Déconnexion</a></div></div></nav><div class="container mt-4"><h1>✅ Multi-Tenant sur Render</h1><div class="alert alert-success"><strong>Client:</strong> {{client}}<br><strong>URL:</strong> {{url}}<br><strong>SSL:</strong> ✅ Automatique</div><div class="row"><div class="col-md-6"><div class="card"><div class="card-header">🔧 API Test</div><div class="card-body"><button onclick="testAPI()" class="btn btn-success">Test API</button><div id="result" class="mt-2"></div></div></div></div><div class="col-md-6"><div class="card"><div class="card-header">📊 Multi-Tenant</div><div class="card-body"><p><strong>Isolation:</strong> ✅ Complète</p><p><strong>Données:</strong> {{client}}</p><p><strong>Plan:</strong> {{plan}}</p></div></div></div></div></div><script>function testAPI(){fetch('/api/info').then(r=>r.json()).then(d=>{document.getElementById('result').innerHTML='<div class="alert alert-success">✅ '+d.client_name+'</div>';});}</script></body></html>'''

LOGIN = '''<!DOCTYPE html><html><head><title>{{name}}</title><meta charset="utf-8"><link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet"></head><body class="bg-light"><div class="container mt-5"><div class="row justify-content-center"><div class="col-md-6"><div class="card"><div class="card-header text-center"><h3>🏢 {{name}}</h3><small>Multi-Tenant sur Render</small></div><div class="card-body"><form method="POST"><div class="mb-3"><label>Utilisateur</label><input type="text" class="form-control" name="username" value="admin" required></div><div class="mb-3"><label>Mot de passe</label><input type="password" class="form-control" name="password" value="admin123" required></div><button type="submit" class="btn btn-primary w-100">Connexion</button></form></div></div></div></div></div></body></html>'''

@app.route('/')
def index():
    if current_user.is_authenticated:
        return render_template_string(DASHBOARD, name=CLIENT_NAME, client=CLIENT_ID, plan=SUBSCRIPTION_PLAN, url=request.host_url)
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        users_file = DATA_DIR / 'users' / 'users.json'
        try:
            with open(users_file, 'r') as f:
                users = json.load(f)
            for user_id, user_data in users.items():
                if user_data['username'] == username and check_password_hash(user_data['password_hash'], password):
                    user = User(user_id, user_data['username'], user_data['password_hash'])
                    login_user(user)
                    return redirect(url_for('index'))
        except:
            pass
    return render_template_string(LOGIN, name=CLIENT_NAME)

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

@app.route('/api/info')
@login_required
def api_info():
    return jsonify({'client_id': CLIENT_ID, 'client_name': CLIENT_NAME, 'subscription_plan': SUBSCRIPTION_PLAN, 'hosting': 'render.com'})

@app.route('/health')
def health():
    return jsonify({'status': 'ok', 'client': CLIENT_ID})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
EOF

# 4. Créer render.yaml
cat > render.yaml << 'EOF'
services:
  - type: web
    name: cabinet-dupont
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: gunicorn app:app --bind 0.0.0.0:$PORT
    envVars:
      - key: CLIENT_ID
        value: cabinet-dupont
      - key: CLIENT_NAME
        value: Cabinet Dupont & Associés
      - key: SUBSCRIPTION_PLAN
        value: professional
      - key: SECRET_KEY
        generateValue: true

  - type: web
    name: cabinet-martin
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: gunicorn app:app --bind 0.0.0.0:$PORT
    envVars:
      - key: CLIENT_ID
        value: cabinet-martin
      - key: CLIENT_NAME
        value: Cabinet Martin
      - key: SUBSCRIPTION_PLAN
        value: starter
      - key: SECRET_KEY
        generateValue: true

  - type: web
    name: cabinet-bernard
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: gunicorn app:app --bind 0.0.0.0:$PORT
    envVars:
      - key: CLIENT_ID
        value: cabinet-bernard
      - key: CLIENT_NAME
        value: Cabinet Bernard
      - key: SUBSCRIPTION_PLAN
        value: enterprise
      - key: SECRET_KEY
        generateValue: true
EOF

# 5. Créer README
cat > README.md << 'EOF'
# 🚀 IA Poste Manager - Multi-Tenant

## URLs de Production

- **Cabinet Dupont**: https://cabinet-dupont.onrender.com
- **Cabinet Martin**: https://cabinet-martin.onrender.com  
- **Cabinet Bernard**: https://cabinet-bernard.onrender.com

## Login

- Username: `admin`
- Password: `admin123`

## Features

- ✅ Multi-tenant avec isolation complète
- ✅ SSL automatique
- ✅ Déploiement automatique via Git
- ✅ API REST sécurisée
- ✅ Interface responsive Bootstrap

## Architecture

Chaque client a sa propre instance avec :
- Données isolées
- Configuration personnalisée
- URL dédiée
- Plan d'abonnement spécifique

## Déploiement

1. Fork ce repo
2. Connecter à Render.com
3. Déployer avec render.yaml
4. 3 services créés automatiquement
EOF

# 6. Créer .gitignore
cat > .gitignore << 'EOF'
__pycache__/
*.pyc
*.pyo
*.pyd
.Python
env/
venv/
.venv/
pip-log.txt
pip-delete-this-directory.txt
.tox/
.coverage
.coverage.*
.cache
nosetests.xml
coverage.xml
*.cover
*.log
.git
.mypy_cache
.pytest_cache
.hypothesis
.DS_Store
EOF

# 7. Initialiser Git
echo "🔧 Initialisation Git..."
git init
git add .
git commit -m "🚀 Initial multi-tenant deployment for Render"

# 8. Créer repo GitHub (si gh CLI installé)
if command -v gh &> /dev/null; then
    echo "📤 Création repo GitHub..."
    gh repo create $PROJECT_NAME --public --description "Multi-tenant Flask app for law firms"
    git remote add origin https://github.com/$GITHUB_USER/$PROJECT_NAME.git
    git branch -M main
    git push -u origin main
    echo "✅ Repo GitHub créé et code pushé"
else
    echo "⚠️  GitHub CLI non installé. Créez manuellement le repo sur github.com"
fi

# 9. Instructions finales
echo ""
echo "✅ DÉPLOIEMENT AUTOMATIQUE TERMINÉ"
echo "=================================="
echo ""
echo "📁 Projet créé dans: $(pwd)"
echo ""
echo "🎯 Prochaines étapes:"
echo "1. Aller sur render.com"
echo "2. Connecter votre repo GitHub: $GITHUB_USER/$PROJECT_NAME"
echo "3. Cliquer 'Deploy from render.yaml'"
echo "4. 3 services seront créés automatiquement"
echo ""
echo "🌐 URLs finales (après déploiement):"
echo "- https://cabinet-dupont.onrender.com"
echo "- https://cabinet-martin.onrender.com"
echo "- https://cabinet-bernard.onrender.com"
echo ""
echo "🔐 Login pour tous: admin / admin123"
echo ""
echo "⏱️  Temps de déploiement: ~5 minutes"
echo "💰 Coût: Gratuit (3 services)"
echo ""
echo "🚀 READY TO DEPLOY!"