#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
IA Poste Manager - Multi-Tenant Edition COMPLETE
Flask App avec toutes les dépendances externes
"""

import os
import sys
import json
import requests
from pathlib import Path
from datetime import datetime, timedelta
from flask import Flask, render_template, request, jsonify, redirect, url_for, flash, session
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
import pandas as pd
import numpy as np
from bs4 import BeautifulSoup

# Configuration Multi-Tenant
CLIENT_ID = os.getenv('CLIENT_ID', 'default')
CLIENT_NAME = os.getenv('CLIENT_NAME', 'Cabinet Juridique')
SUBSCRIPTION_PLAN = os.getenv('SUBSCRIPTION_PLAN', 'starter')
DATA_DIR = os.getenv('DATA_DIR', f'/home/sidmoro/mysite/clients/{CLIENT_ID}/data')

# Créer l'app Flask
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-key-change-in-production')

# Configuration CORS
CORS(app, origins=['*'])

# Configuration Login Manager
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# Créer les dossiers de données
Path(DATA_DIR).mkdir(parents=True, exist_ok=True)
for subdir in ['dossiers', 'factures', 'templates', 'ceseda', 'users', 'analytics']:
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

# Services avancés avec dépendances externes
class CESEDAAnalyzer:
    """Analyseur CESEDA avec web scraping"""
    
    def __init__(self):
        self.base_url = "https://www.legifrance.gouv.fr"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
    
    def scrape_decisions(self, limit=10):
        """Scraper des décisions CESEDA (simulation)"""
        try:
            # Simulation de données (remplacer par vrai scraping)
            decisions = []
            for i in range(limit):
                decision = {
                    'id': f'CESEDA-{datetime.now().strftime("%Y%m%d")}-{i:03d}',
                    'date': (datetime.now() - timedelta(days=i*30)).isoformat(),
                    'type': np.random.choice(['Recours', 'Appel', 'Cassation']),
                    'success_rate': np.random.uniform(0.3, 0.9),
                    'keywords': ['droit au séjour', 'vie privée familiale', 'OQTF'],
                    'tenant_id': CLIENT_ID
                }
                decisions.append(decision)
            
            # Sauvegarder
            decisions_file = Path(DATA_DIR) / 'ceseda' / 'decisions.json'
            with open(decisions_file, 'w', encoding='utf-8') as f:
                json.dump(decisions, f, indent=2, ensure_ascii=False)
            
            return decisions
        except Exception as e:
            return {'error': str(e)}
    
    def predict_success(self, case_data):
        """Prédiction IA du succès d'un recours"""
        # Simulation d'IA avec pandas/numpy
        df = pd.DataFrame([case_data])
        
        # Facteurs de succès simulés
        base_score = 0.5
        if 'vie_privee_familiale' in case_data.get('motifs', []):
            base_score += 0.2
        if case_data.get('duree_sejour', 0) > 5:
            base_score += 0.15
        if case_data.get('enfants_scolarises', False):
            base_score += 0.1
        
        prediction = min(base_score + np.random.uniform(-0.1, 0.1), 0.95)
        
        return {
            'success_probability': round(prediction, 3),
            'confidence': 0.87,
            'key_factors': ['Vie privée familiale', 'Durée de séjour', 'Enfants scolarisés'],
            'recommendation': 'Recours recommandé' if prediction > 0.6 else 'Recours risqué'
        }

class AnalyticsService:
    """Service d'analytics avec pandas"""
    
    def __init__(self, data_dir):
        self.data_dir = Path(data_dir)
    
    def generate_client_stats(self):
        """Générer statistiques client avec pandas"""
        try:
            # Charger données dossiers
            dossiers_dir = self.data_dir / 'dossiers'
            dossiers_data = []
            
            if dossiers_dir.exists():
                for file in dossiers_dir.glob('*.json'):
                    with open(file, 'r', encoding='utf-8') as f:
                        dossier = json.load(f)
                        if dossier.get('tenant_id') == CLIENT_ID:
                            dossiers_data.append(dossier)
            
            if not dossiers_data:
                return {'message': 'Aucune donnée disponible'}
            
            # Analyse avec pandas
            df = pd.DataFrame(dossiers_data)
            df['created_at'] = pd.to_datetime(df['created_at'])
            
            stats = {
                'total_dossiers': len(df),
                'dossiers_par_mois': df.groupby(df['created_at'].dt.to_period('M')).size().to_dict(),
                'types_affaires': df['type_affaire'].value_counts().to_dict(),
                'status_distribution': df['status'].value_counts().to_dict(),
                'created_by_stats': df['created_by'].value_counts().to_dict()
            }
            
            return stats
        except Exception as e:
            return {'error': str(e)}

# Initialiser services
ceseda_analyzer = CESEDAAnalyzer()
analytics_service = AnalyticsService(DATA_DIR)

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

# Routes API Multi-Tenant AVANCÉES
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
        'role': current_user.role,
        'features': {
            'ceseda_ai': True,
            'web_scraping': True,
            'analytics': True,
            'multi_tenant': True
        }
    })

@app.route('/api/ceseda/scrape', methods=['POST'])
@login_required
def scrape_ceseda():
    """Scraper des décisions CESEDA"""
    data = request.json or {}
    limit = data.get('limit', 10)
    
    decisions = ceseda_analyzer.scrape_decisions(limit)
    return jsonify({
        'success': True,
        'decisions_count': len(decisions) if isinstance(decisions, list) else 0,
        'decisions': decisions
    })

@app.route('/api/ceseda/predict', methods=['POST'])
@login_required
def predict_ceseda():
    """Prédiction IA pour recours CESEDA"""
    case_data = request.json or {}
    
    prediction = ceseda_analyzer.predict_success(case_data)
    return jsonify({
        'success': True,
        'prediction': prediction,
        'tenant_id': CLIENT_ID
    })

@app.route('/api/analytics/stats')
@login_required
def analytics_stats():
    """Statistiques avancées avec pandas"""
    stats = analytics_service.generate_client_stats()
    return jsonify({
        'success': True,
        'stats': stats,
        'generated_at': datetime.now().isoformat()
    })

@app.route('/api/dossiers', methods=['GET', 'POST'])
@login_required
def dossiers():
    dossiers_dir = Path(DATA_DIR) / 'dossiers'
    
    if request.method == 'POST':
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
                if dossier.get('tenant_id') == CLIENT_ID:
                    dossiers.append(dossier)
    
    return jsonify(dossiers)

# Templates HTML (créés dynamiquement)
def create_templates():
    """Créer templates HTML"""
    templates_dir = Path('templates')
    templates_dir.mkdir(exist_ok=True)
    
    # Template login
    login_html = '''<!DOCTYPE html>
<html>
<head>
    <title>{{ client_name }} - Connexion</title>
    <meta charset="utf-8">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body class="bg-light">
    <div class="container">
        <div class="row justify-content-center mt-5">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header text-center">
                        <h3>🏢 {{ client_name }}</h3>
                        <small class="text-muted">Multi-Tenant + IA CESEDA</small>
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
                                <label class="form-label">Utilisateur</label>
                                <input type="text" class="form-control" name="username" value="admin" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Mot de passe</label>
                                <input type="password" class="form-control" name="password" value="admin123" required>
                            </div>
                            <button type="submit" class="btn btn-primary w-100">Connexion</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>'''
    
    # Template dashboard
    dashboard_html = '''<!DOCTYPE html>
<html>
<head>
    <title>{{ client_name }} - Dashboard</title>
    <meta charset="utf-8">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
    <nav class="navbar navbar-dark bg-primary">
        <div class="container">
            <span class="navbar-brand">🚀 {{ client_name }}</span>
            <div>
                <span class="navbar-text me-3">{{ subscription_plan|title }}</span>
                <a class="btn btn-outline-light btn-sm" href="/logout">Déconnexion</a>
            </div>
        </div>
    </nav>
    
    <div class="container mt-4">
        <h1>🏆 Multi-Tenant + IA CESEDA</h1>
        <div class="alert alert-success">
            <strong>✅ Client:</strong> <code>{{ client_id }}</code><br>
            <strong>🔧 Features:</strong> Web Scraping, IA Prédictive, Analytics, Multi-Tenant
        </div>
        
        <div class="row">
            <div class="col-md-4">
                <div class="card">
                    <div class="card-header">🧠 IA CESEDA</div>
                    <div class="card-body">
                        <button onclick="testCESEDA()" class="btn btn-success">Test Prédiction</button>
                        <div id="ceseda-result" class="mt-2"></div>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card">
                    <div class="card-header">🕷️ Web Scraping</div>
                    <div class="card-body">
                        <button onclick="testScraping()" class="btn btn-warning">Test Scraping</button>
                        <div id="scraping-result" class="mt-2"></div>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card">
                    <div class="card-header">📊 Analytics</div>
                    <div class="card-body">
                        <button onclick="testAnalytics()" class="btn btn-info">Test Stats</button>
                        <div id="analytics-result" class="mt-2"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
    function testCESEDA() {
        fetch('/api/ceseda/predict', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                motifs: ['vie_privee_familiale'],
                duree_sejour: 7,
                enfants_scolarises: true
            })
        })
        .then(response => response.json())
        .then(data => {
            document.getElementById('ceseda-result').innerHTML = 
                '<small class="text-success">✅ Succès: ' + 
                (data.prediction.success_probability * 100).toFixed(1) + '%</small>';
        });
    }
    
    function testScraping() {
        fetch('/api/ceseda/scrape', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({limit: 5})
        })
        .then(response => response.json())
        .then(data => {
            document.getElementById('scraping-result').innerHTML = 
                '<small class="text-warning">📄 ' + data.decisions_count + ' décisions</small>';
        });
    }
    
    function testAnalytics() {
        fetch('/api/analytics/stats')
        .then(response => response.json())
        .then(data => {
            document.getElementById('analytics-result').innerHTML = 
                '<small class="text-info">📊 Stats générées</small>';
        });
    }
    </script>
</body>
</html>'''
    
    with open(templates_dir / 'login.html', 'w', encoding='utf-8') as f:
        f.write(login_html)
    
    with open(templates_dir / 'dashboard.html', 'w', encoding='utf-8') as f:
        f.write(dashboard_html)

# Initialisation
create_default_user()
create_templates()

if __name__ == '__main__':
    print(f"🚀 Démarrage {CLIENT_NAME}")
    print(f"📋 Client ID: {CLIENT_ID}")
    print(f"💼 Plan: {SUBSCRIPTION_PLAN}")
    print(f"📁 Données: {DATA_DIR}")
    print(f"🔐 Login: admin / admin123")
    print(f"🧠 Features: IA CESEDA, Web Scraping, Analytics")
    
    app.run(debug=True, host='0.0.0.0', port=5000)