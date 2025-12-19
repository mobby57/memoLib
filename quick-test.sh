#!/bin/bash
# Test rapide utilisateur - IAPosteManager

echo "🧪 TEST UTILISATEUR IAPOSTEMANAGER"
echo "=================================="

# 1. Vérifier que le serveur fonctionne
echo "1️⃣ Test de santé du serveur..."
curl -s http://localhost:5000/api/health | jq '.' || echo "❌ Serveur non accessible"

# 2. Test login
echo "2️⃣ Test de connexion..."
curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"test123456"}' | jq '.'

# 3. Test génération IA (sans auth)
echo "3️⃣ Test génération IA..."
curl -s -X POST http://localhost:5000/api/generate-email \
  -H "Content-Type: application/json" \
  -d '{"context":"Test de génération","tone":"professionnel"}' | jq '.'

# 4. Test accessibilité
echo "4️⃣ Test accessibilité..."
curl -s http://localhost:5000/api/accessibility/settings | jq '.'

# 5. Test statistiques
echo "5️⃣ Test statistiques..."
curl -s http://localhost:5000/api/dashboard/stats | jq '.'

echo "✅ Tests terminés!"