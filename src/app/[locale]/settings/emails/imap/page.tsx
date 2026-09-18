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
