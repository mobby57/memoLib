'use client';

import { useAuth } from '@/hooks/useAuth';


import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Inbox,
  Mail,
  AlertTriangle,
  Archive,
  FolderPlus,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface RawEmail {
  id: string;
  from: string;
  subject: string;
  body: string;
  category: string;
  urgency: string;
  receivedAt: string;
  processingStatus: string;
  aiAnalysis?: string;
}

export default function InboxPage() {
  const { data: session, user } = useAuth();
  const [emails, setEmails] = useState<RawEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    if (session) loadEmails();
  }, [session]);

  const loadEmails = async () => {
    try {
      const res = await fetch('/api/emails?status=RECEIVED&limit=50');
      const data = await res.json();
      setEmails(data.emails || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (emailId: string, action: 'integrate' | 'archive' | 'ignore') => {
    setActing(true);
    try {
      await fetch(`/api/emails/${emailId}/integrate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      setEmails(prev => prev.filter(e => e.id !== emailId));
      if (selected === emailId) setSelected(null);
    } finally {
      setActing(false);
    }
  };

  const selectedEmail = emails.find(e => e.id === selected);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Inbox className="w-6 h-6 text-blue-600" />
            Flux entrants — En attente d'intégration
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Chaque information reçue attend votre décision. Rien n'est traité automatiquement.
          </p>
        </div>

        {emails.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border p-12 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900">Tout est traité</h2>
            <p className="text-gray-500 mt-2">Aucun flux en attente d'intégration.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Liste emails bruts */}
            <div className="lg:col-span-1 space-y-2">
              <div className="bg-white rounded-xl border p-3 mb-3">
                <span className="text-sm font-semibold text-gray-700">{emails.length} en attente</span>
              </div>
              {emails.map(email => (
                <button
                  key={email.id}
                  onClick={() => setSelected(email.id)}
                  className={`w-full text-left p-4 rounded-xl border transition ${
                    selected === email.id
                      ? 'bg-blue-50 border-blue-300'
                      : 'bg-white border-gray-200 hover:border-blue-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{email.from}</p>
                      <p className="text-sm text-gray-700 truncate">{email.subject}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {new Date(email.receivedAt).toLocaleString('fr-FR')}
                        </span>
                      </div>
                    </div>
                    {email.urgency === 'high' && (
                      <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Détail + actions */}
            <div className="lg:col-span-2">
              {selectedEmail ? (
                <div className="bg-white rounded-2xl border shadow-sm p-6">
                  {/* Metadata */}
                  <div className="border-b pb-4 mb-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-gray-900">{selectedEmail.subject}</h2>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        selectedEmail.urgency === 'high' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {selectedEmail.urgency === 'high' ? 'URGENT' : selectedEmail.urgency}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      De : {selectedEmail.from} — {new Date(selectedEmail.receivedAt).toLocaleString('fr-FR')}
                    </p>
                    {selectedEmail.category && (
                      <span className="inline-block mt-2 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                        Catégorie IA : {selectedEmail.category}
                      </span>
                    )}
                  </div>

                  {/* Corps brut */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6 max-h-64 overflow-y-auto">
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{selectedEmail.body}</p>
                  </div>

                  {/* Actions manuelles */}
                  <div className="border-t pt-4">
                    <p className="text-xs font-semibold uppercase text-gray-500 mb-3">Décision</p>
                    <div className="flex flex-wrap gap-3">
                      <button
                        disabled={acting}
                        onClick={() => handleAction(selectedEmail.id, 'integrate')}
                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-lg disabled:opacity-50"
                      >
                        <FolderPlus className="w-4 h-4" />
                        Intégrer au dossier
                      </button>
                      <button
                        disabled={acting}
                        onClick={() => handleAction(selectedEmail.id, 'archive')}
                        className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 font-medium px-4 py-2.5 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                      >
                        <Archive className="w-4 h-4" />
                        Archiver
                      </button>
                      <button
                        disabled={acting}
                        onClick={() => handleAction(selectedEmail.id, 'ignore')}
                        className="inline-flex items-center gap-2 border border-gray-300 text-gray-500 font-medium px-4 py-2.5 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" />
                        Ignorer
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-3">
                      État actuel : <span className="font-mono">RECEIVED</span> — En attente de votre décision.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border shadow-sm p-12 text-center">
                  <Eye className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Sélectionnez un email pour le consulter et décider de son sort.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
