#!/bin/bash
# Production deployment script for Render.com

set -e

echo "🚀 DEPLOYING IAPOSTEMANAGER v2.2 TO PRODUCTION"
echo "=============================================="

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install --no-cache-dir -r requirements.txt

# Build React frontend
echo "⚛️ Building React frontend..."
cd frontend-react
npm ci --only=production
npm run build
cd ..

# Copy built frontend to backend
echo "📁 Setting up frontend files..."
mkdir -p src/backend/static
cp -r frontend-react/dist/* src/backend/static/ 2>/dev/null || true

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p src/backend/data
mkdir -p src/backend/uploads  
mkdir -p src/backend/logs
mkdir -p src/backend/flask_session

# Set permissions
echo "🔒 Setting permissions..."
chmod -R 755 src/backend/data
chmod -R 755 src/backend/uploads
chmod -R 755 src/backend/logs

echo "✅ Deployment preparation complete!"
echo "🌐 Ready for production server startup"