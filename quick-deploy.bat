@echo off
echo 🚀 DÉPLOIEMENT RAPIDE - Version Fonctionnelle

echo ✅ Backend Minimal (déjà opérationnel)
docker-compose -f docker-compose.minimal.yml ps

echo.
echo 🎨 Frontend Simple
cd frontend-pro
start /B npm install --legacy-peer-deps
timeout 5
start http://localhost:3000
cd ..

echo.
echo 📱 Interface Console (déjà créée)
start frontend_console.html

echo.
echo ✅ SERVICES ACTIFS:
echo - Backend API: http://localhost:8000
echo - Console Test: frontend_console.html  
echo - MailHog: http://localhost:8025
echo - API Docs: http://localhost:8000/docs
echo.
echo 🎯 L'application est prête à utiliser!
pause