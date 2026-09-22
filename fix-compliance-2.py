#!/usr/bin/env python3
"""fix-compliance-2.py — Corrige les 2 tests compliance."""
import re
import shutil
from datetime import datetime
from pathlib import Path

TS = datetime.now().strftime("%Y%m%d-%H%M%S")
TEST = Path("src/__tests__/api/compliance-routes.test.ts")

if not TEST.exists():
    print(f"✗ {TEST} introuvable")
    raise SystemExit(1)

bak = TEST.with_suffix(TEST.suffix + f".bak-{TS}")
shutil.copy2(TEST, bak)
print(f"✓ backup : {bak.name}")

src = TEST.read_text()
changes = 0

# ─── 1. Dans le test 'accepts anonymous' : POST → createConsent ───
if "const response = await POST(request);" in src:
    src = src.replace(
        "const response = await POST(request);",
        "const response = await createConsent(request);"
    )
    changes += 1
    print("✓ 'POST(request)' → 'createConsent(request)'")

# ─── 2. Remplace userId 'user_test_1' par 'user-1' dans le mock ───
n = src.count("userId: 'user_test_1'")
if n > 0:
    src = src.replace("userId: 'user_test_1'", "userId: 'user-1'")
    changes += 1
    print(f"✓ 'user_test_1' → 'user-1' ({n} occurrence)")

# ─── 3. Simplifie le mock (utilise vi.mocked au lieu de ??) ───
old_mock = """    // Simule un user connecté pour forcer recordConsents
    const clerk = await import('@clerk/nextjs/server');
    (clerk.auth as any).mockResolvedValueOnce?.({
      userId: 'user-1',
      sessionId: 'sess_test',
      orgId: null,
      isAuthenticated: true,
    }) ?? vi.mocked(clerk.auth).mockResolvedValueOnce({
      userId: 'user-1',
      sessionId: 'sess_test',
      orgId: null,
      isAuthenticated: true,
    } as any);
"""

new_mock = """    // Simule un user connecté pour forcer recordConsents
    const clerk = await import('@clerk/nextjs/server');
    vi.mocked(clerk.auth).mockResolvedValueOnce({
      userId: 'user-1',
      sessionId: 'sess_test',
      orgId: null,
      isAuthenticated: true,
    } as any);
"""

if old_mock in src:
    src = src.replace(old_mock, new_mock)
    changes += 1
    print("✓ mock simplifié (vi.mocked direct)")
else:
    # Essaie avec l'ancienne version user_test_1
    old_mock2 = old_mock.replace("'user-1'", "'user_test_1'")
    if old_mock2 in src:
        src = src.replace(old_mock2, new_mock)
        changes += 1
        print("✓ mock simplifié + userId corrigé")

if changes == 0:
    print("⚠  Aucun changement appliqué — le fichier est peut-être déjà correct")

TEST.write_text(src)
print()
print(f"✓ {changes} modification(s)")
print()
print("═" * 60)
print("Vérifie :")
print("  npx vitest run src/__tests__/api/compliance-routes.test.ts 2>&1 | tail -12")
print("═" * 60)
