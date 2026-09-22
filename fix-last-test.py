#!/usr/bin/env python3
"""fix-last-test.py — Remplace le test 'accepts anonymous' par la version correcte."""
import re
import shutil
from datetime import datetime
from pathlib import Path

TS = datetime.now().strftime("%Y%m%d-%H%M%S")
p = Path("src/__tests__/api/compliance-routes.test.ts")

if not p.exists():
    print(f"✗ {p} introuvable")
    raise SystemExit(1)

# Backup
bak = p.with_suffix(p.suffix + f".bak-{TS}")
shutil.copy2(p, bak)
print(f"✓ backup : {bak.name}")

src = p.read_text()

# Nouveau test complet
new_test = """  it('accepts anonymous consent (RGPD) and does NOT require auth', async () => {
    // Force l'état anonyme (override le beforeEach)
    const clerk = await import('@clerk/nextjs/server');
    vi.mocked(clerk.auth).mockResolvedValueOnce({
      userId: null,
      sessionId: null,
      orgId: null,
      isAuthenticated: false,
    } as any);

    const request = new NextRequest('http://localhost/api/compliance/consent', {
      method: 'POST',
      body: JSON.stringify({
        consents: [{ type: 'analytics', granted: false, policyVersion: '2026-10-01' }],
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await createConsent(request);

    expect(response.status).toBe(200);
    expect(gdpr.recordConsents).not.toHaveBeenCalled();
  });"""

# Remplace tout le bloc 'accepts anonymous' jusqu'au prochain 'it(' ou fin de describe
pattern = re.compile(
    r"it\(['\"]accepts anonymous[\s\S]*?(?=\n\s*it\(|\n\}\);)",
    re.MULTILINE
)

new_src, n = pattern.subn(new_test, src, count=1)

if n == 0:
    print("✗ pattern non trouvé")
    print("  Inspecte le fichier :")
    print("    sed -n '45,75p' src/__tests__/api/compliance-routes.test.ts")
    raise SystemExit(1)

p.write_text(new_src)
print(f"✓ test 'accepts anonymous' remplacé")
print()
print("═" * 60)
print("Vérifie :")
print("  npx vitest run src/__tests__/api/compliance-routes.test.ts 2>&1 | tail -10")
print("  npx vitest run 2>&1 | tail -12")
print("═" * 60)
