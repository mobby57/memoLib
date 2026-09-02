#!/bin/bash

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  🚀 GÉNÉRATEUR AUTO - CI/CD DOCKER COMPOSE ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"

# 1. Création des dossiers
mkdir -p .github/workflows scripts

# -------------------------------------------------------------------
# 2. Pipeline GitHub Actions (Version Docker Compose)
# -------------------------------------------------------------------
cat > .github/workflows/deploy-staging.yml << 'EOF'
name: Deploy to Staging (Docker Compose)

on:
  push:
    branches: [ "staging" ]
  workflow_dispatch:

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Login to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:staging-latest

      - name: Deploy with Docker Compose
        run: |
          # Tire la nouvelle image et redémarre les conteneurs
          docker compose -f docker-compose.staging.yml pull
          docker compose -f docker-compose.staging.yml up -d --remove-orphans

      - name: Wait for container to be ready
        run: |
          sleep 5
          docker ps -a

      - name: Run Smoke Tests
        id: smoke
        run: |
          pip install -r requirements.txt || true
          python scripts/smoke_test.py
        env:
          STAGING_URL: "http://localhost:8080"
        continue-on-error: false

      - name: Rollback si échec des tests
        if: failure() && steps.smoke.outcome == 'failure'
        run: |
          echo "❌ Smoke tests échoués, arrêt des conteneurs !"
          docker compose -f docker-compose.staging.yml down
EOF

# -------------------------------------------------------------------
# 3. Fichier docker-compose.staging.yml
# -------------------------------------------------------------------
cat > docker-compose.staging.yml << 'EOF'
version: '3.8'

services:
  app:
    # ⚠️ REMPLACEZ CETTE LIGNE par votre image GHCR
    # Exemple: ghcr.io/votre-username/memoLib:staging-latest
    image: ghcr.io/votre-username/memoLib:staging-latest
    ports:
      - "8080:8080"
    environment:
      - ENV=staging
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 5s
      retries: 3
EOF

# -------------------------------------------------------------------
# 4. Script Smoke Test (amélioré)
# -------------------------------------------------------------------
cat > scripts/smoke_test.py << 'EOF'
#!/usr/bin/env python3
import requests
import sys
import os
import time

BASE_URL = os.environ.get("STAGING_URL", "http://localhost:8080")
TIMEOUT = 10

def run_tests():
    print(f"🚀 Smoke tests sur {BASE_URL}")
    failed = False

    # Test Health
    try:
        resp = requests.get(f"{BASE_URL}/health", timeout=TIMEOUT)
        if resp.status_code == 200:
            print("✅ Health check OK")
        else:
            print(f"❌ Health check échoué (status {resp.status_code})")
            failed = True
    except Exception as e:
        print(f"❌ Health check injoignable : {e}")
        failed = True

    # Test Root
    try:
        resp = requests.get(BASE_URL, timeout=TIMEOUT)
        if resp.status_code == 200:
            print("✅ Endpoint root OK")
        else:
            print(f"❌ Root échoué (status {resp.status_code})")
            failed = True
    except Exception as e:
        print(f"❌ Root injoignable : {e}")
        failed = True

    if failed:
        print("💥 Smoke tests échoués !")
        sys.exit(1)
    else:
        print("✅ Tous les tests sont OK !")
        sys.exit(0)

if __name__ == "__main__":
    time.sleep(5)
    run_tests()
EOF

# -------------------------------------------------------------------
# 5. Dockerfile (assure un serveur Flask minimal)
# -------------------------------------------------------------------
cat > Dockerfile << 'EOF'
FROM python:3.11-slim

WORKDIR /app

# Copie des dépendances
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copie du code (pour les vrais projets)
COPY . .

# Si vous n'avez pas encore de code, ceci lance un mini serveur Flask par défaut
# Sinon, remplacez par votre propre commande (ex: python main.py)
RUN echo 'from flask import Flask; app = Flask(__name__); @app.route("/health"); def health(): return "OK", 200; @app.route("/"); def root(): return "Hello Staging", 200; if __name__ == "__main__": app.run(host="0.0.0.0", port=8080)' > app.py

EXPOSE 8080
CMD ["python", "app.py"]
EOF

# -------------------------------------------------------------------
# 6. requirements.txt
# -------------------------------------------------------------------
cat > requirements.txt << 'EOF'
requests>=2.28.0
Flask>=2.2.0
EOF

# -------------------------------------------------------------------
# 7. Script de déploiement local (pour tester en local)
# -------------------------------------------------------------------
cat > scripts/local-deploy.sh << 'EOF'
#!/bin/bash
echo "🐳 Déploiement local en staging..."
docker compose -f docker-compose.staging.yml up -d --build
sleep 3
echo "🔍 Smoke tests locaux..."
python scripts/smoke_test.py
if [ $? -eq 0 ]; then
  echo "✅ Tout est ok !"
else
  echo "❌ Échec, arrêt des conteneurs..."
  docker compose -f docker-compose.staging.yml down
fi
EOF

# -------------------------------------------------------------------
# 8. Rendre les scripts exécutables
# -------------------------------------------------------------------
chmod +x scripts/smoke_test.py
chmod +x scripts/local-deploy.sh

echo -e "${GREEN}✅ Tous les fichiers ont été générés avec succès !${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"

# Détection automatique du nom d'utilisateur GitHub pour remplacer le placeholder
GITHUB_USER=$(git config user.name 2>/dev/null || echo "votre-username")
REPO_NAME=$(basename "$(pwd)" 2>/dev/null || echo "memoLib")

echo -e "${YELLOW}⚙️  CONFIGURATION AUTO DÉTECTÉE :${NC}"
echo -e "   Utilisateur : ${GREEN}$GITHUB_USER${NC}"
echo -e "   Dépôt       : ${GREEN}$REPO_NAME${NC}"

# Remplacement automatique dans docker-compose.staging.yml
sed -i "s|ghcr.io/votre-username/memoLib|ghcr.io/$GITHUB_USER/$REPO_NAME|g" docker-compose.staging.yml

echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}📌 PROCHEINES ÉTAPES MANUELLES :${NC}"
echo -e "1. ${BLUE}Vérifiez${NC} le fichier docker-compose.staging.yml (le placeholder a été auto-remplacé)."
echo -e "2. ${BLUE}Testez localement${NC} pour valider :"
echo -e "   ${YELLOW}./scripts/local-deploy.sh${NC}"
echo -e "3. ${BLUE}Poussez${NC} sur la branche 'staging' :"
echo -e "   ${YELLOW}git checkout -b staging${NC}"
echo -e "   ${YELLOW}git add . && git commit -m 'feat: CI/CD auto avec Docker Compose'${NC}"
echo -e "   ${YELLOW}git push -u origin staging${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🎯 Votre pipeline s'exécute sur GitHub Actions sans aucun cluster k8s !${NC}"
