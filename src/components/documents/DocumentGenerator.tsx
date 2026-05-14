'use client';

import { useState } from 'react';
import { FileText, Download, Copy, CheckCircle, Loader2 } from 'lucide-react';

interface Template {
  id: string;
  title: string;
}

interface Props {
  dossierId?: string;
  onGenerated?: (content: string) => void;
}

const TEMPLATES: Template[] = [
  { id: 'accuse_reception', title: 'Accusé de réception' },
  { id: 'mise_en_demeure', title: 'Mise en demeure' },
  { id: 'recours_gracieux', title: 'Recours gracieux' },
  { id: 'recours_contentieux', title: 'Recours contentieux' },
  { id: 'convocation', title: 'Convocation RDV' },
  { id: 'attestation', title: 'Attestation' },
];

export function DocumentGenerator({ dossierId, onGenerated }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [variables, setVariables] = useState<Record<string, string>>({});

  const generate = async (templateType: string) => {
    setSelected(templateType);
    setLoading(true);
    try {
      const res = await fetch('/api/documents/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateType, dossierId, variables }),
      });
      const data = await res.json();
      setContent(data.content);
      onGenerated?.(data.content);
    } catch {}
    setLoading(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Template selector */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            onClick={() => generate(t.id)}
            disabled={loading}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
              selected === t.id
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50/50 text-gray-700'
            }`}
          >
            <FileText className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{t.title}</span>
          </button>
        ))}
      </div>

      {/* Generated content */}
      {loading && (
        <div className="flex items-center gap-2 py-4 justify-center text-sm text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" /> Génération...
        </div>
      )}

      {content && !loading && (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-600">
              {TEMPLATES.find((t) => t.id === selected)?.title}
            </span>
            <div className="flex gap-2">
              <button onClick={copyToClipboard} className="p-1.5 text-gray-500 hover:text-gray-700" title="Copier">
                {copied ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                onClick={() => {
                  const blob = new Blob([content], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${selected || 'document'}.txt`;
                  a.click();
                }}
                className="p-1.5 text-gray-500 hover:text-gray-700"
                title="Télécharger"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={16}
            className="w-full px-4 py-3 text-sm text-gray-700 font-mono leading-relaxed resize-none outline-none"
          />
        </div>
      )}
    </div>
  );
}
