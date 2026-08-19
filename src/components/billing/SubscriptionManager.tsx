'use client';

import { useState } from 'react';
import { CreditCard, ExternalLink, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

interface Props {
  planName?: string;
  status?: string;
}

/**
 * Widget de gestion d'abonnement.
 * Affiche le plan actuel et un bouton pour gérer via Stripe Customer Portal.
 */
export function SubscriptionManager({ planName = 'Solo', status = 'active' }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const openBillingPortal = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/billing/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erreur');
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const statusColors: Record<string, string> = {
    active: 'text-green-600 bg-green-50',
    trialing: 'text-blue-600 bg-blue-50',
    past_due: 'text-red-600 bg-red-50',
    canceled: 'text-gray-600 bg-gray-100',
  };

  const statusLabels: Record<string, string> = {
    active: 'Actif',
    trialing: 'Essai gratuit',
    past_due: 'Paiement en retard',
    canceled: 'Annulé',
  };

  return (
    <div className="border rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">Mon abonnement</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-lg font-bold">{planName}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[status] || statusColors.active}`}>
              {statusLabels[status] || status}
            </span>
          </div>
        </div>
        {status === 'active' && <CheckCircle className="w-6 h-6 text-green-500" />}
        {status === 'past_due' && <AlertTriangle className="w-6 h-6 text-red-500" />}
      </div>

      <button
        onClick={openBillingPortal}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <CreditCard className="w-4 h-4" />
        )}
        Gérer mon abonnement
        <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
      </button>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <p className="text-xs text-gray-400">
        Modifier votre plan, mettre à jour votre carte, consulter vos factures.
      </p>
    </div>
  );
}
