#!/bin/bash
# Script de réparation des dépendances

echo "Réparation des dépendances..."

# 1. Désinstaller les packages conflictuels
pip3 uninstall -y pydantic pydantic-core fastapi

# 2. Installer les versions compatibles
pip3 install --user pydantic==2.5.3 pydantic-core==2.14.6
pip3 install --user fastapi==0.109.0
pip3 install --user asgiref

# 3. Test rapide
python3 -c "import pydantic; print('Pydantic OK')"
python3 -c "import fastapi; print('FastAPI OK')"
python3 -c "import asgiref; print('ASGI OK')"

echo "Réparation terminée!"