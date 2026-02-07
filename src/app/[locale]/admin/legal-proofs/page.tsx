'use client';

// Force dynamic to prevent prerendering errors with React hooks
export const dynamic = 'force-dynamic';

import { ProofBadge } from '@/components/legal/ProofBadge';
import { CheckCircle, Download, FileText, Search, Shield } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

interface Proof {
  id: string;
  type: string;
  entityType: string;
  entityId: string;
  documentHash: string;
  timestamp: string;
  signaturesCount: number;
  hasTimestampAuthority: boolean;
  isValid: boolean;
  createdBy: string;
  reason?: string;
  jurisdiction?: string;
}

export default function LegalProofsAdminPage() {
  const { data: session } = useSession();
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterValid, setFilterValid] = useState<string>('ALL');

  useEffect(() => {
    loadProofs();
  }, []);

  async function loadProofs() {
    try {
      setIsLoading(true);
      const response = await fetch('/api/legal/proof/list');
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des preuves');
      }
      const data = await response.json();

      // Transformer les données pour l'affichage
      const transformedProofs = data.proofs.map((p: any) => ({
        id: p.id,
        type: p.type,
        entityType: p.entityType,
        entityId: p.entityId,
        documentHash: p.documentHash,
        timestamp: p.timestamp,
        signaturesCount: p.signatures.length,
        hasTimestampAuthority: !!p.timestampAuthority,
        isValid: p.validationStatus.isValid,
        createdBy: p.metadata.createdBy,
        reason: p.metadata.reason,
        jurisdiction: p.metadata.jurisdiction,
      }));

      setProofs(transformedProofs);
    } catch (error) {
      console.error('Erreur:', error);
      // En cas d'erreur, garder les données mock pour démo
      setProofs([
        {
          id: 'proof_1738596000_abc123',
          type: 'DOCUMENT',
          entityType: 'dossier',
          entityId: 'dossier-123',
          documentHash: 'a3f5b8c9d1e2f3a4...',
          timestamp: '2026-02-03T14:30:00.000Z',
          signaturesCount: 2,
          hasTimestampAuthority: true,
          isValid: true,
          createdBy: 'avocat@cabinet.fr',
          reason: 'Preuve de réception dossier client',
          jurisdiction: 'FR',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  // Filtrage
  const filteredProofs = proofs.filter(proof => {
    // Recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !proof.id.toLowerCase().includes(query) &&
        !proof.entityId.toLowerCase().includes(query) &&
        !proof.createdBy.toLowerCase().includes(query) &&
        !proof.reason?.toLowerCase().includes(query)
      ) {
        return false;
      }
    }

    // Type
    if (filterType !== 'ALL' && proof.type !== filterType) {
      return false;
    }

    // Validité
    if (filterValid === 'VALID' && !proof.isValid) return false;
    if (filterValid === 'INVALID' && proof.isValid) return false;

    return true;
  });

  async function handleDownload(proofId: string, format: 'JSON' | 'PDF' | 'XML') {
    try {
      const response = await fetch('/api/legal/proof/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proofId,
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
      a.download = `preuve-${proofId}.${format.toLowerCase()}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Erreur: ' + err.message);
    }
  }

  if (!session?.user) {
    return (
      <div className="p-8 text-center">
        <div className="text-gray-600">Connexion requise</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Preuves Légales</h1>
              <p className="text-sm text-gray-600">Gestion des preuves certifiées et horodatées</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total preuves" value={proofs.length} icon={<FileText />} />
          <StatCard
            label="Preuves valides"
            value={proofs.filter(p => p.isValid).length}
            icon={<CheckCircle />}
            color="green"
          />
          <StatCard
            label="Avec RFC 3161"
            value={proofs.filter(p => p.hasTimestampAuthority).length}
            icon={<Shield />}
            color="blue"
          />
          <StatCard
            label="Signatures totales"
            value={proofs.reduce((sum, p) => sum + p.signaturesCount, 0)}
            icon={<span>✍️</span>}
            color="purple"
          />
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Rechercher par ID, entité, créateur..."
                className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Type */}
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Tous les types</option>
              <option value="DOCUMENT">Document</option>
              <option value="ACTION">Action</option>
              <option value="COMMUNICATION">Communication</option>
              <option value="TRANSACTION">Transaction</option>
              <option value="VALIDATION">Validation</option>
            </select>

            {/* Validité */}
            <select
              value={filterValid}
              onChange={e => setFilterValid(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Toutes les preuves</option>
              <option value="VALID">Valides uniquement</option>
              <option value="INVALID">Invalides uniquement</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-gray-600">Chargement...</div>
          ) : filteredProofs.length === 0 ? (
            <div className="p-8 text-center text-gray-600">Aucune preuve trouvée</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Entité
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Créé par
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Statut
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredProofs.map(proof => (
                    <tr key={proof.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {proof.id.substring(0, 20)}...
                        </code>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                          {proof.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {proof.entityType}#{proof.entityId.substring(0, 10)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{proof.createdBy}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(proof.timestamp).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3">
                        <ProofBadge
                          isValid={proof.isValid}
                          signaturesCount={proof.signaturesCount}
                          hasTimestampAuthority={proof.hasTimestampAuthority}
                          compact={true}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleDownload(proof.id, 'PDF')}
                            className="p-1 text-gray-600 hover:text-red-600"
                            title="Télécharger PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color = 'gray',
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color?: 'gray' | 'green' | 'blue' | 'purple';
}) {
  const colors = {
    gray: 'bg-gray-100 text-gray-600',
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-600">{label}</div>
          <div className="text-2xl font-bold mt-1">{value}</div>
        </div>
        <div className={`p-3 rounded-lg ${colors[color]}`}>{icon}</div>
      </div>
    </div>
  );
}
