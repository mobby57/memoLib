@echo off
echo 🚀 Test Final MemoLib - Fonctionnalités Avancées
echo ================================================

set API_URL=http://localhost:5078

echo.
echo 1. Test Health Check...
curl -s %API_URL%/health
echo.

echo.
echo 2. Test Login...
for /f "tokens=*" %%i in ('curl -s -X POST -H "Content-Type: application/json" -d "{\"email\":\"sarraboudjellal57@gmail.com\",\"password\":\"SecurePass123!\"}" %API_URL%/api/auth/login') do set LOGIN_RESPONSE=%%i
echo %LOGIN_RESPONSE%

echo.
echo 3. Test Dashboard (nécessite connexion via interface web)
echo   URL: %API_URL%/demo.html
echo   Email: sarraboudjellal57@gmail.com
echo   Password: SecurePass123!

echo.
echo 4. Fonctionnalités à tester dans l'interface:
echo   ✅ Dashboard Avancé (bouton 📊)
echo   ✅ Templates IA (bouton 📝 sur emails)
echo   ✅ Questionnaires (bouton 📋 sur emails)
echo   ✅ Notifications temps réel
echo   ✅ SignalR Hub connecté

echo.
echo 5. Test Ingestion Email...
curl -s -X POST -H "Content-Type: application/json" -d "{\"from\":\"test@example.com\",\"subject\":\"Test Final\",\"body\":\"Test des fonctionnalités avancées\",\"externalId\":\"FINAL-TEST-001\",\"occurredAt\":\"2026-02-22T22:30:00Z\"}" %API_URL%/api/ingest/email
echo.

echo.
echo ✅ API opérationnelle sur %API_URL%
echo 🌐 Interface web: %API_URL%/demo.html
echo 📋 Tests API: test-advanced.http
echo 📖 Documentation: ADVANCED_FEATURES.md

pause