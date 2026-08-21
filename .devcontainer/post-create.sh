#!/bin/bash
set -e

echo "Setting up MemoLib development environment..."

# Root package.json (if exists)
if [ -f "package.json" ]; then
    echo "📦 Installing root dependencies..."
    npm ci
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
if [ -f "prisma/schema.prisma" ]; then
    echo "Generating Prisma client..."
    npx prisma generate
fi

echo "Development environment ready!"
echo ""
echo "Quick start:"
echo "   Application: npm run dev"
echo "   AI worker (optional): docker compose -f docker-compose.dev.yml up ai-service"
