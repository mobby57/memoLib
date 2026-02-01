#!/bin/bash
# Diagnostic TypeScript

echo "🏥 Diagnostic TypeScript MemoLib"
echo "================================"
echo ""

# 1. Compter les fichiers
echo "📊 Statistiques:"
TS_COUNT=$(find src -name "*.ts" 2>/dev/null | wc -l)
TSX_COUNT=$(find src -name "*.tsx" 2>/dev/null | wc -l)
TOTAL=$((TS_COUNT + TSX_COUNT))
echo "  - Fichiers .ts:  $TS_COUNT"
echo "  - Fichiers .tsx: $TSX_COUNT"
echo "  - Total:         $TOTAL"
echo ""

# 2. Vérifier la configuration
echo "⚙️  Configuration:"
if [ -f "tsconfig.json" ]; then
  echo "  ✅ tsconfig.json existe"
  if grep -q '"skipLibCheck": true' tsconfig.json; then
    echo "  ✅ skipLibCheck activé"
  else
    echo "  ⚠️  skipLibCheck désactivé (peut ralentir)"
  fi
  if grep -q '"incremental": true' tsconfig.json; then
    echo "  ✅ incremental activé"
  else
    echo "  ⚠️  incremental désactivé"
  fi
else
  echo "  ❌ tsconfig.json manquant"
fi
echo ""

# 3. Vérifier le cache
echo "💾 Cache:"
if [ -f "tsconfig.tsbuildinfo" ]; then
  SIZE=$(du -h tsconfig.tsbuildinfo | cut -f1)
  echo "  ✅ Cache TypeScript: $SIZE"
else
  echo "  ⚠️  Pas de cache (première compilation sera lente)"
fi
echo ""

# 4. Mémoire disponible
echo "🧠 Ressources:"
if command -v free &> /dev/null; then
  TOTAL_MEM=$(free -h | awk '/^Mem:/ {print $2}')
  AVAIL_MEM=$(free -h | awk '/^Mem:/ {print $7}')
  echo "  - Mémoire totale:      $TOTAL_MEM"
  echo "  - Mémoire disponible:  $AVAIL_MEM"
else
  echo "  ⚠️  Impossible de vérifier la mémoire"
fi
echo ""

# 5. Recommandations
echo "💡 Recommandations:"
if [ $TOTAL -gt 500 ]; then
  echo "  ⚠️  Projet volumineux ($TOTAL fichiers)"
  echo "     → Utiliser: npm run type-check:changed"
  echo "     → Ou: npm run build (Next.js optimisé)"
fi

if [ ! -f "tsconfig.tsbuildinfo" ]; then
  echo "  💡 Première compilation sera lente"
  echo "     → Le cache accélérera les suivantes"
fi

echo ""
echo "🔧 Commandes disponibles:"
echo "  npm run type-check:changed  - Vérifier fichiers modifiés"
echo "  npm run build               - Build Next.js (recommandé)"
echo "  npm run type-check:watch    - Mode watch"
echo ""
