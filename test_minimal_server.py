"""
Version ultra-simple pour diagnostique
"""
from flask import Flask, jsonify
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)

@app.route('/test')
def test():
    return jsonify({"status": "ok", "message": "Serveur basique fonctionne"})

@app.route('/health')
def health():
    return jsonify({"status": "healthy"})

if __name__ == '__main__':
    print("\n" + "="*50)
    print("Test serveur basique sur http://localhost:5001")
    print("="*50 + "\n")
    
    try:
        from waitress import serve
        print("Using Waitress...")
        serve(app, host='0.0.0.0', port=5001)
    except ImportError:
        print("Using Flask dev server...")
        app.run(host='0.0.0.0', port=5001, debug=False)
