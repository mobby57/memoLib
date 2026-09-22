#!/usr/bin/env bash
# audit-and-gen.sh — Audit IDOR + génère les tests tenant prioritaires
set -uo pipefail
cd "$(dirname "$0")"

echo "════════════════════════════════════════════════"
echo " AUDIT IDOR + GÉNÉRATION TESTS"
echo "════════════════════════════════════════════════"
echo

# ─────────────────────────────────────────────────────
# 1. AUDIT : routes /api/tenant/[tenantId]/* sans check
# ─────────────────────────────────────────────────────
echo "▶ [1/3] Routes /api/tenant/[tenantId]/* sans vérif tenantId"
VULN=0
while IFS= read -r f; do
  if ! grep -qE "tenantId !== user\.tenantId|user\.tenantId !== tenantId|assertTenant|tenantId === user\.tenantId" "$f"; then
    echo "  ⚠  $f"
    VULN=$((VULN+1))
  fi
done < <(find src/app/api/tenant -name "route.ts" 2>/dev/null)
echo "  → $VULN route(s) à vérifier"
echo

# ─────────────────────────────────────────────────────
# 2. AUDIT : routes /api/[entity]/[id]/* sans filtre tenant
# ─────────────────────────────────────────────────────
echo "▶ [2/3] Routes /api/*/[id]/* sans filtre tenantId dans Prisma"
VULN2=0
for pattern in 'dossiers' 'documents' 'factures' 'lawyer/workspaces' 'pending-actions' 'drafts'; do
  while IFS= read -r f; do
    # Vérifie si le fichier contient au moins un findFirst/findUnique avec tenantId
    if grep -qE "findFirst|findUnique" "$f" && ! grep -qE "tenantId.*user\.tenantId|user\.tenantId.*tenantId" "$f"; then
      echo "  ⚠  $f"
      VULN2=$((VULN2+1))
    fi
  done < <(find "src/app/api/$pattern" -name "route.ts" 2>/dev/null | grep '\[id\]')
done
echo "  → $VULN2 route(s) suspecte(s)"
echo

# ─────────────────────────────────────────────────────
# 3. GÉNÉRATION : top 5 routes tier 1
# ─────────────────────────────────────────────────────
echo "▶ [3/3] Génération de tests pour les routes Tier 1"

declare -a TARGETS=(
  "api/dossiers/[id]/route.ts|dossier"
  "api/dossiers/[id]/members/route.ts|dossier"
  "api/documents/[id]/route.ts|document"
  "api/factures/[id]/route.ts|facture"
  "api/lawyer/workspaces/[id]/route.ts|workspace"
)

for entry in "${TARGETS[@]}"; do
  ROUTE="${entry%%|*}"
  ENTITY="${entry##*|}"
  SRC="src/app/$ROUTE"
  [[ -f "$SRC" ]] || { echo "  ⏭  $SRC absent"; continue; }

  TEST_DIR="src/__tests__/${ROUTE%/*}"
  TEST_FILE="$TEST_DIR/$(basename "$ROUTE" .ts)-tenant.test.ts"
  mkdir -p "$TEST_DIR"

  # Chemin d'import (retire .ts)
  IMPORT_PATH="@/app/${ROUTE%.ts}"

  cat > "$TEST_FILE" <<EOF
import { NextRequest } from 'next/server';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));
vi.mock('@/lib/clerk-auth', () => ({ auth: mockAuth }));

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    $ENTITY: { findFirst: vi.fn(), findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
  },
}));
vi.mock('@/lib/prisma', () => ({ default: prismaMock, prisma: prismaMock }));

import * as route from '$IMPORT_PATH';

const userTenantA = { id: 'u1', email: 'a@t.com', name: 'A', role: 'COLLABORATEUR', tenantId: 'tenant_A' };
const auth = (user = userTenantA) =>
  mockAuth.mockResolvedValue(
    user
      ? { isAuthenticated: true, clerkUserId: 'c1', orgId: null, user }
      : { isAuthenticated: false, clerkUserId: null, orgId: null, user: null }
  );

const params = (id: string) => ({ params: Promise.resolve({ id }) });

describe('IDOR isolation — $ROUTE', () => {
  beforeEach(() => vi.clearAllMocks());

  for (const method of ['GET', 'PATCH', 'DELETE'] as const) {
    const fn = (route as any)[method];
    if (typeof fn !== 'function') continue;

    it(\`\${method} 401 sans session\`, async () => {
      auth(null);
      const res = await fn(new NextRequest('http://x/api/$ENTITY/id1'), params('id1'));
      expect(res.status).toBe(401);
    });

    it(\`\${method} 404 cross-tenant + filtre tenantId\`, async () => {
      auth(userTenantA);
      prismaMock.$ENTITY.findFirst.mockResolvedValue(null);
      prismaMock.$ENTITY.findUnique.mockResolvedValue(null);

      const res = await fn(new NextRequest('http://x/api/$ENTITY/id1'), params('id1'));

      expect(res.status).toBe(404);
      const called = prismaMock.$ENTITY.findFirst.mock.calls.length + prismaMock.$ENTITY.findUnique.mock.calls.length;
      if (called > 0) {
        const args = prismaMock.$ENTITY.findFirst.mock.calls[0]?.[0] ?? prismaMock.$ENTITY.findUnique.mock.calls[0]?.[0];
        expect(JSON.stringify(args)).toContain('tenant_A');
      }
      if (method === 'PATCH' || method === 'DELETE') {
        expect(prismaMock.$ENTITY.update).not.toHaveBeenCalled();
        expect(prismaMock.$ENTITY.delete).not.toHaveBeenCalled();
      }
    });
  }
});
EOF
  echo "  ✓ $TEST_FILE"
done

echo
echo "════════════════════════════════════════════════"
echo "Terminé."
echo
echo "Résumé :"
echo "  - $VULN route(s) tenant/[tenantId] sans check"
echo "  - $VULN2 route(s) [id] sans filtre tenant"
echo "  - 5 fichiers de test générés"
echo
echo "Étape suivante :"
echo "  npx vitest run src/__tests__/api/dossiers"
echo "════════════════════════════════════════════════"
