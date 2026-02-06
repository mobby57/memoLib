'use client';

import { useState, useEffect } from 'react';
import { Shield, Download, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { ProofBadge } from './ProofBadge';

interface LegalProofViewerProps {
  proofId: string;
  showActions?: boolean;
}

/**
 * Composant pour afficher et vérifier une preuve légale existante
 */
export function LegalProofViewer({
  proofId,
  showActions = true,
}: LegalProofViewerProps) {
  const [verification, setVerification] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (proofId) {
      handleVerify();
    }
  }, [proofId]);

  async function handleVerify() {
    setIsVerifying(true);
    setError(null);

    try {
      const response = await fetch('/api/legal/proof/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proofId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur vérification');
      }

      const data = await response.json();
      setVerification(data.verification);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleDownload(format: 'JSON' | 'PDF' | 'XML') {
    try {
      const response = await fetch('/api/legal/proof/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proofId,
          format,
          includeAuditTrail: true,
          includeSignatures: true,
          watermark: 'CONFIDENTIEL',
          language: 'fr',
        }),
      });

      if (!response.ok) throw new Error('Erreur export');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `preuve-${proofId}.${format.toLowerCase()}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Erreur téléchargement: ' + err.message);
    }
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-800 font-medium">
          <XCircle className="w-5 h-5" />
          Erreur lors de la vérification
        </div>
        <div className="text-sm text-red-600 mt-2">{error}</div>
      </div>
    );
  }

  if (isVerifying) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Vérification en cours...</span>
      </div>
    );
  }

  if (!verification) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Badge principal */}
      <ProofBadge
        isValid={verification.isValid}
        timestamp={verification.verifiedAt}
        compact={false}
      />

      {/* Détails de vérification */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <div className="font-medium text-gray-900">Détails de vérification</div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <CheckItem
            label="Hash du document"
            isValid={verification.details.hashMatch}
          />
          <CheckItem
            label="Signatures"
            isValid={verification.details.signaturesValid}
          />
          <CheckItem
            label="Timestamp"
            isValid={verification.details.timestampValid}
          />
          <CheckItem
            label="Audit trail"
            isValid={verification.details.auditTrailIntact}
          />
          <CheckItem
            label="Pas expiré"
            isValid={verification.details.notExpired}
          />
        </div>

        {/* Erreurs */}
        {verification.errors?.length > 0 && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
            <div className="text-sm font-medium text-red-800 mb-2">
              Erreurs détectées:
            </div>
            <ul className="text-sm text-red-700 space-y-1">
              {verification.errors.map((err: string, i: number) => (
                <li key={i}>• {err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Warnings */}
        {verification.warnings?.length > 0 && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <div className="text-sm font-medium text-yellow-800 mb-2">
              Avertissements:
            </div>
            <ul className="text-sm text-yellow-700 space-y-1">
              {verification.warnings.map((warn: string, i: number) => (
                <li key={i}>• {warn}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex gap-2">
          <button
            onClick={handleVerify}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Re-vérifier
          </button>
          <button
            onClick={() => handleDownload('PDF')}
            className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
          >
            <Download className="w-4 h-4" />
            PDF
          </button>
          <button
            onClick={() => handleDownload('JSON')}
            className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
          >
            <Download className="w-4 h-4" />
            JSON
          </button>
        </div>
      )}

      {/* Info ID */}
      <div className="text-xs text-gray-500">
        ID de preuve: <code className="bg-gray-200 px-2 py-1 rounded">{proofId}</code>
      </div>
    </div>
  );
}

function CheckItem({ label, isValid }: { label: string; isValid: boolean }) {
  return (
    <div className="flex items-center justify-between p-2 bg-white rounded border">
      <span className="text-gray-700">{label}</span>
      {isValid ? (
        <CheckCircle className="w-4 h-4 text-green-600" />
      ) : (
        <XCircle className="w-4 h-4 text-red-600" />
      )}
    </div>
  );
}
