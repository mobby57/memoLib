"""
Vercel Serverless Handler
Point d'entrée pour déploiement Vercel
"""
import os
import sys
from pathlib import Path

# Ajouter chemins
root_dir = Path(__file__).parent
sys.path.insert(0, str(root_dir / "src"))
sys.path.insert(0, str(root_dir))

# Import de l'application Flask
from backend.app_postgres import create_app

# Créer l'application (Vercel l'utilise comme WSGI)
app = create_app()

# Point d'entrée pour Vercel
def handler(request, context):
    """Handler Vercel serverless"""
    return app(request.environ, context.start_response)

# Pour les tests locaux
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
