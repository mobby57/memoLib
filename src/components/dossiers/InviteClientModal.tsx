'use client';
import { useState } from 'react';
import { X, Send, Copy, CheckCircle2, ShieldCheck, AlertCircle, Mail } from 'lucide-react';

export function InviteClientModal({ dossierId, onClose }: { dossierId: string, onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [inviteLink, setInviteLink] = useState('');
  const [emailStatus, setEmailStatus] = useState('');
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleInvite = async () => {
    if (!email) return;
    setStatus('loading');
    try {
      const res = await fetch(`/api/dossiers/${dossierId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, expiresInDays: 7 }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Erreur lors de la génération');
        setStatus('error');
        return;
      }

      setInviteLink(data.inviteLink);
      setEmailStatus(data.emailStatus);
      setStatus('success');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur lors de la génération');
      setStatus('error');
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback si clipboard API bloquée
      const input = document.createElement('input');
      input.value = inviteLink;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b bg-slate-50">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-lg">Inviter un client</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* ÉTAT 1 : Formulaire */}
          {status !== 'success' && (
            <>
              <p className="text-sm text-slate-500 mb-4">
                Créez un lien valable 7 jours. Une tentative d’envoi par email sera effectuée si le service est configuré.
              </p>

              <label className="block text-sm font-medium text-slate-700 mb-2">Email du client</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@email.com"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
                disabled={status === 'loading'}
              />

              <button
                onClick={handleInvite}
                disabled={status === 'loading' || !email}
                className="w-full py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {status === 'loading' ? 'Génération...' : <><Send className="w-4 h-4" /> Créer l’invitation et tenter l’envoi</>}
              </button>

              {status === 'error' && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-red-700">{errorMsg}</p>
                </div>
              )}
            </>
          )}

          {/* ÉTAT 2 : Succès — Affiche le lien */}
          {status === 'success' && (
            <div>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h4 className="text-lg font-semibold text-slate-900 mb-1">Lien généré !</h4>
                <p className="text-sm text-slate-500">
                  Transmettez ce lien à votre client.
                </p>
              </div>

              {/* Statut email */}
              {emailStatus === 'sent' && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
                  <Mail className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-green-800">
                    📧 <strong>Email accepté par le service d’envoi</strong> pour {email}
                  </p>
                </div>
              )}
              {emailStatus !== 'sent' && (
                <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-orange-800">
                    <p className="font-medium">Email non envoyé</p>
                    <p className="mt-1">Le lien a été généré, mais aucun email n’a été confirmé.</p>
                  </div>
                </div>
              )}

              {/* Lien à copier */}
              <label className="block text-sm font-medium text-slate-700 mb-2">Lien sécurisé</label>
              <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg mb-4">
                <input
                  type="text"
                  value={inviteLink}
                  readOnly
                  className="flex-1 bg-transparent text-xs text-slate-600 outline-none truncate"
                />
                <button
                  onClick={copyToClipboard}
                  className={`p-2 rounded-md transition-colors ${copied ? 'bg-green-100 text-green-700' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                >
                  {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <button onClick={onClose} className="w-full py-2 text-sm text-slate-600 hover:text-slate-900 font-medium">
                Fermer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
