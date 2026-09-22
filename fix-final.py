#!/usr/bin/env python3
"""
fix-final.py — Restaure ConsentBanner + fixe les mocks du test emails.
Idempotent : peut être relancé sans casser.
"""
import re
import shutil
import sys
from datetime import datetime
from pathlib import Path

TS = datetime.now().strftime("%Y%m%d-%H%M%S")
ROOT = Path.cwd()

def backup(p: Path):
    b = p.with_suffix(p.suffix + f".bak-{TS}")
    shutil.copy2(p, b)
    print(f"  ✓ backup : {b.name}")

# ═════════════════════════════════════════════════════════════
# 1. ConsentBanner.tsx — restaure le plus ancien backup puis patche
# ═════════════════════════════════════════════════════════════
print("▶ [1/2] ConsentBanner.tsx")
banner = ROOT / "src/components/compliance/ConsentBanner.tsx"

if not banner.exists():
    print("  ✗ fichier introuvable, skip")
else:
    # Cherche le backup le PLUS ANCIEN (avant que tout soit cassé)
    candidates = sorted(banner.parent.glob("ConsentBanner.tsx.bak-*"))
    if candidates:
        oldest = candidates[0]
        shutil.copy2(oldest, banner)
        print(f"  ✓ restauré depuis {oldest.name}")
    else:
        print("  ⚠  aucun backup, on patche le fichier actuel")

    src = banner.read_text()

    # Cherche la fonction saveConsentToServer (peu importe son corps)
    pattern = re.compile(
        r"(const\s+saveConsentToServer\s*=\s*async\s*\([^)]*\)\s*=>\s*\{)(.*?)(\n\s{4}\};)",
        re.DOTALL
    )

    new_body = """
        try {
            await fetch('/api/compliance/consent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    consents: Object.entries(prefs).map(([type, granted]) => ({
                        type,
                        granted,
                        policyVersion: '2026-10-01',
                    })),
                }),
                keepalive: true,
            });
        } catch (error) {
            console.debug('[consent] save skipped:', error);
        }
    """

    def replace_fn(m):
        return m.group(1) + new_body + m.group(3)

    src2, n = pattern.subn(replace_fn, src, count=1)
    if n == 0:
        print("  ⚠  fonction saveConsentToServer non trouvée")
        print("     → vérifie manuellement avec : grep -n saveConsentToServer " + str(banner))
    else:
        backup(banner)
        banner.write_text(src2)
        print("  ✓ saveConsentToServer remplacée (policyVersion + keepalive)")

print()

# ═════════════════════════════════════════════════════════════
# 2. Test emails — ajoute le mock workspace
# ═════════════════════════════════════════════════════════════
print("▶ [2/2] workspace-emails-route.test.ts")
test = ROOT / "src/__tests__/api/lawyer/workspace-emails-route.test.ts"

if not test.exists():
    print("  ✗ fichier introuvable, skip")
else:
    src = test.read_text()
    changed = False

    # 2a. Ajoute workspace.findFirst dans le mock prisma
    if "workspace:" not in src:
        # Cherche `workspaceEmail: {` et insère `workspace: { findFirst: vi.fn() },` avant
        pattern_mock = re.compile(
            r"(\bworkspaceEmail\s*:\s*\{)",
            re.MULTILINE
        )
        def add_ws_mock(m):
            return "workspace: { findFirst: vi.fn() },\n    " + m.group(1)
        src2, n = pattern_mock.subn(add_ws_mock, src, count=1)
        if n > 0:
            src = src2
            changed = True
            print("  ✓ mock workspace.findFirst ajouté")
        else:
            print("  ⚠  structure du mock non reconnue")
    else:
        print("  ⏭  mock workspace déjà présent")

    # 2b. Dans beforeEach, ajoute le mockResolvedValue du workspace
    if "workspace.findFirst.mockResolvedValue" not in src:
        # Cherche beforeEach(() => { ... vi.clearAllMocks() ou autre
        pattern_before = re.compile(
            r"(beforeEach\s*\(\s*\(\s*\)\s*=>\s*\{\s*\n)",
            re.MULTILINE
        )
        def add_ws_resolve(m):
            return (
                m.group(1)
                + "    prismaMock.workspace.findFirst.mockResolvedValue({ id: 'ws-test-1' });\n"
            )
        src2, n = pattern_before.subn(add_ws_resolve, src, count=1)
        if n > 0:
            src = src2
            changed = True
            print("  ✓ workspace.findFirst.mockResolvedValue ajouté dans beforeEach")
        else:
            print("  ⚠  beforeEach non reconnu — ajoute à la main :")
            print("       prismaMock.workspace.findFirst.mockResolvedValue({ id: 'ws-test-1' });")

    # 2c. Dans les tests POST, ajoute workspaceEmail.findFirst (notre guard l'appelle)
    if "workspaceEmail.findFirst" not in src:
        # Cherche workspaceEmail.update et ajoute findFirst dans le mock
        pattern_email = re.compile(
            r"(workspaceEmail\s*:\s*\{)",
            re.MULTILINE
        )
        def add_email_findfirst(m):
            # Si findFirst déjà là, ne rien faire
            return m.group(1) + " findFirst: vi.fn(),"
        src2, n = pattern_email.subn(add_email_findfirst, src, count=1)
        if n > 0:
            src = src2
            changed = True
            print("  ✓ workspaceEmail.findFirst ajouté au mock")
    else:
        print("  ⏭  workspaceEmail.findFirst déjà mocké")

    if changed:
        backup(test)
        test.write_text(src)
        print("  ✓ test mis à jour")
    else:
        print("  ⏭  aucun changement nécessaire")

print()
print("═" * 60)
print("✓ Terminé. Backups : *.bak-" + TS)
print()
print("Prochaines étapes (dans WSL !) :")
print()
print("  1. Vérifie les types :")
print("       npx tsc --noEmit 2>&1 | head -10")
print()
print("  2. Lance les tests ciblés :")
print("       npx vitest run src/__tests__/api/lawyer/workspace-emails-route.test.ts")
print()
print("  3. Lance TOUS les tests :")
print("       npx vitest run 2>&1 | tail -30")
print("═" * 60)
