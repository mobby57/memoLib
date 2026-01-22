#!/bin/bash

# Script de diagnostic Cloudflare Pages Deployment
# Aide à identifier les problèmes d'authentification

echo "🔍 CLOUDFLARE PAGES DEPLOYMENT DIAGNOSTIC"
echo "========================================"
echo ""

# Vérifier les variables d'environnement
echo "1️⃣ Checking Environment Variables..."
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
  echo "  ❌ CLOUDFLARE_API_TOKEN not set"
else
  echo "  ✅ CLOUDFLARE_API_TOKEN is set (${#CLOUDFLARE_API_TOKEN} chars)"
fi

if [ -z "$CLOUDFLARE_ACCOUNT_ID" ]; then
  echo "  ❌ CLOUDFLARE_ACCOUNT_ID not set"
else
  echo "  ✅ CLOUDFLARE_ACCOUNT_ID is set: ${CLOUDFLARE_ACCOUNT_ID:0:10}..."
fi

if [ -z "$NEXTAUTH_SECRET" ]; then
  echo "  ❌ NEXTAUTH_SECRET not set"
else
  echo "  ✅ NEXTAUTH_SECRET is set"
fi

if [ -z "$DATABASE_URL" ]; then
  echo "  ❌ DATABASE_URL not set"
else
  echo "  ✅ DATABASE_URL is set"
fi

echo ""
echo "2️⃣ Testing Wrangler Authentication..."

# Test whoami
npx wrangler whoami 2>&1 | head -20

echo ""
echo "3️⃣ Checking Project Configuration..."

if [ -f "wrangler.toml" ]; then
  echo "  ✅ wrangler.toml exists"
  echo "  Project name: $(grep 'name = ' wrangler.toml | head -1)"
  echo "  Pages build dir: $(grep 'pages_build_output_dir = ' wrangler.toml || echo 'Not set')"
else
  echo "  ❌ wrangler.toml not found"
fi

echo ""
echo "4️⃣ Build Output Check..."

if [ -d ".next" ]; then
  echo "  ✅ .next directory exists"
  echo "  Size: $(du -sh .next | cut -f1)"
  echo "  Contents:"
  ls -la .next | head -10
else
  echo "  ❌ .next directory not found"
fi

echo ""
echo "5️⃣ Deployment Attempt..."

# Try to get list of pages projects
echo "  Attempting to list Pages projects..."
npx wrangler pages project list 2>&1 || echo "  ⚠️ Could not list projects"

echo ""
echo "✅ Diagnostic complete"
