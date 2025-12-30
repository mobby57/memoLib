#!/usr/bin/env python3
"""App factory minimal pour debug"""

from flask import Flask
from src.backend.api import api_bp

app = Flask(__name__)
app.register_blueprint(api_bp, url_prefix='/api/v1')

@app.route('/')
def index():
    return "IA Poste Manager v4.0"

if __name__ == '__main__':
    print("Test: http://localhost:5002/api/v1/health")
    app.run(port=5002, debug=False)
