#!/bin/bash
# Build script for Render.com deployment

echo "🚀 Building iaPosteManager for production..."

# Install backend dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Install frontend dependencies
echo "📦 Installing Node.js dependencies..."
cd src/frontend
npm install
npm run build
cd ../..

# Create necessary directories
mkdir -p data logs backups

# Set permissions
chmod +x start.sh

echo "✅ Build completed successfully!"
echo "🎯 Ready for production deployment"