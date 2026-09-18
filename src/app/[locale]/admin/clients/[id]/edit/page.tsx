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
