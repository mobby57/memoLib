@echo off
echo ========================================
echo   IAPosteManager Minimal Fixed
echo   Version sans dependances complexes
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
echo 📦 Installation dependances minimales...
pip install Flask==3.0.0 Flask-CORS==4.0.0 cryptography==41.0.7 python-dotenv==1.0.0

echo.
echo 🚀 Demarrage version MINIMALE...
echo.
echo 📍 URL: http://127.0.0.1:3001
echo ⚡ Sans dependances complexes
echo ✨ Fonctionnalites essentielles
echo.

python app_minimal_fixed.py

pause