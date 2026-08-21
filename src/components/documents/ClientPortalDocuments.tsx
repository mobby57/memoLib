'use client';

import { useEffect, useState } from 'react';
import { FileText, CheckCircle, PenTool, Eye, Shield, Clock, Lock, Loader2 } from 'lucide-react';

interface SharedDocument {
  id: string;
  title: string;
  message: string | null;
  status: string;
  sharedAt: string;
  requiresAcknowledgment: boolean;
  requiresSignature: boolean;
  confidentialityLevel: string;
  acknowledgedAt: string | null;
  signedAt: string | null;
}

/**
 * Portail Client — Vue des documents partagés par l'avocat.
 * Le client peut consulter, accuser réception, et signer.
 */
export function ClientPortalDocuments() {
  const [documents, setDocuments] = useState<SharedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [signModal, setSignModal] = useState<string | null>(null);
  const [consentText, setConsentText] = useState('');

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/client-portal/shares');
      const data = await res.json();
      setDocuments(data.shares || []);
    } catch {}
    setLoading(false);
  };

  const handleView = async (shareId: string) => {
    await fetch('/api/client-portal/shares', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shareId, action: 'view' }),
    });
    loadDocuments();
  };

  const handleAcknowledge = async (shareId: string) => {
    setActionLoading(shareId);
    await fetch('/api/client-portal/shares', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shareId, action: 'acknowledge' }),
    });
    setActionLoading(null);
    loadDocuments();
  };

  const handleSign = async (shareId: string) => {
    if (!consentText.trim()) return;
    setActionLoading(shareId);
    await fetch('/api/client-portal/shares', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shareId, action: 'sign', consentText }),
    });
    setActionLoading(null);
    setSignModal(null);
    setConsentText('');
    loadDocuments();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">Aucun document partagé pour le moment.</p>
        <p className="text-xs mt-1">Votre avocat vous notifiera lorsqu'un document sera disponible.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-blue-500" />
        <h2 className="text-lg font-semibold text-gray-800">Documents partagés par votre avocat</h2>
      </div>

      <div className="space-y-3">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className={`border rounded-xl p-4 transition-all ${
              doc.status === 'SHARED' ? 'border-blue-200 bg-blue-50/30' :
              doc.status === 'SIGNED' ? 'border-green-200 bg-green-50/30' :
              'border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <h3 className="text-sm font-medium text-gray-800 truncate">{doc.title}</h3>
                  {doc.confidentialityLevel !== 'standard' && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs bg-amber-100 text-amber-700">
                      <Lock className="w-3 h-3" />
                      {doc.confidentialityLevel === 'secret_professionnel' ? 'Secret pro.' : 'Confidentiel'}
                    </span>
                  )}
                </div>

                {doc.message && (
                  <p className="text-sm text-gray-600 mt-1">{doc.message}</p>
                )}

                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(doc.sharedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                  {doc.acknowledgedAt && (
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="w-3 h-3" /> Accusé réception
                    </span>
                  )}
                  {doc.signedAt && (
                    <span className="flex items-center gap-1 text-purple-600">
                      <PenTool className="w-3 h-3" /> Signé
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 ml-4">
                {doc.status === 'SHARED' && (
                  <button
                    onClick={() => handleView(doc.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700"
                  >
                    <Eye className="w-3.5 h-3.5" /> Consulter
                  </button>
                )}

                {doc.requiresAcknowledgment && !doc.acknowledgedAt && doc.status !== 'SHARED' && (
                  <button
                    onClick={() => handleAcknowledge(doc.id)}
                    disabled={actionLoading === doc.id}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {actionLoading === doc.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle className="w-3.5 h-3.5" />
                    )}
                    Accuser réception
                  </button>
                )}

                {doc.requiresSignature && !doc.signedAt && doc.acknowledgedAt && (
                  <button
                    onClick={() => setSignModal(doc.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white text-xs font-medium rounded-lg hover:bg-purple-700"
                  >
                    <PenTool className="w-3.5 h-3.5" /> Signer
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de signature */}
      {signModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <PenTool className="w-5 h-5 text-purple-600" />
              Signature électronique
            </h3>
            <p className="text-sm text-gray-600 mt-2">
              En signant ce document, vous attestez en avoir pris connaissance et acceptez son contenu.
              Cette signature a valeur probante (horodatage + hash cryptographique).
            </p>

            <div className="mt-4">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Mention manuscrite (recopiez ou tapez) :
              </label>
              <textarea
                value={consentText}
                onChange={(e) => setConsentText(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                placeholder="Lu et approuvé. Je reconnais avoir pris connaissance du document et accepte son contenu."
              />
              <p className="text-xs text-gray-400 mt-1">Minimum 10 caractères</p>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => handleSign(signModal)}
                disabled={consentText.length < 10 || actionLoading === signModal}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 text-white text-sm font-medium rounded-xl hover:bg-purple-700 disabled:opacity-50"
              >
                {actionLoading === signModal ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <PenTool className="w-4 h-4" />
                )}
                Signer
              </button>
              <button
                onClick={() => { setSignModal(null); setConsentText(''); }}
                className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
