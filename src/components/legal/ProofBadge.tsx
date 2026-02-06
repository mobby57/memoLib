'use client';

import { Shield, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface ProofBadgeProps {
  isValid: boolean;
  timestamp?: string;
  signaturesCount?: number;
  hasTimestampAuthority?: boolean;
  compact?: boolean;
}

/**
 * Badge de preuve légale certifiée
 * Affiche le statut de validation avec icône et tooltip
 */
export function ProofBadge({
  isValid,
  timestamp,
  signaturesCount = 0,
  hasTimestampAuthority = false,
  compact = false,
}: ProofBadgeProps) {
  if (compact) {
    return (
      <div
        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
        style={{
          backgroundColor: isValid ? '#d4edda' : '#f8d7da',
          color: isValid ? '#155724' : '#721c24',
        }}
        title={
          isValid
            ? `Preuve certifiée - ${signaturesCount} signature(s)`
            : 'Preuve invalide'
        }
      >
        {isValid ? (
          <Shield className="w-3 h-3" />
        ) : (
          <AlertTriangle className="w-3 h-3" />
        )}
        <span>Certifié</span>
      </div>
    );
  }

  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border"
      style={{
        backgroundColor: isValid ? '#d4edda' : '#f8d7da',
        borderColor: isValid ? '#c3e6cb' : '#f5c6cb',
        color: isValid ? '#155724' : '#721c24',
      }}
    >
      <div className="flex-shrink-0">
        {isValid ? (
          <CheckCircle className="w-5 h-5" />
        ) : (
          <XCircle className="w-5 h-5" />
        )}
      </div>
      <div className="flex flex-col gap-1">
        <div className="font-semibold text-sm">
          {isValid ? '🔐 Preuve Légale Certifiée' : '⚠️ Preuve Invalide'}
        </div>
        <div className="text-xs flex flex-wrap gap-2">
          {timestamp && (
            <span>
              📅 {new Date(timestamp).toLocaleDateString('fr-FR')}
            </span>
          )}
          {signaturesCount > 0 && (
            <span>
              ✍️ {signaturesCount} signature{signaturesCount > 1 ? 's' : ''}
            </span>
          )}
          {hasTimestampAuthority && <span>⏱️ RFC 3161</span>}
        </div>
      </div>
    </div>
  );
}
