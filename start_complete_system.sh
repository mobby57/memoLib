#!/bin/bash
# IA Poste Manager - Complete System Start Script for Linux/Mac
# This script starts all components: Backend, Frontend, and opens the browser

echo "=============================================="
echo "  IA Poste Manager - Complete System Startup"
echo "=============================================="

# Initialize PID variables to avoid undefined variable errors in trap handler
BACKEND_PID=""
FRONTEND_PID=""

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

# Trap Ctrl+C to clean up background processes
cleanup() {
    echo ""
    echo "Stopping services..."
    if [[ -n "$BACKEND_PID" ]]; then
        kill "$BACKEND_PID" 2>/dev/null
        echo "Backend stopped."
    fi
    if [[ -n "$FRONTEND_PID" ]]; then
        kill "$FRONTEND_PID" 2>/dev/null
        echo "Frontend stopped."
    fi
    echo "All services stopped."
    exit 0
}
trap cleanup INT TERM

echo "[1/3] Starting Backend Server..."
# Start backend in background
if [ -f "backend/app.py" ]; then
    (cd backend && python3 app.py) &
    BACKEND_PID=$!
    echo "✓ Backend started with PID: $BACKEND_PID"
elif [ -f "backend-python/app.py" ]; then
    (cd backend-python && python3 -m flask run --port 5000) &
    BACKEND_PID=$!
    echo "✓ Backend (Flask) started with PID: $BACKEND_PID"
else
    echo "⚠ Warning: No backend found (backend/app.py or backend-python/app.py)"
fi

# Wait a bit for backend to start
sleep 3

echo "[2/3] Starting Frontend Development Server..."
# Start frontend in background
if [ -d "src/frontend" ]; then
    (cd src/frontend && npm run dev) &
    FRONTEND_PID=$!
    echo "✓ Frontend started with PID: $FRONTEND_PID"
else
    echo "⚠ Warning: src/frontend directory not found"
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
    elif [ -n "$BROWSER" ]; then
        "$BROWSER" http://localhost:5173
    fi
fi

echo ""
echo "=============================================="
echo "  System started successfully!"
echo "=============================================="
echo "  Backend:  http://localhost:5000"
echo "  Frontend: http://localhost:5173"
echo "=============================================="
echo ""
echo "Press Ctrl+C to stop all services..."

# Wait for background processes
wait
