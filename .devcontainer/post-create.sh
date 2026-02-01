#!/bin/bash
set -e

echo "🚀 Setting up IA Poste Manager development environment..."

# Frontend dependencies
if [ -d "src/frontend" ] && [ -f "src/frontend/package.json" ]; then
    echo "📦 Installing frontend dependencies..."
    cd src/frontend
    npm install
    cd ../..
fi

# Root package.json (if exists)
if [ -f "package.json" ]; then
    echo "📦 Installing root dependencies..."
    npm install
fi

# Python dependencies
if [ -f "requirements.txt" ]; then
    echo "🐍 Installing Python dependencies..."
    pip install --upgrade pip
    pip install -r requirements.txt
fi

# AI service dependencies (if exists)
if [ -d "ai-service" ] && [ -f "ai-service/requirements.txt" ]; then
    echo "🤖 Installing AI service dependencies..."
    pip install -r ai-service/requirements.txt
fi

# Prisma generate (if exists)
if [ -f "src/frontend/prisma/schema.prisma" ]; then
    echo "🗃️ Generating Prisma client..."
    cd src/frontend
    npx prisma generate
    cd ../..
fi

echo "✅ Development environment ready!"
echo ""
echo "🎯 Quick start:"
echo "   Frontend: cd src/frontend && npm run dev"
echo "   Backend:  python -m flask run --debug --port 5000"
echo "   Full:     Run task 'Full Stack: Start All'"
