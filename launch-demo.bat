@echo off
echo Lancement de la demo MemoLib...
echo.

start http://localhost:5078/dashboard-pro.html
timeout /t 2 /nobreak >nul

start http://localhost:5078/timeline-demo.html
timeout /t 2 /nobreak >nul

start http://localhost:5078/demo-modern.html
timeout /t 2 /nobreak >nul

start http://localhost:5078/demo.html

echo.
echo Toutes les pages sont ouvertes !
echo.
pause
