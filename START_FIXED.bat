@echo off
echo ========================================
echo   IAPosteManager Unified v3.0 - FIXED
echo   Version corrigee avec securite
echo ========================================
echo.

echo 🔍 Verification Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python non trouve. Installez Python 3.8+
    pause
    exit /b 1
)

echo ✅ Python detecte

echo.
echo 📦 Installation des dependances...
pip install -r requirements_unified.txt

echo.
echo 🚀 Demarrage de l'application CORRIGEE...
echo.
echo 📍 URL: http://127.0.0.1:5000
echo 🔒 Securite renforcee
echo ✨ Corrections critiques appliquees
echo.

python app_unified_fixed.py

pause