@echo off
echo 🚀 LANCEMENT DASHBOARD COMPLET
echo.

echo ✅ Vérification Backend...
curl -s http://localhost:8000/health > nul
if %errorlevel% neq 0 (
    echo ❌ Backend non démarré - Lancement...
    start /B docker-compose -f docker-compose.minimal.yml up -d
    timeout 10
)

echo ✅ Ouverture Dashboard Production...
start dashboard-production.html

echo.
echo 🎯 DASHBOARD INTÉGRÉ LANCÉ!
echo.
echo 📍 FONCTIONNALITÉS DISPONIBLES:
echo - 📊 Dashboard avec stats temps réel
echo - ✍️ Compositeur email avec IA
echo - 👥 Gestion utilisateurs
echo - 🤖 Test IA avancé
echo - 🎤 Assistant vocal (reconnaissance)
echo - 📈 Analytics et monitoring
echo - ⚙️ Paramètres et liens services
echo.
echo 🔗 SERVICES INTÉGRÉS:
echo - Backend API: http://localhost:8000
echo - MailHog: http://localhost:8025
echo - MinIO: http://localhost:9001
echo - API Docs: http://localhost:8000/docs
echo.
echo 🎮 PILOTAGE:
echo - Navigation par onglets
echo - Actions rapides dashboard
echo - Notifications temps réel
echo - Auto-refresh stats
echo.
pause