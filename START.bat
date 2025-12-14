@echo off
chcp 65001 >nul
cls
echo ========================================
echo   SecureVault - Email Automation
echo ========================================
echo.
echo Demarrage de l'application...
echo.
python src\web\app.py
pause
