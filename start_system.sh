#!/bin/bash
# IA Poste Manager - Complete System Start Script for Linux/Mac
# Equivalent to start_system.bat

echo "Starting IA Poste Manager Complete System..."

# Initialize PID variables to avoid undefined variable errors in trap handler
BACKEND_PID=""
FRONTEND_PID=""

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

echo "[1/3] Starting Backend Server..."
# Start backend in background
if [ -f "backend/app.py" ]; then
    (cd backend && python3 app.py) &
    BACKEND_PID=$!
    echo "Backend started with PID: $BACKEND_PID"
else
    echo "Warning: backend/app.py not found"
fi

# Wait a bit for backend to start
sleep 3

echo "[2/3] Starting Frontend Development Server..."
# Start frontend in background
if [ -d "src/frontend" ]; then
    (cd src/frontend && npm run dev) &
    FRONTEND_PID=$!
    echo "Frontend started with PID: $FRONTEND_PID"
else
    echo "Warning: src/frontend directory not found"
fi

# Wait a bit for frontend to start
sleep 2

echo "[3/3] Opening Browser..."
sleep 5

# Open browser based on OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open http://localhost:5173
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    if command -v xdg-open > /dev/null; then
        xdg-open http://localhost:5173
    elif command -v gnome-open > /dev/null; then
        gnome-open http://localhost:5173
    fi
fi

echo ""
echo "System started successfully!"
echo "Backend: http://localhost:5000"
echo "Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop all services..."

# Trap Ctrl+C to clean up background processes
cleanup() {
    echo "Stopping services..."
    [ -n "$BACKEND_PID" ] && kill "$BACKEND_PID" 2>/dev/null
    [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null
    exit 0
}
trap cleanup INT TERM

# Wait for background processes
wait
