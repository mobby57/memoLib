#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
IA Poste Manager - Multi-Tenant Edition
Flask App pour PythonAnywhere avec isolation clients
"""

import os
import sys
import json
from pathlib import Path
from datetime import datetime, timedelta
from flask import Flask, render_template, request, jsonify, redirect, url_for, flash, session
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash

# Configuration Multi-Tenant
CLIENT_ID = os.getenv('CLIENT_ID', 'default')
CLIENT_NAME = os.getenv('CLIENT_NAME', 'Cabinet Juridique')
SUBSCRIPTION_PLAN = os.getenv('SUBSCRIPTION_PLAN', 'starter')
DATA_DIR = os.getenv('DATA_DIR', f'/home/sidmoro/mysite/clients/{CLIENT_ID}/data')

# Créer l'app Flask
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-key-change-in-production')

# Configuration Login Manager
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# Créer les dossiers de données
Path(DATA_DIR).mkdir(parents=True, exist_ok=True)
for subdir in ['dossiers', 'factures', 'templates', 'ceseda', 'users']:
    Path(DATA_DIR, subdir).mkdir(exist_ok=True)

# Classe User
class User(UserMixin):
    def __init__(self, id, username, password_hash, role='user'):
        self.id = id
        self.username = username
        self.password_hash = password_hash
        self.role = role

@login_manager.user_loader
def load_user(user_id):
    users_file = Path(DATA_DIR) / 'users' / 'users.json'
    if users_file.exists():
        with open(users_file, 'r', encoding='utf-8') as f:
            users = json.load(f)
            if user_id in users:
                user_data = users[user_id]
                return User(user_id, user_data['username'], user_data['password_hash'], user_data.get('role', 'user'))
    return None

def create_default_user():
    """Créer utilisateur par défaut si n'existe pas"""
    users_file = Path(DATA_DIR) / 'users' / 'users.json'
    if not users_file.exists():
        default_users = {
            'admin': {
                'username': 'admin',
                'password_hash': generate_password_hash('admin123'),
                'role': 'admin',
                'created_at': datetime.now().isoformat()
            }
        }
        with open(users_file, 'w', encoding='utf-8') as f:
            json.dump(default_users, f, indent=2, ensure_ascii=False)

# Routes principales
@app.route('/')
def index():
    if current_user.is_authenticated:
        return render_template('dashboard.html', 
                             client_name=CLIENT_NAME,
                             subscription_plan=SUBSCRIPTION_PLAN,
                             client_id=CLIENT_ID)
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        users_file = Path(DATA_DIR) / 'users' / 'users.json'
        if users_file.exists():
            with open(users_file, 'r', encoding='utf-8') as f:
                users = json.load(f)
                
            for user_id, user_data in users.items():
                if user_data['username'] == username and check_password_hash(user_data['password_hash'], password):
                    user = User(user_id, user_data['username'], user_data['password_hash'], user_data.get('role', 'user'))
                    login_user(user)
                    flash(f'Connexion réussie - {CLIENT_NAME}', 'success')
                    return redirect(url_for('index'))
        
        flash('Identifiants incorrects', 'error')
    
    return render_template('login.html', client_name=CLIENT_NAME)

@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('Déconnexion réussie', 'info')
    return redirect(url_for('login'))

# Routes API Multi-Tenant
@app.route('/api/client/info')
@login_required
def client_info():
    """Informations du client actuel"""
    return jsonify({
        'client_id': CLIENT_ID,
        'client_name': CLIENT_NAME,
        'subscription_plan': SUBSCRIPTION_PLAN,
        'data_dir': str(DATA_DIR),
        'user': current_user.username,
        'role': current_user.role
    })

@app.route('/api/client/usage')
@login_required
def client_usage():
    """Usage du client actuel"""
    dossiers_dir = Path(DATA_DIR) / 'dossiers'
    factures_dir = Path(DATA_DIR) / 'factures'
    
    nb_dossiers = len(list(dossiers_dir.glob('*.json'))) if dossiers_dir.exists() else 0
    nb_factures = len(list(factures_dir.glob('*.json'))) if factures_dir.exists() else 0
    
    # Limites selon le plan
    limits = {
        'starter': {'max_cases': 500, 'max_users': 3, 'max_analysis': 100},
        'professional': {'max_cases': 2000, 'max_users': 10, 'max_analysis': 500},
        'enterprise': {'max_cases': 10000, 'max_users': 50, 'max_analysis': 2000}
    }
    
    plan_limits = limits.get(SUBSCRIPTION_PLAN, limits['starter'])
    
    return jsonify({
        'usage': {
            'dossiers': nb_dossiers,
            'factures': nb_factures,
            'analyses_month': 0  # À implémenter
        },
        'limits': plan_limits,
        'plan': SUBSCRIPTION_PLAN
    })

@app.route('/api/dossiers', methods=['GET', 'POST'])
@login_required
def dossiers():
    dossiers_dir = Path(DATA_DIR) / 'dossiers'
    
    if request.method == 'POST':
        # Créer nouveau dossier
        data = request.json
        dossier_id = f"DOS-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
        
        dossier = {
            'id': dossier_id,
            'client_name': data.get('client_name', ''),
            'type_affaire': data.get('type_affaire', ''),
            'description': data.get('description', ''),
            'created_at': datetime.now().isoformat(),
            'created_by': current_user.username,
            'status': 'ouvert',
            'tenant_id': CLIENT_ID
        }
        
        with open(dossiers_dir / f'{dossier_id}.json', 'w', encoding='utf-8') as f:
            json.dump(dossier, f, indent=2, ensure_ascii=False)
        
        return jsonify({'success': True, 'dossier_id': dossier_id})
    
    # Lister dossiers
    dossiers = []
    if dossiers_dir.exists():
        for file in dossiers_dir.glob('*.json'):
            with open(file, 'r', encoding='utf-8') as f:
                dossier = json.load(f)
                # Vérifier isolation tenant
                if dossier.get('tenant_id') == CLIENT_ID:
                    dossiers.append(dossier)
    
    return jsonify(dossiers)

@app.route('/api/factures', methods=['GET', 'POST'])
@login_required
def factures():
    factures_dir = Path(DATA_DIR) / 'factures'
    
    if request.method == 'POST':
        # Créer nouvelle facture
        data = request.json
        facture_id = f"FAC-{datetime.now().strftime('%Y-%m%d-%H%M')}"
        
        facture = {
            'id': facture_id,
            'client_name': data.get('client_name', ''),
            'montant_ht': float(data.get('montant_ht', 0)),
            'tva': float(data.get('tva', 20)),
            'description': data.get('description', ''),
            'created_at': datetime.now().isoformat(),
            'created_by': current_user.username,
            'status': 'emise',
            'tenant_id': CLIENT_ID
        }
        
        facture['montant_ttc'] = facture['montant_ht'] * (1 + facture['tva'] / 100)
        
        with open(factures_dir / f'{facture_id}.json', 'w', encoding='utf-8') as f:
            json.dump(facture, f, indent=2, ensure_ascii=False)
        
        return jsonify({'success': True, 'facture_id': facture_id})
    
    # Lister factures
    factures = []
    if factures_dir.exists():
        for file in factures_dir.glob('*.json'):
            with open(file, 'r', encoding='utf-8') as f:
                facture = json.load(f)
                # Vérifier isolation tenant
                if facture.get('tenant_id') == CLIENT_ID:
                    factures.append(facture)
    
    return jsonify(factures)

# Templates HTML basiques
@app.route('/dossiers')
@login_required
def dossiers_page():
    return render_template('dossiers.html', client_name=CLIENT_NAME)

@app.route('/factures')
@login_required
def factures_page():
    return render_template('factures.html', client_name=CLIENT_NAME)

# Template HTML simple pour login
login_template = '''
<!DOCTYPE html>
<html>
<head>
    <title>{{ client_name }} - Connexion</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body class="bg-light">
    <div class="container">
        <div class="row justify-content-center mt-5">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h3 class="text-center">{{ client_name }}</h3>
                        <p class="text-center text-muted">Connexion sécurisée</p>
                    </div>
                    <div class="card-body">
                        {% with messages = get_flashed_messages(with_categories=true) %}
                            {% if messages %}
                                {% for category, message in messages %}
                                    <div class="alert alert-{{ 'danger' if category == 'error' else category }}">{{ message }}</div>
                                {% endfor %}
                            {% endif %}
                        {% endwith %}
                        
                        <form method="POST">
                            <div class="mb-3">
                                <label class="form-label">Nom d'utilisateur</label>
                                <input type="text" class="form-control" name="username" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Mot de passe</label>
                                <input type="password" class="form-control" name="password" required>
                            </div>
                            <button type="submit" class="btn btn-primary w-100">Se connecter</button>
                        </form>
                        
                        <div class="mt-3 text-center">
                            <small class="text-muted">
                                Défaut: admin / admin123<br>
                                <strong>Changez le mot de passe en production!</strong>
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
'''

# Template HTML simple pour dashboard
dashboard_template = '''
<!DOCTYPE html>
<html>
<head>
    <title>{{ client_name }} - Dashboard</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
        <div class="container">
            <a class="navbar-brand" href="/">{{ client_name }}</a>
            <div class="navbar-nav ms-auto">
                <span class="navbar-text me-3">Plan: {{ subscription_plan|title }}</span>
                <a class="nav-link" href="/logout">Déconnexion</a>
            </div>
        </div>
    </nav>
    
    <div class="container mt-4">
        <div class="row">
            <div class="col-md-12">
                <h1>Tableau de bord</h1>
                <p class="text-muted">Client ID: {{ client_id }}</p>
                
                {% with messages = get_flashed_messages(with_categories=true) %}
                    {% if messages %}
                        {% for category, message in messages %}
                            <div class="alert alert-{{ 'danger' if category == 'error' else category }}">{{ message }}</div>
                        {% endfor %}
                    {% endif %}
                {% endwith %}
            </div>
        </div>
        
        <div class="row">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h5>Dossiers</h5>
                    </div>
                    <div class="card-body">
                        <p>Gestion des dossiers clients</p>
                        <a href="/dossiers" class="btn btn-primary">Accéder</a>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h5>Facturation</h5>
                    </div>
                    <div class="card-body">
                        <p>Gestion des factures</p>
                        <a href="/factures" class="btn btn-primary">Accéder</a>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row mt-4">
            <div class="col-md-12">
                <div class="card">
                    <div class="card-header">
                        <h5>API Multi-Tenant</h5>
                    </div>
                    <div class="card-body">
                        <p>Endpoints disponibles:</p>
                        <ul>
                            <li><code>GET /api/client/info</code> - Informations client</li>
                            <li><code>GET /api/client/usage</code> - Usage et limites</li>
                            <li><code>GET /api/dossiers</code> - Liste dossiers</li>
                            <li><code>POST /api/dossiers</code> - Créer dossier</li>
                            <li><code>GET /api/factures</code> - Liste factures</li>
                            <li><code>POST /api/factures</code> - Créer facture</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
'''

# Initialisation des templates et utilisateur
def init_app():
    """Initialiser l'application"""
    templates_dir = Path('templates')
    templates_dir.mkdir(exist_ok=True)
    
    with open(templates_dir / 'login.html', 'w', encoding='utf-8') as f:
        f.write(login_template)
    
    with open(templates_dir / 'dashboard.html', 'w', encoding='utf-8') as f:
        f.write(dashboard_template)
    
    # Créer utilisateur par défaut
    create_default_user()

# Initialiser au démarrage
init_app()

if __name__ == '__main__':
    print(f"🚀 Démarrage {CLIENT_NAME}")
    print(f"📋 Client ID: {CLIENT_ID}")
    print(f"💼 Plan: {SUBSCRIPTION_PLAN}")
    print(f"📁 Données: {DATA_DIR}")
    print(f"🔐 Login: admin / admin123")
    
    app.run(debug=True, host='0.0.0.0', port=5000)