import { CheckCircle, Shield, XCircle } from 'lucide-react';

interface ProofBadgeProps {
  isValid: boolean;
  signaturesCount: number;
  hasTimestampAuthority: boolean;
  compact?: boolean;
}

export function ProofBadge({ isValid, signaturesCount, hasTimestampAuthority, compact }: ProofBadgeProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {isValid ? (
          <CheckCircle className="w-4 h-4 text-green-500" />
        ) : (
          <XCircle className="w-4 h-4 text-red-500" />
        )}
        {hasTimestampAuthority && <Shield className="w-3 h-3 text-blue-500" />}
        <span className="text-xs text-gray-500">{signaturesCount} sig.</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
          isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}
      >
        {isValid ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
        {isValid ? 'Valide' : 'Invalide'}
      </span>
      {hasTimestampAuthority && (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <Shield className="w-3 h-3" />
          RFC 3161
        </span>
      )}
      <span className="text-xs text-gray-500">{signaturesCount} signature(s)</span>
    </div>
  );
}
