@echo off
cls
echo.
echo ========================================
echo   IA Poste Manager v2.3 - Quick Start
echo   MS CONSEILS - Sarra Boudjellal
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python not found. Please install Python 3.8+
    pause
    exit /b 1
)

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo 📦 Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo 🔧 Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo 📚 Installing dependencies...
pip install -r requirements.txt --quiet

REM Create data directory
if not exist "data" mkdir data

REM Check configuration
echo 🔍 Checking configuration...
python verify_system.py

echo.
echo 🚀 Starting IA Poste Manager...
echo 📱 Access the app at: http://localhost:5000
echo 🛑 Press Ctrl+C to stop the server
echo.

REM Start the application
python app.py