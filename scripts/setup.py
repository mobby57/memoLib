"""Script d'installation et configuration initiale"""
import subprocess
import sys
import os

def install_dependencies():
    """Installe les dépendances"""
    print("📦 Installation des dépendances...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt", "-q"])
    print("✅ Dépendances installées")

def create_directories():
    """Crée les répertoires nécessaires"""
    print("📁 Création des répertoires...")
    dirs = [
        "data/databases",
        "data/encrypted",
        "data/uploads",
        "logs"
    ]
    for d in dirs:
        os.makedirs(d, exist_ok=True)
    print("✅ Répertoires créés")

def create_env_file():
    """Crée le fichier .env si inexistant"""
    if not os.path.exists(".env"):
        print("⚙️ Création du fichier .env...")
        with open(".env", "w") as f:
            f.write("FLASK_ENV=development\n")
            f.write("SECRET_KEY=change-me-in-production\n")
            f.write("STRIPE_API_KEY=\n")
            f.write("OPENAI_API_KEY=\n")
        print("✅ Fichier .env créé")
    else:
        print("ℹ️ Fichier .env existe déjà")

def main():
    """Installation complète"""
    print("\n" + "="*50)
    print("  INSTALLATION SECUREVAULT v2.0")
    print("="*50 + "\n")
    
    install_dependencies()
    create_directories()
    create_env_file()
    
    print("\n" + "="*50)
    print("  ✅ INSTALLATION TERMINÉE")
    print("="*50)
    print("\nPour démarrer:")
    print("  python src/web/app.py")
    print("  ou")
    print("  LANCER_V2.bat\n")

if __name__ == "__main__":
    main()
