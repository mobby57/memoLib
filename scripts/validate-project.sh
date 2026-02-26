#!/bin/bash
# Validation rapide du projet MemoLib

echo "🔍 Validation MemoLib"
echo "===================="
echo ""

errors=0

# 1. Vérifier next.config.js
echo "📝 Vérification next.config.js..."
if node -e "require('./next.config.js')" 2>/dev/null; then
  echo "  ✅ next.config.js valide"
else
  echo "  ❌ next.config.js invalide"
  ((errors++))
fi

# 2. Vérifier tsconfig.json
echo "📝 Vérification tsconfig.json..."
if [ -f "tsconfig.json" ]; then
  if node -e "JSON.parse(require('fs').readFileSync('tsconfig.json', 'utf8'))" 2>/dev/null; then
    echo "  ✅ tsconfig.json valide"
  else
    echo "  ❌ tsconfig.json invalide"
    ((errors++))
  fi
else
  echo "  ❌ tsconfig.json manquant"
  ((errors++))
fi

# 3. Vérifier package.json
echo "📝 Vérification package.json..."
if [ -f "package.json" ]; then
  if node -e "JSON.parse(require('fs').readFileSync('package.json', 'utf8'))" 2>/dev/null; then
    echo "  ✅ package.json valide"
  else
    echo "  ❌ package.json invalide"
    ((errors++))
  fi
else
  echo "  ❌ package.json manquant"
  ((errors++))
fi

# 4. Vérifier node_modules
echo "📦 Vérification dépendances..."
if [ -d "node_modules" ]; then
  echo "  ✅ node_modules présent"
else
  echo "  ⚠️  node_modules manquant (exécuter: npm install)"
fi

# 5. Vérifier Prisma
echo "🗄️  Vérification Prisma..."
if [ -f "prisma/schema.prisma" ]; then
  echo "  ✅ schema.prisma présent"
  if [ -d "node_modules/.prisma" ]; then
    echo "  ✅ Prisma Client généré"
  else
    echo "  ⚠️  Prisma Client non généré (exécuter: npm run db:generate)"
  fi
else
  echo "  ❌ schema.prisma manquant"
  ((errors++))
fi

# 6. Vérifier .env
echo "🔐 Vérification environnement..."
if [ -f ".env.local" ] || [ -f ".env" ]; then
  echo "  ✅ Fichier .env présent"
else
  echo "  ⚠️  Fichier .env manquant (copier .env.example)"
fi

# 7. Vérifier scripts
echo "🛠️  Vérification scripts..."
scripts=(
  "scripts/type-check-safe.sh"
  "scripts/type-check-changed.sh"
  "scripts/typescript-diagnostic.sh"
)
for script in "${scripts[@]}"; do
  if [ -f "$script" ]; then
    if [ -x "$script" ]; then
      echo "  ✅ $script (exécutable)"
    else
      echo "  ⚠️  $script (non exécutable)"
    fi
  else
    echo "  ❌ $script manquant"
    ((errors++))
  fi
done

echo ""
echo "📊 Résumé"
echo "========="
if [ $errors -eq 0 ]; then
  echo "✅ Tous les tests passent"
  echo ""
  echo "🚀 Prêt pour le développement !"
  echo ""
  echo "Commandes disponibles:"
  echo "  npm run dev                    - Lancer le serveur de dev"
  echo "  npm run type-check:diagnostic  - Diagnostic TypeScript"
  echo "  npm run type-check:changed     - Vérifier fichiers modifiés"
  echo "  npm run build                  - Build production"
  exit 0
else
  echo "❌ $errors erreur(s) détectée(s)"
  echo ""
  echo "Corriger les erreurs avant de continuer."
  exit 1
fi
