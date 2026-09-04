#!/bin/bash
# fix-tests-remaining.sh
# Corrige les erreurs spécifiques restantes après le premier script

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}🔧 Correction des derniers problèmes de tests...${NC}"

# ---------- 1. Remplacer vi.requireMock par vi.importMock ----------
echo -e "${YELLOW}✏️  vi.requireMock → vi.importMock${NC}"
find . -type f -name "*.test.ts" -exec sed -i 's/vi\.requireMock/vi.importMock/g' {} +

# ---------- 2. Remplacer vi.requireActual par vi.importActual ----------
echo -e "${YELLOW}✏️  vi.requireActual → vi.importActual${NC}"
find . -type f -name "*.test.ts" -exec sed -i 's/vi\.requireActual/vi.importActual/g' {} +

# ---------- 3. Corriger l'import de @prisma/client/runtime/library ----------
echo -e "${YELLOW}✏️  Correction des imports Prisma runtime${NC}"
find . -type f -name "*.test.ts" -exec sed -i "s|@prisma/client/runtime/library|@prisma/client/runtime|g" {} +
find . -type f -name "*.ts" -path "*/app/api/*" -exec sed -i "s|@prisma/client/runtime/library|@prisma/client/runtime|g" {} +

# ---------- 4. Corriger le mock bcryptjs dans vitest.setup.ts ----------
echo -e "${YELLOW}✏️  Correction du mock bcryptjs${NC}"
if [ -f "vitest.setup.ts" ]; then
    cat > vitest.setup.ts << 'EOF'
import { vi } from 'vitest';

// Mock correct de bcryptjs (avec default export)
vi.mock('bcryptjs', async () => {
    const actual = await vi.importActual('bcryptjs');
    return {
        ...actual,
        default: {
            compare: vi.fn(),
            hash: vi.fn(),
        },
        compare: vi.fn(),
        hash: vi.fn(),
    };
});

// Mock de next-auth
vi.mock('next-auth', () => ({
    getServerSession: vi.fn(),
}));

// Mock de @clerk/nextjs
vi.mock('@clerk/nextjs', () => ({
    auth: vi.fn().mockResolvedValue({ userId: 'test-user', tenantId: 'test-tenant' }),
    currentUser: vi.fn().mockResolvedValue({ id: 'test-user' }),
}));

vi.mock('server-only', () => ({}));

process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || 'test-secret-32-characters-long-for-testing';
process.env.DATABASE_URL = process.env.DATABASE_URL || '';
EOF
    echo -e "${GREEN}✅ vitest.setup.ts mis à jour${NC}"
fi

# ---------- 5. Corriger le doublon d'import expect (Playwright + Vitest) ----------
echo -e "${YELLOW}✏️  Suppression du doublon expect dans test-multichannel.e2e.test.ts${NC}"
find . -type f -name "test-multichannel.e2e.test.ts" -exec sed -i '/import { expect, test } from "@playwright\/test"/d' {} +

# ---------- 6. Remplacer @vi/globals par vitest ----------
echo -e "${YELLOW}✏️  @vi/globals → vitest${NC}"
find . -type f -name "*.test.ts" -exec sed -i "s|@vi/globals|vitest|g" {} +

# ---------- 7. Ajouter un alias pour @prisma/client/runtime dans vitest.config.ts ----------
echo -e "${YELLOW}✏️  Ajout d'un alias pour @prisma/client/runtime${NC}"
if [ -f "vitest.config.ts" ]; then
    sed -i "/alias: {/a\      '@/prisma/client/runtime': path.resolve(__dirname, 'node_modules/@prisma/client/runtime')," vitest.config.ts
fi

# ---------- 8. Relancer les tests pour vérifier ----------
echo -e "${CYAN}🧪 Relance des tests...${NC}"
npx vitest --run src/__tests__/api/auth/ src/__tests__/api/dossiers/ src/__tests__/api/emails/ || true

echo -e "${GREEN}✅ Corrections appliquées.${NC}"
echo -e "${CYAN}💡 Lancez npx vitest --run pour voir le résultat final.${NC}"
