"""API complète IAPosteManager - Toutes les routes sans authentification"""
from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Base de données simple
DB_PATH = 'complete_api.db'

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''CREATE TABLE IF NOT EXISTS emails (
        id INTEGER PRIMARY KEY,
        recipient TEXT,
        subject TEXT,
        body TEXT,
        status TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')
    
    cursor.execute('''CREATE TABLE IF NOT EXISTS templates (
        id INTEGER PRIMARY KEY,
        name TEXT,
        subject TEXT,
        body TEXT,
        category TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')
    
    cursor.execute('''CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY,
        name TEXT,
        email TEXT,
        organization TEXT,
        category TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')
    
    conn.commit()
    conn.close()

# Dashboard
@app.route('/api/dashboard/stats')
def dashboard_stats():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('SELECT COUNT(*) FROM emails')
    total_emails = cursor.fetchone()[0]
    cursor.execute('SELECT COUNT(*) FROM templates')
    templates_count = cursor.fetchone()[0]
    conn.close()
    
    return jsonify({
        'total_emails': total_emails,
        'today_emails': 0,
        'ai_generations': int(total_emails * 0.6),
        'accessibility_users': 0,
        'templates_count': templates_count,
        'success_rate': 95.2,
        'week_trend': 5.2
    })

# Configuration
@app.route('/api/config/settings', methods=['GET', 'POST'])
def config_settings():
    if request.method == 'GET':
        return jsonify({
            'success': True,
            'settings': {
                'theme': 'light',
                'language': 'fr',
                'notifications': True,
                'has_gmail': False,
                'has_openai': False
            }
        })
    return jsonify({'success': True})

# Templates
@app.route('/api/templates', methods=['GET', 'POST'])
def templates():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    if request.method == 'GET':
        cursor.execute('SELECT * FROM templates ORDER BY created_at DESC')
        templates = cursor.fetchall()
        formatted = [{
            'id': t[0], 'name': t[1], 'subject': t[2], 
            'body': t[3], 'category': t[4], 'created_at': t[5]
        } for t in templates]
        conn.close()
        return jsonify({'success': True, 'templates': formatted})
    
    elif request.method == 'POST':
        data = request.get_json() or {}
        cursor.execute(
            'INSERT INTO templates (name, subject, body, category) VALUES (?, ?, ?, ?)',
            (data.get('name', ''), data.get('subject', ''), 
             data.get('body', ''), data.get('category', 'general'))
        )
        conn.commit()
        template_id = cursor.lastrowid
        conn.close()
        return jsonify({'success': True, 'template_id': template_id})

# Emails
@app.route('/api/email-history')
def email_history():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM emails ORDER BY created_at DESC LIMIT 50')
    emails = cursor.fetchall()
    formatted = [{
        'id': e[0], 'recipient': e[1], 'subject': e[2],
        'body': e[3], 'status': e[4], 'created_at': e[5]
    } for e in emails]
    conn.close()
    return jsonify({'success': True, 'emails': formatted})

@app.route('/api/send-email', methods=['POST'])
@app.route('/api/email/send', methods=['POST'])
def send_email():
    data = request.get_json() or {}
    recipient = data.get('recipient', '')
    subject = data.get('subject', '')
    body = data.get('body', '')
    
    if not all([recipient, subject, body]):
        return jsonify({'success': False, 'error': 'Données manquantes'}), 400
    
    # Simuler l'envoi
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        'INSERT INTO emails (recipient, subject, body, status) VALUES (?, ?, ?, ?)',
        (recipient, subject, body, 'sent')
    )
    conn.commit()
    conn.close()
    
    return jsonify({'success': True, 'message': 'Email envoyé avec succès ✅'})

# Génération IA
@app.route('/api/generate-email', methods=['POST'])
@app.route('/api/ai/generate', methods=['POST'])
def generate_email():
    try:
        data = request.get_json() or {}
        context = data.get('context', '')
        tone = data.get('tone', 'professionnel')
        
        if not context:
            return jsonify({
                'success': False, 
                'error': 'Le contexte est requis pour générer un email'
            }), 400
        
        templates = {
            'professionnel': {
                'subject': f'Demande concernant {context[:50]}',
                'body': f'Bonjour,\n\nJ\'espère que vous allez bien.\n\nJe me permets de vous contacter concernant {context}.\n\nPourriez-vous m\'indiquer la procédure à suivre ?\n\nJe reste à votre disposition.\n\nCordialement'
            },
            'amical': {
                'subject': f'À propos de {context[:50]}',
                'body': f'Salut !\n\nJ\'espère que tu vas bien.\n\nJe voulais te parler de {context}.\n\nQu\'est-ce que tu en penses ?\n\nN\'hésite pas à me dire !\n\nÀ bientôt !'
            },
            'formel': {
                'subject': f'Demande officielle - {context[:50]}',
                'body': f'Madame, Monsieur,\n\nJ\'ai l\'honneur de m\'adresser à vous concernant {context}.\n\nJe vous serais reconnaissant de bien vouloir m\'indiquer la procédure.\n\nVeuillez agréer mes salutations distinguées.'
            }
        }
        
        template = templates.get(tone, templates['professionnel'])
        
        return jsonify({
            'success': True,
            'subject': template['subject'],
            'body': template['body'],
            'source': 'template',
            'tone': tone
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Erreur génération: {str(e)}'
        }), 500

# Contacts
@app.route('/api/contacts', methods=['GET', 'POST'])
def contacts():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    if request.method == 'GET':
        cursor.execute('SELECT * FROM contacts ORDER BY name ASC')
        contacts = cursor.fetchall()
        formatted = [{
            'id': c[0], 'name': c[1], 'email': c[2],
            'organization': c[3], 'category': c[4], 'created_at': c[5]
        } for c in contacts]
        conn.close()
        return jsonify({'success': True, 'contacts': formatted})
    
    elif request.method == 'POST':
        data = request.get_json() or {}
        cursor.execute(
            'INSERT INTO contacts (name, email, organization, category) VALUES (?, ?, ?, ?)',
            (data.get('name', ''), data.get('email', ''),
             data.get('organization', ''), data.get('category', ''))
        )
        conn.commit()
        contact_id = cursor.lastrowid
        conn.close()
        return jsonify({'success': True, 'contact_id': contact_id})

@app.route('/api/contacts/<int:contact_id>', methods=['DELETE'])
def delete_contact(contact_id):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('DELETE FROM contacts WHERE id = ?', (contact_id,))
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'message': 'Contact supprimé'})

# Auth
@app.route('/api/auth/login', methods=['POST'])
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    password = data.get('password', '')
    
    if len(password) >= 8:
        return jsonify({
            'success': True,
            'token': 'demo-token-123',
            'redirect': '/'
        })
    return jsonify({'success': False, 'error': 'Mot de passe trop court'}), 400

@app.route('/api/auth/logout', methods=['POST'])
@app.route('/api/logout', methods=['POST'])
def logout():
    return jsonify({'success': True})

# Accessibilité
@app.route('/api/accessibility/settings', methods=['GET', 'POST'])
def accessibility_settings():
    if request.method == 'GET':
        return jsonify({
            'success': True,
            'settings': {
                'screenReader': False,
                'highContrast': False,
                'fontSize': 'medium',
                'ttsEnabled': False
            }
        })
    return jsonify({'success': True})

@app.route('/api/accessibility/shortcuts')
def accessibility_shortcuts():
    return jsonify({
        'success': True,
        'shortcuts': [
            {'key': 'Ctrl+/', 'description': 'Afficher les raccourcis'},
            {'key': 'Ctrl+H', 'description': 'Haut contraste'},
            {'key': 'Tab', 'description': 'Navigation clavier'}
        ]
    })

# Vocal
@app.route('/api/voice/transcribe', methods=['POST'])
def voice_transcribe():
    return jsonify({
        'success': True,
        'text': 'Transcription simulée du fichier audio.'
    })

@app.route('/api/voice/speak', methods=['POST'])
def voice_speak():
    return jsonify({'success': True})

# Amélioration IA
@app.route('/api/ai/improve-text', methods=['POST'])
def improve_text():
    data = request.get_json() or {}
    text = data.get('text', '')
    
    # Amélioration basique
    improved = text.strip()
    if improved and not improved[0].isupper():
        improved = improved[0].upper() + improved[1:]
    if improved and not improved[-1] in '.!?':
        improved += '.'
    
    return jsonify({
        'success': True,
        'content': improved,
        'text': improved,
        'source': 'basic'
    })

if __name__ == '__main__':
    init_db()
    print("🚀 API Complète IAPosteManager - Port 5000")
    print("📊 Toutes les routes disponibles")
    print("🔓 Aucune authentification requise")
    app.run(debug=False, host='127.0.0.1', port=5000)