@echo off
echo ========================================
echo  IA Poste Manager - Complete System Test
echo ========================================
echo.

echo [1/4] Starting Backend Server...
cd /d "%~dp0"
start "Backend" cmd /k "python backend/app.py"
timeout /t 3 /nobreak >nul

echo [2/4] Testing API Endpoints...
python test_api.py
if %errorlevel% neq 0 (
    echo ❌ API test failed
    pause
    exit /b 1
)

echo [3/4] Starting Frontend...
cd src\frontend
start "Frontend" cmd /k "npm run dev"
timeout /t 3 /nobreak >nul

echo [4/4] System Ready!
echo.
echo ✅ Backend: http://localhost:5000
echo ✅ Frontend: http://localhost:5173
echo ✅ Workspace API: http://localhost:5000/api/workspace/*
echo.
echo Press any key to open browser...
pause >nul
start http://localhost:5173

echo.
echo System is running! Press any key to exit...
pause >nul