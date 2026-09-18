#!/usr/bin/env python3
"""Corrige les 9 erreurs tsc remontées après fix-all.py."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent

def ok(m):   print(f"\033[1;32m✓\033[0m {m}")
def warn(m): print(f"\033[1;33m!\033[0m {m}")

# ──────────────────────────────────────────────────────────────
# 1) api/auth/signout/route.ts — cookies() est async
# ──────────────────────────────────────────────────────────────
f = ROOT / "src/app/api/auth/signout/route.ts"
if f.exists():
    s = f.read_text(encoding='utf-8')
    # Remplace tout le corps par une version correcte
    f.write_text("""import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  // Next 15 : cookies() est async
  const jar = await cookies();
  jar.delete('session');
  jar.delete('next-auth.session-token');
  jar.delete('__Secure-next-auth.session-token');
  return NextResponse.json({ ok: true });
}
""", encoding='utf-8')
    ok(f"{f.relative_to(ROOT)}")
else:
    warn(f"{f.relative_to(ROOT)} introuvable")

# ──────────────────────────────────────────────────────────────
# 2) AdminNavigation.tsx — supprimer le doublon useParams
# ──────────────────────────────────────────────────────────────
for rel, keep_var in [
    ("src/components/AdminNavigation.tsx", "locale"),
    ("src/components/Navigation.tsx",      "locale"),
]:
    f = ROOT / rel
    if not f.exists():
        warn(f"{rel} introuvable")
        continue
    s = f.read_text(encoding='utf-8')
    orig = s
    # Supprime la ligne injectée (avec ou sans type générique)
    s = re.sub(
        r"^\s*const\s*\{\s*locale\s*\}\s*=\s*useParams<\{[^}]+\}>\(\);\s*\n",
        "",
        s, flags=re.M)
    # Nettoie aussi l'import useParams s'il devient inutilisé
    if 'useParams' not in re.sub(
        r"^import[^\n]*useParams[^\n]*\n", "", s, flags=re.M
    ):
        s = re.sub(
            r"^import\s*\{\s*useRouter\s*,\s*useParams\s*\}\s*from\s*'next/navigation';\s*\n",
            "import { useRouter } from 'next/navigation';\n",
            s, flags=re.M)
    if s != orig:
        f.write_text(s, encoding='utf-8')
        ok(f"{rel} — doublon 'locale' supprimé")
    else:
        ok(f"{rel} — rien à changer")

# ──────────────────────────────────────────────────────────────
# 3) FeatureGate.tsx — injecter locale correctement
# ──────────────────────────────────────────────────────────────
f = ROOT / "src/components/billing/FeatureGate.tsx"
if f.exists():
    s = f.read_text(encoding='utf-8')

    # s'assurer que 'use client' est en tête
    if not s.lstrip().startswith("'use client'"):
        s = "'use client';\n" + s

    # importer useParams si absent
    if 'useParams' not in s:
        if "from 'next/navigation'" in s:
            s = re.sub(
                r"import\s*\{\s*([^}]+?)\s*\}\s*from\s*'next/navigation';",
                lambda m: f"import {{ {m.group(1).strip()}, useParams }} from 'next/navigation';",
                s, count=1)
        else:
            s = re.sub(
                r"('use client';\n)",
                r"\1import { useParams } from 'next/navigation';\n",
                s, count=1)

    # Injecter `const { locale } = useParams<{ locale: string }>();` en tête
    # du 1er composant (function OU const X = (...) => {)
    if 'const { locale } = useParams' not in s:
        patterns = [
            # export function Name(...) ... {
            r'(export\s+(?:default\s+)?function\s+\w+\s*\([^)]*\)\s*(?::[^{]*?)?\s*\{)',
            # export const Name = (...) => {
            r'(export\s+(?:default\s+)?const\s+\w+\s*(?::[^=]*)?=\s*\([^)]*\)\s*=>\s*\{)',
            # const Name = (...) => {
            r'(const\s+\w+\s*(?::[^=]*)?=\s*\([^)]*\)\s*=>\s*\{)',
        ]
        injected = False
        for pat in patterns:
            m = re.search(pat, s)
            if m:
                s = s[:m.end()] + "\n  const { locale } = useParams<{ locale: string }>();" + s[m.end():]
                injected = True
                break
        if injected:
            ok(f"{f.relative_to(ROOT)} — locale injecté")
        else:
            warn(f"{f.relative_to(ROOT)} — composant introuvable, injecte à la main : const {{ locale }} = useParams<{{ locale: string }}>();")

    f.write_text(s, encoding='utf-8')
    ok(f"{f.relative_to(ROOT)} — écrit")

# ──────────────────────────────────────────────────────────────
# Vérif
# ──────────────────────────────────────────────────────────────
print()
ok("Fix appliqué. Relance : npx tsc --noEmit")
