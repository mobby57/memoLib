'use client';

// Force dynamic to prevent prerendering errors with React hooks
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';

interface Facture {
  id: string;
  numero: string;
  montantHT: number;
  montantTVA: number;
  montantTTC: number;
  statut: string;
  dateEmission: string;
  dateEcheance: string;
  datePaiement?: string;
  client: {
    firstName: string;
    lastName: string;
    email: string;
  };
  dossier?: {
    numero: string;
    typeDossier: string;
  };
  lignes: Array<{
    description: string;
    quantite: number;
    prixUnitaire: number;
    montantHT: number;
  }>;
}

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export default function FacturesPage() {
  const [factures, setFactures] = useState<Facture[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewFacture, setShowNewFacture] = useState(false);
  const [selectedFacture, setSelectedFacture] = useState<Facture | null>(null);
  const [filter, setFilter] = useState('all');

  // Pour la demo, on utilise un tenantId fictif
  const tenantId = 'demo-tenant-001';

  const loadFactures = useCallback(async () => {
    try {
      const res = await fetch(`/api/factures?tenantId=${tenantId}`);
      const data = await res.json();
      setFactures(data.factures || []);
    } catch (error) {
      console.error('Erreur chargement factures:', error);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  const loadClients = useCallback(async () => {
    try {
      const res = await fetch(`/api/clients?tenantId=${tenantId}`);
      const data = await res.json();
      setClients(data.clients || []);
    } catch (error) {
      console.error('Erreur chargement clients:', error);
    }
  }, [tenantId]);

  useEffect(() => {
    loadFactures();
    loadClients();
  }, [loadFactures, loadClients]);

  const getStatutBadge = (statut: string) => {
    const styles: Record<string, string> = {
      brouillon: 'bg-gray-100 text-gray-800',
      envoyee: 'bg-blue-100 text-blue-800',
      payee: 'bg-green-100 text-green-800',
      en_retard: 'bg-red-100 text-red-800',
      annulee: 'bg-gray-400 text-white',
    };
    const labels: Record<string, string> = {
      brouillon: 'Brouillon',
      envoyee: 'Envoyee',
      payee: 'Payee',
      en_retard: 'En retard',
      annulee: 'Annulee',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[statut] || 'bg-gray-100'}`}>
        {labels[statut] || statut}
      </span>
    );
  };

  const filteredFactures = factures.filter((f) => {
    if (filter === 'all') return true;
    return f.statut === filter;
  });

  const stats = {
    total: factures.reduce((sum, f) => sum + f.montantTTC, 0),
    payees: factures.filter((f) => f.statut === 'payee').reduce((sum, f) => sum + f.montantTTC, 0),
    enAttente: factures.filter((f) => f.statut === 'envoyee').reduce((sum, f) => sum + f.montantTTC, 0),
    enRetard: factures.filter((f) => f.statut === 'en_retard').reduce((sum, f) => sum + f.montantTTC, 0),
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900"> Facturation</h1>
          <p className="text-gray-600">Gerez vos factures et paiements</p>
        </div>
        <button
          onClick={() => setShowNewFacture(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <span></span>
          Nouvelle Facture
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total Facture</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total.toFixed(2)}€</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Payees</p>
          <p className="text-2xl font-bold text-green-600">{stats.payees.toFixed(2)}€</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">En attente</p>
          <p className="text-2xl font-bold text-blue-600">{stats.enAttente.toFixed(2)}€</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">En retard</p>
          <p className="text-2xl font-bold text-red-600">{stats.enRetard.toFixed(2)}€</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {['all', 'brouillon', 'envoyee', 'payee', 'en_retard'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-1 rounded-lg text-sm ${
              filter === status ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'
            }`}
          >
            {status === 'all' ? 'Toutes' : status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Factures Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">Chargement...</div>
        ) : filteredFactures.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="text-4xl mb-2"></p>
            <p>Aucune facture trouvee</p>
            <button
              onClick={() => setShowNewFacture(true)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Creer une facture
            </button>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Numero</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant TTC</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">echeance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredFactures.map((facture) => (
                <tr key={facture.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{facture.numero}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {facture.client.firstName} {facture.client.lastName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">
                    {facture.montantTTC.toFixed(2)}€
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStatutBadge(facture.statut)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(facture.dateEmission).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(facture.dateEcheance).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => setSelectedFacture(facture)}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      ️ Voir
                    </button>
                    <button className="text-gray-600 hover:text-gray-800"> PDF</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Nouvelle Facture */}
      {showNewFacture && (
        <NewFactureModal
          clients={clients}
          tenantId={tenantId}
          onClose={() => setShowNewFacture(false)}
          onCreated={() => {
            setShowNewFacture(false);
            loadFactures();
          }}
        />
      )}

      {/* Modal Detail Facture */}
      {selectedFacture && (
        <FactureDetailModal
          facture={selectedFacture}
          onClose={() => setSelectedFacture(null)}
          onUpdate={() => {
            setSelectedFacture(null);
            loadFactures();
          }}
        />
      )}
    </div>
  );
}

// Composant Modal Nouvelle Facture
function NewFactureModal({
  clients,
  tenantId,
  onClose,
  onCreated,
}: {
  clients: Client[];
  tenantId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [clientId, setClientId] = useState('');
  const [lignes, setLignes] = useState([{ description: '', quantite: 1, prixUnitaire: 0 }]);
  const [loading, setLoading] = useState(false);

  const addLigne = () => {
    setLignes([...lignes, { description: '', quantite: 1, prixUnitaire: 0 }]);
  };

  const updateLigne = (index: number, field: string, value: string | number) => {
    const newLignes = [...lignes];
    (newLignes[index] as Record<string, string | number>)[field] = value;
    setLignes(newLignes);
  };

  const removeLigne = (index: number) => {
    setLignes(lignes.filter((_, i) => i !== index));
  };

  const total = lignes.reduce((sum, l) => sum + l.quantite * l.prixUnitaire, 0);
  const tva = total * 0.2;
  const ttc = total + tva;

  const handleSubmit = async () => {
    if (!clientId || lignes.length === 0) {
      alert('Veuillez selectionner un client et ajouter au moins une ligne');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/factures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          clientId,
          lignes: lignes.filter((l) => l.description && l.prixUnitaire > 0),
        }),
      });

      if (res.ok) {
        onCreated();
      } else {
        const data = await res.json();
        alert(data.error || 'Erreur creation facture');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur creation facture');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold"> Nouvelle Facture</h2>
        </div>

        <div className="p-6 space-y-4">
          {/* Client */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Selectionner un client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName} - {c.email}
                </option>
              ))}
            </select>
          </div>

          {/* Lignes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Lignes de facture</label>
            {lignes.map((ligne, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Description"
                  value={ligne.description}
                  onChange={(e) => updateLigne(index, 'description', e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-lg"
                />
                <input
                  type="number"
                  placeholder="Qte"
                  value={ligne.quantite}
                  onChange={(e) => updateLigne(index, 'quantite', parseFloat(e.target.value))}
                  className="w-20 px-3 py-2 border rounded-lg"
                />
                <input
                  type="number"
                  placeholder="Prix"
                  value={ligne.prixUnitaire}
                  onChange={(e) => updateLigne(index, 'prixUnitaire', parseFloat(e.target.value))}
                  className="w-24 px-3 py-2 border rounded-lg"
                />
                <button
                  onClick={() => removeLigne(index)}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  ️
                </button>
              </div>
            ))}
            <button onClick={addLigne} className="text-blue-600 text-sm hover:underline">
              + Ajouter une ligne
            </button>
          </div>

          {/* Totaux */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between mb-1">
              <span>Total HT:</span>
              <span>{total.toFixed(2)}€</span>
            </div>
            <div className="flex justify-between mb-1">
              <span>TVA (20%):</span>
              <span>{tva.toFixed(2)}€</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Total TTC:</span>
              <span>{ttc.toFixed(2)}€</span>
            </div>
          </div>
        </div>

        <div className="p-6 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creation...' : 'Creer la facture'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Composant Modal Detail Facture
function FactureDetailModal({
  facture,
  onClose,
  onUpdate,
}: {
  facture: Facture;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const updateStatut = async (newStatut: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/factures', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          factureId: facture.id,
          statut: newStatut,
          datePaiement: newStatut === 'payee' ? new Date().toISOString() : undefined,
        }),
      });

      if (res.ok) {
        onUpdate();
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold"> Facture {facture.numero}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
            x
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Infos client */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium mb-2">Client</h3>
            <p>
              {facture.client.firstName} {facture.client.lastName}
            </p>
            <p className="text-sm text-gray-500">{facture.client.email}</p>
          </div>

          {/* Lignes */}
          <div>
            <h3 className="font-medium mb-2">Prestations</h3>
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500">
                  <th className="pb-2">Description</th>
                  <th className="pb-2 text-right">Qte</th>
                  <th className="pb-2 text-right">Prix</th>
                  <th className="pb-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {facture.lignes.map((ligne, i) => (
                  <tr key={i} className="border-t">
                    <td className="py-2">{ligne.description}</td>
                    <td className="py-2 text-right">{ligne.quantite}</td>
                    <td className="py-2 text-right">{ligne.prixUnitaire.toFixed(2)}€</td>
                    <td className="py-2 text-right">{ligne.montantHT.toFixed(2)}€</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totaux */}
          <div className="border-t pt-4">
            <div className="flex justify-between mb-1">
              <span>Total HT:</span>
              <span>{facture.montantHT.toFixed(2)}€</span>
            </div>
            <div className="flex justify-between mb-1">
              <span>TVA ({facture.montantTVA > 0 ? '20' : '0'}%):</span>
              <span>{facture.montantTVA.toFixed(2)}€</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Total TTC:</span>
              <span>{facture.montantTTC.toFixed(2)}€</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {facture.statut === 'brouillon' && (
              <button
                onClick={() => updateStatut('envoyee')}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                 Envoyer
              </button>
            )}
            {facture.statut === 'envoyee' && (
              <button
                onClick={() => updateStatut('payee')}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                 Marquer payee
              </button>
            )}
            <button className="px-4 py-2 border rounded-lg hover:bg-gray-50"> Telecharger PDF</button>
          </div>
        </div>
      </div>
    </div>
  );
}
