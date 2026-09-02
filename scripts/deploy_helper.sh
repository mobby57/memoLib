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
