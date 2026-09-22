#!/usr/bin/env python3
"""
fix-compliance-tests.py — Adapte les 2 tests compliance au nouveau contrat RGPD.
- Test 'requires authentication' → devient 'accepts anonymous consent'
- Test 'records only validated' → ajoute un mock user connecté
Idempotent, backup automatique.
"""
import re
import shutil
from datetime import datetime
from pathlib import Path

TS = datetime.now().strftime("%Y%m%d-%H%M%S")
ROOT = Path.cwd()
TEST = ROOT / "src/__tests__/api/compliance-routes.test.ts"

if not TEST.exists():
    print(f"✗ {TEST} introuvable")
    raise SystemExit(1)

# Backup
bak = TEST.with_suffix(TEST.suffix + f".bak-{TS}")
shutil.copy2(TEST, bak)
print(f"✓ backup : {bak.name}")

src = TEST.read_text()
changes = 0

# ═════════════════════════════════════════════════════════════
# 1. Remplace le test 'requires authentication' par 'accepts anonymous'
# ═════════════════════════════════════════════════════════════
pattern_auth = re.compile(
    r"it\(['\"]requires authentication before recording consent['\"][\s\S]*?\n\s*\}\);",
    re.MULTILINE
)

new_test = """it('accepts anonymous consent (RGPD) and does NOT require auth', async () => {
    const request = new NextRequest('http://localhost/api/compliance/consent', {
      method: 'POST',
      body: JSON.stringify({
        consents: [{ type: 'analytics', granted: false, policyVersion: '2026-10-01' }],
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(gdpr.recordConsents).not.toHaveBeenCalled();
  });"""

src2, n = pattern_auth.subn(new_test, src, count=1)
if n > 0:
    src = src2
    changes += 1
    print("✓ test 'requires authentication' remplacé par 'accepts anonymous'")
else:
    print("⏭  test 'requires authentication' non trouvé (déjà adapté ?)")

# ═════════════════════════════════════════════════════════════
# 2. Dans 'records only validated', ajoute un mock user connecté
# ═════════════════════════════════════════════════════════════
# Cherche le test et insère le mock auth au début
pattern_records = re.compile(
    r"(it\(['\"]records only validated[^']*['\"]\s*,\s*async\s*\(\s*\)\s*=>\s*\{\s*\n)",
    re.MULTILINE
)

mock_user = """    // Simule un user connecté pour forcer recordConsents
    const clerk = await import('@clerk/nextjs/server');
    (clerk.auth as any).mockResolvedValueOnce?.({
      userId: 'user_test_1',
      sessionId: 'sess_test',
      orgId: null,
      isAuthenticated: true,
    }) ?? vi.mocked(clerk.auth).mockResolvedValueOnce({
      userId: 'user_test_1',
      sessionId: 'sess_test',
      orgId: null,
      isAuthenticated: true,
    } as any);

"""

def insert_mock(m):
    return m.group(1) + mock_user

src2, n = pattern_records.subn(insert_mock, src, count=1)
if n > 0:
    src = src2
    changes += 1
    print("✓ mock user ajouté dans 'records only validated'")
else:
    print("⏭  test 'records only validated' non trouvé ou déjà modifié")

# Écrit
if changes > 0:
    TEST.write_text(src)
    print()
    print(f"✓ {changes} modification(s) appliquée(s)")
else:
    print()
    print("⚠  Aucune modification — le fichier est peut-être déjà à jour")
    print("   ou la structure a changé. Inspecte :")
    print(f"   sed -n '1,80p' {TEST}")

print()
print("═" * 60)
print("Vérifie :")
print("  npx vitest run src/__tests__/api/compliance-routes.test.ts 2>&1 | tail -12")
print("  npx vitest run 2>&1 | tail -12")
print("═" * 60)
