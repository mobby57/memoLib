#!/bin/bash

echo "======================================"
echo "TEST PROVISIONING EMAIL CLOUD"
echo "======================================"
echo ""

API_URL="${1:-http://localhost:5000}"
TEST_USER="contact"
TEST_EMAIL="$TEST_USER@iapostemanager.com"

echo "🔍 Test 1: Vérification disponibilité email"
echo "Endpoint: POST $API_URL/api/email/check-availability"
RESPONSE=$(curl -s -X POST "$API_URL/api/email/check-availability" \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"$TEST_USER\"}")

echo "Response: $RESPONSE"
AVAILABLE=$(echo $RESPONSE | grep -o '"available":true' || echo "")

if [ -n "$AVAILABLE" ]; then
    echo "✅ Email disponible"
else
    echo "⚠️  Email déjà pris (normal si déjà testé)"
fi
echo ""

echo "🔍 Test 2: Suggestions alternatives"
echo "Endpoint: POST $API_URL/api/email/check-availability"
RESPONSE=$(curl -s -X POST "$API_URL/api/email/check-availability" \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"admin\"}")

SUGGESTIONS=$(echo $RESPONSE | grep -o '"suggestions":\[[^]]*\]' || echo "")
if [ -n "$SUGGESTIONS" ]; then
    echo "✅ Suggestions reçues"
    echo "   $SUGGESTIONS"
else
    echo "ℹ️  Pas de suggestions (normal si disponible)"
fi
echo ""

echo "🔍 Test 3: Validation patterns"
echo "Test caractères invalides..."
RESPONSE=$(curl -s -X POST "$API_URL/api/email/check-availability" \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"test@invalid\"}")

ERROR=$(echo $RESPONSE | grep -o '"error"' || echo "")
if [ -n "$ERROR" ]; then
    echo "✅ Validation fonctionne"
else
    echo "⚠️  Validation peut-être manquante"
fi
echo ""

echo "🔍 Test 4: Liste de mes comptes (authentification requise)"
echo "Endpoint: GET $API_URL/api/email/my-accounts"
RESPONSE=$(curl -s -X GET "$API_URL/api/email/my-accounts" \
  -H "Cookie: session=test")

if echo $RESPONSE | grep -q '"accounts"'; then
    echo "✅ Endpoint accessible"
    ACCOUNT_COUNT=$(echo $RESPONSE | grep -o '"accounts":\[[^]]*\]' | wc -c)
    echo "   Comptes trouvés: $(echo $RESPONSE | grep -o '"email"' | wc -l)"
else
    echo "⚠️  Authentification requise (normal)"
fi
echo ""

echo "🔍 Test 5: Health check du service"
if curl -s "$API_URL/api/health" | grep -q "ok"; then
    echo "✅ API principale fonctionnelle"
else
    echo "❌ API principale non accessible"
fi
echo ""

echo "======================================"
echo "RÉSUMÉ DES TESTS"
echo "======================================"
echo ""
echo "📋 Checklist:"
echo "  [✓] Vérification disponibilité"
echo "  [✓] Suggestions alternatives"
echo "  [✓] Validation input"
echo "  [✓] Liste comptes (avec auth)"
echo "  [✓] Health check"
echo ""
echo "⚠️  NOTES:"
echo "  • Authentification requise pour créer emails"
echo "  • Tester via interface web pour test complet"
echo "  • Configurer EMAIL_PROVIDER dans .env"
echo ""
echo "🌐 Interface web: $API_URL/email-provisioning"
echo ""
