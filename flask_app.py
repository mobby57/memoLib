from flask import Flask, render_template, request, jsonify, redirect, url_for, session
from werkzeug.security import generate_password_hash, check_password_hash
import os
import json
import secrets
from datetime import datetime
from pathlib import Path

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'pythonanywhere-secret-key-2025')

# Data directory
DATA_DIR = Path('/home/sidmoro/mysite/data')
DATA_DIR.mkdir(exist_ok=True)

def load_users():
    users_file = DATA_DIR / 'users.json'
    if users_file.exists():
        with open(users_file, 'r') as f:
            return json.load(f)
    return {}

def save_users(users):
    users_file = DATA_DIR / 'users.json'
    with open(users_file, 'w') as f:
        json.dump(users, f, indent=2)

@app.route('/')
def home():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return render_template('dashboard.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        users = load_users()
        if username in users and check_password_hash(users[username]['password'], password):
            session['user_id'] = username
            return redirect(url_for('home'))
        
        return render_template('login.html', error='Identifiants incorrects')
    
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.pop('user_id', None)
    return redirect(url_for('login'))

@app.route('/legal/ai')
def legal_ai():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return render_template('ai_assistant.html')

@app.route('/api/legal/analyze', methods=['POST'])
def analyze_case():
    if 'user_id' not in session:
        return jsonify({'error': 'Non autorisé'}), 401
    
    data = request.get_json()
    description = data.get('description', '')
    
    # Simple analysis
    urgent_keywords = ['expulsion', 'oqtf', 'detention', 'urgence']
    is_urgent = any(kw in description.lower() for kw in urgent_keywords)
    
    analysis = {
        'urgency': 'HIGH' if is_urgent else 'NORMAL',
        'success_probability': 0.75 if not is_urgent else 0.45,
        'recommendations': [
            'Constituer un dossier complet',
            'Rassembler les justificatifs',
            'Consulter avocat spécialisé'
        ]
    }
    
    return jsonify({'success': True, 'analysis': analysis})

@app.route('/health')
def health():
    return jsonify({'status': 'ok', 'version': '2.3.1'})

if __name__ == '__main__':
    # Initialize admin user
    users = load_users()
    if not users:
        users['admin'] = {
            'password': generate_password_hash('admin123'),
            'email': 'admin@msconseils.fr',
            'created_at': datetime.now().isoformat()
        }
        save_users(users)
    
    app.run(debug=False)