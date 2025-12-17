@echo off
chcp 65001 > nul
cd /d "%~dp0\src\backend"
echo ====================================
echo SERVEUR IAPOSTEMANAGER
echo ====================================
echo.
python app.py
echo.
echo Serveur arrete.
pause
