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
