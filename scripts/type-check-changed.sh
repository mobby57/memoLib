#!/bin/bash
# Vérification TypeScript des fichiers modifiés uniquement

echo "🔍 Vérification TypeScript des fichiers modifiés..."

# Obtenir les fichiers modifiés (non commités)
MODIFIED_FILES=$(git diff --name-only --diff-filter=ACMR HEAD | grep -E '\.(ts|tsx)$' || echo "")

if [ -z "$MODIFIED_FILES" ]; then
  echo "✅ Aucun fichier TypeScript modifié"
  exit 0
fi

echo "📝 Fichiers à vérifier:"
echo "$MODIFIED_FILES"
echo ""

# Vérifier chaque fichier individuellement
errors=0
while IFS= read -r file; do
  if [ -f "$file" ]; then
    echo "🔎 $file"
    if ! npx tsc --noEmit --skipLibCheck "$file" 2>&1 | grep -E "error TS" | head -n 5; then
      :
    else
      ((errors++))
    fi
  fi
done <<< "$MODIFIED_FILES"

if [ $errors -eq 0 ]; then
  echo ""
  echo "✅ Aucune erreur TypeScript dans les fichiers modifiés"
  exit 0
else
  echo ""
  echo "❌ $errors fichier(s) avec des erreurs"
  exit 1
fi
