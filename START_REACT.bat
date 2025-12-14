@echo off
echo ========================================
echo   IAPosteManager React + Backend
echo   Version complete avec interface React
echo ========================================
echo.

echo 🔍 Verification Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js non trouve. Installez Node.js depuis https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js detecte

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
echo 📦 Installation dependances Python...
pip install Flask==3.0.0 Flask-CORS==4.0.0 cryptography==41.0.7 python-dotenv==1.0.0

echo.
echo 📦 Installation dependances React...
cd frontend-react
if not exist "node_modules" (
    call npm install
)

echo.
echo 🚀 Demarrage Backend Python (port 5000)...
start "Backend" cmd /k "cd .. && python app_minimal_fixed.py"

echo.
echo ⏳ Attente demarrage backend...
timeout /t 3 /nobreak >nul

echo.
echo 🚀 Demarrage Frontend React (port 3001)...
echo.
echo 📍 URL React: http://localhost:3001
echo 📍 URL Backend: http://localhost:5000
echo.
echo Appuyez sur Ctrl+C pour arreter
echo.

npm run dev

pause