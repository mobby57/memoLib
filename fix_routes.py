"""Fix rapide pour ajouter les routes manquantes"""
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/api/dashboard/stats')
def dashboard_stats():
    return jsonify({
        'success': True,
        'stats': {
            'emails_sent': 0,
            'ai_generations': 0,
            'templates': 0
        }
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

if __name__ == '__main__':
    print("🔧 Routes API temporaires - Port 5001")
    app.run(debug=False, host='127.0.0.1', port=5001)