#!/usr/bin/env bash
# scripts/fix-all.sh — Applique toutes les corrections de routing détectées.
# Idempotent : relançable sans effet de bord.
set -uo pipefail

say()  { printf "\033[1;34m→\033[0m %s\n" "$*"; }
ok()   { printf "\033[1;32m✓\033[0m %s\n" "$*"; }
warn() { printf "\033[1;33m!\033[0m %s\n" "$*"; }
err()  { printf "\033[1;31m✗\033[0m %s\n" "$*"; }

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# ─────────────────────────────────────────────────────────────
# 0. Fix typos restants (accents dans URLs)
# ─────────────────────────────────────────────────────────────
say "0) Accents dans les URLs d'API"
if [[ -f "src/app/[locale]/admin/integrations/page.tsx" ]]; then
  perl -CSDA -i -pe 's{/api/int\Xgrations}{/api/integrations}g' \
    "src/app/[locale]/admin/integrations/page.tsx"
  ok "admin/integrations/page.tsx : /api/intégrations → /api/integrations"
fi

# ─────────────────────────────────────────────────────────────
# 1. Patch ConnectEmailButton.tsx (locale dynamique)
# ─────────────────────────────────────────────────────────────
say "1) ConnectEmailButton.tsx — locale dynamique"
FILE="src/components/emails/ConnectEmailButton.tsx"
if [[ -f "$FILE" ]]; then
  if ! grep -q "useParams" "$FILE"; then
    # remplace l'import React s'il existe, sinon ajoute après 'use client'
    if grep -q "from 'react'" "$FILE"; then
      perl -CSDA -i -pe "s{^import \{ useState \} from 'react';}{import { useState } from 'react';\nimport { useParams } from 'next/navigation';}m" "$FILE"
    else
      perl -CSDA -i -pe "s{^'use client';}{'use client';\nimport { useParams } from 'next/navigation';}m" "$FILE"
    fi
    ok "  import useParams ajouté"
  fi

  # dans ConnectEmailPanel (fonction qui contient le /fr/settings...), injecter const { locale }
  if ! grep -q "const { locale } = useParams" "$FILE"; then
    perl -CSDA -i -pe "s{(export function ConnectEmailPanel\(\{[\s\S]*?\}\)\s*\{)}{$1\n  const { locale } = useParams<{ locale: string }>();}m" "$FILE"
    ok "  const { locale } = useParams ajouté dans ConnectEmailPanel"
  fi

  # remplacer l'URL /fr codée en dur
  perl -CSDA -i -pe 's{href="/fr/settings/emails/imap"}{href={`/\${locale}/settings/emails/imap`}}g' "$FILE"
  ok "  href /fr → /\${locale}"
else
  warn "  $FILE introuvable"
fi

# ─────────────────────────────────────────────────────────────
# 2. Patch FeatureGate.tsx
# ─────────────────────────────────────────────────────────────
say "2) FeatureGate.tsx — /settings/billing → /\${locale}/billing"
FILE="src/components/billing/FeatureGate.tsx"
if [[ -f "$FILE" ]]; then
  if ! grep -q "useParams" "$FILE"; then
    if grep -q "from 'next/navigation'" "$FILE"; then
      perl -CSDA -i -pe "s{from 'next/navigation'}{from 'next/navigation'}g" "$FILE"  # no-op, on va ajouter proprement
    fi
    # ajoute après 'use client' ; sinon en haut
    if grep -q "^'use client';" "$FILE"; then
      perl -CSDA -i -pe "s{^'use client';}{'use client';\nimport { useParams } from 'next/navigation';}m" "$FILE"
    else
      perl -CSDA -i -pe "s{\A}{'use client';\nimport { useParams } from 'next/navigation';\n}" "$FILE"
    fi
    ok "  import useParams ajouté"
  fi

  # injecter const { locale } dans le composant principal exporté (heuristique : 1er `export function`)
  if ! grep -q "const { locale } = useParams" "$FILE"; then
    perl -CSDA -i -pe "s{(export (?:default )?function \w+\([^)]*\)\s*\{)}{$1\n  const { locale } = useParams<{ locale: string }>();}m" "$FILE"
    ok "  const { locale } = useParams injecté"
  fi

  perl -CSDA -i -pe 's{href="/settings/billing\?upgrade=true"}{href={`/\${locale}/billing?upgrade=true`}}g' "$FILE"
  ok "  href remplacé"
else
  warn "  $FILE introuvable"
fi

# ─────────────────────────────────────────────────────────────
# 3. Patch AdminNavigation.tsx + Navigation.tsx (signout POST)
# ─────────────────────────────────────────────────────────────
patch_signout() {
  local FILE="$1"
  [[ -f "$FILE" ]] || { warn "  $FILE introuvable"; return; }
  say "3) $FILE — signout POST"

  if ! grep -q "^'use client';" "$FILE"; then
    perl -CSDA -i -pe "s{\A}{'use client';\n}" "$FILE"
    ok "  'use client' ajouté"
  fi

  # import useRouter / useParams
  if ! grep -q "useRouter" "$FILE"; then
    perl -CSDA -i -pe "s{^('use client';)}{$1\nimport { useRouter, useParams } from 'next/navigation';}m" "$FILE"
    ok "  import useRouter/useParams ajouté"
  fi

  # handler + const router/locale : on injecte dans la 1ère fonction composant
  if ! grep -q "handleSignout" "$FILE"; then
    perl -CSDA -i -pe "s{(export (?:default )?function \w+\([^)]*\)\s*\{)}{$1\n  const router = useRouter();\n  const { locale } = useParams<{ locale: string }>();\n  const handleSignout = async (e: React.MouseEvent) => {\n    e.preventDefault();\n    await fetch('/api/auth/signout', { method: 'POST', credentials: 'include' });\n    router.push(\`/\${locale}\`);\n  };}m" "$FILE"
    ok "  handler signout injecté"
  fi

  # remplace <a href="/api/auth/signout">…</a> et <Link href="/api/auth/signout">…</Link>
  perl -CSDA -i -0pe 's{<(a|Link)\b[^>]*href="/api/auth/signout"[^>]*>(.*?)</\1>}{<button type="button" onClick={handleSignout}>$2</button>}gs' "$FILE"
  ok "  lien remplacé par bouton"
}

patch_signout "src/components/AdminNavigation.tsx"
patch_signout "src/components/Navigation.tsx"

# ─────────────────────────────────────────────────────────────
# 4. Pages UI manquantes
# ─────────────────────────────────────────────────────────────
say "4) Pages UI manquantes"

write() { # write <path>  (stdin)
  local f="$1"
  if [[ -e "$f" ]]; then warn "  SKIP $f (existe)"; cat >/dev/null; return; fi
  mkdir -p "$(dirname "$f")"; cat > "$f"; ok "  créé $f"
}

write "src/app/[locale]/documents/[id]/page.tsx" <<'EOF'
import Link from 'next/link';

export const metadata = { title: 'Document' };

export default async function DocumentDetailPage({
  params,
}: {
  params: { locale: string; id: string };
}) {
  const { locale, id } = params;
  const doc = { id, nom: '—', type: '—', createdAt: '—' };

  return (
    <main className="p-6 space-y-4">
      <Link href={`/${locale}/documents`} className="text-sm text-blue-600 hover:underline">
        ← Retour aux documents
      </Link>
      <h1 className="text-2xl font-semibold">Document {doc.nom}</h1>
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <dt className="text-gray-500">ID</dt><dd>{doc.id}</dd>
        <dt className="text-gray-500">Type</dt><dd>{doc.type}</dd>
        <dt className="text-gray-500">Créé le</dt><dd>{doc.createdAt}</dd>
      </dl>
      <a className="inline-block rounded bg-blue-600 px-3 py-2 text-sm text-white"
         href={`/api/documents/${id}/download`}>Télécharger</a>
    </main>
  );
}
EOF

write "src/app/[locale]/emails/[id]/page.tsx" <<'EOF'
import Link from 'next/link';

export const metadata = { title: 'Email' };

export default async function EmailDetailPage({
  params,
}: {
  params: { locale: string; id: string };
}) {
  const { locale, id } = params;
  const email = { id, from: '—', subject: '—', body: '—', date: '—' };

  return (
    <main className="p-6 space-y-4">
      <Link href={`/${locale}/emails`} className="text-sm text-blue-600 hover:underline">
        ← Retour aux emails
      </Link>
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">{email.subject}</h1>
        <p className="text-sm text-gray-500">De : {email.from} — {email.date}</p>
      </header>
      <article className="prose max-w-none whitespace-pre-wrap rounded border p-4">
        {email.body}
      </article>
    </main>
  );
}
EOF

write "src/app/[locale]/super-admin/analytics/page.tsx" <<'EOF'
export const metadata = { title: 'Analytics — Super Admin' };

export default function SuperAdminAnalyticsPage() {
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Analytics</h1>
      <p className="text-sm text-gray-500">
        Vue globale multi-tenant. TODO : brancher
        <code className="mx-1 rounded bg-gray-100 px-1">api/super-admin/stats</code>.
      </p>
    </main>
  );
}
EOF

write "src/app/[locale]/super-admin/system/page.tsx" <<'EOF'
export const metadata = { title: 'Système — Super Admin' };

export default function SuperAdminSystemPage() {
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Système</h1>
      <p className="text-sm text-gray-500">
        État des services, versions, jobs cron. TODO : brancher
        <code className="mx-1 rounded bg-gray-100 px-1">api/health</code> et
        <code className="mx-1 rounded bg-gray-100 px-1">api/version</code>.
      </p>
    </main>
  );
}
EOF

# ─────────────────────────────────────────────────────────────
# 5. Vérification
# ─────────────────────────────────────────────────────────────
say "5) Vérification"

echo
echo "── Accents résiduels dans les URLs d'API ──"
if grep -rInE "'/api/[^']*[éèêëàâäôöûüç]|\`/api/[^\`]*[éèêëàâäôöûüç]" src --include='*.tsx' --include='*.ts' 2>/dev/null; then
  err "il en reste"
else
  ok "aucun"
fi

echo
echo "── Typo 'légal-proof' / 'intégrations' (URL uniquement) ──"
if grep -rInE "l[ée]gal-proof|/lawyer/int[ée]grations" src --include='*.tsx' --include='*.ts' 2>/dev/null | grep -v "Preuve légale"; then
  warn "occurrences résiduelles (vérifier manuellement)"
else
  ok "aucune"
fi

echo
echo "── /fr/ codé en dur dans href ──"
if grep -rInE 'href="/fr/' src --include='*.tsx' 2>/dev/null; then
  warn "trouvé des href=/fr/..."
else
  ok "aucun"
fi

echo
echo "── /api/auth/signout (doit rester en POST côté code) ──"
grep -rIn "api/auth/signout" src/components 2>/dev/null || warn "aucune référence"

echo
echo "── Régénère routes + destinations et compare ──"
find src/app -type f \( -name 'page.tsx' -o -name 'route.ts' \) \
  | sort | sed 's#src/app/##' \
  | sed -E 's#/page\.tsx$##; s#/route\.ts$##' \
  > /tmp/memolib-routes.txt

grep -rInE "href=|router\.(push|replace)\(|redirect\(|href\s*:|path\s*:|to\s*:|url\s*:" src \
  | grep -vE "node_modules|\.next|__tests__|\.test\.|\.spec\.|/examples/|lib/websocket|hooks/useWebSocket" \
  > /tmp/memolib-destinations.txt

if [[ -f /tmp/memolib-check.py ]]; then
  python3 /tmp/memolib-check.py
else
  warn "checker /tmp/memolib-check.py absent"
fi

echo
ok "Terminé. Lance : npx tsc --noEmit && npm run build"
