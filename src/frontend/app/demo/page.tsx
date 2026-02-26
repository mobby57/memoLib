'use client';

import { useState } from 'react';
import {
  CheckCircle,
  Users,
  FileText,
  Zap,
  BarChart3,
  Shield,
  Clock,
  MessageSquare,
  Brain,
  AlertCircle,
  Download,
  Loader,
  Eye,
  Mail,
  Phone,
  Webhook,
  CreditCard,
  Globe,
  Database,
  Lock,
  Bell,
  TrendingUp,
  FileCheck,
  Folder,
  Upload,
  Send,
} from 'lucide-react';
import Link from 'next/link';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  category: string;
  status: 'active' | 'pending' | 'archived';
  createdAt: string;
}

interface Dossier {
  id: string;
  clientId: string;
  type: string;
  status: string;
  description: string;
  analysis?: string;
  createdAt: string;
  documents: number;
}

interface Message {
  id: string;
  from: string;
  channel: 'email' | 'whatsapp' | 'sms' | 'form';
  subject: string;
  preview: string;
  timestamp: string;
}

const DEMO_CLIENTS: Client[] = [
  {
    id: '1',
    name: 'Marie Dupont',
    email: 'marie.d@email.com',
    phone: '+33 6 12 34 56 78',
    category: '🏢 Entreprise - Startup',
    status: 'active',
    createdAt: '2026-01-15',
  },
  {
    id: '2',
    name: 'Jean Martin',
    email: 'jean.m@email.com',
    phone: '+33 6 98 76 54 32',
    category: '👤 Particulier - Contentieux',
    status: 'active',
    createdAt: '2026-01-10',
  },
  {
    id: '3',
    name: 'Sophie Chen',
    email: 'sophie.c@email.com',
    phone: '+33 7 11 22 33 44',
    category: '🌍 International - Immigration',
    status: 'pending',
    createdAt: '2026-02-01',
  },
];

const DEMO_DOSSIERS: Dossier[] = [
  {
    id: '1',
    clientId: '1',
    type: 'Conseil Juridique',
    status: 'En cours',
    description: 'Startup tech recherchant conseil sur levée de fonds et RGPD. Besoin audit complet protection données.',
    documents: 8,
    createdAt: '2026-01-15',
  },
  {
    id: '2',
    clientId: '2',
    type: 'Contentieux Civil',
    status: 'Préparation audience',
    description: 'Litige commercial - contrat non respecté. Montant: 45K€. Audience prévue mars 2026.',
    documents: 12,
    createdAt: '2026-01-10',
  },
  {
    id: '3',
    clientId: '3',
    type: 'Droit des Étrangers',
    description: 'Demande titre séjour talent - profession artistique. Portfolio + contrats nécessaires.',
    status: 'Attente documents',
    documents: 5,
    createdAt: '2026-02-01',
  },
];

const DEMO_MESSAGES: Message[] = [
  {
    id: '1',
    from: 'Marie Dupont',
    channel: 'email',
    subject: 'Suite à notre réunion RGPD',
    preview: 'Bonjour, suite à notre échange d\'hier, j\'ai quelques questions supplémentaires...',
    timestamp: 'Il y a 2h',
  },
  {
    id: '2',
    from: '+33 6 98 76 54 32',
    channel: 'whatsapp',
    subject: 'Nouveau message',
    preview: 'Bonjour Maître, j\'ai reçu une nouvelle mise en demeure...',
    timestamp: 'Il y a 5h',
  },
  {
    id: '3',
    from: 'Contact Form',
    channel: 'form',
    subject: 'Demande de consultation',
    preview: 'Nom: Pierre Blanc, Objet: divorce contentieux...',
    timestamp: 'Hier 18:30',
  },
];

const AI_ANALYSIS = `
🔍 **ANALYSE DU DOSSIER:**

✅ **POINTS FORTS:**
- Base légale solide: RGPD Art. 32 (sécurité du traitement)
- Documentation complète: politique confidentialité + DPO nommé
- Contexte favorable: startup tech = sensibilité reconnue données

📊 **ÉVALUATION RISQUES:**
- Risque conformité CNIL: FAIBLE (8/100)
- Documentation manquante: registre traitements (requis Art. 30)
- Délai mise en conformité: 2-3 semaines estimé

💡 **RECOMMANDATIONS STRATÉGIQUES:**
1. Créer registre des traitements (obligatoire >250 employés ou données sensibles)
2. Audit sous-traitants (vérifier clauses RGPD contrats)
3. Formation équipe (sensibilisation protection données)
4. Mise en place procédure violation (notification 72h CNIL)

🎯 **PROBABILITÉ CONFORMITÉ COMPLÈTE: 85%**
(Après mise en œuvre recommandations ci-dessus)

⚠️ **ACTIONS URGENTES:**
- Registre traitements: 7 jours
- Audit sous-traitants: 14 jours
- Formation équipe: 21 jours
`;

export default function CompleteDemoPage() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [activeFeature, setActiveFeature] = useState<string>('clients');
  const [clients, setClients] = useState<Client[]>(DEMO_CLIENTS);
  const [dossiers, setDossiers] = useState<Dossier[]>(DEMO_DOSSIERS);
  const [messages, setMessages] = useState<Message[]>(DEMO_MESSAGES);
  const [selectedDossier, setSelectedDossier] = useState<Dossier | null>(DEMO_DOSSIERS[0]);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [generatingDoc, setGeneratingDoc] = useState(false);
  const [newClientForm, setNewClientForm] = useState({ name: '', email: '', phone: '', category: '' });
  const [generatedDocUrl, setGeneratedDocUrl] = useState<string | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<'email' | 'whatsapp' | 'sms'>('email');

  const handleAddClient = () => {
    if (!newClientForm.name || !newClientForm.email) {
      alert('Nom et email requis');
      return;
    }

    const newClient: Client = {
      id: Date.now().toString(),
      name: newClientForm.name,
      email: newClientForm.email,
      origin: newClientForm.origin || '🌍 À définir',
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
    };

    setClients([...clients, newClient]);
    setNewClientForm({ name: '', email: '', origin: '' });
    alert(`✅ Client "${newClient.name}" ajouté!`);
  };

  const handleAnalyzeDossier = async () => {
    if (!selectedDossier) return;
    setShowAnalysis(true);
    setSelectedDossier({
      ...selectedDossier,
      analysis: AI_ANALYSIS,
    });
  };

  const handleGenerateDocument = async () => {
    if (!selectedDossier) return;
    setGeneratingDoc(true);

    // Simulate document generation
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const docContent = `
MÉMOIRE EN RÉPONSE À LA DEMANDE D'ASILE

Dossier: ${selectedDossier.id}
Client: ${clients.find((c) => c.id === selectedDossier.clientId)?.name || 'N/A'}
Date: ${new Date().toLocaleDateString('fr-FR')}

I. FAITS

${selectedDossier.faits}

II. FONDEMENTS JURIDIQUES

La demande d'asile de ${clients.find((c) => c.id === selectedDossier.clientId)?.name} se fonde sur:

1. Convention de Genève du 28 juillet 1951 relative au statut des réfugiés
   - Article 1A-2: définition du réfugié
   - Persécution fondée sur religion, nationalité, opinion politique

2. Directive 2004/83/CE du Conseil (aujourd'hui directivement 2011/95/UE)
   - Protection internationale
   - Motif de persécution reconnus

III. JURISPRUDENCE CNDA

Cas similaires examines par CNDA (2024):
- Taux acceptation profils comparables: 76%
- Arguments juridiques reconnus valables
- Éléments probants documentés

IV. CONCLUSION

Pour les raisons exposées ci-dessus, nous demandons l'acceptation de cette demande d'asile dans les délais impartis.

Respectueusement,
Cabinet MemoLib - Assisté d'IA.
`;

    // Create a Blob and download
    const blob = new Blob([docContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    setGeneratedDocUrl(url);

    setGeneratingDoc(false);
    alert(`✅ Document généré! Cliquez "Télécharger Mémoire" pour sauvegarder.`);
  };

  const dossierClient = selectedDossier ? clients.find((c) => c.id === selectedDossier.clientId) : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="border-b bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              MemoLib
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Démo LIVE</h1>
            <Link href="/pricing" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
              Essai Gratuit
            </Link>
          </div>
          <p className="text-gray-600 mt-2">Cliquez sur les sections pour explorer les fonctionnalités réelles</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Features Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {[
            { id: 'clients', icon: Users, label: 'Clients' },
            { id: 'dossiers', icon: FileText, label: 'Dossiers' },
            { id: 'ai', icon: Brain, label: 'Analyse IA' },
            { id: 'documents', icon: Zap, label: 'Documents' },
          ].map((feature) => (
            <button
              key={feature.id}
              onClick={() => setActiveFeature(feature.id)}
              className={`p-4 rounded-lg border-2 transition-all ${
                activeFeature === feature.id
                  ? 'border-blue-600 bg-blue-50 shadow-lg'
                  : 'border-gray-200 bg-white hover:border-blue-400'
              }`}
            >
              <feature.icon className={`w-8 h-8 ${activeFeature === feature.id ? 'text-blue-600' : 'text-gray-600'}`} />
              <h3 className="font-semibold text-gray-900 mt-2">{feature.label}</h3>
            </button>
          ))}
        </div>

        {/* Content Areas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main panel */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border-2 border-gray-200 p-8">
              {/* CLIENTS SECTION */}
              {activeFeature === 'clients' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900">👥 Gestion des Clients</h2>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-4">Liste des Clients ({clients.length})</h3>
                    <div className="space-y-2">
                      {clients.map((client) => (
                        <div
                          key={client.id}
                          className="flex items-center justify-between p-3 bg-white border rounded hover:bg-blue-50 cursor-pointer"
                        >
                          <div>
                            <p className="font-medium text-gray-900">{client.name}</p>
                            <p className="text-xs text-gray-600">{client.origin}</p>
                          </div>
                          <span
                            className={`text-xs px-2 py-1 rounded font-semibold ${
                              client.status === 'active'
                                ? 'bg-green-100 text-green-700'
                                : client.status === 'appealing'
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {client.status === 'active'
                              ? '✅ Actif'
                              : client.status === 'appealing'
                                ? '🔄 Appel'
                                : '✓ Résolu'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="font-semibold text-gray-900 mb-4">➕ Ajouter un Client (Essayez!)</h3>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Nom complet"
                        value={newClientForm.name}
                        onChange={(e) => setNewClientForm({ ...newClientForm, name: e.target.value })}
                        className="w-full p-2 border rounded"
                      />
                      <input
                        type="email"
                        placeholder="Email"
                        value={newClientForm.email}
                        onChange={(e) => setNewClientForm({ ...newClientForm, email: e.target.value })}
                        className="w-full p-2 border rounded"
                      />
                      <input
                        type="text"
                        placeholder="Pays d'origine (ex: 🇸🇾 Syrie)"
                        value={newClientForm.origin}
                        onChange={(e) => setNewClientForm({ ...newClientForm, origin: e.target.value })}
                        className="w-full p-2 border rounded"
                      />
                      <button
                        onClick={handleAddClient}
                        className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 font-semibold"
                      >
                        ➕ Ajouter Client
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* DOSSIERS SECTION */}
              {activeFeature === 'dossiers' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900">📋 Gestion des Dossiers</h2>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-4">Dossiers Actifs ({dossiers.length})</h3>
                    <div className="space-y-2">
                      {dossiers.map((dossier) => {
                        const client = clients.find((c) => c.id === dossier.clientId);
                        return (
                          <button
                            key={dossier.id}
                            onClick={() => setSelectedDossier(dossier)}
                            className={`w-full text-left p-3 rounded border-2 transition-all ${
                              selectedDossier?.id === dossier.id
                                ? 'border-blue-600 bg-blue-50'
                                : 'border-gray-200 bg-white hover:border-blue-300'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-gray-900">{dossier.type}</p>
                                <p className="text-sm text-gray-600">{client?.name || 'Client'}</p>
                              </div>
                              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                {dossier.status}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {selectedDossier && (
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <p className="text-sm text-gray-700 font-semibold">📄 Détails Dossier Sélectionné:</p>
                      <p className="text-sm text-gray-600 mt-2">{selectedDossier.faits}</p>
                    </div>
                  )}
                </div>
              )}

              {/* AI ANALYSIS SECTION */}
              {activeFeature === 'ai' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900">🧠 Analyse IA des Cas</h2>

                  {selectedDossier && dossierClient ? (
                    <div className="space-y-4">
                      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                        <p className="font-semibold text-gray-900">📊 Cas Analysé:</p>
                        <p className="text-gray-700 mt-1">
                          <strong>{dossierClient.name}</strong> - {dossierClient.origin}
                        </p>
                        <p className="text-gray-600 text-sm mt-2">{selectedDossier.faits}</p>
                      </div>

                      {!showAnalysis ? (
                        <button
                          onClick={handleAnalyzeDossier}
                          className="w-full bg-purple-600 text-white p-3 rounded hover:bg-purple-700 font-semibold flex items-center justify-center gap-2"
                        >
                          <Brain className="w-5 h-5" />
                          🚀 Lancer Analyse IA
                        </button>
                      ) : (
                        <div className="bg-white p-4 rounded-lg border border-purple-300">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap font-mono text-xs leading-relaxed">
                            {selectedDossier.analysis}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-600 text-center py-8">Sélectionnez un dossier à gauche pour analyzer</p>
                  )}
                </div>
              )}

              {/* DOCUMENTS SECTION */}
              {activeFeature === 'documents' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900">⚡ Génération de Documents</h2>

                  {selectedDossier && dossierClient ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          '📄 Mémoire en réponse',
                          '⏱️ Demande délai supplémentaire',
                          '📮 Lettre à préfecture',
                          '⚖️ Aide juridictionnelle',
                        ].map((doc, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-gray-50 border rounded">
                            <span className="text-gray-800 font-medium">{doc}</span>
                            <span className="text-xs text-gray-500">Disponible</span>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={handleGenerateDocument}
                        disabled={generatingDoc}
                        className="w-full bg-green-600 text-white p-3 rounded hover:bg-green-700 font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {generatingDoc ? (
                          <>
                            <Loader className="w-5 h-5 animate-spin" />
                            Génération en cours...
                          </>
                        ) : (
                          <>
                            <Zap className="w-5 h-5" />
                            ✨ Générer Mémoire en Réponse
                          </>
                        )}
                      </button>

                      {generatedDocUrl && (
                        <a
                          href={generatedDocUrl}
                          download="Memoire_en_reponse.txt"
                          className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700 font-semibold flex items-center justify-center gap-2"
                        >
                          <Download className="w-5 h-5" />
                          📥 Télécharger le Document
                        </a>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-600 text-center py-8">Sélectionnez un dossier pour générer documents</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Stats Panel */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">📊 Statistiques</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-gray-600">Clients (Plan Pro Max: 50)</p>
                  <div className="flex items-center justify-between mt-1">
                    <div className="w-full bg-gray-200 rounded-full h-2 mr-3">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(clients.length / 50) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-bold text-blue-600">{clients.length}</span>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-600">Dossiers (Plan Pro Max: 500)</p>
                  <div className="flex items-center justify-between mt-1">
                    <div className="w-full bg-gray-200 rounded-full h-2 mr-3">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${(dossiers.length / 500) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-bold text-green-600">{dossiers.length}</span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-xs font-semibold text-gray-600 mb-2">Statuts Clients</p>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-700">
                      ✅ Actif: <span className="font-bold">{clients.filter((c) => c.status === 'active').length}</span>
                    </p>
                    <p className="text-xs text-gray-700">
                      🔄 Appel: <span className="font-bold">{clients.filter((c) => c.status === 'appealing').length}</span>
                    </p>
                    <p className="text-xs text-gray-700">
                      ✓ Résolu:{' '}
                      <span className="font-bold">{clients.filter((c) => c.status === 'resolved').length}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg p-6 text-white">
              <h3 className="font-semibold mb-3">🎯 Prêt à Commencer?</h3>
              <p className="text-sm mb-4 opacity-90">
                Cette démo utilise tout ce que vous voyez - clients réels, dossiers interactifs, analyse IA, génération documents.
              </p>
              <Link
                href="/pricing"
                className="block w-full text-center bg-white text-blue-600 py-2 rounded font-semibold hover:bg-gray-100"
              >
                Essai Gratuit 14j
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
