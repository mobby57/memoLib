'use client';

import { useState } from 'react';
import { Shield, AlertTriangle } from 'lucide-react';

/**
 * Consentement granulaire pour données sensibles (Art. 9 RGPD)
 * 
 * OBLIGATOIRE avant le traitement de :
 * - Origine ethnique (dossiers immigration)
 * - Opinions politiques (asile)
 * - Données de santé (certificats médicaux)
 * - Données judiciaires (casier)
 * 
 * Le consentement doit être :
 * - Libre, spécifique, éclairé et univoque (Art. 4(11) RGPD)
 * - Granulaire (par catégorie de données)
 * - Rétractable à tout moment
 * - Prouvable (horodatage + trace)
 */

interface SensitiveDataCategory {
  id: string;
  label: string;
  description: string;
  required: boolean;
}

interface SensitiveDataConsentProps {
  categories: SensitiveDataCategory[];
  clientName: string;
  dossierId?: string;
  onConsent: (consents: Record<string, boolean>) => void;
  onCancel: () => void;
}

const DEFAULT_CATEGORIES: SensitiveDataCategory[] = [
  {
    id: 'ethnic_origin',
    label: 'Origine ethnique / nationalité',
    description: 'Nécessaire pour les dossiers de titre de séjour, naturalisation, et asile.',
    required: true,
  },
  {
    id: 'political_opinions',
    label: 'Opinions politiques / convictions',
    description: 'Pertinent pour les demandes d\'asile (persécution politique).',
    required: false,
  },
  {
    id: 'health_data',
    label: 'Données de santé',
    description: 'Certificats médicaux, vulnérabilités, handicap (si pertinent au dossier).',
    required: false,
  },
  {
    id: 'criminal_record',
    label: 'Données judiciaires',
    description: 'Casier judiciaire, condamnations antérieures (si pertinent au dossier).',
    required: false,
  },
];

export function SensitiveDataConsent({
  categories = DEFAULT_CATEGORIES,
  clientName,
  dossierId,
  onConsent,
  onCancel,
}: SensitiveDataConsentProps) {
  const [consents, setConsents] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    categories.forEach((cat) => {
      initial[cat.id] = cat.required; // Pré-cocher les obligatoires
    });
    return initial;
  });
  const [confirmed, setConfirmed] = useState(false);

  const handleToggle = (categoryId: string, required: boolean) => {
    if (required) return; // Les catégories requises ne peuvent pas être décochées
    setConsents((prev) => ({ ...prev, [categoryId]: !prev[categoryId] }));
  };

  const handleSubmit = () => {
    if (!confirmed) return;
    onConsent(consents);
  };

  const allRequiredChecked = categories
    .filter((c) => c.required)
    .every((c) => consents[c.id]);

  return (
    <div className="bg-white border-2 border-blue-200 rounded-2xl p-6 max-w-lg mx-auto shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Shield className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Consentement — Données sensibles</h3>
          <p className="text-sm text-gray-500">Article 9 du RGPD</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4">
        <p className="text-sm text-blue-800">
          Le traitement du dossier de <strong>{clientName}</strong> nécessite le recueil
          de données personnelles sensibles. Conformément au RGPD, un consentement
          explicite est requis pour chaque catégorie.
        </p>
      </div>

      <div className="space-y-3 mb-4">
        {categories.map((category) => (
          <label
            key={category.id}
            className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
              consents[category.id]
                ? 'border-blue-300 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            } ${category.required ? 'cursor-not-allowed' : ''}`}
          >
            <input
              type="checkbox"
              checked={consents[category.id]}
              onChange={() => handleToggle(category.id, category.required)}
              disabled={category.required}
              className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div>
              <span className="text-sm font-medium text-gray-900">
                {category.label}
                {category.required && (
                  <span className="ml-1 text-xs text-red-500">(obligatoire)</span>
                )}
              </span>
              <p className="text-xs text-gray-500 mt-0.5">{category.description}</p>
            </div>
          </label>
        ))}
      </div>

      <div className="border-t pt-4 mb-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={() => setConfirmed(!confirmed)}
            className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-xs text-gray-700">
            Je confirme que le client <strong>{clientName}</strong> a été informé de la
            collecte de ces données, de leur finalité (traitement juridique de son dossier),
            de la durée de conservation (5 ans après clôture), et de son droit de retrait
            à tout moment. Ce consentement a été recueilli de manière libre et éclairée.
          </span>
        </label>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 mb-4 flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-800">
          Le client peut retirer son consentement à tout moment. Le retrait n&apos;affecte pas
          la licéité du traitement effectué avant le retrait (Art. 7(3) RGPD).
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 text-sm font-medium"
        >
          Annuler
        </button>
        <button
          onClick={handleSubmit}
          disabled={!confirmed || !allRequiredChecked}
          className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Confirmer le consentement
        </button>
      </div>

      {dossierId && (
        <p className="text-xs text-gray-400 mt-3 text-center">
          Dossier ref: {dossierId} — Consentement horodaté et tracé dans l&apos;audit trail.
        </p>
      )}
    </div>
  );
}
