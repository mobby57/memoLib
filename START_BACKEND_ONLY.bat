@echo off
echo ========================================
echo   Backend API seulement (pour React)
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
echo 📦 Installation dependances...
pip install Flask==3.0.0 Flask-CORS==4.0.0 cryptography==41.0.7 python-dotenv==1.0.0

echo.
echo 🚀 Demarrage Backend API...
echo.
echo 📍 Backend API: http://127.0.0.1:5000
echo 🔗 Pour React sur: http://localhost:3001
echo.

python app_minimal_fixed.py

pause