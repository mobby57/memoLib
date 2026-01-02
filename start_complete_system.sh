#!/bin/bash

echo "========================================"
echo " IA Poste Manager - Complete System Test"
echo "========================================"
echo ""

cd "$(dirname "$0")"

echo "[1/4] Starting Backend Server..."
if [ -d "backend" ] && [ -f "backend/app.py" ]; then
    (cd backend && python app.py) &
    BACKEND_PID=$!
elif [ -f "app.py" ]; then
    python app.py &
    BACKEND_PID=$!
else
    echo "❌ Backend not found"
    exit 1
fi
sleep 3

echo "[2/4] Testing API Endpoints..."
if [ -f "test_api.py" ]; then
    python test_api.py
    if [ $? -ne 0 ]; then
        echo "❌ API test failed"
        kill $BACKEND_PID 2>/dev/null
        exit 1
    fi
else
    echo "⚠️  test_api.py not found, skipping API tests"
fi

echo "[3/4] Starting Frontend..."
if [ -d "src/frontend" ]; then
    (cd src/frontend && npm run dev) &
    FRONTEND_PID=$!
else
    echo "⚠️  Frontend not found, skipping"
fi
sleep 3

echo "[4/4] System Ready!"
echo ""
echo "✅ Backend: http://localhost:5000"
echo "✅ Frontend: http://localhost:5173"
echo "✅ Workspace API: http://localhost:5000/api/workspace/*"
echo ""
echo "Press Enter to open browser..."
read

# Try different commands to open browser depending on OS
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:5173
elif command -v open &> /dev/null; then
    open http://localhost:5173
else
    echo "Please open http://localhost:5173 in your browser"
fi

echo ""
echo "System is running! Press Ctrl+C to exit..."

# Wait for user interrupt
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
wait
