#!/usr/bin/env python3
"""fix-idor-v2.py — Patche les 3 routes avec brace-matching correct."""
import re, shutil
from datetime import datetime
from pathlib import Path

TS = datetime.now().strftime("%Y%m%d-%H%M%S")
ROOT = Path.cwd()

def backup(p):
    b = p.with_suffix(p.suffix + f".bak-{TS}")
    shutil.copy2(p, b)
    print(f"  ✓ backup : {b.name}")

def find_block_end(text, start):
    """Trouve la position de la } fermant le bloc { ouvert à start."""
    assert text[start] == '{', f"pas une accolade à {start}"
    depth = 0
    i = start
    in_str = None
    while i < len(text):
        c = text[i]
        # gère les chaînes
        if in_str:
            if c == '\\':
                i += 2
                continue
            if c == in_str:
                in_str = None
        else:
            if c in ('"', "'", '`'):
                in_str = c
            elif c == '{':
                depth += 1
            elif c == '}':
                depth -= 1
                if depth == 0:
                    return i
        i += 1
    raise ValueError("bloc non fermé")

GUARD = """    const tenantId = (user as any).tenantId as string;
    if (!tenantId || !(await assertWorkspaceAccess(params.id, tenantId))) {
      return NextResponse.json({ error: 'Workspace non trouvé' }, { status: 404 });
    }
"""

def add_guard(text):
    """Après chaque 'if (!user) { ... }', insère le guard."""
    pattern = re.compile(r'if\s*\(\s*!\s*user\s*\)\s*\{')
    insertions = []
    for m in pattern.finditer(text):
        open_brace = text.index('{', m.start())
        close_brace = find_block_end(text, open_brace)
        # Cherche la fin de ligne après le close_brace
        end = close_brace + 1
        while end < len(text) and text[end] in ' \t':
            end += 1
        if end < len(text) and text[end] == '\n':
            end += 1
        insertions.append(end)
    # Insère de la fin vers le début pour ne pas casser les index
    for pos in reversed(insertions):
        text = text[:pos] + GUARD + text[pos:]
    return text, len(insertions)

# ─── 1. quick-actions ───
qa = ROOT / "src/app/api/tenant/[tenantId]/quick-actions/route.ts"
print("▶ quick-actions/route.ts")
backup(qa)
src = qa.read_text()

OLD = """      case 'update_dossier_status':
        const updatedDossier = await prisma.dossier.update({
          where: { id: data.dossierId },
          data: {
            statut: data.statut,
            lastActivityAt: new Date()
          }
        });
        return NextResponse.json({ success: true, dossier: updatedDossier });"""

NEW = """      case 'update_dossier_status': {
        const target = await prisma.dossier.findFirst({
          where: { id: data.dossierId, tenantId },
          select: { id: true },
        });
        if (!target) {
          return NextResponse.json({ error: 'Dossier non trouvé' }, { status: 404 });
        }
        const updatedDossier = await prisma.dossier.update({
          where: { id: target.id },
          data: {
            statut: data.statut,
            lastActivityAt: new Date()
          }
        });
        return NextResponse.json({ success: true, dossier: updatedDossier });
      }"""

if OLD in src:
    src = src.replace(OLD, NEW)
    print("  ✓ update_dossier_status patché")
else:
    print("  ⏭  déjà patché ou contenu différent")

OLD2 = """      case 'mark_echeance_complete':
        const updatedEcheance = await prisma.echeance.update({
          where: { id: data.echeanceId },
          data: {
            statut: 'termine',
            completedAt: new Date()
          }
        });
        return NextResponse.json({ success: true, echeance: updatedEcheance });"""

NEW2 = """      case 'mark_echeance_complete': {
        const target = await prisma.echeance.findFirst({
          where: { id: data.echeanceId, dossier: { tenantId } },
          select: { id: true },
        });
        if (!target) {
          return NextResponse.json({ error: 'Échéance non trouvée' }, { status: 404 });
        }
        const updatedEcheance = await prisma.echeance.update({
          where: { id: target.id },
          data: {
            statut: 'termine',
            completedAt: new Date()
          }
        });
        return NextResponse.json({ success: true, echeance: updatedEcheance });
      }"""

if OLD2 in src:
    src = src.replace(OLD2, NEW2)
    print("  ✓ mark_echeance_complete patché")
else:
    print("  ⏭  déjà patché ou contenu différent")

qa.write_text(src)
print()

# ─── 2. emails ───
em = ROOT / "src/app/api/lawyer/workspaces/[id]/emails/route.ts"
print("▶ emails/route.ts")
backup(em)
src = em.read_text()

if 'assertWorkspaceAccess' not in src:
    src = src.replace(
        "import { prisma } from '@/lib/prisma';",
        "import { prisma } from '@/lib/prisma';\nimport { assertWorkspaceAccess } from '@/lib/auth/workspace-access';",
        1
    )
    print("  ✓ import ajouté")

src, n = add_guard(src)
print(f"  ✓ guards insérés : {n}")

OLD3 = """    const email = await prisma.workspaceEmail.update({
      where: { id: emailId },
      data: updateData,
    });"""
NEW3 = """    const existing = await prisma.workspaceEmail.findFirst({
      where: { id: emailId, workspaceId: params.id },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Email non trouvé' }, { status: 404 });
    }
    const email = await prisma.workspaceEmail.update({
      where: { id: existing.id },
      data: updateData,
    });"""
n2 = src.count(OLD3)
src = src.replace(OLD3, NEW3)
print(f"  ✓ filtre emailId∈workspaceId : {n2} occurrence(s)")

em.write_text(src)
print()

# ─── 3. procedures ───
pr = ROOT / "src/app/api/lawyer/workspaces/[id]/procedures/route.ts"
print("▶ procedures/route.ts")
backup(pr)
src = pr.read_text()

if 'assertWorkspaceAccess' not in src:
    src = src.replace(
        "import { prisma } from '@/lib/prisma';",
        "import { prisma } from '@/lib/prisma';\nimport { assertWorkspaceAccess } from '@/lib/auth/workspace-access';",
        1
    )
    print("  ✓ import ajouté")

src, n = add_guard(src)
print(f"  ✓ guards insérés : {n}")

pr.write_text(src)
print()

print("═" * 60)
print("✓ Patch terminé. Backups *.bak-" + TS)
print()
print("Vérifie la syntaxe :")
print("  npx tsc --noEmit 'src/app/api/lawyer/workspaces/[id]/emails/route.ts'")
print()
print("Relance les tests :")
print("  npx vitest run src/__tests__/api/tenant src/__tests__/api/lawyer")
print("═" * 60)
