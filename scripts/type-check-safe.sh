#!/bin/bash
# Type-check safe pour environnements avec mémoire limitée

echo "🔍 Vérification TypeScript..."

# Augmenter la limite mémoire Node.js
export NODE_OPTIONS="--max-old-space-size=4096"

# Vérifier avec cache incrémental
echo "📦 Compilation TypeScript avec cache..."
if npx tsc --noEmit --skipLibCheck --incremental 2>&1 | tee /tmp/tsc-output.log; then
  echo "✅ Aucune erreur TypeScript"
  exit 0
else
  echo "❌ Erreurs TypeScript détectées"
  echo "📄 Voir les détails dans /tmp/tsc-output.log"
  exit 1
fi
