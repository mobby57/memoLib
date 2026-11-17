'use client';
import { useState } from 'react';
import { Send, X, CheckCircle2 } from 'lucide-react';

export function QuickInviteModal({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({ email: '', typeDossier: 'RECOURS_OQTF', objet: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/dossiers/quick-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error();
      setStatus('success');
    } catch {
      alert('Erreur lors de l\'envoi');
      setStatus('idle');
    }
  };

  if (status === 'success') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-xl shadow-xl max-w-md w-full text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Invitation envoyée !</h2>
          <p className="text-slate-500 mb-6">Le client a reçu un email pour remplir son dossier.</p>
          <button onClick={onClose} className="bg-slate-900 text-white px-6 py-2 rounded-lg">Fermer</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b bg-slate-50">
          <h2 className="font-semibold">Inviter un nouveau client</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email du client</label>
            <input required type="email" className="w-full p-2 border rounded-lg" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="client@email.com" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Type de dossier</label>
            <select className="w-full p-2 border rounded-lg" value={formData.typeDossier} onChange={e => setFormData({...formData, typeDossier: e.target.value})}>
              <option value="RECOURS_OQTF">Recours OQTF</option>
              <option value="TITRE_SEJOUR">Titre de séjour</option>
              <option value="ASILE">Demande d'asile</option>
              <option value="NATURALISATION">Naturalisation</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Objet (visible par le client)</label>
            <input required type="text" className="w-full p-2 border rounded-lg" value={formData.objet} onChange={e => setFormData({...formData, objet: e.target.value})} placeholder="Ex: Recours OQTF du 12/10/2026" />
          </div>
          <button type="submit" disabled={status === 'loading'} className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 flex justify-center items-center gap-2">
            {status === 'loading' ? 'Envoi...' : <><Send className="w-4 h-4" /> Envoyer l'invitation</>}
          </button>
        </form>
      </div>
    </div>
  );
}
