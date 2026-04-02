#!/bin/bash

# Script de validation MemoLib - Fonctionnalités Avancées
echo "🚀 Validation MemoLib - Fonctionnalités Avancées"
echo "================================================"

API_URL="http://localhost:5078"
TOKEN=""

# Fonction pour tester un endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4
    
    echo -n "Testing $description... "
    
    if [ "$method" = "GET" ]; then
        if [ -n "$TOKEN" ]; then
            response=$(curl -s -w "%{http_code}" -H "Authorization: Bearer $TOKEN" "$API_URL$endpoint")
        else
            response=$(curl -s -w "%{http_code}" "$API_URL$endpoint")
        fi
    else
        if [ -n "$TOKEN" ]; then
            response=$(curl -s -w "%{http_code}" -X "$method" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d "$data" "$API_URL$endpoint")
        else
            response=$(curl -s -w "%{http_code}" -X "$method" -H "Content-Type: application/json" -d "$data" "$API_URL$endpoint")
        fi
    fi
    
    http_code="${response: -3}"
    body="${response%???}"
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo "✅ OK ($http_code)"
    else
        echo "❌ FAIL ($http_code)"
        echo "   Response: $body"
    fi
}

# 1. Test de santé
test_endpoint "GET" "/health" "API Health"

# 2. Connexion
echo -n "Testing Login... "
login_response=$(curl -s -X POST -H "Content-Type: application/json" -d '{"email":"sarraboudjellal57@gmail.com","password":"SecurePass123!"}' "$API_URL/api/auth/login")
TOKEN=$(echo "$login_response" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
    echo "✅ OK (Token obtained)"
else
    echo "❌ FAIL (No token)"
    echo "Response: $login_response"
    exit 1
fi

# 3. Test Dashboard
test_endpoint "GET" "/api/dashboard/metrics" "Dashboard Metrics"
test_endpoint "GET" "/api/dashboard/realtime-stats" "Realtime Stats"

# 4. Test Templates
test_endpoint "POST" "/api/templates/generate" "Template Generation" '{"clientContext":"Test client","subject":"Test subject","caseType":"general"}'
test_endpoint "GET" "/api/templates" "Templates List"

# 5. Test Questionnaires (nécessite un événement existant)
test_endpoint "GET" "/api/cases" "Cases List"

# 6. Test Ingestion (pour déclencher notifications)
test_endpoint "POST" "/api/ingest/email" "Email Ingestion" '{"from":"test@example.com","subject":"Test","body":"Test body","externalId":"TEST-001","occurredAt":"2026-02-22T22:00:00Z"}'

# 7. Test Centre Anomalies
test_endpoint "GET" "/api/alerts/center?limit=5" "Anomaly Center"

echo ""
echo "🎯 Tests Interface Web:"
echo "1. Ouvrir: $API_URL/demo.html"
echo "2. Se connecter avec: sarraboudjellal57@gmail.com / SecurePass123!"
echo "3. Tester bouton '📊 Dashboard Avancé'"
echo "4. Tester bouton '📝 Réponse IA' sur un email"
echo "5. Vérifier notifications temps réel"
echo ""
echo "✅ Validation terminée!"