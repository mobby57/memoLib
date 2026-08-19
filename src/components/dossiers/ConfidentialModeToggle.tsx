'use client';

import { useState } from 'react';
import { Shield, ShieldOff, Loader2 } from 'lucide-react';

interface Props {
  dossierId: string;
  initialValue: boolean;
  onToggle?: (newValue: boolean) => void;
}

/**
 * Toggle pour activer/désactiver le mode confidentiel sur un dossier.
 * Quand activé : aucune donnée ne quitte le réseau (IA locale uniquement).
 */
export function ConfidentialModeToggle({ dossierId, initialValue, onToggle }: Props) {
  const [isConfidential, setIsConfidential] = useState(initialValue);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const toggle = async () => {
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch(`/api/dossiers/${dossierId}/confidential`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confidential: !isConfidential }),
      });

      const data = await res.json();

      if (res.ok) {
        setIsConfidential(!isConfidential);
        setMessage(data.message);
        onToggle?.(!isConfidential);
      } else {
        setMessage(data.error || 'Erreur');
      }
    } catch {
      setMessage('Erreur de connexion');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 4000);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={toggle}
        disabled={loading}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
          isConfidential
            ? 'bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200'
            : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
        } disabled:opacity-50`}
        title={isConfidential 
          ? 'Mode confidentiel actif — IA cloud bloquée, données traitées localement uniquement'
          : 'Cliquer pour activer le mode confidentiel (IA locale uniquement)'
        }
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isConfidential ? (
          <Shield className="w-4 h-4 text-amber-600" />
        ) : (
          <ShieldOff className="w-4 h-4 text-gray-400" />
        )}
        {isConfidential ? 'Confidentiel — IA locale' : 'Mode standard'}
      </button>

      {message && (
        <p className={`text-xs ${isConfidential ? 'text-amber-600' : 'text-gray-500'}`}>
          {message}
        </p>
      )}

      {isConfidential && (
        <p className="text-xs text-amber-600/70">
          🔒 Aucune donnée de ce dossier ne sera envoyée à un service cloud (art. 66-5).
        </p>
      )}
    </div>
  );
}
