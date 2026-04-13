'use client';

import { AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';

interface AIDisclaimerProps {
  variant?: 'banner' | 'inline' | 'compact';
  dismissible?: boolean;
}

export function AIDisclaimer({ variant = 'inline', dismissible = true }: AIDisclaimerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  if (variant === 'compact') {
    return (
      <p className="text-xs text-gray-500 italic">
        ⚠️ Suggestion IA — outil d&apos;aide, ne constitue pas un conseil juridique.
        Vérification professionnelle requise.
      </p>
    );
  }

  if (variant === 'banner') {
    return (
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            MemoLib est un <strong>outil de gestion</strong>. Les suggestions IA ne constituent
            pas un conseil juridique. Vérifiez toujours avec un professionnel qualifié.
          </span>
        </div>
        {dismissible && (
          <button
            onClick={() => setDismissed(true)}
            className="text-amber-600 hover:text-amber-800 p-1"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  // variant === 'inline'
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
      <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
      <div className="text-sm text-amber-800">
        <strong>Outil d&apos;aide à la décision</strong> — Les résultats de l&apos;IA sont
        indicatifs et ne remplacent pas le jugement professionnel de l&apos;avocat.
        {dismissible && (
          <button
            onClick={() => setDismissed(true)}
            className="ml-2 underline hover:no-underline text-amber-600"
          >
            Compris
          </button>
        )}
      </div>
    </div>
  );
}
