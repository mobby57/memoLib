from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/api/dashboard/stats')
def dashboard_stats():
    return jsonify({'total_emails': 0, 'today_emails': 0, 'ai_generations': 0, 'accessibility_users': 0, 'templates_count': 0, 'success_rate': 95.2, 'week_trend': 5.2})

@app.route('/api/config/settings', methods=['GET', 'POST'])
def config_settings():
    return jsonify({'success': True, 'settings': {'theme': 'light', 'language': 'fr', 'notifications': True}})

@app.route('/api/templates', methods=['GET', 'POST'])
def templates():
    return jsonify({'success': True, 'templates': []})

@app.route('/api/email-history')
def email_history():
    return jsonify({'success': True, 'emails': []})

@app.route('/api/send-email', methods=['POST'])
def send_email():
    return jsonify({'success': True, 'message': 'Email envoyé ✅'})

@app.route('/api/generate-email', methods=['POST'])
def generate_email():
    data = request.get_json() or {}
    context = data.get('context', 'test')
    return jsonify({'success': True, 'subject': f'Demande concernant {context}', 'body': f'Bonjour,\n\nConcernant {context}.\n\nCordialement'})

@app.route('/api/ai/generate', methods=['POST'])
def ai_generate():
    return generate_email()

@app.route('/api/ai/improve-text', methods=['POST'])
def improve_text():
    data = request.get_json() or {}
    text = data.get('text', '')
    return jsonify({'success': True, 'content': text.capitalize() + '.', 'text': text.capitalize() + '.'})

@app.route('/api/contacts', methods=['GET', 'POST'])
def contacts():
    return jsonify({'success': True, 'contacts': []})

@app.route('/api/auth/login', methods=['POST'])
def login():
    return jsonify({'success': True, 'token': 'demo-token'})

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    return jsonify({'success': True})

@app.route('/api/accessibility/settings', methods=['GET', 'POST'])
def accessibility_settings():
    return jsonify({'success': True, 'settings': {'fontSize': 'medium'}})

@app.route('/api/accessibility/shortcuts')
def accessibility_shortcuts():
    return jsonify({'success': True, 'shortcuts': []})

@app.route('/api/voice/transcribe', methods=['POST'])
def voice_transcribe():
    return jsonify({'success': True, 'text': 'Transcription test'})

@app.route('/api/voice/speak', methods=['POST'])
def voice_speak():
    return jsonify({'success': True})

if __name__ == '__main__':
    print("🚀 API Simple - Port 5000")
    app.run(debug=False, host='127.0.0.1', port=5000)