@echo off
echo Redemarrage du backend...
taskkill /F /IM python.exe 2>nul
timeout /t 2 /nobreak >nul
cd src\backend
start /B python app.py
echo Backend redémarre sur http://localhost:5000
timeout /t 3 /nobreak >nul