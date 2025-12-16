#!/bin/bash
# Test de charge - iaPosteManager
# Usage: ./load-test.sh [concurrent-users] [duration-seconds]

CONCURRENT=${1:-10}
DURATION=${2:-60}
URL="${3:-http://localhost:5000}"

echo "🔥 Test de charge - iaPosteManager"
echo "URL: $URL"
echo "Utilisateurs concurrents: $CONCURRENT"
echo "Durée: ${DURATION}s"
echo ""

# Vérifier si Apache Bench est installé
if ! command -v ab &> /dev/null; then
    echo "📦 Installation Apache Bench..."
    sudo apt-get install -y apache2-utils
fi

# Tests de charge sur différents endpoints
echo "=== Test 1: Page d'accueil ===" 
ab -n 1000 -c $CONCURRENT -t $DURATION "${URL}/" > /tmp/load-home.txt
echo "✓ Résultats:"
grep "Requests per second" /tmp/load-home.txt
grep "Time per request" /tmp/load-home.txt | head -1
echo ""

echo "=== Test 2: API Health ===" 
ab -n 1000 -c $CONCURRENT -t $DURATION "${URL}/api/health" > /tmp/load-health.txt
echo "✓ Résultats:"
grep "Requests per second" /tmp/load-health.txt
grep "Time per request" /tmp/load-health.txt | head -1
echo ""

echo "=== Test 3: API Templates ===" 
ab -n 500 -c $CONCURRENT -t $DURATION "${URL}/api/templates" > /tmp/load-templates.txt
echo "✓ Résultats:"
grep "Requests per second" /tmp/load-templates.txt
grep "Time per request" /tmp/load-templates.txt | head -1
echo ""

# Génération rapport HTML
cat > load-test-report.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Load Test Report - iaPosteManager</title>
    <style>
        body { font-family: Arial; margin: 40px; }
        h1 { color: #2c3e50; }
        .test { background: #f8f9fa; padding: 20px; margin: 20px 0; border-left: 4px solid #3498db; }
        .metric { font-size: 18px; margin: 10px 0; }
        .good { color: #27ae60; }
        .warning { color: #f39c12; }
        .bad { color: #e74c3c; }
    </style>
</head>
<body>
    <h1>🔥 Load Test Report</h1>
    <p>Date: $(date)</p>
    <p>URL: $URL</p>
    <p>Concurrent Users: $CONCURRENT</p>
    <p>Duration: ${DURATION}s</p>
    
    <div class="test">
        <h2>Test 1: Homepage</h2>
        <pre>$(cat /tmp/load-home.txt | grep -A 20 "Percentage of the requests")</pre>
    </div>
    
    <div class="test">
        <h2>Test 2: API Health</h2>
        <pre>$(cat /tmp/load-health.txt | grep -A 20 "Percentage of the requests")</pre>
    </div>
    
    <div class="test">
        <h2>Test 3: API Templates</h2>
        <pre>$(cat /tmp/load-templates.txt | grep -A 20 "Percentage of the requests")</pre>
    </div>
</body>
</html>
EOF

echo "📊 Rapport généré: load-test-report.html"
echo "✅ Test de charge terminé!"
