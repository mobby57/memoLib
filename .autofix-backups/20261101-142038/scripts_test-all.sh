#!/bin/bash
# ═══════════════════════════════════════════════════════════
# AUTO-TEST MEMOLIB — Version robuste (détecte vraiment les échecs)
# ═══════════════════════════════════════════════════════════

set -uo pipefail
export NODE_OPTIONS="--max-old-space-size=6144"

# Se placer à la racine du projet (dossier du script)
cd "$(dirname "$0")/.." || exit 1

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

LOG="/tmp/memolib-tests-$(date +%Y%m%d-%H%M%S).log"

echo -e "${YELLOW}🧪 MemoLib — Tests complets${NC}"
echo "Dossier : $(pwd)"
echo "Log     : $LOG"
echo ""

# ═══ Vérification préalable ═══
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ package.json introuvable. Tu es dans le mauvais dossier.${NC}"
    echo "   Dossier actuel : $(pwd)"
    echo "   Attendu : .../memolib-production/"
    exit 1
fi

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  node_modules manquant. Lance 'npm install --legacy-peer-deps' d'abord.${NC}"
    exit 1
fi

FAILED=0

# ═══ 1. TypeScript ═══
echo -e "${YELLOW}[1/4] TypeScript...${NC}"
if NODE_OPTIONS="--max-old-space-size=6144" ./node_modules/.bin/tsc --noEmit --incremental > "$LOG.ts" 2>&1; then
    echo -e "${GREEN}✅ TypeScript OK${NC}"
else
    echo -e "${RED}❌ TypeScript ERREURS${NC}"
    echo "   Détail : head -20 $LOG.ts"
    head -20 "$LOG.ts"
    FAILED=$((FAILED + 1))
fi
echo ""

# ═══ 2. ESLint ═══
echo -e "${YELLOW}[2/4] ESLint...${NC}"
if ./node_modules/.bin/eslint src --max-warnings 50 > "$LOG.lint" 2>&1; then
    echo -e "${GREEN}✅ Lint OK${NC}"
else
    echo -e "${RED}❌ Lint ERREURS${NC}"
    echo "   Détail : head -20 $LOG.lint"
    head -20 "$LOG.lint"
    FAILED=$((FAILED + 1))
fi
echo ""

# ═══ 3. Vitest ═══
echo -e "${YELLOW}[3/4] Vitest...${NC}"
if ./node_modules/.bin/vitest run > "$LOG.test" 2>&1; then
    TESTS_LINE=$(grep -E "^ *Tests " "$LOG.test" | tail -1)
    echo -e "${GREEN}✅ Tests OK${NC}"
    echo "   $TESTS_LINE"
else
    echo -e "${RED}❌ Tests ERREURS${NC}"
    grep -E "FAIL|Tests " "$LOG.test" | tail -10
    echo "   Détail complet : cat $LOG.test"
    FAILED=$((FAILED + 1))
fi
echo ""

# ═══ 4. Build ═══
echo -e "${YELLOW}[4/4] Build Next.js (2-3 min)...${NC}"
if NODE_OPTIONS="--max-old-space-size=6144" ./node_modules/.bin/next build --webpack > "$LOG.build" 2>&1; then
    echo -e "${GREEN}✅ Build OK${NC}"
else
    echo -e "${RED}❌ Build ERREURS${NC}"
    echo "   Détail : tail -30 $LOG.build"
    tail -30 "$LOG.build"
    FAILED=$((FAILED + 1))
fi
echo ""

# ═══ Résumé ═══
echo "═══════════════════════════════════════════════════════════"
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 TOUS LES TESTS PASSENT${NC}"
    echo ""
    echo "Logs détaillés :"
    echo "  TypeScript : $LOG.ts"
    echo "  Lint       : $LOG.lint"
    echo "  Tests      : $LOG.test"
    echo "  Build      : $LOG.build"
    exit 0
else
    echo -e "${RED}❌ $FAILED étape(s) en échec sur 4${NC}"
    echo ""
    echo "Logs détaillés :"
    echo "  TypeScript : $LOG.ts"
    echo "  Lint       : $LOG.lint"
    echo "  Tests      : $LOG.test"
    echo "  Build      : $LOG.build"
    exit 1
fi
