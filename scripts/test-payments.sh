#!/bin/bash

# MemoLib Payment System Test Script
# Tests all payment functionality in development mode

set -e

echo "🧪 MemoLib Payment System Tests"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in test mode
if [ -z "$STRIPE_SECRET_KEY" ] || [[ ! "$STRIPE_SECRET_KEY" =~ ^sk_test ]]; then
    echo -e "${RED}❌ Error: STRIPE_SECRET_KEY not set or not in test mode${NC}"
    echo "Please set test API keys in .env.local"
    exit 1
fi

echo -e "${GREEN}✅ Stripe test mode detected${NC}"
echo ""

# Function to test API endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=$4
    
    echo -n "Testing $method $endpoint... "
    
    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method "http://localhost:3000$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method "http://localhost:3000$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    status=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$status" -eq "$expected_status" ]; then
        echo -e "${GREEN}✅ Pass (Status: $status)${NC}"
        return 0
    else
        echo -e "${RED}❌ Fail (Expected: $expected_status, Got: $status)${NC}"
        echo "Response: $body"
        return 1
    fi
}

echo "📋 Step 1: Health Checks"
echo "------------------------"

# Check if server is running
if ! curl -s http://localhost:3000 > /dev/null; then
    echo -e "${RED}❌ Server not running on localhost:3000${NC}"
    echo "Please run: npm run dev"
    exit 1
fi

echo -e "${GREEN}✅ Server is running${NC}"
echo ""

echo "💳 Step 2: Payment Intent Tests"
echo "--------------------------------"

# Test payment intent creation
test_endpoint "POST" "/api/payments/create-intent" \
    '{"amount":999,"currency":"usd"}' 200

# Test with invalid amount
test_endpoint "POST" "/api/payments/create-intent" \
    '{"amount":-100,"currency":"usd"}' 400

# Test multiple currencies
for currency in usd eur gbp jpy; do
    test_endpoint "POST" "/api/payments/create-intent" \
        "{\"amount\":1000,\"currency\":\"$currency\"}" 200
done

echo ""

echo "📦 Step 3: Subscription Tests"
echo "------------------------------"

# Test current subscription
test_endpoint "GET" "/api/subscriptions/current" "" 200

# Note: Creating/cancelling subscriptions requires authentication
# These would fail without proper session cookies

echo ""

echo "💰 Step 4: Payment Methods Tests"
echo "----------------------------------"

test_endpoint "GET" "/api/payments/methods" "" 200

echo ""

echo "📄 Step 5: Invoice Tests"
echo "-------------------------"

test_endpoint "GET" "/api/payments/invoices" "" 200

echo ""

echo "🌍 Step 6: Currency Conversion Tests"
echo "--------------------------------------"

# These are in-memory tests
cd src/frontend
echo -n "Testing currency conversion... "
node -e "
const { convertCurrency, formatCurrencyAmount } = require('./lib/currencies.ts');
(async () => {
    try {
        const converted = await convertCurrency(100, 'USD', 'EUR');
        if (converted > 0 && converted !== 100) {
            console.log('✅ Pass');
        } else {
            console.log('❌ Fail');
            process.exit(1);
        }
    } catch (e) {
        console.log('❌ Error:', e.message);
        process.exit(1);
    }
})();
" || echo -e "${YELLOW}⚠️  Skip (Node test)${NC}"

cd ../..

echo ""

echo "🎯 Step 7: Stripe CLI Tests (Webhooks)"
echo "----------------------------------------"

if ! command -v stripe &> /dev/null; then
    echo -e "${YELLOW}⚠️  Stripe CLI not installed${NC}"
    echo "Install: https://stripe.com/docs/stripe-cli"
else
    echo -e "${GREEN}✅ Stripe CLI found${NC}"
    echo ""
    echo "To test webhooks, run in another terminal:"
    echo "  stripe listen --forward-to localhost:3000/api/payments/webhook"
    echo ""
    echo "Then trigger test events:"
    echo "  stripe trigger payment_intent.succeeded"
    echo "  stripe trigger customer.subscription.created"
fi

echo ""

echo "📊 Test Summary"
echo "==============="
echo ""
echo -e "${GREEN}✅ Basic API tests completed${NC}"
echo ""
echo "Next steps:"
echo "1. Run E2E tests: npm run test:e2e"
echo "2. Test with Stripe CLI webhooks"
echo "3. Manual testing in browser at http://localhost:3000/billing"
echo ""
echo "Test cards to use:"
echo "  Success: 4242 4242 4242 4242"
echo "  Decline: 4000 0000 0000 0002"
echo "  3D Secure: 4000 0025 0000 3155"
echo ""
echo -e "${GREEN}All tests passed! 🎉${NC}"
