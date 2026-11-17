'use client';
import { useState } from 'react';
import { Send, CheckCircle2, Copy } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function InviterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ clientEmail: '', typeDossier: 'RECOURS_OQTF', objet: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/dossiers/quick-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      setStatus('success');
    } catch (err: any) {
      alert(err.message);
      setStatus('idle');
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-8 text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Invitation crÃ©Ã©e !</h1>
          <p className="text-slate-500 mb-6">Le dossier est prÃªt. Transmettez ce lien au client :</p>
          <div className="flex gap-2 mb-6">
            <input type="text" readOnly value={result.inviteLink} className="flex-1 px-3 py-2 bg-slate-50 border rounded-lg text-xs" />
            <button onClick={() => navigator.clipboard.writeText(result.inviteLink)} className="px-4 py-2 bg-slate-900 text-white rounded-lg"><Copy className="w-4 h-4" /></button>
          </div>
          <button onClick={() => router.push('/fr/dossiers')} className="w-full py-2 bg-blue-600 text-white rounded-lg">Retour aux dossiers</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-8">
        <h1 className="text-2xl font-bold mb-6">Inviter un client</h1>
        <div className="space-y-4">
          <input required type="email" placeholder="Email du client" className="w-full p-3 border rounded-lg" onChange={e => setForm({...form, clientEmail: e.target.value})} />
          <select className="w-full p-3 border rounded-lg" onChange={e => setForm({...form, typeDossier: e.target.value})}>
            <option value="RECOURS_OQTF">Recours OQTF</option>
            <option value="TITRE_SEJOUR">Titre de sÃ©jour</option>
          </select>
          <input type="text" placeholder="Objet (optionnel)" className="w-full p-3 border rounded-lg" onChange={e => setForm({...form, objet: e.target.value})} />
        </div>
        <button type="submit" disabled={status === 'loading'} className="mt-6 w-full py-3 bg-blue-600 text-white rounded-lg font-bold flex justify-center gap-2">
          <Send className="w-4 h-4" /> {status === 'loading' ? 'CrÃ©ation...' : 'CrÃ©er et inviter'}
        </button>
                <div className="mt-4 text-xs text-slate-400 text-center">
          </div>
</form>
    </div>
  );
}
