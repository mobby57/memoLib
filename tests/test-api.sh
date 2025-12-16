#!/bin/bash
# Tests API automatisés - iaPosteManager
# Teste tous les endpoints de l'API

BASE_URL="${1:-http://localhost:5000}"
RESULTS_FILE="test-results-$(date +%Y%m%d_%H%M%S).txt"

echo "🧪 Tests API - iaPosteManager" | tee $RESULTS_FILE
echo "URL: $BASE_URL" | tee -a $RESULTS_FILE
echo "Date: $(date)" | tee -a $RESULTS_FILE
echo "" | tee -a $RESULTS_FILE

PASSED=0
FAILED=0

test_endpoint() {
    local method=$1
    local endpoint=$2
    local expected_status=$3
    local data=$4
    
    echo -n "Testing $method $endpoint... " | tee -a $RESULTS_FILE
    
    if [ "$method" == "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method \
          -H "Content-Type: application/json" \
          -d "$data" \
          "$BASE_URL$endpoint")
    fi
    
    status=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$status" == "$expected_status" ]; then
        echo "✅ PASS ($status)" | tee -a $RESULTS_FILE
        ((PASSED++))
    else
        echo "❌ FAIL (expected $expected_status, got $status)" | tee -a $RESULTS_FILE
        ((FAILED++))
    fi
}

# Tests
echo "=== Tests Endpoints ===" | tee -a $RESULTS_FILE
echo "" | tee -a $RESULTS_FILE

test_endpoint "GET" "/api/health" "200"
test_endpoint "GET" "/api/accessibility/settings" "200"
test_endpoint "GET" "/api/templates" "200"
test_endpoint "GET" "/api/config/settings" "200"
test_endpoint "POST" "/api/auth/login" "200" '{"password":"testpassword123"}'
test_endpoint "GET" "/api/dashboard/stats" "200"
test_endpoint "GET" "/api/email-history" "200"

echo "" | tee -a $RESULTS_FILE
echo "=== Résultats ===" | tee -a $RESULTS_FILE
echo "✅ Passed: $PASSED" | tee -a $RESULTS_FILE
echo "❌ Failed: $FAILED" | tee -a $RESULTS_FILE
echo "" | tee -a $RESULTS_FILE

if [ $FAILED -eq 0 ]; then
    echo "🎉 Tous les tests passent!" | tee -a $RESULTS_FILE
    exit 0
else
    echo "⚠️  Des tests ont échoué" | tee -a $RESULTS_FILE
    exit 1
fi
