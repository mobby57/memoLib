"""
Script standalone pour démarrer le serveur FastAPI
"""
import sys
import os

# Ajouter le répertoire au path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

if __name__ == '__main__':
    print("="*70)
    print(" DEMARRAGE SERVEUR IAPOSTEMANAGER")
    print("="*70)
    print("\n[*] Chargement des modules...")
    
    try:
        import uvicorn
        from src.backend.main_fastapi import app
        print("[OK] Modules charges")
        
        print("\n[*] Demarrage du serveur sur http://127.0.0.1:8000")
        print("[*] Endpoints disponibles:")
        print("   - GET  /health - Health check")
        print("   - GET  /docs - Documentation API")
        print("   - POST /api/auth/login")
        print("   - GET  /api/routes/ - Routes Data API")
        print("\n" + "="*70)
        print("[!] Appuyez sur CTRL+C pour arreter le serveur")
        print("="*70 + "\n")
        
        # Démarrage
        uvicorn.run(
            app, 
            host='0.0.0.0', 
            port=8000,
            reload=False,
            log_level="info"
        )
        
    except KeyboardInterrupt:
        print("\n\n[*] Serveur arrete par l'utilisateur")
        sys.exit(0)
    except Exception as e:
        print(f"\n\n[ERROR] ERREUR FATALE: {e}")
        import traceback
        traceback.print_exc()
        input("\n\nAppuyez sur Entree pour quitter...")
        sys.exit(1)
