#!/bin/bash
# IA Poste Manager v2.3 - Start Script for Linux/Mac
# Equivalent to START.bat

echo "Starting IA Poste Manager v2.3..."

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

echo "Activating virtual environment..."
source venv/bin/activate

echo "Installing dependencies..."
pip install -r requirements.txt

echo "Starting Flask server..."
python app.py
