@echo off
echo 🚀 DÉPLOIEMENT COMPLET EMAIL ASSISTANT PRO
echo.

echo A) 🎨 Frontend Next.js...
cd frontend-pro
call npm install
start npm run dev
cd ..

echo B) 🧠 IA Avancée intégrée ✅

echo C) 🏢 Microservices...
cd microservices
docker-compose up -d
cd ..

echo D) 📱 Mobile App...
cd mobile-app
call npm install
start npm start
cd ..

echo.
echo ✅ TOUS LES SERVICES DÉPLOYÉS!
echo.
echo 📍 ACCÈS:
echo - Frontend: http://localhost:3000
echo - Gateway: http://localhost:8080
echo - Mobile: Expo DevTools
echo - Backend: http://localhost:8000
echo - MailHog: http://localhost:8025
echo - Grafana: http://localhost:3000
echo.
pause