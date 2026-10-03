#!/usr/bin/env bash
set -euo pipefail

say()  { printf "\033[1;34m→\033[0m %s\n" "$*"; }
skip() { printf "\033[1;33mSKIP\033[0m %s (existe déjà)\n" "$*"; }
mk()   { mkdir -p "$(dirname "$1")"; }

write() {  # write <path>  (contenu sur stdin)
  local f="$1"
  if [[ -e "$f" ]]; then skip "$f"; cat >/dev/null; return; fi
  mk "$f"; cat > "$f"; say "créé $f"
}

# ─────────────────────────────────────────────────────────────
# 2. Pages UI
# ─────────────────────────────────────────────────────────────

write "src/app/[locale]/client/dossiers/page.tsx" <<'EOF'
import Link from 'next/link';

export const metadata = { title: 'Mes dossiers' };

export default async function ClientDossiersPage({
  params,
}: {
  params: { locale: string };
}) {
  const { locale } = params;
  const dossiers: Array<{ id: string; reference: string; statut?: string }> = [];

  return (
    <main className="p-6 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Mes dossiers</h1>
        <Link
          href={`/${locale}/client/dossiers/nouveau`}
          className="rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
        >
          Nouveau dossier
        </Link>
      </header>
      {dossiers.length === 0 ? (
        <p className="text-sm text-gray-500">Aucun dossier pour le moment.</p>
      ) : (
        <ul className="divide-y rounded border">
          {dossiers.map((d) => (
            <li key={d.id} className="p-3">
              <Link
                href={`/${locale}/client/dossiers/${d.id}`}
                className="text-blue-600 hover:underline"
              >
                {d.reference}
              </Link>
              {d.statut && <span className="ml-2 text-xs text-gray-500">{d.statut}</span>}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
EOF

write "src/app/[locale]/admin/clients/[id]/edit/page.tsx" <<'EOF'
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function EditClientPage() {
  const { locale, id } = useParams<{ locale: string; id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ nom: '', email: '', telephone: '' });

  useEffect(() => {
    // TODO: GET /api/admin/clients/${id}
    setLoading(false);
  }, [id]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: PATCH /api/admin/clients/${id}
    router.push(`/${locale}/admin/clients/${id}`);
  }

  if (loading) return <p className="p-6">Chargement…</p>;

  return (
    <main className="mx-auto max-w-2xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Modifier le client</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="w-full rounded border px-3 py-2" placeholder="Nom"
               value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
        <input className="w-full rounded border px-3 py-2" placeholder="Email"
               value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="w-full rounded border px-3 py-2" placeholder="Téléphone"
               value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
        <div className="flex gap-2">
          <button className="rounded bg-blue-600 px-4 py-2 text-white" type="submit">
            Enregistrer
          </button>
          <button type="button" className="rounded border px-4 py-2"
                  onClick={() => router.push(`/${locale}/admin/clients/${id}`)}>
            Annuler
          </button>
        </div>
      </form>
    </main>
  );
}
EOF

write "src/app/[locale]/admin/dossiers/[id]/edit/page.tsx" <<'EOF'
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function EditDossierPage() {
  const { locale, id } = useParams<{ locale: string; id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ reference: '', statut: '', tribunal: '' });

  useEffect(() => {
    // TODO: GET /api/admin/dossiers/${id}
    setLoading(false);
  }, [id]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: PATCH /api/admin/dossiers/${id}
    router.push(`/${locale}/admin/dossiers/${id}`);
  }

  if (loading) return <p className="p-6">Chargement…</p>;

  return (
    <main className="mx-auto max-w-2xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Modifier le dossier</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="w-full rounded border px-3 py-2" placeholder="Référence"
               value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
        <input className="w-full rounded border px-3 py-2" placeholder="Statut"
               value={form.statut} onChange={(e) => setForm({ ...form, statut: e.target.value })} />
        <input className="w-full rounded border px-3 py-2" placeholder="Tribunal"
               value={form.tribunal} onChange={(e) => setForm({ ...form, tribunal: e.target.value })} />
        <div className="flex gap-2">
          <button className="rounded bg-blue-600 px-4 py-2 text-white" type="submit">
            Enregistrer
          </button>
          <button type="button" className="rounded border px-4 py-2"
                  onClick={() => router.push(`/${locale}/admin/dossiers/${id}`)}>
            Annuler
          </button>
        </div>
      </form>
    </main>
  );
}
EOF

write "src/app/[locale]/legal/cookies/page.tsx" <<'EOF'
export const metadata = { title: 'Politique cookies' };

export default function CookiesPage() {
  return (
    <main className="prose mx-auto max-w-3xl p-6">
      <h1>Politique cookies</h1>
      <p>À rédiger.</p>
    </main>
  );
}
EOF

write "src/app/[locale]/legal/privacy/page.tsx" <<'EOF'
export const metadata = { title: 'Politique de confidentialité' };

export default function PrivacyPage() {
  return (
    <main className="prose mx-auto max-w-3xl p-6">
      <h1>Politique de confidentialité</h1>
      <p>À rédiger.</p>
    </main>
  );
}
EOF

write "src/app/[locale]/settings/billing/page.tsx" <<'EOF'
import { redirect } from 'next/navigation';

export default function SettingsBillingRedirect({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams: { upgrade?: string };
}) {
  const qs = searchParams.upgrade ? `?upgrade=${searchParams.upgrade}` : '';
  redirect(`/${params.locale}/billing${qs}`);
}
EOF

write "src/app/[locale]/super-admin/tenants/[id]/page.tsx" <<'EOF'
import Link from 'next/link';

export default async function TenantDetailPage({
  params,
}: {
  params: { locale: string; id: string };
}) {
  const { locale, id } = params;
  const tenant = { id, nom: '—', plan: '—', statut: '—' };

  return (
    <main className="p-6 space-y-4">
      <Link href={`/${locale}/super-admin/tenants`} className="text-sm text-blue-600 hover:underline">
        ← Retour aux tenants
      </Link>
      <h1 className="text-2xl font-semibold">Tenant {tenant.nom}</h1>
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <dt className="text-gray-500">ID</dt><dd>{tenant.id}</dd>
        <dt className="text-gray-500">Plan</dt><dd>{tenant.plan}</dd>
        <dt className="text-gray-500">Statut</dt><dd>{tenant.statut}</dd>
      </dl>
    </main>
  );
}
EOF

write "src/app/[locale]/super-admin/tenants/nouveau/page.tsx" <<'EOF'
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

export default function NewTenantPage() {
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const [form, setForm] = useState({ nom: '', email: '', plan: 'PILOT' });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: POST /api/super-admin/tenants
    router.push(`/${locale}/super-admin/tenants`);
  }

  return (
    <main className="mx-auto max-w-xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Nouveau tenant</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="w-full rounded border px-3 py-2" placeholder="Nom"
               value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
        <input className="w-full rounded border px-3 py-2" placeholder="Email admin"
               value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <select className="w-full rounded border px-3 py-2" value={form.plan}
                onChange={(e) => setForm({ ...form, plan: e.target.value })}>
          <option value="PILOT">PILOT</option>
          <option value="PRO">PRO</option>
          <option value="CABINET">CABINET</option>
        </select>
        <button className="rounded bg-blue-600 px-4 py-2 text-white" type="submit">
          Créer
        </button>
      </form>
    </main>
  );
}
EOF

write "src/app/[locale]/drafts/[id]/page.tsx" <<'EOF'
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DraftPage() {
  const { locale, id } = useParams<{ locale: string; id: string }>();
  const router = useRouter();
  const [draft, setDraft] = useState<{ contenu: string } | null>(null);

  useEffect(() => {
    setDraft({ contenu: '' });
  }, [id]);

  async function validate() {
    await fetch(`/api/drafts/${id}/validate`, { method: 'POST' });
    router.push(`/${locale}/dashboard`);
  }
  async function reject() {
    await fetch(`/api/drafts/${id}/reject`, { method: 'POST' });
    router.push(`/${locale}/dashboard`);
  }

  if (!draft) return <p className="p-6">Chargement…</p>;

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Brouillon {id}</h1>
      <textarea
        className="h-64 w-full rounded border p-3 font-mono text-sm"
        value={draft.contenu}
        onChange={(e) => setDraft({ contenu: e.target.value })}
      />
      <div className="flex gap-2">
        <button className="rounded bg-green-600 px-4 py-2 text-white" onClick={validate}>
          Valider
        </button>
        <button className="rounded bg-red-600 px-4 py-2 text-white" onClick={reject}>
          Rejeter
        </button>
      </div>
    </main>
  );
}
EOF

write "src/app/[locale]/settings/emails/imap/page.tsx" <<'EOF'
'use client';

import { useState } from 'react';

export default function ImapSettingsPage() {
  const [form, setForm] = useState({ host: '', port: 993, user: '', pass: '' });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: POST /api/email/connect/imap
  }

  return (
    <main className="mx-auto max-w-xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Configuration IMAP</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="w-full rounded border px-3 py-2" placeholder="Hôte IMAP"
               value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })} />
        <input className="w-full rounded border px-3 py-2" type="number" placeholder="Port"
               value={form.port} onChange={(e) => setForm({ ...form, port: Number(e.target.value) })} />
        <input className="w-full rounded border px-3 py-2" placeholder="Utilisateur"
               value={form.user} onChange={(e) => setForm({ ...form, user: e.target.value })} />
        <input className="w-full rounded border px-3 py-2" type="password" placeholder="Mot de passe"
               value={form.pass} onChange={(e) => setForm({ ...form, pass: e.target.value })} />
        <button className="rounded bg-blue-600 px-4 py-2 text-white" type="submit">
          Enregistrer
        </button>
      </form>
    </main>
  );
}
EOF

# ─────────────────────────────────────────────────────────────
# 3. Routes API
# ─────────────────────────────────────────────────────────────

write "src/app/api/auth/signout/route.ts" <<'EOF'
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  // TODO: adapter à ta stratégie d'auth (NextAuth v5 → signOut({ redirect: false }))
  cookies().delete('session');
  cookies().delete('next-auth.session-token');
  cookies().delete('__Secure-next-auth.session-token');
  return NextResponse.json({ ok: true });
}
EOF

write "src/app/api/client/factures/[id]/download/route.ts" <<'EOF'
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  return NextResponse.redirect(new URL(`/api/factures/${params.id}/pdf`, req.url));
}
EOF

write "src/app/api/test/ceseda-analysis/route.ts" <<'EOF'
import { NextResponse } from 'next/server';

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available' }, { status: 404 });
  }
  return NextResponse.json({ ok: true, message: 'Route de test CESEDA' });
}
EOF

# ─────────────────────────────────────────────────────────────
# 1. Typos
# ─────────────────────────────────────────────────────────────
say "correction des typos"
sed -i 's#/auth/signin#/auth/login#g' "src/app/[locale]/billing/page.tsx" 2>/dev/null || true
sed -i 's#/demo/légal-proof#/demo/legal-proof#g' \
  "src/app/[locale]/demo/workspace-reasoning/page.tsx" \
  "src/app/[locale]/demo/complete/page.tsx" 2>/dev/null || true
sed -i 's#/lawyer/intégrations#/lawyer/integrations#g' \
  "src/app/[locale]/lawyer/advanced/page.tsx" 2>/dev/null || true

say "terminé. Lance 'git status' pour voir les fichiers créés/modifiés."
