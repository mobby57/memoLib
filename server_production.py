"""
Serveur API Production - Version Stable
Utilise Waitress WSGI avec gestion d'erreurs robuste
"""
import os
import sys
import logging
from pathlib import Path

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# Ajouter les chemins
root_dir = Path(__file__).parent
sys.path.insert(0, str(root_dir / "src"))
sys.path.insert(0, str(root_dir))

def start_server():
    """Démarre le serveur avec gestion d'erreurs"""
    try:
        # Import de l'application
        logger.info("Chargement de l'application Flask...")
        from backend.app_postgres import create_app, db_service
        
        # Création de l'app
        app = create_app()
        logger.info("Application Flask créée avec succès")
        
        # Test de la connexion DB
        logger.info("Test de connexion à la base de données...")
        if not db_service.health_check():
            logger.error("Échec de connexion à la base de données!")
            logger.error("Vérifiez votre variable DATABASE_URL dans .env")
            return False
        
        logger.info("Connexion DB réussie ✓")
        
        # Affichage des informations
        print("\n" + "="*70)
        print("  IA POSTE MANAGER - API Production Server")
        print("="*70)
        print(f"\n  URL principale : http://localhost:5000")
        print(f"  Documentation  : http://localhost:5000/")
        print(f"  Health check   : http://localhost:5000/api/v2/health")
        print(f"\n  Serveur WSGI   : Waitress (Production-ready)")
        print(f"  Mode           : Production (stable)")
        print(f"\n  Pour arrêter   : CTRL+C")
        print("="*70 + "\n")
        
        # Démarrage avec Waitress
        try:
            from waitress import serve
            logger.info("Démarrage du serveur Waitress sur 0.0.0.0:5000...")
            logger.info("Le serveur est maintenant prêt à recevoir des requêtes")
            
            # serve() bloque ici jusqu'à CTRL+C
            serve(
                app, 
                host='0.0.0.0', 
                port=5000,
                threads=6,
                channel_timeout=30,
                cleanup_interval=10,
                asyncore_use_poll=True
            )
            
        except ImportError:
            logger.warning("Waitress non disponible, utilisation du serveur Flask")
            logger.warning("Pour la production, installez: pip install waitress")
            app.run(
                host='0.0.0.0',
                port=5000,
                debug=False,
                threaded=True,
                use_reloader=False
            )
        
        return True
        
    except KeyboardInterrupt:
        logger.info("\nArrêt du serveur demandé par l'utilisateur")
        return True
        
    except Exception as e:
        logger.error(f"Erreur fatale au démarrage: {e}")
        logger.exception("Détails de l'erreur:")
        return False

if __name__ == '__main__':
    try:
        success = start_server()
        sys.exit(0 if success else 1)
    except Exception as e:
        logger.error(f"Erreur non gérée: {e}")
        sys.exit(1)
