#!/bin/bash
set -e

echo "🚀 Starting iaPosteManager on Render.com..."

# Set environment variables
export FLASK_ENV=production
export PYTHONPATH=$PYTHONPATH:$(pwd)

# Start the Flask application
cd src/backend
python app.py