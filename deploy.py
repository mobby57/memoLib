#!/usr/bin/env python3
import os
import subprocess
import sys

def deploy_application():
    print("🚀 Déploiement IAPosteManager v2.2")
    print("=" * 40)
    
    steps = [
        ("Vérification Python", check_python),
        ("Installation dépendances", install_dependencies),
        ("Configuration base", setup_config),
        ("Initialisation DB", init_database),
        ("Tests production", run_tests),
        ("Démarrage application", start_application)
    ]
    
    for step_name, step_func in steps:
        print(f"\n📋 {step_name}...")
        try:
            if not step_func():
                print(f"❌ Échec: {step_name}")
                return False
            print(f"✅ Succès: {step_name}")
        except Exception as e:
            print(f"❌ Erreur {step_name}: {e}")
            return False
    
    print("\n🎉 Déploiement terminé avec succès!")
    print("🌐 Application disponible sur: http://localhost:5000")
    return True

def check_python():
    return sys.version_info >= (3, 8)

def install_dependencies():
    result = subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], 
                          capture_output=True)
    return result.returncode == 0

def setup_config():
    if not os.path.exists('.env'):
        if os.path.exists('.env.production'):
            import shutil
            shutil.copy('.env.production', '.env')
            print("📝 Fichier .env créé depuis .env.production")
        else:
            with open('.env', 'w') as f:
                f.write("SECRET_KEY=change-me-in-production\n")
                f.write("FLASK_ENV=production\n")
            print("📝 Fichier .env créé avec valeurs par défaut")
    return True

def init_database():
    # La DB sera initialisée automatiquement au premier démarrage
    os.makedirs('data', exist_ok=True)
    return True

def run_tests():
    if os.path.exists('test_production.py'):
        result = subprocess.run([sys.executable, "test_production.py"], capture_output=True)
        return result.returncode == 0
    return True

def start_application():
    print("🔄 Démarrage de l'application...")
    print("   Utilisez Ctrl+C pour arrêter")
    
    try:
        subprocess.run([sys.executable, "src/web/app.py"])
    except KeyboardInterrupt:
        print("\n🛑 Application arrêtée")
    
    return True

if __name__ == "__main__":
    success = deploy_application()
    sys.exit(0 if success else 1)