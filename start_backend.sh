#!/bin/bash

echo "Starting IA Poste Manager Backend..."

cd "$(dirname "$0")"

# Try main backend first
if [ -f "backend/app.py" ]; then
    echo "Starting main backend..."
    python backend/app.py
elif [ -f "src/backend/app.py" ]; then
    echo "Starting src backend..."
    python src/backend/app.py
elif [ -f "app.py" ]; then
    echo "Starting root app..."
    python app.py
else
    echo "No backend found. Creating simple server..."
    python -c "
from flask import Flask, jsonify
from flask_cors import CORS
app = Flask(__name__)
CORS(app)

@app.route('/health')
def health():
    return jsonify({'status': 'healthy'})

@app.route('/api/workspace/create', methods=['POST'])
def create_workspace():
    return jsonify({'id': 'demo-workspace', 'status': 'created'})

@app.route('/api/workspace/list')
def list_workspaces():
    return jsonify({'workspaces': []})

if __name__ == '__main__':
    print('Demo backend running on http://localhost:5000')
    app.run(host='0.0.0.0', port=5000, debug=True)
"
fi
