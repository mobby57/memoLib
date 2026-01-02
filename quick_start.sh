#!/bin/bash
# IA Poste Manager v2.3 - Quick Start Script for Linux/Mac
# MS CONSEILS - Sarra Boudjellal
# Equivalent to QUICK_START.bat

clear
echo ""
echo "========================================"
echo "  IA Poste Manager v2.3 - Quick Start"
echo "  MS CONSEILS - Sarra Boudjellal"
echo "========================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python not found. Please install Python 3.8+"
    exit 1
fi

# Display Python version
python3 --version

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📚 Installing dependencies..."
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt --quiet
else
    echo "⚠️  requirements.txt not found, skipping dependency installation"
fi

# Create data directory
if [ ! -d "data" ]; then
    mkdir data
fi

# Check configuration
echo "🔍 Checking configuration..."
if [ -f "verify_system.py" ]; then
    if python3 verify_system.py; then
        echo "✅ System verification passed"
    else
        echo "⚠️  System verification completed with warnings"
    fi
fi

echo ""
echo "🚀 Starting IA Poste Manager..."
echo "📱 Access the app at: http://localhost:5000"
echo "🛑 Press Ctrl+C to stop the server"
echo ""

# Start the application
python3 app.py
