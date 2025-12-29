@echo off
echo Starting IA Poste Manager Complete System...

echo [1/3] Starting Backend Server...
start "Backend" cmd /k "cd backend && python app.py"

timeout /t 3

echo [2/3] Starting Frontend Development Server...
start "Frontend" cmd /k "cd src/frontend && npm run dev"

timeout /t 2

echo [3/3] Opening Browser...
timeout /t 5
start http://localhost:5173

echo System started successfully!
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5173
pause