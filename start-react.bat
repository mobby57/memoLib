@echo off
echo 🚀 LANCEMENT REACT APP - PORT 3001
echo.

echo ✅ Vérification Backend...
curl -s http://localhost:8000/health > nul
if %errorlevel% neq 0 (
    echo ❌ Backend non démarré - Lancement...
    start /B docker-compose -f docker-compose.minimal.yml up -d
    timeout 10
)

echo ✅ Installation dépendances React...
cd react-app
call npm install

echo ✅ Démarrage React App...
call npm run dev

pause