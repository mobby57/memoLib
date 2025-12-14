#!/bin/bash
# Build script pour Render

echo "🔨 Building IAPosteManager..."

# Install Python dependencies
pip install -r requirements.txt

# Build frontend
cd src/frontend
npm ci
npm run build
cd ../..

echo "✅ Build terminé!"