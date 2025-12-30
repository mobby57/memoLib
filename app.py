#!/usr/bin/env python3
from flask import Flask, render_template, jsonify
import os
from datetime import datetime

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', 'dev-key-change-in-production')

@app.route('/')
def index():
    return '''
    <!DOCTYPE html>
    <html>
    <head>
        <title>IA Poste Manager v2.3</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                   background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                   min-height: 100vh; margin: 0; color: white; }
            .container { max-width: 800px; margin: 0 auto; padding: 40px 20px; text-align: center; }
            .card { background: rgba(255,255,255,0.1); padding: 40px; border-radius: 20px;
                   backdrop-filter: blur(15px); margin: 20px 0; }
            .btn { background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
                   color: white; border: none; padding: 15px 30px; border-radius: 25px;
                   text-decoration: none; display: inline-block; margin: 10px; }
            .status { color: #27ae60; font-size: 1.2em; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="card">
                <h1>🚀 IA Poste Manager v2.3</h1>
                <p>Système d'automatisation d'emails avec IA</p>
                <div class="status">✅ Application déployée avec succès!</div>
                <p><strong>Plateforme:</strong> Gratuite et sécurisée</p>
                <p><strong>Status:</strong> Opérationnel</p>
                <a href="/health" class="btn">🔍 Vérifier Status</a>
                <a href="/demo" class="btn">🎯 Démo</a>
            </div>
            
            <div class="card">
                <h2>📋 Fonctionnalités</h2>
                <p>✅ Interface web moderne</p>
                <p>✅ API REST sécurisée</p>
                <p>✅ Déploiement gratuit</p>
                <p>✅ SSL automatique</p>
            </div>
        </div>
    </body>
    </html>
    '''

@app.route('/health')
def health():
    return jsonify({
        'status': 'healthy',
        'version': '2.3',
        'timestamp': datetime.now().isoformat(),
        'deployment': 'success'
    })

@app.route('/demo')
def demo():
    return '''
    <!DOCTYPE html>
    <html>
    <head>
        <title>Démo - IA Poste Manager</title>
        <meta charset="utf-8">
        <style>
            body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }
            .demo { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
            .success { color: #27ae60; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="demo">
            <h1>🎯 Démo IA Poste Manager</h1>
            <p class="success">✅ Déploiement réussi sur plateforme gratuite!</p>
            <h3>Caractéristiques:</h3>
            <ul>
                <li>Application Flask moderne</li>
                <li>Interface responsive</li>
                <li>API REST fonctionnelle</li>
                <li>Déploiement automatisé</li>
                <li>SSL/HTTPS sécurisé</li>
            </ul>
            <p><a href="/">← Retour accueil</a></p>
        </div>
    </body>
    </html>
    '''

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)