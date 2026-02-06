'use client';

// Force dynamic to prevent prerendering errors
export const dynamic = 'force-dynamic';

import { LegalProofGenerator } from '@/components/legal/LegalProofGenerator';
import { LegalProofViewer } from '@/components/legal/LegalProofViewer';
import { ProofBadge } from '@/components/legal/ProofBadge';
import { Database, FileText, Shield } from 'lucide-react';
import { useState } from 'react';

/**
 * Page de démonstration du système de preuves légales
 * Pour tester et présenter les fonctionnalités
 */
export default function LegalProofDemoPage() {
  const [activeTab, setActiveTab] = useState<'generate' | 'verify'>('generate');
  const [lastGeneratedProof, setLastGeneratedProof] = useState<any>(null);
  const [verifyProofId, setVerifyProofId] = useState('');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-blue-600 rounded-xl">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Système de Preuves Légales</h1>
              <p className="text-gray-600 mt-1">
                Générez des preuves horodatées et certifiées opposables en justice
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <FeatureCard
            icon={<Shield />}
            title="Horodatage RFC 3161"
            description="Timestamp certifié par autorité de confiance"
          />
          <FeatureCard
            icon={<FileText />}
            title="Signatures eIDAS"
            description="Simple, avancée ou qualifiée selon besoin"
          />
          <FeatureCard
            icon={<Database />}
            title="Audit Trail"
            description="Chaîne d'EventLog immuable et vérifiable"
          />
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="border-b">
            <div className="flex">
              <button
                onClick={() => setActiveTab('generate')}
                className={`flex-1 px-6 py-4 font-medium text-sm transition-colors ${
                  activeTab === 'generate'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                ✨ Générer une preuve
              </button>
              <button
                onClick={() => setActiveTab('verify')}
                className={`flex-1 px-6 py-4 font-medium text-sm transition-colors ${
                  activeTab === 'verify'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                🔍 Vérifier une preuve
              </button>
            </div>
          </div>

          <div className="p-8">
            {activeTab === 'generate' ? (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Générer une nouvelle preuve</h2>
                  <p className="text-gray-600 text-sm">
                    Créez une preuve légale certifiée pour un document, une action ou une
                    communication.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="font-medium text-blue-900 mb-2">📘 Exemple d'utilisation</div>
                  <div className="text-sm text-blue-800">
                    Un avocat reçoit un document client par email. Il génère une preuve pour
                    certifier la date et l'heure de réception, opposable en justice si le client
                    conteste.
                  </div>
                </div>

                <LegalProofGenerator
                  entityType="document"
                  entityId="demo-document-123"
                  tenantId="demo-tenant"
                  onProofGenerated={proof => {
                    setLastGeneratedProof(proof);
                    alert(`Preuve générée avec succès!\nID: ${proof.id}`);
                  }}
                />

                {lastGeneratedProof && (
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="font-medium text-green-900 mb-3">
                      ✅ Dernière preuve générée
                    </div>
                    <ProofBadge
                      isValid={lastGeneratedProof.validationStatus?.isValid}
                      timestamp={lastGeneratedProof.timestamp}
                      signaturesCount={lastGeneratedProof.signaturesCount}
                      hasTimestampAuthority={lastGeneratedProof.hasTimestampAuthority}
                    />
                    <div className="mt-3 text-xs text-gray-600">
                      ID:{' '}
                      <code className="bg-white px-2 py-1 rounded">{lastGeneratedProof.id}</code>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Vérifier une preuve existante</h2>
                  <p className="text-gray-600 text-sm">
                    Validez l'intégrité d'une preuve en vérifiant le hash, les signatures et l'audit
                    trail.
                  </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="font-medium text-yellow-900 mb-2">
                    ⚡ Vérification instantanée
                  </div>
                  <div className="text-sm text-yellow-800">
                    La vérification contrôle 5 points critiques : hash du document, hash de la
                    preuve, signatures, timestamp et audit trail.
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ID de la preuve à vérifier
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={verifyProofId}
                      onChange={e => setVerifyProofId(e.target.value)}
                      placeholder="proof_1738596000_abc123"
                      className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    {lastGeneratedProof && (
                      <button
                        onClick={() => setVerifyProofId(lastGeneratedProof.id)}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                      >
                        Utiliser dernière preuve
                      </button>
                    )}
                  </div>
                </div>

                {verifyProofId && (
                  <div className="mt-6 border rounded-lg p-4">
                    <LegalProofViewer proofId={verifyProofId} showActions={true} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Documentation */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">📚 Documentation</h3>
          <div className="space-y-3 text-sm text-gray-700">
            <div>
              <a
                href="/docs/LEGAL_PROOF_SYSTEM.md"
                className="text-blue-600 hover:underline font-medium"
              >
                Guide complet du système de preuves
              </a>
              <p className="text-gray-600 mt-1">
                Principes, API, formats d'export et valeur juridique
              </p>
            </div>
            <div>
              <a href="/docs/SECTOR_RULES.md" className="text-blue-600 hover:underline font-medium">
                Règles sectorielles
              </a>
              <p className="text-gray-600 mt-1">
                Délais légaux et preuves obligatoires par secteur (LEGAL, MDPH, MEDICAL)
              </p>
            </div>
            <div>
              <a href="/admin/legal-proofs" className="text-blue-600 hover:underline font-medium">
                Dashboard administrateur
              </a>
              <p className="text-gray-600 mt-1">
                Gérer toutes les preuves générées (admin uniquement)
              </p>
            </div>
          </div>
        </div>

        {/* API Examples */}
        <div className="mt-8 bg-gray-900 text-gray-100 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">💻 Exemples d'API</h3>
          <div className="space-y-4 text-sm font-mono">
            <div>
              <div className="text-green-400 mb-2"># Générer une preuve</div>
              <pre className="bg-gray-800 p-3 rounded overflow-x-auto">
                {`curl -X POST /api/legal/proof/generate \\
  -H "Content-Type: application/json" \\
  -d '{
    "entityType": "dossier",
    "entityId": "dossier-123",
    "type": "DOCUMENT",
    "reason": "Preuve réception",
    "jurisdiction": "FR",
    "includeTimestampAuthority": true
  }'`}
              </pre>
            </div>
            <div>
              <div className="text-green-400 mb-2"># Vérifier une preuve</div>
              <pre className="bg-gray-800 p-3 rounded overflow-x-auto">
                {`curl -X POST /api/legal/proof/verify \\
  -d '{"proofId": "proof_xxx"}'`}
              </pre>
            </div>
            <div>
              <div className="text-green-400 mb-2"># Exporter en PDF</div>
              <pre className="bg-gray-800 p-3 rounded overflow-x-auto">
                {`curl -X POST /api/legal/proof/export \\
  -d '{"proofId": "proof_xxx", "format": "PDF"}' \\
  -o preuve.pdf`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">{icon}</div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}
