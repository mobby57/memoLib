'use client';

// Force dynamic to prevent prerendering errors with React hooks
export const dynamic = 'force-dynamic';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { Card, Badge } from '@/components/ui';
import { Mail, RefreshCw, Link as LinkIcon, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface Email {
  id: string;
  from: string;
  subject: string;
  receivedAt: string;
  isProcessed: boolean;
  category: string;
  urgency: string;
  client?: { firstName: string; lastName: string };
  dossier?: { numero: string; typeDossier: string };
}

export default function EmailMonitorPage() {
  const { user } = useAuth();
  const [emails, setEmails] = useState<Email[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'processed'>('all');
  const [loading, setLoading] = useState(true);

  const loadEmails = async () => {
    if (!user?.tenantId) return;
    
    setLoading(true);
    const status = filter === 'all' ? '' : filter;
    const res = await fetch(`/api/tenant/${user.tenantId}/emails?status=${status}`);
    if (res.ok) {
      setEmails(await res.json());
    }
    setLoading(false);
  };

  useEffect(() => {
    loadEmails();
  }, [user?.tenantId, filter]);

  const reprocessEmail = async (emailId: string) => {
    if (!user?.tenantId) return;
    
    const res = await fetch(`/api/tenant/${user.tenantId}/emails`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailId, action: 'reprocess' })
    });
    
    if (res.ok) loadEmails();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">📧 Monitoring Emails</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Classification automatique et liaison aux dossiers
          </p>
        </div>
        <button
          onClick={loadEmails}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 inline mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      <div className="flex gap-2">
        {(['all', 'pending', 'processed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            {f === 'pending' && <Clock className="w-4 h-4 inline mr-2" />}
            {f === 'processed' && <CheckCircle className="w-4 h-4 inline mr-2" />}
            {f === 'all' ? 'Tous' : f === 'pending' ? 'En attente' : 'Traités'}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {emails.map((email) => (
          <Card key={email.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold">{email.subject}</h3>
                  <Badge variant={email.isProcessed ? 'success' : 'warning'}>
                    {email.isProcessed ? 'Traité' : 'En attente'}
                  </Badge>
                  <Badge variant={email.urgency === 'high' ? 'error' : 'default'}>
                    {email.urgency}
                  </Badge>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  De: {email.from}
                </p>

                {email.dossier && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <LinkIcon className="w-4 h-4" />
                    Dossier {email.dossier.numero} - {email.dossier.typeDossier}
                  </div>
                )}

                {email.client && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Client: {email.client.firstName} {email.client.lastName}
                  </div>
                )}

                {!email.isProcessed && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-orange-600">
                    <AlertCircle className="w-4 h-4" />
                    Action manuelle requise
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 items-end">
                <span className="text-xs text-gray-500">
                  {new Date(email.receivedAt).toLocaleString('fr-FR')}
                </span>
                {!email.isProcessed && (
                  <button
                    onClick={() => reprocessEmail(email.id)}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    <RefreshCw className="w-3 h-3 inline mr-1" />
                    Retraiter
                  </button>
                )}
              </div>
            </div>
          </Card>
        ))}

        {emails.length === 0 && !loading && (
          <Card className="p-8 text-center">
            <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Aucun email {filter !== 'all' && filter}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
