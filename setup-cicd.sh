#!/bin/bash

# Couleurs pour un affichage propre
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  🚀 GÉNÉRATEUR CI/CD STAGING - TOUT EN UN SEUL SCRIPT ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"

# 1. Création des dossiers
mkdir -p .github/workflows
mkdir -p scripts
mkdir -p k8s
mkdir -p monitoring

echo -e "${GREEN}✅ Dossiers créés avec succès.${NC}"

# -------------------------------------------------------------------
# 2. Fichier : .github/workflows/deploy-staging.yml
# -------------------------------------------------------------------
cat > .github/workflows/deploy-staging.yml << 'EOF'
name: Deploy to Staging

on:
  push:
    branches: [ "staging" ]
  workflow_dispatch:

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}
  NAMESPACE: staging

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Log in to GitHub Container Registry
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
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:staging-${{ github.sha }}

      - name: Install kubectl
        uses: azure/setup-kubectl@v4
        with:
          version: 'v1.28.0'

      - name: Set up Kubeconfig
        run: |
          mkdir -p $HOME/.kube
          echo "${{ secrets.KUBECONFIG_STAGING }}" | base64 --decode > $HOME/.kube/config

      - name: Run Deploy Helper
        run: |
          chmod +x scripts/deploy_helper.sh
          ./scripts/deploy_helper.sh ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:staging-${{ github.sha }}

      - name: Run Smoke Tests
        id: smoke
        run: |
          pip install -r requirements.txt || true
          python scripts/smoke_test.py
        env:
          STAGING_URL: "http://app-staging.${{ env.NAMESPACE }}.svc.cluster.local:8080"
        continue-on-error: false

      - name: Rollback en cas d'échec
        if: failure() && steps.smoke.outcome == 'failure'
        run: |
          echo "❌ Smoke tests échoués, rollback immédiat !"
          kubectl rollout undo deployment/app-staging -n ${{ env.NAMESPACE }}
EOF

# -------------------------------------------------------------------
# 3. Fichier : scripts/deploy_helper.sh
# -------------------------------------------------------------------
cat > scripts/deploy_helper.sh << 'EOF'
#!/bin/bash
set -e

NAMESPACE="staging"
DEPLOYMENT_NAME="app-staging"
IMAGE_TAG=$1

if [ -z "$IMAGE_TAG" ]; then
  echo "❌ Erreur : Aucune image tag fournie."
  exit 1
fi

echo "📦 Déploiement de l'image : $IMAGE_TAG"

# Applique les manifests
kubectl apply -f k8s/ -n $NAMESPACE

# Force la mise à jour de l'image
kubectl set image deployment/$DEPLOYMENT_NAME app=$IMAGE_TAG -n $NAMESPACE

# Attend que le déploiement soit stable (timeout 5min)
kubectl rollout status deployment/$DEPLOYMENT_NAME -n $NAMESPACE --timeout=300s

echo "✅ Déploiement terminé avec succès."
EOF

# -------------------------------------------------------------------
# 4. Fichier : scripts/smoke_test.py
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

    # Test Endpoint racine
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
        sys.exit(1)
    else:
        print("✅ Tous les tests sont OK !")
        sys.exit(0)

if __name__ == "__main__":
    time.sleep(5)
    run_tests()
EOF

# -------------------------------------------------------------------
# 5. Fichier : k8s/deployment.yaml
# -------------------------------------------------------------------
cat > k8s/deployment.yaml << 'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-staging
  namespace: staging
  labels:
    app: app-staging
spec:
  replicas: 1
  selector:
    matchLabels:
      app: app-staging
  template:
    metadata:
      labels:
        app: app-staging
    spec:
      containers:
        - name: app
          image: IMAGE_PLACEHOLDER # Sera remplacé par le script
          ports:
            - containerPort: 8080
          env:
            - name: ENV
              value: "staging"
          livenessProbe:
            httpGet:
              path: /health
              port: 8080
            initialDelaySeconds: 10
            periodSeconds: 5
          readinessProbe:
            httpGet:
              path: /health
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 5
EOF

# -------------------------------------------------------------------
# 6. Fichier : k8s/service.yaml
# -------------------------------------------------------------------
cat > k8s/service.yaml << 'EOF'
apiVersion: v1
kind: Service
metadata:
  name: app-staging
  namespace: staging
spec:
  selector:
    app: app-staging
  ports:
    - protocol: TCP
      port: 8080
      targetPort: 8080
  type: ClusterIP
EOF

# -------------------------------------------------------------------
# 7. Fichier : monitoring/prometheus-rules.yml
# -------------------------------------------------------------------
cat > monitoring/prometheus-rules.yml << 'EOF'
groups:
  - name: staging_alerts
    interval: 30s
    rules:
      - alert: StagingDown
        expr: up{job="staging-app"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "🚨 L'application Staging est DOWN"
          description: "Le pod est inaccessible depuis plus d'1 minute."

      - alert: HighErrorRateStaging
        expr: rate(http_requests_total{status=~"5..", env="staging"}[2m]) > 0.10
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "⚠️ Taux d'erreur 5xx élevé sur Staging"
          description: "Plus de 10% d'erreurs en 2 minutes."
EOF

# -------------------------------------------------------------------
# 8. Fichier : Dockerfile (exemple générique avec Python)
# -------------------------------------------------------------------
cat > Dockerfile << 'EOF'
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Simule un endpoint /health
RUN echo 'from flask import Flask; app = Flask(__name__); @app.route("/health"); def health(): return "OK", 200; @app.route("/"); def root(): return "Hello Staging", 200; if __name__ == "__main__": app.run(host="0.0.0.0", port=8080)' > app.py

CMD ["python", "app.py"]
EOF

# -------------------------------------------------------------------
# 9. Fichier : requirements.txt (pour les tests + l'app)
# -------------------------------------------------------------------
cat > requirements.txt << 'EOF'
requests>=2.28.0
Flask>=2.2.0
EOF

# -------------------------------------------------------------------
# 10. Rendre les scripts exécutables
# -------------------------------------------------------------------
chmod +x scripts/deploy_helper.sh
chmod +x scripts/smoke_test.py

echo -e "${GREEN}✅ Tous les fichiers ont été générés avec succès !${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}📌 PROCHEINES ÉTAPES MANUELLES :${NC}"
echo -e "1. ${BLUE}Ajoutez le secret${NC} dans GitHub :"
echo "   - Nom : KUBECONFIG_STAGING"
echo "   - Valeur : Le contenu de votre ~/.kube/config encodé en base64"
echo "     (Commande : cat ~/.kube/config | base64 -w 0)"
echo -e "2. ${BLUE}Vérifiez${NC} le fichier k8s/deployment.yaml pour ajuster le port si nécessaire."
echo -e "3. ${BLUE}Poussez${NC} tout sur la branche 'staging' :"
echo "   git add . && git commit -m 'Ajout CI/CD complet' && git push origin staging"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🎯 Le pipeline s'exécutera automatiquement sur GitHub Actions !${NC}"
