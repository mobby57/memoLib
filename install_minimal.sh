#!/bin/bash
# Installation minimale pour PythonAnywhere

echo "Installation minimale..."

# Installer uniquement les packages essentiels
pip3 install --user fastapi uvicorn asgiref python-dotenv openai

# Créer répertoires
mkdir -p data/logs

# Copier configuration
cp .env.secure .env

# Test
python3 -c "import fastapi; print('FastAPI OK')"
python3 -c "import asgiref; print('ASGI OK')"

echo "Installation terminée!"