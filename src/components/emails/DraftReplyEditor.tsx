'use client';

import { useState } from 'react';
import { Brain, Send, Copy, Loader2, CheckCircle, RefreshCw } from 'lucide-react';

interface Props {
  emailId?: string;
  subject: string;
  body: string;
  from: string;
  dossierId?: string;
  onSend?: (draft: { subject: string; body: string }) => void;
}

export function DraftReplyEditor({ emailId, subject, body, from, dossierId, onSend }: Props) {
  const [draft, setDraft] = useState<{ subject: string; body: string; tone: string; suggestedActions: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editedBody, setEditedBody] = useState('');

  const generate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/draft-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailId, subject, body, from, dossierId }),
      });
      const data = await res.json();
      setDraft(data);
      setEditedBody(data.body);
    } catch {}
    setLoading(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(editedBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!draft && !loading) {
    return (
      <button onClick={generate} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors">
        <Brain className="w-4 h-4" />
        Générer une réponse
      </button>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 bg-indigo-50 rounded-xl">
        <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
        <span className="text-sm text-indigo-700">Rédaction en cours...</span>
      </div>
    );
  }

  if (!draft) return null;

  return (
    <div className="border border-indigo-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-indigo-50 px-4 py-2 flex items-center justify-between">
        <span className="text-xs font-medium text-indigo-700">Brouillon IA — Ton {draft.tone}</span>
        <div className="flex items-center gap-2">
          <button onClick={generate} className="p-1 text-indigo-500 hover:text-indigo-700" title="Régénérer">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button onClick={copyToClipboard} className="p-1 text-indigo-500 hover:text-indigo-700" title="Copier">
            {copied ? <CheckCircle className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Subject */}
      <div className="px-4 py-2 border-b border-indigo-100">
        <input
          type="text"
          value={draft.subject}
          onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
          className="w-full text-sm font-medium text-gray-800 bg-transparent outline-none"
        />
      </div>

      {/* Body editable */}
      <textarea
        value={editedBody}
        onChange={(e) => setEditedBody(e.target.value)}
        rows={8}
        className="w-full px-4 py-3 text-sm text-gray-700 bg-white resize-none outline-none"
      />

      {/* Actions */}
      <div className="px-4 py-3 bg-gray-50 flex items-center justify-between">
        <div className="flex gap-2">
          {draft.suggestedActions?.map((action, i) => (
            <span key={i} className="text-xs bg-white border border-gray-200 rounded-full px-2.5 py-1 text-gray-600">
              {action}
            </span>
          ))}
        </div>
        {onSend && (
          <button
            onClick={() => onSend({ subject: draft.subject, body: editedBody })}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            Envoyer
          </button>
        )}
        {!onSend && (
          <button
            onClick={async () => {
              try {
                const res = await fetch('/api/emails/send', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    to: from,
                    subject: `Re: ${draft.subject}`,
                    body: editedBody,
                    replyToEmailId: emailId,
                  }),
                });
                if (res.ok) {
                  alert('✅ Email envoyé avec succès !');
                } else {
                  const data = await res.json();
                  alert(`❌ ${data.error || 'Erreur d\'envoi'}`);
                }
              } catch {
                // Fallback mailto si l'API échoue
                window.location.href = `mailto:${from}?subject=Re: ${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(editedBody)}`;
              }
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            Envoyer
          </button>
        )}
      </div>
    </div>
  );
}
