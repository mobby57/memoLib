#!/bin/bash
# Script de vérification post-déploiement PythonAnywhere

echo "🔍 VÉRIFICATION DÉPLOIEMENT PYTHONANYWHERE"
echo "=========================================="

# Vérifier structure
echo "📁 Structure des fichiers:"
ls -la ~/iapostemanage/

echo ""
echo "📁 Dossier src:"
ls -la ~/iapostemanage/src/

echo ""
echo "🐍 Virtualenv actif:"
which python
python --version

echo ""
echo "📦 Packages installés:"
pip list | grep -E "fastapi|uvicorn|asgiref|sqlalchemy"

echo ""
echo "🔧 Test import application:"
cd ~/iapostemanage
python -c "from src.backend.main_fastapi import app; print('✅ Import OK')"

echo ""
echo "💾 Base de données:"
ls -la ~/iapostemanage/data/

echo ""
echo "🌐 Variables d'environnement:"
python -c "import os; print('SECRET_KEY:', 'OK' if os.getenv('SECRET_KEY') else 'MANQUANT')"

echo ""
echo "📊 Logs récents:"
tail -n 10 /var/log/$USER.pythonanywhere.com.error.log

echo ""
echo "✅ VÉRIFICATION TERMINÉE"