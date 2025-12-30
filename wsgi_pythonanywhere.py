#!/usr/bin/python3.10
"""
WSGI Configuration for PythonAnywhere
FastAPI Application via ASGI-WSGI Bridge
"""
import sys
import os

# Remplacer 'yourusername' par votre nom d'utilisateur
path = '/home/yourusername/iapostemanager'
if path not in sys.path:
    sys.path.insert(0, path)

# Charger variables d'environnement
from dotenv import load_dotenv
load_dotenv(os.path.join(path, '.env'))

# Importer l'application FastAPI
from src.backend.main_fastapi import app

# Bridge ASGI->WSGI (obligatoire pour PythonAnywhere)
try:
    from asgiref.wsgi import WsgiToAsgi
    application = WsgiToAsgi(app)
except ImportError:
    application = app
    print("⚠️ Warning: asgiref not installed. Install with: pip install asgiref")