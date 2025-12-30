#!/bin/bash
# 🚀 Script automatique de déploiement multi-tenant sur Render
# Repo: iapostemanager

set -e

echo "🚀 DÉPLOIEMENT AUTOMATIQUE RENDER"
echo "================================="

# 1. Corriger remote si nécessaire
if git remote get-url origin 2>/dev/null | grep -q "iaposte-multitenant"; then
    echo "🔧 Correction URL remote..."
    git remote set-url origin https://github.com/mobby57/iapostemanager.git
fi

# 2. Créer branche multitenant
echo "📋 Création branche multitenant..."
git checkout -b multitenant-render 2>/dev/null || git checkout multitenant-render

# 3. Créer fichiers Render
echo "📁 Création fichiers Render..."

# Requirements
cat > requirements.txt << 'EOF'
Flask==3.0.3
Flask-Login==0.6.3
Werkzeug==3.0.3
gunicorn==21.2.0
EOF

# App Flask multi-tenant ultra-compacte
cat > app.py << 'EOF'
import os,json
from pathlib import Path
from flask import Flask,request,jsonify,redirect,url_for,render_template_string
from flask_login import LoginManager,UserMixin,login_user,logout_user,login_required,current_user
from werkzeug.security import generate_password_hash,check_password_hash

CLIENT_ID=os.getenv('CLIENT_ID','demo')
CLIENT_NAME=os.getenv('CLIENT_NAME','Demo')
PLAN=os.getenv('SUBSCRIPTION_PLAN','pro')

app=Flask(__name__)
app.config['SECRET_KEY']=os.getenv('SECRET_KEY','key123')
login_manager=LoginManager()
login_manager.init_app(app)
login_manager.login_view='login'

DATA_DIR=Path(f'/opt/render/project/data/{CLIENT_ID}')
DATA_DIR.mkdir(parents=True,exist_ok=True)
(DATA_DIR/'users').mkdir(exist_ok=True)

class User(UserMixin):
    def __init__(self,id,username,password_hash):
        self.id=id;self.username=username;self.password_hash=password_hash

@login_manager.user_loader
def load_user(user_id):
    users_file=DATA_DIR/'users'/'users.json'
    if users_file.exists():
        try:
            with open(users_file,'r') as f:
                users=json.load(f)
                if user_id in users:
                    user_data=users[user_id]
                    return User(user_id,user_data['username'],user_data['password_hash'])
        except:pass
    return None

def create_user():
    users_file=DATA_DIR/'users'/'users.json'
    if not users_file.exists():
        users={'admin':{'username':'admin','password_hash':generate_password_hash('admin123')}}
        with open(users_file,'w') as f:json.dump(users,f)

create_user()

DASH='''<!DOCTYPE html><html><head><title>{{n}}</title><meta charset="utf-8"><link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet"></head><body><nav class="navbar navbar-dark bg-success"><div class="container"><span class="navbar-brand">🚀 {{n}}</span><div><span class="navbar-text me-3">{{p}}</span><a class="btn btn-outline-light btn-sm" href="/logout">Déconnexion</a></div></div></nav><div class="container mt-4"><h1>✅ Multi-Tenant Render</h1><div class="alert alert-success"><strong>Client:</strong> {{c}}<br><strong>URL:</strong> {{u}}<br><strong>Repo:</strong> iapostemanager</div><div class="row"><div class="col-md-6"><div class="card"><div class="card-header">🔧 API Test</div><div class="card-body"><button onclick="fetch('/api/info').then(r=>r.json()).then(d=>document.getElementById('r').innerHTML='<div class=\"alert alert-success\">✅ '+d.client_name+'</div>')" class="btn btn-success">Test API</button><div id="r" class="mt-2"></div></div></div></div><div class="col-md-6"><div class="card"><div class="card-header">📊 Multi-Tenant</div><div class="card-body"><p><strong>Isolation:</strong> ✅ Complète</p><p><strong>Plan:</strong> {{p}}</p><p><strong>SSL:</strong> ✅ Auto</p></div></div></div></div></div></body></html>'''

LOGIN='''<!DOCTYPE html><html><head><title>{{n}}</title><meta charset="utf-8"><link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet"></head><body class="bg-light"><div class="container mt-5"><div class="row justify-content-center"><div class="col-md-6"><div class="card"><div class="card-header text-center"><h3>🏢 {{n}}</h3><small>Multi-Tenant sur Render</small></div><div class="card-body"><form method="POST"><div class="mb-3"><label>Utilisateur</label><input type="text" class="form-control" name="username" value="admin" required></div><div class="mb-3"><label>Mot de passe</label><input type="password" class="form-control" name="password" value="admin123" required></div><button type="submit" class="btn btn-primary w-100">Connexion</button></form></div></div></div></div></div></body></html>'''

@app.route('/')
def index():
    if current_user.is_authenticated:
        return render_template_string(DASH,n=CLIENT_NAME,c=CLIENT_ID,p=PLAN,u=request.host_url)
    return redirect(url_for('login'))

@app.route('/login',methods=['GET','POST'])
def login():
    if request.method=='POST':
        username=request.form['username'];password=request.form['password']
        users_file=DATA_DIR/'users'/'users.json'
        try:
            with open(users_file,'r') as f:users=json.load(f)
            for user_id,user_data in users.items():
                if user_data['username']==username and check_password_hash(user_data['password_hash'],password):
                    user=User(user_id,user_data['username'],user_data['password_hash'])
                    login_user(user);return redirect(url_for('index'))
        except:pass
    return render_template_string(LOGIN,n=CLIENT_NAME)

@app.route('/logout')
@login_required
def logout():logout_user();return redirect(url_for('login'))

@app.route('/api/info')
@login_required
def api_info():return jsonify({'client_id':CLIENT_ID,'client_name':CLIENT_NAME,'subscription_plan':PLAN,'hosting':'render.com'})

@app.route('/health')
def health():return jsonify({'status':'ok','client':CLIENT_ID})

if __name__=='__main__':
    port=int(os.environ.get('PORT',5000))
    app.run(host='0.0.0.0',port=port)
EOF

# 4. Render config multi-services
cat > render.yaml << 'EOF'
services:
  - type: web
    name: cabinet-dupont
    env: python
    repo: https://github.com/mobby57/iapostemanager
    branch: multitenant-render
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
    repo: https://github.com/mobby57/iapostemanager
    branch: multitenant-render
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
    repo: https://github.com/mobby57/iapostemanager
    branch: multitenant-render
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

# 5. README pour Render
cat > README_RENDER.md << 'EOF'
# 🚀 IA Poste Manager - Multi-Tenant sur Render

## Déploiement Automatique

### URLs de Production
- **Cabinet Dupont**: https://cabinet-dupont.onrender.com
- **Cabinet Martin**: https://cabinet-martin.onrender.com  
- **Cabinet Bernard**: https://cabinet-bernard.onrender.com

### Login Universel
- **Username**: `admin`
- **Password**: `admin123`

### Déploiement
1. Aller sur [render.com](https://render.com)
2. New > Blueprint
3. Connect Repository: `mobby57/iapostemanager`
4. Branch: `multitenant-render`
5. Deploy from `render.yaml`
6. 3 services créés automatiquement

### Features
- ✅ Multi-tenant avec isolation complète
- ✅ SSL automatique gratuit
- ✅ Déploiement Git automatique
- ✅ API REST sécurisée
- ✅ Interface Bootstrap responsive

### Architecture
Chaque client a sa propre instance isolée avec données séparées.
EOF

# 6. Commit et push
echo "📤 Commit et push..."
git add .
git commit -m "🚀 Multi-tenant deployment for Render - 3 clients ready"

# 7. Push avec gestion d'erreur
echo "🔄 Push vers GitHub..."
if git push -u origin multitenant-render; then
    echo "✅ Push réussi!"
else
    echo "⚠️  Erreur push. Entrez votre token GitHub comme mot de passe."
    echo "Username: mobby57"
    echo "Password: [VOTRE_TOKEN_GITHUB]"
    git push -u origin multitenant-render
fi

# 8. Instructions finales
echo ""
echo "🎉 DÉPLOIEMENT AUTOMATIQUE TERMINÉ!"
echo "===================================="
echo ""
echo "📋 Repo: https://github.com/mobby57/iapostemanager"
echo "🌿 Branche: multitenant-render"
echo ""
echo "🚀 PROCHAINES ÉTAPES:"
echo "1. Aller sur render.com"
echo "2. New > Blueprint"
echo "3. Connect Repository: mobby57/iapostemanager"
echo "4. Branch: multitenant-render"
echo "5. Deploy from render.yaml"
echo ""
echo "🌐 URLs FINALES (après déploiement):"
echo "- https://cabinet-dupont.onrender.com"
echo "- https://cabinet-martin.onrender.com"
echo "- https://cabinet-bernard.onrender.com"
echo ""
echo "🔐 Login: admin / admin123"
echo "⏱️  Temps: ~5 minutes"
echo "💰 Coût: GRATUIT"
echo ""
echo "🏆 READY TO DEPLOY!"