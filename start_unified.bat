@echo off
echo 🚀 Démarrage Architecture React + Backend Unifié
echo ================================================

echo 📦 1. Installation des dépendances...
cd frontend-unified
call npm install
cd ..

echo 🐳 2. Démarrage des services Docker...
docker-compose -f docker-compose.unified.yml up --build -d

echo ⏳ 3. Attente des services...
timeout /t 10

echo 🌐 4. Services disponibles:
echo    - Frontend React: http://localhost:3000
echo    - Backend API:    http://localhost:8000
echo    - Database:       localhost:5432
echo.

echo 📊 5. Test de santé des services...
curl -s http://localhost:8000/api/health

echo.
echo ✅ Architecture unifiée démarrée !
echo.
echo 🎯 Fonctionnalités intégrées:
echo    - Interface React moderne
echo    - Backend FastAPI unifié
echo    - Services email, IA, vocal
echo    - Interface accessible
echo    - Base de données PostgreSQL
echo.

pause