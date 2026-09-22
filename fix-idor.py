#!/usr/bin/env python3
"""
fix-idor.py — Patche automatiquement les 3 routes IDOR confirmées.
Backup automatique + vérifications avant/après.
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

def write(p: Path, content: str):
    p.write_text(content)

# ─────────────────────────────────────────────────────────────
# 1. Helper assertWorkspaceAccess
# ─────────────────────────────────────────────────────────────
helper = ROOT / "src/lib/auth/workspace-access.ts"
helper.parent.mkdir(parents=True, exist_ok=True)
helper.write_text('''import { prisma } from '@/lib/prisma';

/**
 * Vérifie que le workspace appartient bien au tenant de l'utilisateur.
 * Retourne false si le workspace n'existe pas OU appartient à un autre tenant.
 * → la route appelante doit renvoyer 404 (jamais 403, pour ne pas fuiter l'existence).
 */
export async function assertWorkspaceAccess(
  workspaceId: string,
  tenantId: string
): Promise<boolean> {
  const ws = await prisma.workspace.findFirst({
    where: { id: workspaceId, tenantId },
    select: { id: true },
  });
  return ws !== null;
}
''')
print(f"✓ helper créé : {helper.relative_to(ROOT)}")
print()

# ─────────────────────────────────────────────────────────────
# 2. quick-actions/route.ts — filtre tenantId sur update
# ─────────────────────────────────────────────────────────────
qa = ROOT / "src/app/api/tenant/[tenantId]/quick-actions/route.ts"
print("▶ Patch quick-actions/route.ts")
backup(qa)
src = qa.read_text()

old_dossier = """      case 'update_dossier_status':
        const updatedDossier = await prisma.dossier.update({
          where: { id: data.dossierId },
          data: {
            statut: data.statut,
            lastActivityAt: new Date()
          }
        });
        return NextResponse.json({ success: true, dossier: updatedDossier });"""

new_dossier = """      case 'update_dossier_status': {
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

old_echeance = """      case 'mark_echeance_complete':
        const updatedEcheance = await prisma.echeance.update({
          where: { id: data.echeanceId },
          data: {
            statut: 'termine',
            completedAt: new Date()
          }
        });
        return NextResponse.json({ success: true, echeance: updatedEcheance });"""

new_echeance = """      case 'mark_echeance_complete': {
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

changed = 0
if old_dossier in src:
    src = src.replace(old_dossier, new_dossier)
    changed += 1
    print("  ✓ update_dossier_status patché")
else:
    print("  ⚠  update_dossier_status non trouvé (déjà patché ?)")

if old_echeance in src:
    src = src.replace(old_echeance, new_echeance)
    changed += 1
    print("  ✓ mark_echeance_complete patché")
else:
    print("  ⚠  mark_echeance_complete non trouvé")

write(qa, src)
print()

# ─────────────────────────────────────────────────────────────
# 3. emails/route.ts — assertWorkspaceAccess + filtre emailId
# ─────────────────────────────────────────────────────────────
em = ROOT / "src/app/api/lawyer/workspaces/[id]/emails/route.ts"
print("▶ Patch emails/route.ts")
backup(em)
src = em.read_text()

# 3a. Import du helper
if 'assertWorkspaceAccess' not in src:
    src = src.replace(
        "import { prisma } from '@/lib/prisma';",
        "import { prisma } from '@/lib/prisma';\nimport { assertWorkspaceAccess } from '@/lib/auth/workspace-access';"
    )
    print("  ✓ import ajouté")

# 3b. Check d'accès après chaque "if (!user)"
guard = """    const tenantId = (user as any).tenantId as string;
    if (!tenantId || !(await assertWorkspaceAccess(params.id, tenantId))) {
      return NextResponse.json({ error: 'Workspace non trouvé' }, { status: 404 });
    }"""

# Motif : "if (!user) { return ... 401 ... }" suivi d'autre chose
pattern_401 = re.compile(
    r"(if \(!user\)\s*\{[^}]*?\}\s*)",
    re.DOTALL
)

def add_guard(match):
    block = match.group(1)
    # Évite double insertion si déjà patché
    return block

# Compte les "if (!user)" avant patch
count_before = src.count("if (!user)")
src = pattern_401.sub(lambda m: m.group(1) + "\n" + guard + "\n", src)
count_after = src.count("assertWorkspaceAccess(params.id")

if count_after >= count_before and count_before > 0:
    print(f"  ✓ guard ajouté sur {count_after} handler(s)")
else:
    print(f"  ⚠  guard non ajouté proprement ({count_before} 'if(!user)' trouvés, {count_after} guards)")

# 3c. Filtre emailId avant update dans PATCH et POST
old_update = """    const email = await prisma.workspaceEmail.update({
      where: { id: emailId },
      data: updateData,
    });"""

new_update = """    const existing = await prisma.workspaceEmail.findFirst({
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

# Remplace TOUTES les occurrences (PATCH + POST)
n = src.count(old_update)
src = src.replace(old_update, new_update)
if n > 0:
    print(f"  ✓ filtre emailId∈workspaceId ajouté ({n} occurrence)")

write(em, src)
print()

# ─────────────────────────────────────────────────────────────
# 4. procedures/route.ts — assertWorkspaceAccess
# ─────────────────────────────────────────────────────────────
pr = ROOT / "src/app/api/lawyer/workspaces/[id]/procedures/route.ts"
print("▶ Patch procedures/route.ts")
backup(pr)
src = pr.read_text()

# 4a. Import
if 'assertWorkspaceAccess' not in src:
    src = src.replace(
        "import { prisma } from '@/lib/prisma';",
        "import { prisma } from '@/lib/prisma';\nimport { assertWorkspaceAccess } from '@/lib/auth/workspace-access';"
    )
    print("  ✓ import ajouté")

# 4b. Guard après chaque if (!user)
count_before = src.count("if (!user)")
src = pattern_401.sub(lambda m: m.group(1) + "\n" + guard + "\n", src)
count_after = src.count("assertWorkspaceAccess(params.id")

if count_after > 0:
    print(f"  ✓ guard ajouté sur {count_after} handler(s)")
else:
    print(f"  ⚠  guard non ajouté ({count_before} 'if(!user)' trouvés)")

write(pr, src)
print()

print("═" * 60)
print("✓ Patch terminé.")
print()
print("Relance les tests :")
print("  npx vitest run src/__tests__/api/tenant src/__tests__/api/lawyer")
print("═" * 60)
