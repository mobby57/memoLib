'use client';

import { useState } from 'react';
import { Share2, Lock, FileCheck, Clock, Eye, CheckCircle, XCircle, Shield, Loader2, Send } from 'lucide-react';

interface ShareItem {
  id: string;
  title: string;
  status: string;
  sharedAt: string;
  firstViewedAt: string | null;
  viewCount: number;
  acknowledgedAt: string | null;
  signedAt: string | null;
  requiresAcknowledgment: boolean;
  requiresSignature: boolean;
  confidentialityLevel: string;
}

interface Props {
  dossierId: string;
  clientUserId: string;
  clientName: string;
  documentId?: string;
  documentName?: string;
}

const STATUS_BADGES: Record<string, { label: string; color: string; icon: any }> = {
  SHARED: { label: 'Envoyé', color: 'bg-blue-100 text-blue-700', icon: Send },
  VIEWED: { label: 'Consulté', color: 'bg-yellow-100 text-yellow-700', icon: Eye },
  ACKNOWLEDGED: { label: 'Accusé réception', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  SIGNED: { label: 'Signé', color: 'bg-purple-100 text-purple-700', icon: FileCheck },
  EXPIRED: { label: 'Expiré', color: 'bg-gray-100 text-gray-500', icon: Clock },
  REVOKED: { label: 'Révoqué', color: 'bg-red-100 text-red-700', icon: XCircle },
};

export function ShareToClient({ dossierId, clientUserId, clientName, documentId, documentName }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [shares, setShares] = useState<ShareItem[]>([]);
  const [loadingShares, setLoadingShares] = useState(false);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form state
  const [title, setTitle] = useState(documentName ? `Document : ${documentName}` : '');
  const [message, setMessage] = useState('');
  const [requiresAck, setRequiresAck] = useState(true);
  const [requiresSig, setRequiresSig] = useState(false);
  const [confidentiality, setConfidentiality] = useState<'standard' | 'confidentiel' | 'secret_professionnel'>('standard');

  const loadShares = async () => {
    setLoadingShares(true);
    try {
      const res = await fetch(`/api/client-portal/shares?dossierId=${dossierId}`);
      const data = await res.json();
      setShares(data.shares || []);
    } catch {}
    setLoadingShares(false);
  };

  const handleShare = async () => {
    setSending(true);
    setSuccess(false);
    try {
      const res = await fetch('/api/client-portal/shares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dossierId,
          clientUserId,
          documentId,
          title,
          message,
          requiresAcknowledgment: requiresAck,
          requiresSignature: requiresSig,
          confidentialityLevel: confidentiality,
        }),
      });
      if (res.ok) {
        setSuccess(true);
        setShowForm(false);
        loadShares();
      }
    } catch {}
    setSending(false);
  };

  const handleRevoke = async (shareId: string) => {
    if (!confirm('Révoquer ce partage ? Le client n\'y aura plus accès.')) return;
    await fetch('/api/client-portal/shares', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shareId, action: 'revoke', reason: 'Révoqué manuellement' }),
    });
    loadShares();
  };

  const handleExportProof = async (shareId: string) => {
    const res = await fetch('/api/client-portal/shares', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shareId, action: 'export_proof' }),
    });
    const data = await res.json();
    if (data.proof) {
      const blob = new Blob([JSON.stringify(data.proof, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `preuve_partage_${shareId.slice(0, 8)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-500" />
          Partage sécurisé — {clientName}
        </h4>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowForm(!showForm); if (!shares.length) loadShares(); }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            Partager au client
          </button>
        </div>
      </div>

      {/* Formulaire de partage */}
      {showForm && (
        <div className="border border-blue-200 rounded-xl p-4 bg-blue-50/50 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Titre du partage <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              placeholder="Ex: Décision CCSS du 2 juillet 2026"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Message au client</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              placeholder="Veuillez prendre connaissance de ce document..."
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={requiresAck} onChange={(e) => setRequiresAck(e.target.checked)} className="rounded" />
              Accusé de réception
            </label>
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={requiresSig} onChange={(e) => setRequiresSig(e.target.checked)} className="rounded" />
              Signature requise
            </label>
            <select
              value={confidentiality}
              onChange={(e) => setConfidentiality(e.target.value as any)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1"
            >
              <option value="standard">Standard</option>
              <option value="confidentiel">Confidentiel</option>
              <option value="secret_professionnel">Secret professionnel</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleShare}
              disabled={sending || !title}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Envoyer au client
            </button>
            <button onClick={() => setShowForm(false)} className="px-3 py-2 text-xs text-gray-500 hover:text-gray-700">
              Annuler
            </button>
          </div>

          {success && (
            <p className="text-xs text-green-600 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Document partagé avec succès. Le client sera notifié.
            </p>
          )}
        </div>
      )}

      {/* Liste des partages existants */}
      {shares.length > 0 && (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b">
            <p className="text-xs font-medium text-gray-500">Historique des partages ({shares.length})</p>
          </div>
          <div className="divide-y divide-gray-100">
            {shares.map((share) => {
              const badge = STATUS_BADGES[share.status] || STATUS_BADGES.SHARED;
              const BadgeIcon = badge.icon;
              return (
                <div key={share.id} className="px-4 py-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{share.title}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
                        <BadgeIcon className="w-3 h-3" />
                        {badge.label}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(share.sharedAt).toLocaleDateString('fr-FR')}
                      </span>
                      {share.viewCount > 0 && (
                        <span className="text-xs text-gray-400 flex items-center gap-0.5">
                          <Eye className="w-3 h-3" /> {share.viewCount}x
                        </span>
                      )}
                      {share.confidentialityLevel !== 'standard' && (
                        <span className="text-xs text-amber-600 flex items-center gap-0.5">
                          <Lock className="w-3 h-3" /> {share.confidentialityLevel}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleExportProof(share.id)}
                      className="p-1.5 text-gray-400 hover:text-blue-600" title="Exporter preuve"
                    >
                      <FileCheck className="w-4 h-4" />
                    </button>
                    {share.status !== 'REVOKED' && (
                      <button
                        onClick={() => handleRevoke(share.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600" title="Révoquer"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {loadingShares && (
        <p className="text-xs text-gray-400 flex items-center gap-1">
          <Loader2 className="w-3 h-3 animate-spin" /> Chargement...
        </p>
      )}
    </div>
  );
}
