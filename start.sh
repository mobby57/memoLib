#!/bin/bash
# MemoLib Assistant v2.3 - Start Script for Linux/Mac
# Equivalent to START.bat

echo "Starting MemoLib Assistant v2.3..."

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

echo "Activating virtual environment..."
source venv/bin/activate

echo "Installing dependencies..."
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
else
    echo "Warning: requirements.txt not found, skipping dependency installation"
fi

echo "Starting Flask server..."
python3 app.py
