#!/bin/bash
# Start script for production deployment

echo "🚀 Starting iaPosteManager in production mode..."

# Set production environment
export FLASK_ENV=production
export NODE_ENV=production

# Create necessary directories
mkdir -p data logs backups

# Start the application
echo "🎯 Starting Flask backend on port $PORT..."
cd src/backend
python app.py