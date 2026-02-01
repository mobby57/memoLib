"""
API REST Simple pour MVP - Version de Démarrage Rapide
=======================================================
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime
import os
import sys

# Ajouter le répertoire racine au path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

app = Flask(__name__)
CORS(app)

print("🚀 Démarrage de l'API MVP Simple...")

@app.route('/')
def home():
    """Page d'accueil"""
    return jsonify({
        'message': 'memoLib MVP API',
        'version': '1.0.0-mvp',
        'status': 'running',
        'endpoints': [
            'GET  / - Cette page',
            'GET  /api/v1/health - Health check',
            'POST /api/v1/messages - Traiter un message',
            'GET  /api/v1/channels - Liste des canaux'
        ]
    })

@app.route('/api/v1/health')
def health():
    """Health check"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'version': '1.0.0-mvp',
        'mode': 'simple'
    })

@app.route('/api/v1/messages', methods=['POST'])
def process_message():
    """Traite un message (version simplifiée)"""
    try:
        data = request.get_json()
        
        if not data or 'content' not in data:
            return jsonify({
                'success': False,
                'error': 'Content is required'
            }), 400
        
        content = data.get('content', '')
        subject = data.get('subject', '')
        sender = data.get('sender', 'unknown@example.com')
        
        # Simuler un workspace
        import uuid
        workspace_id = f"ws_{uuid.uuid4().hex[:12]}"
        
        return jsonify({
            'success': True,
            'workspace_id': workspace_id,
            'message': 'Message reçu avec succès',
            'data': {
                'content_length': len(content),
                'subject': subject,
                'sender': sender
            }
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/v1/channels')
def list_channels():
    """Liste des canaux"""
    return jsonify({
        'channels': ['email', 'chat', 'sms', 'whatsapp', 'web_form', 'api']
    })

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    print(f"\n✅ API Simple prête sur http://localhost:{port}")
    print(f"📖 Visitez http://localhost:{port}/ pour voir les endpoints\n")
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=True
    )
