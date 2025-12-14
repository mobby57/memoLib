"""Serveur API minimal pour résoudre les erreurs 401"""
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/api/dashboard/stats')
def dashboard_stats():
    return jsonify({
        'total_emails': 0,
        'today_emails': 0,
        'ai_generations': 0,
        'accessibility_users': 0,
        'templates_count': 0,
        'success_rate': 0,
        'week_trend': 0
    })

@app.route('/api/config/settings', methods=['GET', 'POST'])
def config_settings():
    if request.method == 'GET':
        return jsonify({
            'success': True,
            'settings': {
                'theme': 'light',
                'language': 'fr',
                'notifications': True
            }
        })
    return jsonify({'success': True})

@app.route('/api/templates')
def templates():
    return jsonify({
        'success': True,
        'templates': []
    })

@app.route('/api/email-history')
def email_history():
    return jsonify({
        'success': True,
        'emails': []
    })

@app.route('/api/generate-email', methods=['POST'])
def generate_email():
    data = request.get_json() or {}
    context = data.get('context', '')
    tone = data.get('tone', 'professionnel')
    
    # Template simple basé sur le ton
    templates = {
        'professionnel': {
            'subject': f'Demande concernant {context[:30]}',
            'body': f'Bonjour,\n\nJ\'espère que vous allez bien.\n\nJe me permets de vous contacter concernant {context}.\n\nCordialement'
        },
        'amical': {
            'subject': f'À propos de {context[:30]}',
            'body': f'Salut !\n\nJ\'espère que tu vas bien.\n\nJe voulais te parler de {context}.\n\nÀ bientôt !'
        }
    }
    
    template = templates.get(tone, templates['professionnel'])
    return jsonify({
        'success': True,
        'subject': template['subject'],
        'body': template['body']
    })

@app.route('/api/ai/generate', methods=['POST'])
def ai_generate():
    return generate_email()

if __name__ == '__main__':
    print("🔧 API Server - Port 5000")
    app.run(debug=False, host='127.0.0.1', port=5000)