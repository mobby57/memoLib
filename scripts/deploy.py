#!/usr/bin/env python3
"""Script de déploiement automatisé"""
import subprocess
import sys
import os
import time

class Deployer:
    def __init__(self):
        self.steps = []
        self.failed_step = None
    
    def run_command(self, cmd, description):
        """Exécuter commande avec gestion erreur"""
        print(f"🔄 {description}...")
        try:
            result = subprocess.run(cmd, shell=True, check=True, capture_output=True, text=True)
            print(f"✅ {description} - OK")
            return True
        except subprocess.CalledProcessError as e:
            print(f"❌ {description} - FAILED: {e.stderr}")
            self.failed_step = description
            return False
    
    def deploy_local(self):
        """Déploiement local"""
        steps = [
            ("make test", "Tests unitaires"),
            ("make security", "Scan sécurité"),
            ("docker compose build", "Build image"),
            ("docker compose up -d", "Démarrage services"),
            ("sleep 10", "Attente démarrage"),
            ("curl -f http://localhost:5000/api/health", "Vérification santé")
        ]
        
        for cmd, desc in steps:
            if not self.run_command(cmd, desc):
                return False
        
        print("🎉 Déploiement local réussi!")
        return True
    
    def deploy_production(self):
        """Déploiement production"""
        steps = [
            ("make ci", "Pipeline CI complète"),
            ("docker build -t securevault:prod .", "Build production"),
            ("docker tag securevault:prod registry.com/securevault:latest", "Tag image"),
            ("docker push registry.com/securevault:latest", "Push registry"),
            ("kubectl apply -f k8s/", "Déploiement Kubernetes"),
            ("kubectl rollout status deployment/securevault-app", "Attente rollout")
        ]
        
        for cmd, desc in steps:
            if not self.run_command(cmd, desc):
                return False
        
        print("🚀 Déploiement production réussi!")
        return True
    
    def rollback(self):
        """Rollback en cas d'échec"""
        print("🔄 Rollback en cours...")
        subprocess.run("kubectl rollout undo deployment/securevault-app", shell=True)
        print("↩️ Rollback terminé")

if __name__ == "__main__":
    deployer = Deployer()
    
    env = sys.argv[1] if len(sys.argv) > 1 else "local"
    
    if env == "production":
        success = deployer.deploy_production()
    else:
        success = deployer.deploy_local()
    
    if not success:
        print(f"💥 Échec à l'étape: {deployer.failed_step}")
        if env == "production":
            deployer.rollback()
        sys.exit(1)