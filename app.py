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
