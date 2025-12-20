@echo off
echo ========================================
echo IAPosteManager v2.2 - Status Check
echo ========================================

echo Checking project structure...

REM Check critical files
if exist "src\backend\app.py" (
    echo ✅ Backend app found
) else (
    echo ❌ Backend app missing
)

if exist "frontend-react\package.json" (
    echo ✅ Frontend package.json found
) else (
    echo ❌ Frontend package.json missing
)

if exist "requirements.txt" (
    echo ✅ Requirements.txt found
) else (
    echo ❌ Requirements.txt missing
)

if exist "Dockerfile" (
    echo ✅ Dockerfile found
) else (
    echo ❌ Dockerfile missing
)

if exist "docker-compose.yml" (
    echo ✅ Docker Compose found
) else (
    echo ❌ Docker Compose missing
)

if exist ".env" (
    echo ✅ Environment file found
) else (
    echo ⚠️  Environment file missing (will use defaults)
)

echo.
echo Checking Python installation...
python --version 2>nul
if errorlevel 1 (
    echo ❌ Python not found
) else (
    echo ✅ Python found
)

echo.
echo Checking Node.js installation...
node --version 2>nul
if errorlevel 1 (
    echo ❌ Node.js not found
) else (
    echo ✅ Node.js found
)

echo.
echo ========================================
echo Status check complete!
echo ========================================
echo.
echo To start the application:
echo 1. Run QUICK_START.bat for local development
echo 2. Or use docker-compose up -d for production
echo.
pause