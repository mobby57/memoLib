"""
Script d'initialisation de la sécurité pour IA Poste Manager
==============================================================

Ce script configure automatiquement :
- Génération de la clé maître
- Initialisation du gestionnaire de secrets
- Migration des secrets existants
- Vérification de la configuration
"""

import os
import sys
import secrets
from pathlib import Path

# Ajouter le répertoire parent au PYTHONPATH
sys.path.insert(0, str(Path(__file__).parent.parent))


def generate_master_key() -> str:
    """Génère une clé maître sécurisée"""
    return secrets.token_urlsafe(32)


def generate_jwt_secret() -> str:
    """Génère un secret JWT"""
    return secrets.token_urlsafe(64)


def setup_env_file():
    """Configure le fichier .env avec des clés générées"""
    
    env_file = Path(__file__).parent.parent / '.env'
    env_template = Path(__file__).parent.parent / '.env.template'
    
    print("🔐 Configuration de la sécurité...\n")
    
    # Vérifier si .env existe déjà
    if env_file.exists():
        response = input("⚠️  Le fichier .env existe déjà. Voulez-vous le remplacer ? (o/N) : ")
        if response.lower() != 'o':
            print("❌ Opération annulée")
            return False
    
    # Lire le template
    if not env_template.exists():
        print(f"❌ Template non trouvé : {env_template}")
        return False
    
    with open(env_template, 'r', encoding='utf-8') as f:
        template_content = f.read()
    
    # Générer les clés
    print("🔑 Génération des clés de sécurité...")
    master_key = generate_master_key()
    jwt_secret = generate_jwt_secret()
    flask_secret = secrets.token_urlsafe(32)
    webhook_secret = secrets.token_urlsafe(32)
    
    print(f"   ✅ Clé maître générée")
    print(f"   ✅ Secret JWT généré")
    print(f"   ✅ Secret Flask généré")
    print(f"   ✅ Secret webhook généré")
    
    # Remplacer les placeholders
    env_content = template_content.replace(
        'MASTER_ENCRYPTION_KEY=',
        f'MASTER_ENCRYPTION_KEY={master_key}'
    )
    env_content = env_content.replace(
        'JWT_SECRET_KEY=',
        f'JWT_SECRET_KEY={jwt_secret}'
    )
    env_content = env_content.replace(
        'FLASK_SECRET_KEY=',
        f'FLASK_SECRET_KEY={flask_secret}'
    )
    env_content = env_content.replace(
        'WEBHOOK_SECRET=',
        f'WEBHOOK_SECRET={webhook_secret}'
    )
    
    # Écrire le fichier .env
    with open(env_file, 'w', encoding='utf-8') as f:
        f.write(env_content)
    
    print(f"\n✅ Fichier .env créé : {env_file}")
    print("\n⚠️  IMPORTANT :")
    print("   1. Éditez .env et complétez avec vos vraies API keys")
    print("   2. Ne committez JAMAIS .env dans Git")
    print("   3. Sauvegardez la clé maître dans un endroit sûr\n")
    
    return True


def initialize_secrets_manager():
    """Initialise le gestionnaire de secrets"""
    
    from security.secrets_manager import get_secrets_manager
    
    print("🔧 Initialisation du gestionnaire de secrets...")
    
    try:
        secrets_mgr = get_secrets_manager()
        
        # Vérifier que le gestionnaire fonctionne
        test_key = 'TEST_KEY'
        test_value = 'test_value_123'
        
        secrets_mgr.set_secret(test_key, test_value, save=False)
        retrieved = secrets_mgr.get_secret(test_key, use_env=False)
        
        if retrieved == test_value:
            print("   ✅ Gestionnaire de secrets opérationnel")
            
            # Nettoyer
            secrets_mgr.delete_secret(test_key, save=False)
            
            return True
        else:
            print("   ❌ Erreur de cohérence des données")
            return False
            
    except Exception as e:
        print(f"   ❌ Erreur : {e}")
        return False


def migrate_existing_secrets():
    """Migre les secrets existants vers le nouveau système"""
    
    from security.secrets_manager import get_secrets_manager
    
    print("📦 Migration des secrets existants...")
    
    # Chemins des anciens fichiers
    old_credentials = Path(__file__).parent.parent / 'data' / 'credentials.enc'
    
    if not old_credentials.exists():
        print("   ℹ️  Aucun secret existant à migrer")
        return True
    
    try:
        secrets_mgr = get_secrets_manager()
        
        # Le gestionnaire charge automatiquement credentials.enc
        keys = secrets_mgr.get_all_keys()
        
        print(f"   ✅ {len(keys)} secrets chargés")
        
        return True
        
    except Exception as e:
        print(f"   ⚠️  Erreur lors de la migration : {e}")
        print("   ℹ️  Vous devrez peut-être reconfigurer manuellement")
        return False


def verify_configuration():
    """Vérifie que tout est correctement configuré"""
    
    print("\n🔍 Vérification de la configuration...")
    
    checks = []
    
    # 1. Fichier .env existe
    env_file = Path(__file__).parent.parent / '.env'
    checks.append(("Fichier .env", env_file.exists()))
    
    # 2. .gitignore contient .env
    gitignore = Path(__file__).parent.parent / '.gitignore'
    if gitignore.exists():
        with open(gitignore, 'r') as f:
            checks.append((".env dans .gitignore", '.env' in f.read()))
    else:
        checks.append((".gitignore existe", False))
    
    # 3. Clé maître définie
    if env_file.exists():
        from dotenv import load_dotenv
        load_dotenv(env_file)
        checks.append(("MASTER_ENCRYPTION_KEY", bool(os.getenv('MASTER_ENCRYPTION_KEY'))))
        checks.append(("JWT_SECRET_KEY", bool(os.getenv('JWT_SECRET_KEY'))))
    
    # 4. Modules de sécurité importables
    try:
        from security.secrets_manager import get_secrets_manager
        from security.encryption import get_encryption
        from security.middleware import get_security
        checks.append(("Modules de sécurité", True))
    except ImportError as e:
        checks.append(("Modules de sécurité", False))
    
    # Afficher les résultats
    print()
    all_passed = True
    for check_name, passed in checks:
        status = "✅" if passed else "❌"
        print(f"   {status} {check_name}")
        if not passed:
            all_passed = False
    
    print()
    if all_passed:
        print("🎉 Configuration de sécurité complète !")
    else:
        print("⚠️  Certaines vérifications ont échoué")
        print("   Consultez le guide : docs/SECURITY_GUIDE.md")
    
    return all_passed


def main():
    """Point d'entrée principal"""
    
    print("=" * 60)
    print("  IA POSTE MANAGER - INITIALISATION DE LA SÉCURITÉ")
    print("=" * 60)
    print()
    
    # Vérifier les dépendances
    try:
        import cryptography
        import jwt
        import dotenv
    except ImportError as e:
        print(f"❌ Dépendance manquante : {e}")
        print("\nInstallez les dépendances :")
        print("   pip install cryptography pyjwt python-dotenv")
        sys.exit(1)
    
    # Étapes d'initialisation
    steps = [
        ("Configuration .env", setup_env_file),
        ("Initialisation gestionnaire", initialize_secrets_manager),
        ("Migration secrets", migrate_existing_secrets),
        ("Vérification", verify_configuration)
    ]
    
    for step_name, step_func in steps:
        try:
            if not step_func():
                print(f"\n❌ Échec : {step_name}")
                print("   Consultez docs/SECURITY_GUIDE.md pour plus d'aide")
                sys.exit(1)
        except Exception as e:
            print(f"\n❌ Erreur lors de {step_name} : {e}")
            import traceback
            traceback.print_exc()
            sys.exit(1)
    
    print("\n" + "=" * 60)
    print("✨ Initialisation terminée avec succès !")
    print("=" * 60)
    print("\n📖 Prochaines étapes :")
    print("   1. Éditez .env avec vos vraies API keys")
    print("   2. Consultez docs/SECURITY_GUIDE.md")
    print("   3. Testez avec : python scripts/test_security.py")
    print()


if __name__ == '__main__':
    main()
