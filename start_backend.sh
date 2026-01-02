#!/bin/bash
# IA Poste Manager - Backend Start Script for Linux/Mac
# Equivalent to start_backend.bat

echo "Starting IA Poste Manager Backend..."

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

# Try main backend first
if [ -f "backend/app.py" ]; then
    echo "Starting main backend..."
    python3 backend/app.py
elif [ -f "src/backend/app.py" ]; then
    echo "Starting src backend..."
    python3 src/backend/app.py
elif [ -f "app.py" ]; then
    echo "Starting root app..."
    python3 app.py
else
    echo "No backend found. Creating simple server..."
    python3 -c "
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
    app.run(host='127.0.0.1', port=5000, debug=False)
"
fi
