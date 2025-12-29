@echo off
echo ========================================
echo  IA POSTE MANAGER - FRONTEND TEST
echo ========================================
echo.

echo [1/3] Starting Backend...
start "Backend" cmd /k "python simple_backend.py"
timeout /t 5 /nobreak >nul

echo [2/3] Testing Backend Health...
python -c "
import requests
try:
    r = requests.get('http://localhost:5000/health', timeout=3)
    print('Backend OK:', r.json())
except:
    print('Backend not ready, wait a moment...')
"

echo [3/3] Starting Frontend...
cd src\frontend
start "Frontend" cmd /k "npm run dev"

echo.
echo ========================================
echo  SYSTEM READY FOR TESTING
echo ========================================
echo.
echo Backend:  http://localhost:5000/health
echo Frontend: http://localhost:5173
echo Workspace: http://localhost:5173/workspaces
echo.
echo Test the complete workflow:
echo 1. Create workspace
echo 2. Generate response  
echo 3. Create form
echo 4. Check status updates
echo.
pause