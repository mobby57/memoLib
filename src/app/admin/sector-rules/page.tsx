'use client';

/**
 * Page Admin: Règles Sectorielles
 * Affiche les règles juridiques par secteur (LEGAL, MDPH, MEDICAL, ADMIN)
 */

import { AlertCircle, Book, Calendar, Clock, FileText, Filter, Scale, Search } from 'lucide-react';
import { useState } from 'react';

type Sector = 'ALL' | 'LEGAL' | 'MDPH' | 'MEDICAL' | 'ADMIN' | 'GENERAL';

interface Rule {
  id: string;
  sector: Sector;
  title: string;
  deadline: string;
  legalBasis: string;
  requiredProofs: string[];
  retentionYears: number;
  description: string;
  examples: string[];
}

// Données des règles sectorielles (depuis docs/SECTOR_RULES.md)
const SECTOR_RULES: Rule[] = [
  // LEGAL
  {
    id: 'legal-1',
    sector: 'LEGAL',
    title: 'Recours Gracieux',
    deadline: '2 mois à compter de la décision',
    legalBasis: 'CJA art. R421-1',
    requiredProofs: ['Accusé de réception', 'Horodatage certifié', 'Preuve envoi recommandé'],
    retentionYears: 10,
    description:
      'Délai pour former un recours gracieux contre une décision administrative défavorable.',
    examples: ['Refus de titre de séjour', 'Décision OQTF', 'Refus de naturalisation'],
  },
  {
    id: 'legal-2',
    sector: 'LEGAL',
    title: 'Recours Contentieux (Tribunal Administratif)',
    deadline: '2 mois à compter de la décision ou du rejet du recours gracieux',
    legalBasis: 'CJA art. R421-1',
    requiredProofs: ['Copie décision contestée', 'AR recours gracieux', 'Preuve délai respecté'],
    retentionYears: 10,
    description: 'Délai pour saisir le tribunal administratif en cas de rejet du recours gracieux.',
    examples: ['Contestation OQTF après rejet gracieux', 'Recours contre refus après silence'],
  },
  {
    id: 'legal-3',
    sector: 'LEGAL',
    title: 'Appel (Cour Administrative Appel)',
    deadline: '1 mois à compter du jugement TA',
    legalBasis: 'CJA art. R811-2',
    requiredProofs: ['Jugement TA', 'Notification jugement', 'Déclaration appel'],
    retentionYears: 10,
    description: 'Délai pour faire appel d un jugement du tribunal administratif.',
    examples: ['Appel jugement déboutant OQTF', 'Appel jugement rejetant demande titre'],
  },

  // MDPH
  {
    id: 'mdph-1',
    sector: 'MDPH',
    title: 'Dépôt Dossier MDPH',
    deadline: 'Aucun délai strict mais traiter sous 4 mois',
    legalBasis: 'Code de l action sociale et des familles',
    requiredProofs: ['Certificat médical < 6 mois', 'Formulaire Cerfa', 'Pièces justificatives'],
    retentionYears: 5,
    description:
      'Dossier de demande MDPH doit contenir certificat médical récent et formulaire complété.',
    examples: ['Demande AAH', 'Demande RQTH', 'Demande PCH'],
  },
  {
    id: 'mdph-2',
    sector: 'MDPH',
    title: 'Recours MDPH (CRA)',
    deadline: '2 mois après notification décision CDAPH',
    legalBasis: 'CASF art. L241-9',
    requiredProofs: ['Décision CDAPH', 'AR notification', 'Courrier recours'],
    retentionYears: 5,
    description: 'Recours contre décision CDAPH auprès de la Commission de Recours Amiable.',
    examples: ['Refus AAH', 'Taux incapacité contesté', 'Refus PCH'],
  },

  // MEDICAL
  {
    id: 'medical-1',
    sector: 'MEDICAL',
    title: 'Conservation Dossier Médical',
    deadline: '20 ans à compter de la dernière consultation',
    legalBasis: 'CSP art. R1112-7',
    requiredProofs: ['Dossier médical complet', 'Horodatage sécurisé', 'Archivage conforme HDS'],
    retentionYears: 20,
    description: 'Les établissements de santé doivent conserver les dossiers médicaux 20 ans.',
    examples: ['Dossiers hospitaliers', 'Imagerie médicale', 'Comptes rendus opératoires'],
  },
  {
    id: 'medical-2',
    sector: 'MEDICAL',
    title: 'Expertise Médicale Contradictoire',
    deadline: 'Désignation expert sous 4 mois après demande',
    legalBasis: 'Code de procédure civile',
    requiredProofs: ['Ordonnance désignation expert', 'Convocation expertise', 'Rapport expertise'],
    retentionYears: 10,
    description: 'Délai pour désigner un expert médical dans le cadre d un contentieux.',
    examples: ['Expertise préjudice corporel', 'Expertise consolidation'],
  },

  // ADMIN
  {
    id: 'admin-1',
    sector: 'ADMIN',
    title: 'Réponse Courrier Administration',
    deadline: '2 mois (silence = rejet)',
    legalBasis: 'Loi n°2000-321 du 12 avril 2000',
    requiredProofs: ['AR dépôt demande', 'Copie courrier', 'Horodatage'],
    retentionYears: 3,
    description:
      'L administration dispose de 2 mois pour répondre. Silence = décision implicite de rejet.',
    examples: ['Demande de régularisation', 'Demande de titre de séjour', 'Demande aide sociale'],
  },

  // GENERAL
  {
    id: 'general-1',
    sector: 'GENERAL',
    title: 'RGPD - Droit Accès',
    deadline: '1 mois maximum (prorogeable 2 mois)',
    legalBasis: 'RGPD art. 15',
    requiredProofs: ['Demande écrite', 'Justificatif identité', 'AR'],
    retentionYears: 5,
    description: 'Toute personne a le droit obtenir copie de ses données personnelles.',
    examples: ['Demande copie dossier client', 'Export données personnelles'],
  },
  {
    id: 'general-2',
    sector: 'GENERAL',
    title: 'RGPD - Droit Oubli',
    deadline: '1 mois maximum',
    legalBasis: 'RGPD art. 17',
    requiredProofs: ['Demande suppression', 'Justificatif identité', 'Preuve exécution'],
    retentionYears: 3,
    description: 'Droit de demander la suppression de ses données personnelles (avec exceptions).',
    examples: ['Suppression compte client', 'Anonymisation données'],
  },
];

export default function SectorRulesPage() {
  const [selectedSector, setSelectedSector] = useState<Sector>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Filtrage
  const filteredRules = SECTOR_RULES.filter(rule => {
    if (selectedSector !== 'ALL' && rule.sector !== selectedSector) {
      return false;
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        rule.title.toLowerCase().includes(query) ||
        rule.description.toLowerCase().includes(query) ||
        rule.legalBasis.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // Stats par secteur
  const stats = {
    total: SECTOR_RULES.length,
    legal: SECTOR_RULES.filter(r => r.sector === 'LEGAL').length,
    mdph: SECTOR_RULES.filter(r => r.sector === 'MDPH').length,
    medical: SECTOR_RULES.filter(r => r.sector === 'MEDICAL').length,
    admin: SECTOR_RULES.filter(r => r.sector === 'ADMIN').length,
    general: SECTOR_RULES.filter(r => r.sector === 'GENERAL').length,
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Scale className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Règles Sectorielles</h1>
        </div>
        <p className="text-gray-600">Délais légaux et preuves requises par secteur activité</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Règles</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg shadow-sm border border-blue-200">
          <div className="text-2xl font-bold text-blue-600">{stats.legal}</div>
          <div className="text-sm text-blue-800">LEGAL</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg shadow-sm border border-purple-200">
          <div className="text-2xl font-bold text-purple-600">{stats.mdph}</div>
          <div className="text-sm text-purple-800">MDPH</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg shadow-sm border border-green-200">
          <div className="text-2xl font-bold text-green-600">{stats.medical}</div>
          <div className="text-sm text-green-800">MEDICAL</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg shadow-sm border border-orange-200">
          <div className="text-2xl font-bold text-orange-600">{stats.admin}</div>
          <div className="text-sm text-orange-800">ADMIN</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-gray-600">{stats.general}</div>
          <div className="text-sm text-gray-800">GENERAL</div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Recherche */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par titre, base légale..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filtres secteur */}
          <div className="flex gap-2 flex-wrap">
            {(['ALL', 'LEGAL', 'MDPH', 'MEDICAL', 'ADMIN', 'GENERAL'] as Sector[]).map(sector => (
              <button
                key={sector}
                onClick={() => setSelectedSector(sector)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedSector === sector
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {sector}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Liste des règles */}
      <div className="space-y-4">
        {filteredRules.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
            <Filter className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">Aucune règle trouvée pour ces critères</p>
          </div>
        ) : (
          filteredRules.map(rule => (
            <div
              key={rule.id}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              {/* En-tête */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        rule.sector === 'LEGAL'
                          ? 'bg-blue-100 text-blue-800'
                          : rule.sector === 'MDPH'
                            ? 'bg-purple-100 text-purple-800'
                            : rule.sector === 'MEDICAL'
                              ? 'bg-green-100 text-green-800'
                              : rule.sector === 'ADMIN'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {rule.sector}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{rule.title}</h3>
                  <p className="text-gray-700">{rule.description}</p>
                </div>
              </div>

              {/* Informations clés */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Délai</div>
                    <div className="text-sm text-gray-600">{rule.deadline}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Book className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Base Légale</div>
                    <div className="text-sm text-gray-600">{rule.legalBasis}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Preuves Requises</div>
                    <ul className="text-sm text-gray-600 list-disc list-inside">
                      {rule.requiredProofs.map((proof, idx) => (
                        <li key={idx}>{proof}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Conservation</div>
                    <div className="text-sm text-gray-600">{rule.retentionYears} ans minimum</div>
                  </div>
                </div>
              </div>

              {/* Exemples */}
              {rule.examples.length > 0 && (
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 mb-2">
                        Exemples d'application
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {rule.examples.map((example, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
                          >
                            {example}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-900">
            <strong>Note importante :</strong> Ces délais sont indicatifs. Consultez toujours un
            avocat spécialisé pour votre situation spécifique. Les délais peuvent varier selon les
            circonstances.
          </div>
        </div>
      </div>
    </div>
  );
}
