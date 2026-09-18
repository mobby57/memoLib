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
