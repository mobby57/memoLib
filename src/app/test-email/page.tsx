'use client';

// Force dynamic to prevent prerendering errors with React hooks
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { Card } from '@/components/ui';
import { Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function TestEmailPage() {
  const [from, setFrom] = useState('client@example.com');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const examples = [
    {
      name: 'Nouveau titre de séjour',
      subject: 'Demande titre de séjour urgent',
      body: 'Bonjour Maître,\n\nJe souhaite faire une demande de titre de séjour. Mon ancien titre expire le 15 mars 2024.\n\nCordialement,\nJean Dupont'
    },
    {
      name: 'Dossier existant',
      subject: 'Re: DOS-1234 - Documents complémentaires',
      body: 'Bonjour,\n\nVoici les documents demandés pour mon dossier.\n\nCordialement'
    },
    {
      name: 'OQTF urgent',
      subject: 'OQTF reçue - URGENT',
      body: 'Bonjour Maître,\n\nJ\'ai reçu une OQTF hier. Audience prévue le 20 février. Que dois-je faire ?\n\nMerci'
    }
  ];

  const testEmail = async () => {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, subject, body })
      });

      const data = await res.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Erreur réseau' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">🧪 Test Email IA</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Testez la classification automatique avec Ollama
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {examples.map((ex) => (
          <button
            key={ex.name}
            onClick={() => { setSubject(ex.subject); setBody(ex.body); }}
            className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300"
          >
            {ex.name}
          </button>
        ))}
      </div>

      <Card className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">De (email)</label>
          <input
            type="email"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Objet</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Corps</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
          />
        </div>

        <button
          onClick={testEmail}
          disabled={loading || !from || !subject || !body}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? (
            <><Loader2 className="w-5 h-5 inline animate-spin mr-2" />Traitement...</>
          ) : (
            <><Send className="w-5 h-5 inline mr-2" />Tester</>
          )}
        </button>
      </Card>

      {result && (
        <Card className={`p-6 border-2 ${result.error ? 'border-red-500' : 'border-green-500'}`}>
          <div className="flex items-start gap-3">
            {result.error ? (
              <AlertCircle className="w-6 h-6 text-red-500" />
            ) : (
              <CheckCircle className="w-6 h-6 text-green-500" />
            )}
            
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2">
                {result.error ? 'Erreur' : 'Résultat'}
              </h3>
              
              {result.error ? (
                <p className="text-red-600">{result.error}</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-green-600 font-medium">{result.message}</p>
                  
                  <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                    <div>
                      <span className="text-gray-500">Action:</span>
                      <span className="ml-2 font-medium">{result.action}</span>
                    </div>
                    
                    {result.classification && (
                      <>
                        <div>
                          <span className="text-gray-500">Type:</span>
                          <span className="ml-2 font-medium">{result.classification.typeDossier}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Urgence:</span>
                          <span className="ml-2 font-medium">{result.classification.urgency}</span>
                        </div>
                      </>
                    )}
                    
                    {result.dossierId && (
                      <div className="col-span-2">
                        <span className="text-gray-500">Dossier ID:</span>
                        <span className="ml-2 font-mono text-xs">{result.dossierId}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
