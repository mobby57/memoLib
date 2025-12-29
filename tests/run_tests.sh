#!/bin/bash

echo "🧪 Exécution des tests IAPosteManager"
echo "======================================"
echo ""

# Backend tests
echo "[1/2] Tests Backend..."
pytest tests/ -v --cov=src/backend --cov-report=term --cov-report=html

# Frontend tests
echo ""
echo "[2/2] Tests Frontend..."
cd src/frontend
npm run test

echo ""
echo "✅ Tests terminés !"
echo "📊 Coverage: htmlcov/index.html"

