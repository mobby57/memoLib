#!/usr/bin/env python3
"""Backend API minimal pour IAPosteManager React"""

import sys
import os
from flask import Flask
from flask_cors import CORS

# Ajouter le répertoire racine au path
sys.path.insert(0, os.path.dirname(__file__))

# Import de l'app principale
from src.web.app import app

# Configuration CORS pour React
CORS(app, origins=["http://localhost:3001", "http://127.0.0.1:3001"])

if __name__ == '__main__':
    print("\n" + "="*50)
    print("IAPosteManager v2.2 - Backend API")
    print("="*50)
    print(f"\nBackend API: http://127.0.0.1:5000")
    print(f"Frontend React: http://127.0.0.1:3001")
    print("\nEndpoints disponibles:")
    print("- GET  /api/health")
    print("- POST /api/login")
    print("- POST /api/send-email")
    print("- POST /api/generate-email")
    print("- GET  /api/templates")
    print("- GET  /api/contacts")
    print("- GET  /api/check-credentials")
    print("="*50 + "\n")
    
    app.run(debug=True, host='127.0.0.1', port=5000)