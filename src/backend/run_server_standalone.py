"""
Script standalone pour démarrer le serveur Flask sans interruption
"""
import sys
import os

# Ajouter le répertoire au path
sys.path.insert(0, os.path.dirname(__file__))

if __name__ == '__main__':
    print("="*70)
    print(" DEMARRAGE SERVEUR IAPOSTEMANAGER")
    print("="*70)
    print("\n[*] Chargement des modules...")
    
    try:
        from app import app, socketio
        print("[OK] Modules charges")
        
        print("\n[*] Demarrage du serveur sur http://127.0.0.1:5000")
        print("[*] Email provisioning active:")
        print("   - POST /api/email/check-availability")
        print("   - POST /api/email/create")
        print("   - GET  /api/email/my-accounts")
        print("\n" + "="*70)
        print("[!] Appuyez sur CTRL+C pour arreter le serveur")
        print("="*70 + "\n")
        
        # Démarrage
        socketio.run(
            app, 
            debug=False, 
            host='0.0.0.0', 
            port=5000, 
            allow_unsafe_werkzeug=True,
            use_reloader=False
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
