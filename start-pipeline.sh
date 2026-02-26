#!/bin/bash
# start-pipeline.sh
# Démarrage complet du pipeline d'analyse MemoLib

set -e

echo "🚀 Démarrage du Pipeline d'Analyse MemoLib..."
echo "=================================================="

# Check Python
echo "✓ Vérification Python..."
python --version

# Check Node
echo "✓ Vérification Node..."
node --version

# Check deps
echo "✓ Vérification dépendances Python..."
python -c "from analysis.pipelines.pipeline import AnalysisPipeline; print('  ✅ Pipeline importable')"

# Check Flask
echo "✓ Vérification Flask..."
python -m py_compile backend-python/app.py && echo "  ✅ Flask syntax OK"

echo ""
echo "=================================================="
echo "🎯 Démarrage composants..."
echo "=================================================="

# Terminal 1: Frontend
echo "→ Frontend (Next.js) sur port 3000..."
(cd src/frontend && npm run dev &)
FRONTEND_PID=$!

# Terminal 2: Backend
echo "→ Backend (Flask) sur port 5000..."
(FLASK_APP=backend-python/app.py python -m flask run --debug --port 5000 &)
BACKEND_PID=$!

# Wait for services to start
sleep 5

echo ""
echo "=================================================="
echo "✅ Services lancés!"
echo "=================================================="
echo ""
echo "📍 Endpoints disponibles:"
echo ""
echo "  Frontend:  http://localhost:3000"
echo "  Backend:   http://localhost:5000"
echo "  Health:    http://localhost:5000/analysis/health"
echo ""
echo "🧪 Test rapide:"
echo '  curl -X POST http://localhost:5000/analysis/test-rules \'
echo '    -H "Content-Type: application/json" \'
echo '    -d "{\"source\":\"EMAIL\",\"content\":\"OQTF. Délai: 3 jours.\",\"content_hash\":\"hash123\"}"'
echo ""
echo "📊 Load test:"
echo "  python -m analysis.load_test"
echo ""
echo "🧪 Unit tests:"
echo "  pytest analysis/tests/test_rules_engine.py -v"
echo ""
echo "Press Ctrl+C to stop all services..."
echo ""

# Keep script alive
wait
