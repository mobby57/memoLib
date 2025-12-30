from flask import Flask, render_template, request, jsonify, redirect, url_for, session
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import os
import json
import secrets
from datetime import datetime
from pathlib import Path

app = Flask(__name__)
CORS(app)

# Secure configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', secrets.token_urlsafe(32))
app.config['JSON_AS_ASCII'] = False
app.config['SESSION_COOKIE_SECURE'] = True
app.config['SESSION_COOKIE_HTTPONLY'] = True

# Data storage
DATA_DIR = Path('data')
DATA_DIR.mkdir(exist_ok=True)

# Secure user storage
USERS_FILE = DATA_DIR / 'users.json'

def load_users():
    if USERS_FILE.exists():
        with open(USERS_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_users(users):
    with open(USERS_FILE, 'w') as f:
        json.dump(users, f, indent=2)

def load_data(filename):
    try:
        with open(DATA_DIR / filename, 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return []

def save_data(filename, data):
    with open(DATA_DIR / filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

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
        
        return render_template('auth/login.html', error='Identifiants incorrects')
    
    return render_template('auth/login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        email = request.form.get('email')
        
        users = load_users()
        if username in users:
            return render_template('auth/register.html', error='Utilisateur existe déjà')
        
        users[username] = {
            'password': generate_password_hash(password),
            'email': email,
            'created_at': datetime.now().isoformat()
        }
        save_users(users)
        
        session['user_id'] = username
        return redirect(url_for('home'))
    
    return render_template('auth/register.html')

@app.route('/logout')
def logout():
    session.pop('user_id', None)
    return redirect(url_for('login'))

@app.route('/api/send-email', methods=['POST'])
def send_email():
    if 'user_id' not in session:
        return jsonify({'error': 'Non autorisé'}), 401
    
    data = request.get_json()
    if not data or not all(k in data for k in ['to', 'subject', 'content']):
        return jsonify({'error': 'Données manquantes'}), 400
    
    emails = load_data('emails.json')
    emails.append({
        'id': len(emails) + 1,
        'to': data['to'],
        'subject': data['subject'],
        'content': data['content'],
        'user': session['user_id'],
        'date': datetime.now().isoformat()
    })
    save_data('emails.json', emails)
    return jsonify({'success': True, 'message': 'Email enregistré!'})

@app.route('/api/templates', methods=['GET', 'POST'])
def templates():
    if 'user_id' not in session:
        return jsonify({'error': 'Non autorisé'}), 401
    
    if request.method == 'POST':
        data = request.get_json()
        if not data or not all(k in data for k in ['name', 'content']):
            return jsonify({'error': 'Données manquantes'}), 400
        
        templates = load_data('templates.json')
        templates.append({
            'id': len(templates) + 1,
            'name': data['name'],
            'content': data['content'],
            'user': session['user_id'],
            'created_at': datetime.now().isoformat()
        })
        save_data('templates.json', templates)
        return jsonify({'success': True})
    
    return jsonify(load_data('templates.json'))

@app.route('/api/contacts', methods=['GET', 'POST'])
def contacts():
    if 'user_id' not in session:
        return jsonify({'error': 'Non autorisé'}), 401
    
    if request.method == 'POST':
        data = request.get_json()
        if not data or not all(k in data for k in ['name', 'email']):
            return jsonify({'error': 'Données manquantes'}), 400
        
        contacts = load_data('contacts.json')
        contacts.append({
            'id': len(contacts) + 1,
            'name': data['name'],
            'email': data['email'],
            'user': session['user_id'],
            'created_at': datetime.now().isoformat()
        })
        save_data('contacts.json', contacts)
        return jsonify({'success': True})
    
    return jsonify(load_data('contacts.json'))

@app.route('/health')
def health_check():
    return jsonify({
        'status': 'ok',
        'version': '2.3.1',
        'timestamp': datetime.now().isoformat()
    })

@app.errorhandler(404)
def not_found(e):
    return render_template('errors/404.html'), 404

@app.errorhandler(500)
def internal_error(e):
    return render_template('errors/500.html'), 500

if __name__ == '__main__':
    # Initialize admin user if not exists
    users = load_users()
    if not users:
        users['admin'] = {
            'password': generate_password_hash('admin123'),
            'email': 'admin@cabinet-avocat.fr',
            'created_at': datetime.now().isoformat()
        }
        save_users(users)
        print("Admin user created: admin/admin123")
    
    print("🚀 IA Poste Manager v2.3.1 - Sécurisé")
    print("📍 URL: http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=False)