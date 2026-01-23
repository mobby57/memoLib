'use client'

import { useFormContext } from 'react-hook-form'
import { Calendar, AlertTriangle } from 'lucide-react'
import { Input } from '@/components/forms/Input'

const TYPES_DOSSIER = [
  { 
    value: 'TITRE_SEJOUR', 
    label: 'Titre de Séjour', 
    icon: '📄',
    description: 'Première demande ou renouvellement de titre de séjour',
    delais: '60 jours avant expiration recommandé',
    urgence: 'normale',
    documents: ['Passeport', 'Photos identité', 'Justificatif domicile', 'Contrat de travail'],
  },
  { 
    value: 'RECOURS_OQTF', 
    label: 'Recours OQTF', 
    icon: '⚠️',
    description: 'Recours contre une obligation de quitter le territoire français',
    delais: '48h pour référé-liberté, 2 mois pour TA',
    urgence: 'critique',
    documents: ['OQTF', 'Passeport', 'Preuves attaches en France', 'Certificats médicaux'],
  },
  { 
    value: 'NATURALISATION', 
    label: 'Naturalisation', 
    icon: '🇫🇷',
    description: 'Demande d\'acquisition de la nationalité française',
    delais: 'Instruction 12 à 18 mois',
    urgence: 'normale',
    documents: ['Titre séjour 5 ans', 'Certificat niveau français B1', 'Bulletins salaire', 'Avis imposition'],
  },
  { 
    value: 'REGROUPEMENT_FAMILIAL', 
    label: 'Regroupement Familial', 
    icon: '👨‍👩‍👧',
    description: 'Faire venir sa famille en France (conjoint, enfants)',
    delais: 'Instruction 6 mois, visite logement',
    urgence: 'normale',
    documents: ['Titre séjour', 'Justificatif ressources', 'Acte de mariage', 'Bail/attestation logement'],
  },
  { 
    value: 'ASILE', 
    label: 'Demande d\'Asile', 
    icon: '🏠',
    description: 'Demande de protection internationale (réfugié, protection subsidiaire)',
    delais: '15 jours procédure accélérée, 6 mois normale',
    urgence: 'haute',
    documents: ['Récit détaillé', 'Preuves persécution', 'Documents identité', 'Convocation OFPRA'],
  },
  { 
    value: 'VISA', 
    label: 'Visa Long Séjour', 
    icon: '✈️',
    description: 'VLS-TS pour études, travail, famille',
    delais: '15 jours à 3 mois',
    urgence: 'normale',
    documents: ['Passeport', 'Photos', 'Assurance', 'Justificatifs motif séjour'],
  },
  { 
    value: 'AUTRE', 
    label: 'Autre Démarche', 
    icon: '📋',
    description: 'Autre type de démarche administrative',
    delais: 'Variable selon démarche',
    urgence: 'normale',
    documents: [],
  },
]

const PRIORITES = [
  { value: 'NORMALE', label: 'Normale', color: 'bg-blue-100 text-blue-700', description: 'Délai standard' },
  { value: 'HAUTE', label: 'Haute', color: 'bg-orange-100 text-orange-700', description: 'Traitement prioritaire' },
  { value: 'URGENTE', label: 'Urgente', color: 'bg-red-100 text-red-700', description: 'Traitement rapide' },
  { value: 'CRITIQUE', label: 'Critique', color: 'bg-purple-100 text-purple-700', description: 'Immédiat (référé)' },
]

export function EtapeTypeDossier() {
  const { register, watch, setValue, formState: { errors } } = useFormContext()
  const typeSelectionne = watch('typeDossier')
  const priorite = watch('priorite')

  const typeInfo = TYPES_DOSSIER.find(t => t.value === typeSelectionne)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Type de Dossier</h2>
        <p className="text-gray-600">Sélectionnez le type de démarche que vous souhaitez effectuer</p>
      </div>

      {/* Sélection du type */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TYPES_DOSSIER.map((type) => (
          <label
            key={type.value}
            className={`
              relative flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all
              hover:border-blue-400 hover:shadow-md
              ${typeSelectionne === type.value 
                ? 'border-blue-600 bg-blue-50 shadow-lg' 
                : 'border-gray-200 bg-white'
              }
            `}
          >
            <input
              type="radio"
              value={type.value}
              {...register('typeDossier')}
              className="sr-only"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-3xl">{type.icon}</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{type.label}</h3>
                  {type.urgence === 'critique' && (
                    <span className="inline-flex items-center gap-1 text-xs text-red-600">
                      <AlertTriangle className="w-3 h-3" />
                      Urgence maximale
                    </span>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-2">{type.description}</p>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Calendar className="w-3 h-3" />
                {type.delais}
              </div>
            </div>
            {typeSelectionne === type.value && (
              <div className="absolute top-2 right-2">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">✓</span>
                </div>
              </div>
            )}
          </label>
        ))}
      </div>

      {errors.typeDossier && (
        <p className="text-sm text-red-600">{errors.typeDossier.message as string}</p>
      )}

      {/* Informations complémentaires si type sélectionné */}
      {typeInfo && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">Documents généralement requis :</h4>
          <ul className="grid grid-cols-2 gap-2">
            {typeInfo.documents.map((doc, i) => (
              <li key={i} className="text-sm text-blue-700 flex items-center gap-2">
                <span className="text-blue-400">•</span>
                {doc}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Objet de la demande */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Objet de la demande <span className="text-red-500">*</span>
        </label>
        <textarea
          {...register('objetDemande')}
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Décrivez précisément l'objet de votre demande..."
        />
        {errors.objetDemande && (
          <p className="mt-1 text-sm text-red-600">{errors.objetDemande.message as string}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Minimum 10 caractères. Soyez précis pour faciliter le traitement.
        </p>
      </div>

      {/* Priorité */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Niveau de Priorité <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {PRIORITES.map((p) => (
            <label
              key={p.value}
              className={`
                relative flex flex-col items-center p-3 border-2 rounded-lg cursor-pointer transition-all
                ${priorite === p.value 
                  ? 'border-blue-600 shadow-md' 
                  : 'border-gray-200 hover:border-gray-400'
                }
              `}
            >
              <input
                type="radio"
                value={p.value}
                {...register('priorite')}
                className="sr-only"
              />
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${p.color}`}>
                {p.label}
              </span>
              <span className="text-xs text-gray-500 mt-1 text-center">{p.description}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Date d'échéance */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Date d'échéance (si connue)
        </label>
        <Input
          type="date"
          {...register('dateEcheance')}
          className="max-w-xs"
        />
        <p className="mt-1 text-xs text-gray-500">
          Date limite pour déposer le dossier ou contester une décision
        </p>
      </div>
    </div>
  )
}
