@echo off
echo 🚀 LANCEMENT FUSION COMPLÈTE - PORT 3001
echo.

echo ✅ Vérification Backend API...
curl -s http://localhost:8000/health > nul
if %errorlevel% neq 0 (
    echo ❌ Backend non démarré - Lancement automatique...
    start /B docker-compose -f docker-compose.minimal.yml up -d
    echo ⏳ Attente démarrage backend...
    timeout 15
)

echo ✅ Lancement serveur fusion sur port 3001...
python server-fusion.py

pause