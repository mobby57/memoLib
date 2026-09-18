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
