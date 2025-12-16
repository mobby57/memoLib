#!/usr/bin/env python3
"""
Script de déploiement production pour iaPosteManager
Automatise le build, les tests et le déploiement Docker
"""

import subprocess
import sys
import os
from datetime import datetime
from pathlib import Path

class Color:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_step(message):
    print(f"\n{Color.OKBLUE}{Color.BOLD}>>> {message}{Color.ENDC}")

def print_success(message):
    print(f"{Color.OKGREEN}✓ {message}{Color.ENDC}")

def print_error(message):
    print(f"{Color.FAIL}✗ {message}{Color.ENDC}")

def print_warning(message):
    print(f"{Color.WARNING}⚠ {message}{Color.ENDC}")

def run_command(cmd, check=True, cwd=None):
    """Execute une commande shell"""
    try:
        result = subprocess.run(
            cmd,
            shell=True,
            check=check,
            cwd=cwd,
            capture_output=True,
            text=True
        )
        return result.returncode == 0, result.stdout, result.stderr
    except subprocess.CalledProcessError as e:
        return False, e.stdout, e.stderr

def check_prerequisites():
    """Vérifie les prérequis"""
    print_step("Vérification des prérequis...")
    
    prerequisites = [
        ("docker", "Docker"),
        ("docker-compose", "Docker Compose"),
        ("node", "Node.js"),
        ("npm", "npm"),
    ]
    
    all_ok = True
    for cmd, name in prerequisites:
        success, stdout, _ = run_command(f"{cmd} --version", check=False)
        if success:
            version = stdout.strip().split('\n')[0]
            print_success(f"{name}: {version}")
        else:
            print_error(f"{name} n'est pas installé")
            all_ok = False
    
    return all_ok

def check_env_file():
    """Vérifie le fichier .env.production"""
    print_step("Vérification de .env.production...")
    
    if not os.path.exists('.env.production'):
        print_error(".env.production n'existe pas!")
        return False
    
    # Lire le fichier
    with open('.env.production', 'r') as f:
        content = f.read()
    
    # Vérifier les valeurs par défaut dangereuses
    dangerous = [
        'CHANGE-THIS',
        'your-super-secret',
        'your-email@gmail.com',
        'your-openai-api-key-here',
    ]
    
    found_dangerous = []
    for danger in dangerous:
        if danger in content:
            found_dangerous.append(danger)
    
    if found_dangerous:
        print_warning("Valeurs par défaut détectées dans .env.production:")
        for danger in found_dangerous:
            print(f"  - {danger}")
        
        response = input(f"\n{Color.WARNING}Continuer quand même? (y/N): {Color.ENDC}")
        if response.lower() != 'y':
            return False
    
    print_success(".env.production configuré")
    return True

def run_tests():
    """Execute les tests E2E"""
    print_step("Exécution des tests E2E...")
    
    # Vérifier si le backend tourne
    print("Démarrage du backend pour les tests...")
    backend_process = subprocess.Popen(
        ["python", "src/backend/app.py"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )
    
    import time
    time.sleep(3)  # Attendre le démarrage
    
    # Lancer les tests
    success, stdout, stderr = run_command(
        "npx playwright test tests/e2e/user-journeys.spec.js --reporter=line",
        cwd="src/frontend"
    )
    
    # Arrêter le backend
    backend_process.terminate()
    backend_process.wait()
    
    if success:
        print_success("Tous les tests passent!")
        return True
    else:
        print_error("Des tests ont échoué")
        print(stderr)
        response = input(f"\n{Color.WARNING}Continuer le déploiement malgré les tests échoués? (y/N): {Color.ENDC}")
        return response.lower() == 'y'

def build_frontend():
    """Build le frontend React"""
    print_step("Build du frontend React...")
    
    success, stdout, stderr = run_command(
        "npm run build",
        cwd="src/frontend"
    )
    
    if success:
        print_success("Frontend buildé avec succès")
        # Afficher la taille du build
        dist_path = Path("src/frontend/dist")
        if dist_path.exists():
            size = sum(f.stat().st_size for f in dist_path.rglob('*') if f.is_file())
            size_mb = size / (1024 * 1024)
            print(f"  Taille du build: {size_mb:.2f} MB")
        return True
    else:
        print_error("Échec du build frontend")
        print(stderr)
        return False

def build_docker():
    """Build l'image Docker"""
    print_step("Build de l'image Docker...")
    
    # Tag avec timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    tag = f"iapostemanager:prod-{timestamp}"
    
    success, stdout, stderr = run_command(
        f"docker build -t {tag} -t iapostemanager:latest ."
    )
    
    if success:
        print_success(f"Image Docker créée: {tag}")
        return True
    else:
        print_error("Échec du build Docker")
        print(stderr)
        return False

def stop_existing_containers():
    """Arrête les containers existants"""
    print_step("Arrêt des containers existants...")
    
    run_command("docker-compose -f docker-compose.prod.yml down", check=False)
    print_success("Containers arrêtés")

def deploy_production():
    """Déploie en production avec Docker Compose"""
    print_step("Déploiement en production...")
    
    success, stdout, stderr = run_command(
        "docker-compose -f docker-compose.prod.yml up -d"
    )
    
    if success:
        print_success("Application déployée!")
        print("\n" + "="*50)
        print(f"{Color.OKGREEN}✓ Déploiement réussi!{Color.ENDC}")
        print("="*50)
        print(f"\n{Color.OKCYAN}Application accessible sur:{Color.ENDC}")
        print("  - Backend: http://localhost:5000")
        print("  - Frontend: http://localhost:5000")
        print(f"\n{Color.OKCYAN}Commandes utiles:{Color.ENDC}")
        print("  - Logs: docker-compose -f docker-compose.prod.yml logs -f")
        print("  - Status: docker-compose -f docker-compose.prod.yml ps")
        print("  - Arrêt: docker-compose -f docker-compose.prod.yml down")
        return True
    else:
        print_error("Échec du déploiement")
        print(stderr)
        return False

def main():
    print(f"\n{Color.HEADER}{Color.BOLD}")
    print("="*60)
    print("  DÉPLOIEMENT PRODUCTION - iaPosteManager")
    print("="*60)
    print(f"{Color.ENDC}\n")
    
    # 1. Vérifier les prérequis
    if not check_prerequisites():
        print_error("Prérequis manquants. Installez les outils nécessaires.")
        sys.exit(1)
    
    # 2. Vérifier .env.production
    if not check_env_file():
        print_error("Configuration .env.production invalide")
        sys.exit(1)
    
    # 3. Demander confirmation
    print(f"\n{Color.WARNING}Cette opération va:{Color.ENDC}")
    print("  1. Exécuter les tests E2E")
    print("  2. Builder le frontend React")
    print("  3. Créer une image Docker")
    print("  4. Arrêter les containers existants")
    print("  5. Déployer la nouvelle version")
    
    response = input(f"\n{Color.BOLD}Continuer? (y/N): {Color.ENDC}")
    if response.lower() != 'y':
        print("Déploiement annulé")
        sys.exit(0)
    
    # 4. Tests
    if not run_tests():
        sys.exit(1)
    
    # 5. Build frontend
    if not build_frontend():
        sys.exit(1)
    
    # 6. Build Docker
    if not build_docker():
        sys.exit(1)
    
    # 7. Arrêter les anciens containers
    stop_existing_containers()
    
    # 8. Déployer
    if not deploy_production():
        sys.exit(1)
    
    print(f"\n{Color.OKGREEN}{Color.BOLD}🚀 Déploiement terminé avec succès!{Color.ENDC}\n")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n\n{Color.WARNING}Déploiement interrompu par l'utilisateur{Color.ENDC}")
        sys.exit(1)
    except Exception as e:
        print_error(f"Erreur inattendue: {str(e)}")
        sys.exit(1)
