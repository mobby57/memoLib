"""
Serveur API - Lancement avec Keep-Alive
Résolution du problème de terminaison PowerShell
"""
import os
import sys
import logging
import threading
import time
from pathlib import Path

# Configuration logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger(__name__)

# Ajouter chemins
root_dir = Path(__file__).parent
sys.path.insert(0, str(root_dir / "src"))
sys.path.insert(0, str(root_dir))

# Variable globale pour keep-alive
keep_running = True

def heartbeat():
    """Thread heartbeat pour garder le processus vivant"""
    count = 0
    while keep_running:
        time.sleep(30)
        count += 1
        logger.debug(f"Heartbeat #{count} - Serveur actif")

def main():
    global keep_running
    
    try:
        # Import app
        logger.info("Chargement des modules...")
        from backend.app_postgres import create_app, db_service
        
        # Créer app
        app = create_app()
        logger.info("Application chargée")
        
        # Test DB
        if not db_service.health_check():
            logger.error("Échec connexion DB!")
            return 1
        
        logger.info("DB connectée ✓")
        
        # Bannière
        print("\n" + "="*70)
        print("  🚀 IA POSTE MANAGER - Backend API Server")
        print("="*70)
        print(f"  URL: http://localhost:5000")
        print(f"  Health: http://localhost:5000/api/v2/health")
        print(f"  Docs: http://localhost:5000/")
        print("="*70 + "\n")
        
        # Démarrer heartbeat
        heartbeat_thread = threading.Thread(target=heartbeat, daemon=True)
        heartbeat_thread.start()
        logger.info("Heartbeat démarré")
        
        # Serveur
        try:
            from waitress import serve
            logger.info("Waitress: Serving on http://0.0.0.0:5000")
            logger.info("** SERVEUR PRÊT - CTRL+C pour arrêter **\n")
            
            # serve() bloque ici
            serve(
                app,
                host='0.0.0.0',
                port=5000,
                threads=4,
                channel_timeout=60,
                _quiet=False
            )
            
        except ImportError:
            logger.warning("Waitress non disponible, Flask dev server")
            app.run(
                host='0.0.0.0',
                port=5000,
                debug=False,
                threaded=True,
                use_reloader=False
            )
        
        return 0
        
    except KeyboardInterrupt:
        logger.info("\n\nArrêt demandé")
        keep_running = False
        return 0
        
    except Exception as e:
        logger.error(f"Erreur: {e}", exc_info=True)
        return 1

if __name__ == '__main__':
    exit_code = main()
    logger.info(f"Fin du programme (code {exit_code})")
    sys.exit(exit_code)
