#!/usr/bin/env python3
"""Test serveur persistant"""

from flask import Flask, jsonify
import time

app = Flask(__name__)

@app.route('/ping')
def ping():
    return jsonify({'status': 'pong', 'time': time.time()})

if __name__ == '__main__':
    try:
        print("="*60)
        print("Démarrage serveur sur http://localhost:5003/ping")
        print("="*60)
        app.run(host='127.0.0.1', port=5003, debug=False, use_reloader=False)
    except Exception as e:
        print(f"ERREUR: {e}")
        import traceback
        traceback.print_exc()
        input("Appuyer sur Entrée pour quitter...")
