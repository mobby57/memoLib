#!/usr/bin/env python3
"""Test minimal Blueprint sans dépendances"""

from flask import Flask, Blueprint, jsonify

app = Flask(__name__)

# Blueprint minimal
test_bp = Blueprint('test', __name__)

@test_bp.route('/ping', methods=['GET'])
def ping():
    return jsonify({'status': 'pong'}), 200

# Enregistrement
app.register_blueprint(test_bp, url_prefix='/api')

if __name__ == '__main__':
    print("Test serveur sur http://localhost:5001/api/ping")
    app.run(port=5001, debug=False)
