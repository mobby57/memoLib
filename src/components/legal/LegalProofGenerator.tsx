'use client';

import { useState } from 'react';
import { Shield, Download, CheckCircle, Loader2 } from 'lucide-react';

interface LegalProofGeneratorProps {
  entityType: string;
  entityId: string;
  tenantId?: string;
  onProofGenerated?: (proof: any) => void;
}

/**
 * Composant pour générer une preuve légale
 * Bouton + modal de configuration
 */
export function LegalProofGenerator({
  entityType,
  entityId,
  tenantId,
  onProofGenerated,
}: LegalProofGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedProof, setGeneratedProof] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Options
  const [reason, setReason] = useState('');
  const [jurisdiction, setJurisdiction] = useState('FR');
  const [includeTimestamp, setIncludeTimestamp] = useState(true);

  async function handleGenerate() {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/legal/proof/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType,
          entityId,
          type: 'DOCUMENT',
          reason: reason || `Preuve pour ${entityType} ${entityId}`,
          jurisdiction,
          includeTimestampAuthority: includeTimestamp,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la génération');
      }

      const data = await response.json();
      setGeneratedProof(data.proof);
      onProofGenerated?.(data.proof);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleDownload(format: 'JSON' | 'PDF' | 'XML') {
    if (!generatedProof?.id) return;

    try {
      const response = await fetch('/api/legal/proof/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proofId: generatedProof.id,
          format,
          includeAuditTrail: true,
          includeSignatures: true,
          language: 'fr',
        }),
      });

      if (!response.ok) throw new Error('Erreur export');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `preuve-${generatedProof.id}.${format.toLowerCase()}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Erreur lors du téléchargement: ' + err.message);
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Shield className="w-4 h-4" />
        Générer Preuve Légale
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold">Générer Preuve Légale</h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Info entité */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Entité</div>
            <div className="font-medium mt-1">
              {entityType} #{entityId}
            </div>
          </div>

          {/* Formulaire */}
          {!generatedProof ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Raison de la génération
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Ex: Preuve de réception du dossier le 03/02/2026"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Juridiction
                </label>
                <select
                  value={jurisdiction}
                  onChange={(e) => setJurisdiction(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="FR">🇫🇷 France</option>
                  <option value="EU">🇪🇺 Union Européenne</option>
                  <option value="US">🇺🇸 États-Unis</option>
                  <option value="CA">🇨🇦 Canada</option>
                  <option value="UK">🇬🇧 Royaume-Uni</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="timestamp"
                  checked={includeTimestamp}
                  onChange={(e) => setIncludeTimestamp(e.target.checked)}
                  className="w-4 h-4 text-blue-600"
                />
                <label htmlFor="timestamp" className="text-sm text-gray-700">
                  Inclure timestamp authority (RFC 3161) - Recommandé
                </label>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
                  ⚠️ {error}
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    Générer la preuve
                  </>
                )}
              </button>
            </>
          ) : (
            /* Preuve générée */
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-800 font-medium mb-3">
                  <CheckCircle className="w-5 h-5" />
                  Preuve générée avec succès
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">ID:</span>
                    <code className="bg-white px-2 py-1 rounded">
                      {generatedProof.id}
                    </code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Hash:</span>
                    <code className="bg-white px-2 py-1 rounded text-xs">
                      {generatedProof.documentHash?.substring(0, 16)}...
                    </code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Timestamp:</span>
                    <span>
                      {new Date(generatedProof.timestamp).toLocaleString(
                        'fr-FR'
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Signatures:</span>
                    <span>{generatedProof.signaturesCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">RFC 3161:</span>
                    <span>
                      {generatedProof.hasTimestampAuthority ? '✅' : '❌'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Boutons téléchargement */}
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">
                  Télécharger la preuve
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleDownload('PDF')}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                  >
                    <Download className="w-4 h-4" />
                    PDF
                  </button>
                  <button
                    onClick={() => handleDownload('JSON')}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
                  >
                    <Download className="w-4 h-4" />
                    JSON
                  </button>
                  <button
                    onClick={() => handleDownload('XML')}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"
                  >
                    <Download className="w-4 h-4" />
                    XML
                  </button>
                </div>
              </div>

              <button
                onClick={() => {
                  setGeneratedProof(null);
                  setReason('');
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Générer une autre preuve
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-6 border-t bg-gray-50">
          <button
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
