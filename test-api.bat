@echo off
chcp 65001 >nul
title Test API MemoLib

echo.
echo 🔍 TEST DE L'API MEMOLIB
echo =========================
echo.

echo 1. Test de santé de l'API...
curl -s -o nul -w "Status: %%{http_code}" http://localhost:5078/health
echo.

echo.
echo 2. Test de l'endpoint API principal...
curl -s -o nul -w "Status: %%{http_code}" http://localhost:5078/api
echo.

echo.
echo 3. Test de l'endpoint d'inscription...
curl -s -o nul -w "Status: %%{http_code}" -X POST -H "Content-Type: application/json" -d "{\"email\":\"test@test.com\",\"password\":\"Test123!\",\"name\":\"Test User\"}" http://localhost:5078/api/auth/register
echo.

echo.
echo 4. Vérification des processus .NET...
tasklist /FI "IMAGENAME eq dotnet.exe" /FO TABLE

echo.
echo 5. Test de connectivité réseau...
netstat -an | findstr :5078

echo.
echo Appuyez sur une touche pour fermer...
pause >nul