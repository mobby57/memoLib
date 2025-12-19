#!/bin/bash
set -e

echo "🔧 Building iaPosteManager for Render.com..."

# Install Python dependencies
pip install -r requirements.txt

# Create necessary directories
mkdir -p data
mkdir -p logs
mkdir -p uploads

# Install frontend dependencies and build
cd src/frontend
npm ci
npm run build
cd ../..

echo "✅ Build completed successfully!"