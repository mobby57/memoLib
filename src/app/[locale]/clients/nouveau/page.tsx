'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NouveauClientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      router.push('/clients');
      router.refresh();
    } else {
      alert('Erreur lors de la création');
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Nouveau client</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input required placeholder="Prénom" aria-label="Prénom" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} className="w-full p-2 border rounded" />
        <input required placeholder="Nom" aria-label="Nom" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} className="w-full p-2 border rounded" />
        <input required type="email" placeholder="Email" aria-label="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full p-2 border rounded" />
        <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50">
          {loading ? 'Création...' : 'Créer le client'}
        </button>
      </form>
    </div>
  );
}
