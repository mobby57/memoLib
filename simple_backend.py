from flask import Flask, jsonify, request
from flask_cors import CORS
import json
from datetime import datetime

app = Flask(__name__)
CORS(app)

@app.route('/health')
def health():
    return jsonify({'status': 'healthy', 'service': 'IA Poste Manager'})

@app.route('/api/status')
def api_status():
    return jsonify({'status': 'running', 'version': '2.3'})

@app.route('/api/workspace/create', methods=['POST'])
def create_workspace():
    data = request.get_json() or {}
    workspace = {
        'id': f'ws_{datetime.now().strftime("%Y%m%d_%H%M%S")}',
        'type': data.get('workspace_type', 'general'),
        'status': 'created',
        'created_at': datetime.utcnow().isoformat(),
        'email': {
            'subject': data.get('email_subject', ''),
            'content': data.get('email_content', ''),
            'sender': data.get('email_sender', '')
        },
        'analysis': {
            'complexity_score': 5.0,
            'priority': 'medium',
            'missing_info': [],
            'suggested_actions': ['generate_response']
        },
        'metrics': {
            'ai_calls_count': 1,
            'processing_time_seconds': 0
        }
    }
    return jsonify(workspace), 201

@app.route('/api/workspace/list')
def list_workspaces():
    return jsonify({'workspaces': []})

@app.route('/api/workspace/<workspace_id>')
def get_workspace(workspace_id):
    return jsonify({
        'id': workspace_id,
        'status': 'created',
        'type': 'general'
    })

@app.route('/api/workspace/<workspace_id>/process', methods=['PUT'])
def process_workspace(workspace_id):
    data = request.get_json() or {}
    action = data.get('action', '')
    
    return jsonify({
        'status': 'success',
        'message': f'Action {action} completed',
        'processing_time': 1.5,
        'ai_calls': 1
    })

if __name__ == '__main__':
    print('[BACKEND] IA Poste Manager Backend starting...')
    print('[HEALTH] http://localhost:5000/health')
    print('[API] http://localhost:5000/api/status')
    app.run(host='0.0.0.0', port=5000, debug=True)