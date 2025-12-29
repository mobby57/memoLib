#!/usr/bin/python3.10
import sys
import os

# Ajouter le chemin de votre projet
path = '/home/yourusername/iapostemanage'
if path not in sys.path:
    sys.path.insert(0, path)

# Charger variables d'environnement
from dotenv import load_dotenv
load_dotenv(os.path.join(path, '.env'))

# Importer l'application Flask
from app import app as application

if __name__ == "__main__":
    application.run()