#!/usr/bin/env python3
"""scripts/fix-all.py — corrige le routing (typos, imports, pages manquantes)."""
from pathlib import Path
import re, subprocess, sys

ROOT = Path(__file__).resolve().parent.parent

def info(m): print(f"\033[1;34m→\033[0m {m}")
def ok(m):   print(f"\033[1;32m✓\033[0m {m}")
def warn(m): print(f"\033[1;33m!\033[0m {m}")
def err(m):  print(f"\033[1;31m✗\033[0m {m}")

# ──────────────────────────────────────────────────────────────
# 0. Accents dans les URLs d'API
# ──────────────────────────────────────────────────────────────
info("0) Accents dans les URLs d'API")
f = ROOT / "src/app/[locale]/admin/integrations/page.tsx"
if f.exists():
    s = f.read_text(encoding='utf-8')
    new = re.sub(r'/api/int[^\W\d_]+grations', '/api/integrations', s)
    if new != s:
        f.write_text(new, encoding='utf-8')
        ok(str(f.relative_to(ROOT)))
    else:
        ok(f"{f.relative_to(ROOT)} — rien à changer")

# ──────────────────────────────────────────────────────────────
# 1. ConnectEmailButton.tsx — réécriture complète
# ──────────────────────────────────────────────────────────────
info("1) ConnectEmailButton.tsx — réécriture complète")
f = ROOT / "src/components/emails/ConnectEmailButton.tsx"
if f.exists():
    f.with_suffix('.tsx.bak').write_text(f.read_text(encoding='utf-8'), encoding='utf-8')
    f.write_text(r"""'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Mail, CheckCircle, Loader2 } from 'lucide-react';

interface ConnectEmailButtonProps {
  provider?: 'gmail' | 'outlook';
  connectedEmail?: string | null;
  onConnect?: () => void;
  className?: string;
}

export function ConnectEmailButton({
  provider = 'gmail',
  connectedEmail,
  onConnect,
  className = '',
}: ConnectEmailButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleConnect = () => {
    setLoading(true);
    window.location.href = `/api/email/connect/${provider}`;
  };

  if (connectedEmail) {
    return (
      <div className={`flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl ${className}`}>
        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-green-900">Boîte mail connectée</p>
          <p className="text-xs text-green-700">{connectedEmail}</p>
        </div>
      </div>
    );
  }

  const config = {
    gmail: {
      label: 'Connecter Gmail',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
      ),
      bg: 'bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-blue-300',
      text: 'text-gray-700',
    },
    outlook: {
      label: 'Connecter Outlook',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#0078D4" d="M24 7.387v10.478c0 .23-.08.424-.238.576a.806.806 0 01-.588.234h-8.522v-8.97L16.2 11.2l1.548-1.452V7.387l-3.096 2.186L12 7.387V6.2c0-.16.054-.297.162-.41a.554.554 0 01.41-.164h10.604c.232 0 .426.078.586.234.16.156.238.35.238.578v.95z" />
          <path fill="#0078D4" d="M14.652 12.756V20H5.174a.806.806 0 01-.588-.234.768.768 0 01-.238-.578V4.812c0-.228.08-.422.238-.578a.806.806 0 01.588-.234h8.522v7.804l.956.952z" />
          <path fill="#28A8EA" d="M9.652 8.422c-.67 0-1.232.228-1.684.684C7.516 9.562 7.29 10.16 7.29 10.9c0 .74.226 1.34.678 1.8.452.46 1.014.69 1.684.69.67 0 1.232-.23 1.684-.69.452-.46.678-1.06.678-1.8 0-.74-.226-1.338-.678-1.794-.452-.456-1.014-.684-1.684-.684z" />
        </svg>
      ),
      bg: 'bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-blue-400',
      text: 'text-gray-700',
    },
  };

  const c = config[provider];

  return (
    <button
      onClick={handleConnect}
      disabled={loading}
      className={`flex items-center justify-center gap-3 w-full py-3.5 px-5 rounded-xl font-medium transition-all shadow-sm hover:shadow-md ${c.bg} ${c.text} disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : c.icon}
      <span>{loading ? 'Connexion...' : c.label}</span>
    </button>
  );
}

export function ConnectEmailPanel({
  connectedEmail,
}: {
  connectedEmail?: string | null;
}) {
  const { locale } = useParams<{ locale: string }>();
  return (
    <div className="space-y-3">
      <ConnectEmailButton provider="gmail" connectedEmail={connectedEmail} />
      <ConnectEmailButton provider="outlook" />
      <div className="flex items-center gap-3 text-xs text-gray-400">
        <div className="flex-1 h-px bg-gray-200" />
        <span>ou configuration manuelle</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>
      <a
        href={`/${locale}/settings/emails/imap`}
        className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-all"
      >
        <Mail className="w-4 h-4" />
        Configurer IMAP manuellement
      </a>
    </div>
  );
}
""", encoding='utf-8')
    ok(f"{f.relative_to(ROOT)} (backup .bak créé)")

# ──────────────────────────────────────────────────────────────
# 2. FeatureGate.tsx
# ──────────────────────────────────────────────────────────────
info("2) FeatureGate.tsx")
f = ROOT / "src/components/billing/FeatureGate.tsx"
if f.exists():
    s = f.read_text(encoding='utf-8')
    orig = s
    # 'use client' en tête si absent
    if "'use client';" not in s.split('\n', 3)[:3][0]:
        s = "'use client';\n" + s
    # import useParams
    if 'useParams' not in s:
        s = re.sub(r"('use client';\n)", r"\1import { useParams } from 'next/navigation';\n", s, count=1)
    # const { locale } dans le 1er composant exporté
    if 'const { locale }' not in s:
        m = re.search(
            r'export\s+(?:default\s+)?function\s+\w+\s*\((?:[^()]|\([^()]*\))*\)\s*(?::[^{]*?)?\s*\{',
            s)
        if m:
            s = s[:m.end()] + "\n  const { locale } = useParams<{ locale: string }>();" + s[m.end():]
        else:
            warn("  pas pu localiser le composant exporté — ajoute manuellement : const { locale } = useParams<{ locale: string }>();")
    # URL
    s = s.replace(
        'href="/settings/billing?upgrade=true"',
        'href={`/${locale}/billing?upgrade=true`}'
    )
    if s != orig:
        f.write_text(s, encoding='utf-8')
        ok(f"{f.relative_to(ROOT)}")
    else:
        ok(f"{f.relative_to(ROOT)} — rien à changer")

# ──────────────────────────────────────────────────────────────
# 3. Signout (AdminNavigation.tsx + Navigation.tsx)
# ──────────────────────────────────────────────────────────────
info("3) Signout dans AdminNavigation + Navigation")
SIGNOUT_RE = re.compile(
    r'<(a|Link)\b[^>]*href="/api/auth/signout"[^>]*>(.*?)</\1>',
    re.DOTALL,
)
INJECT = (
    "\n  const router = useRouter();\n"
    "  const { locale } = useParams<{ locale: string }>();\n"
    "  const handleSignout = async (e: React.MouseEvent) => {\n"
    "    e.preventDefault();\n"
    "    await fetch('/api/auth/signout', { method: 'POST', credentials: 'include' });\n"
    "    router.push(`/${locale}`);\n"
    "  };\n"
)
for rel in ("src/components/AdminNavigation.tsx", "src/components/Navigation.tsx"):
    f = ROOT / rel
    if not f.exists():
        warn(f"  {rel} introuvable")
        continue
    s = f.read_text(encoding='utf-8')
    orig = s
    if not s.startswith("'use client';"):
        s = "'use client';\n" + s
    if 'useRouter' not in s:
        s = re.sub(r"('use client';\n)", r"\1import { useRouter, useParams } from 'next/navigation';\n", s, count=1)
    if 'handleSignout' not in s:
        m = re.search(
            r'export\s+(?:default\s+)?function\s+\w+\s*\((?:[^()]|\([^()]*\))*\)\s*(?::[^{]*?)?\s*\{',
            s)
        if m:
            s = s[:m.end()] + INJECT + s[m.end():]
        else:
            warn(f"  {rel} : composant non localisé, injecte handleSignout manuellement")
    s = SIGNOUT_RE.sub(r'<button type="button" onClick={handleSignout}>\2</button>', s)
    if s != orig:
        f.write_text(s, encoding='utf-8')
        ok(rel)
    else:
        ok(f"{rel} — rien à changer")

# ──────────────────────────────────────────────────────────────
# 4. Pages manquantes
# ──────────────────────────────────────────────────────────────
info("4) Pages manquantes")

PAGES = {
"src/app/[locale]/documents/[id]/page.tsx": """import Link from 'next/link';

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
""",
"src/app/[locale]/emails/[id]/page.tsx": """import Link from 'next/link';

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
""",
"src/app/[locale]/super-admin/analytics/page.tsx": """export const metadata = { title: 'Analytics — Super Admin' };

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
""",
"src/app/[locale]/super-admin/system/page.tsx": """export const metadata = { title: 'Système — Super Admin' };

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
""",
}

for rel, content in PAGES.items():
    f = ROOT / rel
    if f.exists():
        warn(f"SKIP {rel} (existe)")
        continue
    f.parent.mkdir(parents=True, exist_ok=True)
    f.write_text(content, encoding='utf-8')
    ok(f"créé {rel}")

# ──────────────────────────────────────────────────────────────
# 5. Vérification
# ──────────────────────────────────────────────────────────────
info("5) Vérification")

def grep(pattern, include=('*.tsx', '*.ts')):
    args = ['grep', '-rInE', pattern, 'src']
    for inc in include:
        args += ['--include', inc]
    r = subprocess.run(args, capture_output=True, text=True)
    return r.stdout.strip()

checks = [
    ("URL d'API accentuée",      r"/api/[^\"'\`]*[éèêëàâäôöûüç]"),
    (r'href="/fr/...',           r'href="/fr/'),
    (r'signout résiduel en href', r'href="/api/auth/signout"'),
    (r'légal-proof résiduel',    r"l[ée]gal-proof"),
    (r'intégrations dans URL',   r"['\"\`]/[^'\"\`]*int[ée]grations"),
]
for label, pat in checks:
    out = grep(pat)
    if out:
        err(f"{label} — encore présent :")
        print(out)
    else:
        ok(f"{label} : aucun")

print()
ok("Script terminé.")
print("Étape suivante :")
print("  npx tsc --noEmit")
print("  npm run build")
print("  git add -A && git commit -m \"fix(routing): …\"")
