#!/bin/bash
# Création du package final pour PythonAnywhere

echo "Création du package de déploiement final..."

# Créer l'archive avec tous les fichiers nécessaires
tar -czf iapostemanage_final.tar.gz \
  src/backend/main_fastapi.py \
  wsgi_pythonanywhere.py \
  .env.secure \
  requirements.txt \
  data/.gitkeep

echo "Package créé: iapostemanage_final.tar.gz"
echo ""
echo "INSTRUCTIONS FINALES:"
echo "===================="
echo "1. Uploadez iapostemanage_final.tar.gz sur PythonAnywhere"
echo "2. Extraire: tar -xzf iapostemanage_final.tar.gz"
echo "3. pip3 install --user fastapi uvicorn asgiref python-dotenv openai"
echo "4. Configurez le WSGI file avec wsgi_pythonanywhere.py"
echo "5. Remplacez VOTRE_USERNAME par votre nom d'utilisateur"
echo "6. Copiez .env.secure vers .env et ajoutez vos clés"
echo "7. Reload l'application web"
echo ""
echo "URL finale: https://yourusername.pythonanywhere.com"