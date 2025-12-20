#!/usr/bin/env python3
"""
Serveur simple pour tester les pages HTML
Usage: python test_pages.py
"""

from flask import Flask, send_file, jsonify
import os

app = Flask(__name__)

# Page d'accueil
@app.route('/')
def home():
    return send_file('index.html')

# Pages HTML
@app.route('/dashboard.html')
def dashboard():
    return send_file('dashboard.html')

@app.route('/compose.html') 
def compose():
    return send_file('compose.html')

@app.route('/ai-generator.html')
def ai_generator():
    return send_file('ai-generator.html')

@app.route('/voice.html')
def voice():
    return send_file('voice.html')

@app.route('/templates.html')
def templates():
    return send_file('templates.html')

@app.route('/batch.html')
def batch():
    return send_file('batch.html')

# API simple pour les tests
@app.route('/api/health')
def health():
    return jsonify({'status': 'healthy', 'version': '3.0'})

@app.route('/api/dashboard/stats')
def stats():
    return jsonify({
        'total_emails': 42,
        'today_emails': 5,
        'ai_generations': 12,
        'accessibility_users': 3
    })

@app.route('/api/generate-email', methods=['POST'])
def generate_email():
    return jsonify({
        'success': True,
        'subject': 'Email généré par IA',
        'body': 'Ceci est un email généré automatiquement.'
    })

if __name__ == '__main__':
    print("🚀 Serveur de test des pages HTML")
    print("📁 Fichiers HTML détectés:")
    
    html_files = ['index.html', 'dashboard.html', 'compose.html', 'ai-generator.html', 'voice.html', 'templates.html', 'batch.html']
    for file in html_files:
        if os.path.exists(file):
            print(f"   ✅ {file}")
        else:
            print(f"   ❌ {file} (manquant)")
    
    print("\n🌐 Serveur démarré sur http://localhost:8000")
    print("👉 Cliquez sur les liens pour tester la navigation")
    
    app.run(host='0.0.0.0', port=8000, debug=True)