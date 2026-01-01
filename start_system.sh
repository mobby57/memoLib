#!/bin/bash

echo "Starting IA Poste Manager Complete System..."

echo "[1/3] Starting Backend Server..."
cd backend && python app.py &
BACKEND_PID=$!

sleep 3

echo "[2/3] Starting Frontend Development Server..."
cd src/frontend && npm run dev &
FRONTEND_PID=$!

sleep 2

echo "[3/3] Opening Browser..."
sleep 5

# Try different commands to open browser depending on OS
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:5173
elif command -v open &> /dev/null; then
    open http://localhost:5173
else
    echo "Please open http://localhost:5173 in your browser"
fi

echo "System started successfully!"
echo "Backend: http://localhost:5000"
echo "Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for user interrupt
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
wait
