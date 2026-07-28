'use client';

// Force dynamic to prevent prerendering errors with React hooks
export const dynamic = 'force-dynamic';

/**
 * Formulaire Avance de Creation de Dossier
 * - Interface multi-etapes intuitive
 * - Validation en temps reel avec Zod
 * - Extraction IA de documents
 * - Templates intelligents par type
 * - Auto-completion et suggestions
 * - Sauvegarde automatique (brouillon)
 */

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { useForm, FormProvider, useFormContext } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { 
  FileText, User, Briefcase, Home, Heart, FileCheck, 
  ChevronRight, ChevronLeft, Upload, Save, Send, AlertCircle,
  CheckCircle, Sparkles, Clock, Calendar
} from 'lucide-react'
import { Card } from '@/components/ui'
import { Badge } from '@/components/ui'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/forms/Button'
import { EtapeTypeDossier } from '@/components/dossiers/EtapeTypeDossier'
import { SensitiveDataConsent } from '@/components/legal/SensitiveDataConsent'
import { CesedaSpecificFields } from '@/components/dossiers/CesedaSpecificFields'

// Schema de validation Zod
const dossierSchema = z.object({
  // Informations generales
  typeDossier: z.enum([
    'TITRE_SEJOUR', 'RECOURS_OQTF', 'NATURALISATION', 
    'REGROUPEMENT_FAMILIAL', 'ASILE', 'VISA', 'AUTRE'
  ]),
  objetDemande: z.string().min(10, 'Minimum 10 caracteres'),
  priorité: z.enum(['NORMALE', 'HAUTE', 'URGENTE', 'CRITIQUE']),
  dateEcheance: z.string().optional(),
  
  // Identite
  nom: z.string().min(2, 'Nom requis'),
  prenom: z.string().min(2, 'Prenom requis'),
  nomNaissance: z.string().optional(),
  dateNaissance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format: YYYY-MM-DD'),
  lieuNaissance: z.string().min(2, 'Lieu de naissance requis'),
  paysNaissance: z.string().min(2, 'Pays requis'),
  nationalite: z.string().min(2, 'Nationalite requise'),
  sexe: z.enum(['M', 'F', 'AUTRE']),
  
  // Contact
  téléphone: z.string().regex(/^0[1-9]\d{8}$/, 'Format: 0123456789'),
  email: z.string().email('Email invalide'),
  adresse: z.string().min(5, 'Adresse complete requise'),
  codePostal: z.string().regex(/^\d{5}$/, 'Code postal: 5 chiffres'),
  ville: z.string().min(2, 'Ville requise'),
  
  // Situation
  situationFamiliale: z.enum(['CELIBATAIRE', 'MARIE', 'PACSE', 'CONCUBINAGE', 'DIVORCE', 'VEUF']),
  nombreEnfants: z.number().min(0).max(20),
  situationPro: z.string(),
  niveauFrancais: z.string(),
  
  // Administratif
  dateArrivee: z.string().optional(),
  numeroEtranger: z.string().optional(),
  prefectureRattachement: z.string().optional(),
  
  // Metadonnees spécifiques CESEDA (optionnelles, stockees en JSON)
  metadata: z.record(z.any()).optional(),
})

type DossierFormData = z.infer<typeof dossierSchema>

const TYPES_DOSSIER = [
  { 
    value: 'TITRE_SEJOUR', 
    label: 'Titre de Sejour', 
    icon: '',
    description: 'Première demande ou renouvellement',
    delais: ['60 jours avant expiration', 'Recepisse', 'Decision prefecture'],
    documents: ['Passeport', 'Photos', 'Justificatif domicile', 'Contrat travail']
  },
  { 
    value: 'RECOURS_OQTF', 
    label: 'Recours OQTF', 
    icon: '?',
    description: 'Recours contre obligation de quitter le territoire',
    delais: ['48h refere-liberte', '2 mois recours gracieux', '2 mois TA'],
    documents: ['OQTF', 'Passeport', 'Preuves attaches', 'Certificats']
  },
  { 
    value: 'NATURALISATION', 
    label: 'Naturalisation', 
    icon: '????',
    description: 'Demande de nationalite francaise',
    delais: ['Instruction 12-18 mois', 'Entretien prefecture'],
    documents: ['Passeport', 'Titre sejour 5 ans', 'Certificat francais B1', 'Bulletins salaire']
  },
  { 
    value: 'REGROUPEMENT_FAMILIAL', 
    label: 'Regroupement Familial', 
    icon: '??',
    description: 'Faire venir sa famille en France',
    delais: ['6 mois instruction', 'Visite logement'],
    documents: ['Titre sejour', 'Justificatif ressources', 'Acte mariage', 'Bail']
  },
  { 
    value: 'ASILE', 
    label: 'Demande d\'Asile', 
    icon: '??',
    description: 'Protection internationale',
    delais: ['Procédure acceleree 15 jours', 'Procédure normale 6 mois', 'CNDA 5 mois'],
    documents: ['Recit', 'Preuves persecution', 'Documents identite', 'Convocation OFPRA']
  },
  { 
    value: 'VISA', 
    label: 'Visa Long Sejour', 
    icon: '?',
    description: 'VLS-TS etudes, travail, famille',
    delais: ['Rendez-vous consulat', 'Instruction 15 jours-3 mois'],
    documents: ['Passeport', 'Photos', 'Assurance', 'Justificatifs motif']
  },
]

const ETAPES = [
  { id: 'type', label: 'Type de Dossier', icon: FileText },
  { id: 'ceseda', label: 'Infos Spécifiques', icon: Briefcase },
  { id: 'identite', label: 'Identite', icon: User },
  { id: 'situation', label: 'Situation', icon: Home },
  { id: 'professionnel', label: 'Professionnel', icon: Briefcase },
  { id: 'administratif', label: 'Administratif', icon: FileCheck },
  { id: 'documents', label: 'Documents', icon: Upload },
  { id: 'validation', label: 'Validation', icon: CheckCircle },
]

export default function NouveauDossierAvance() {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [etapeActive, setEtapeActive] = useState(0)
  const [loading, setLoading] = useState(false)
  const [documentAnalyzing, setDocumentAnalyzing] = useState(false)
  const [extractedData, setExtractedData] = useState<any>(null)
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true)
  const [showSensitiveConsent, setShowSensitiveConsent] = useState(false)
  const [sensitiveConsent, setSensitiveConsent] = useState<Record<string, boolean> | null>(null)

  // Restore step from sessionStorage
  useEffect(() => {
    try {
      const savedStep = sessionStorage.getItem('memolib_nouveau_dossier_avocat_step');
      if (savedStep) setEtapeActive(parseInt(savedStep, 10));
    } catch {}
  }, []);

  // Persist step
  useEffect(() => {
    try { sessionStorage.setItem('memolib_nouveau_dossier_avocat_step', String(etapeActive)); } catch {}
  }, [etapeActive]);

  // Donnees anonymisees pour demo
  const methods = useForm<DossierFormData>({
    resolver: zodResolver(dossierSchema),
    mode: 'onChange',
    defaultValues: {
      priorité: 'NORMALE',
      nombreEnfants: 0,
      // Donnees client anonymisees
      nom: 'DOE',
      prenom: 'John',
      dateNaissance: '1990-01-01',
      lieuNaissance: 'Paris',
      paysNaissance: 'France',
      nationalite: 'Francaise',
      sexe: 'M',
      adresse: '123 rue de la Republique',
      codePostal: '75001',
      ville: 'Paris',
      téléphone: '+33612345678',
      email: 'client.anonyme@example.com',
      situationFamiliale: 'CELIBATAIRE',
    }
  })

  const { watch, setValue, formState: { errors } } = methods
  const typeDossierSelectionne = watch('typeDossier')

  // Auto-save brouillon toutes les 30s
  useEffect(() => {
    if (!autoSaveEnabled) return
    
    const interval = setInterval(() => {
      const data = methods.getValues()
      localStorage.setItem('dossier_brouillon', JSON.stringify(data))
      toast({ title: 'Brouillon sauvegarde' })
    }, 30000)

    return () => clearInterval(interval)
  }, [autoSaveEnabled, methods, toast])

  // Charger brouillon au montage
  useEffect(() => {
    const brouillon = localStorage.getItem('dossier_brouillon')
    if (brouillon) {
      const confirmed = confirm('Un brouillon existe. Voulez-vous le restaurer ?')
      if (confirmed) {
        methods.reset(JSON.parse(brouillon))
        toast({ title: 'Brouillon restaure' })
      }
    }
  }, [methods, toast])

  // Templates intelligents par type
  useEffect(() => {
    if (!typeDossierSelectionne) return

    const templates: Record<string, Partial<DossierFormData>> = {
      RECOURS_OQTF: {
        priorité: 'URGENTE',
        objetDemande: 'Recours contentieux contre OQTF notifiee le ',
      },
      ASILE: {
        priorité: 'HAUTE',
        objetDemande: 'Demande d\'asile - Protection internationale',
      },
      NATURALISATION: {
        priorité: 'NORMALE',
        objetDemande: 'Demande de naturalisation francaise par decret',
      },
    }

    const template = templates[typeDossierSelectionne]
    if (template) {
      Object.entries(template).forEach(([key, value]) => {
        setValue(key as any, value)
      })
    }
  }, [typeDossierSelectionne, setValue])

  // Extraction IA de documents
  const handleDocumentUpload = async (file: File) => {
    if (!file || file.size > 10 * 1024 * 1024) {
      toast({ title: 'Erreur', description: 'Fichier trop volumineux (max 10 MB)', variant: 'destructive' })
      return
    }

    setDocumentAnalyzing(true)
    const formData = new FormData()
    formData.append('document', file)

    try {
      const response = await fetch('/api/dossiers/analyze-document', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Erreur analyse')

      const data = await response.json()
      setExtractedData(data)

      // Pre-remplir les champs detectes
      if (data.nom) setValue('nom', data.nom)
      if (data.prenom) setValue('prenom', data.prenom)
      if (data.dateNaissance) setValue('dateNaissance', data.dateNaissance)
      if (data.nationalite) setValue('nationalite', data.nationalite)

      toast({ 
        title: ' Donnees extraites', 
        description: `${Object.keys(data).length} champs pre-remplis automatiquement` 
      })
    } catch (error) {
      toast({ title: 'Erreur analyse document', variant: 'destructive' })
    } finally {
      setDocumentAnalyzing(false)
    }
  }

  const handleEtapeSuivante = async () => {
    // Valider l'etape actuelle
    const champsEtape = getChampsEtape(etapeActive)
    const isValid = await methods.trigger(champsEtape as any)
    
    if (!isValid) {
      toast({ 
        title: 'Champs manquants', 
        description: 'Veuillez remplir tous les champs obligatoires',
        variant: 'destructive' 
      })
      return
    }

    if (etapeActive < ETAPES.length - 1) {
      setEtapeActive(etapeActive + 1)
    }
  }

  const handleEtapePrecedente = () => {
    if (etapeActive > 0) {
      setEtapeActive(etapeActive - 1)
    }
  }

  const onSubmit = async (data: DossierFormData) => {
    // Art. 9 RGPD: Consentement requis pour données sensibles (immigration, asile)
    const SENSITIVE_TYPES = ['TITRE_SEJOUR', 'RECOURS_OQTF', 'ASILE', 'REGROUPEMENT_FAMILIAL', 'NATURALISATION'];
    if (SENSITIVE_TYPES.includes(data.typeDossier) && !sensitiveConsent) {
      setShowSensitiveConsent(true);
      return;
    }

    setLoading(true)

    try {
      const response = await fetch('/api/dossiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          // Joindre la preuve de consentement pour l'audit trail
          sensitiveDataConsent: sensitiveConsent ? {
            granted: true,
            categories: sensitiveConsent,
            timestamp: new Date().toISOString(),
          } : undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erreur creation dossier')
      }

      const dossier = await response.json()

      // Nettoyer le brouillon
      localStorage.removeItem('dossier_brouillon')

      toast({ 
        title: ' Dossier cree', 
        description: `Dossier #${dossier.id} cree avec succès` 
      })

      setTimeout(() => {
        sessionStorage.removeItem('memolib_nouveau_dossier_avocat_step')
        router.push(`/dossiers/${dossier.id}`)
      }, 1500)
    } catch (error) {
      toast({ 
        title: 'Erreur', 
        description: error instanceof Error ? error.message : 'Erreur inconnue',
        variant: 'destructive' 
      })
    } finally {
      setLoading(false)
    }
  }

  function getChampsEtape(etape: number): string[] {
    const etapesChamps: Record<number, string[]> = {
      0: ['typeDossier', 'objetDemande', 'priorité'],
      1: [], // CESEDA-specific fields are optional
      2: ['nom', 'prenom', 'dateNaissance', 'lieuNaissance', 'nationalite', 'sexe'],
      3: ['téléphone', 'email', 'adresse', 'codePostal', 'ville', 'situationFamiliale'],
      4: ['situationPro', 'niveauFrancais'],
      5: ['dateArrivee', 'numeroEtranger', 'prefectureRattachement'],
    }
    return etapesChamps[etape] || []
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8 px-4">
      {/* Modal Consentement Art. 9 RGPD */}
      {showSensitiveConsent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <SensitiveDataConsent
            clientName={`${methods.getValues('prenom')} ${methods.getValues('nom')}`}
            onConsent={(consents) => {
              setSensitiveConsent(consents);
              setShowSensitiveConsent(false);
              // Re-déclencher la soumission maintenant que le consentement est obtenu
              methods.handleSubmit(onSubmit)();
            }}
            onCancel={() => setShowSensitiveConsent(false)}
            categories={[
              { id: 'ethnic_origin', label: 'Origine ethnique / nationalité', description: 'Nécessaire pour les dossiers de titre de séjour, naturalisation, et asile.', required: true },
              { id: 'political_opinions', label: 'Opinions politiques / convictions', description: 'Pertinent pour les demandes d\'asile (persécution politique).', required: false },
              { id: 'health_data', label: 'Données de santé', description: 'Certificats médicaux, vulnérabilités, handicap (si pertinent au dossier).', required: false },
              { id: 'criminal_record', label: 'Données judiciaires', description: 'Casier judiciaire, condamnations antérieures (si pertinent au dossier).', required: false },
            ]}
          />
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        {/* Header avec Role */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                Créer un Nouveau Dossier
              </h1>
              <p className="text-gray-600">Formulaire guide avec extraction intelligente de documents</p>
            </div>
            <div className="text-right space-y-2">
              <Badge variant="default">
                 Super Admin
              </Badge>
              <div className="text-sm text-gray-600">
                Avocat: <span className="font-medium text-blue-600">Me. Dupont</span> (backup)
              </div>
              <div className="text-xs text-gray-500 bg-yellow-50 px-3 py-1 rounded border border-yellow-200">
                 Donnees anonymisees
              </div>
            </div>
          </div>
        </div>

        {/* Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {ETAPES.map((etape, index) => {
              const Icon = etape.icon
              const isActive = index === etapeActive
              const isCompleted = index < etapeActive
              
              return (
                <div key={etape.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`
                      w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all
                      ${isActive ? 'bg-blue-600 border-blue-600 text-white scale-110' : ''}
                      ${isCompleted ? 'bg-green-500 border-green-500 text-white' : ''}
                      ${!isActive && !isCompleted ? 'bg-white border-gray-300 text-gray-400' : ''}
                    `}>
                      {isCompleted ? <CheckCircle className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                    </div>
                    <span className={`mt-2 text-sm font-medium ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                      {etape.label}
                    </span>
                  </div>
                  {index < ETAPES.length - 1 && (
                    <div className={`h-1 flex-1 mx-2 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)}>
            <Card className="p-8 shadow-xl">
              {/* Contenu de l'etape */}
              {etapeActive === 0 && <EtapeTypeDossier />}
              {etapeActive === 1 && <CesedaSpecificFields />}
              {etapeActive === 2 && <EtapeIdentite />}
              {etapeActive === 3 && <EtapeSituation />}
              {etapeActive === 4 && <EtapeProfessionnel />}
              {etapeActive === 5 && <EtapeAdministratif />}
              {etapeActive === 6 && <EtapeDocuments onUpload={handleDocumentUpload} analyzing={documentAnalyzing} />}
              {etapeActive === 7 && <EtapeValidation />}

              {/* Navigation */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t">
                <Button
                  type="button"
                  onClick={handleEtapePrecedente}
                  disabled={etapeActive === 0}
                  variant="outline"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Précédent
                </Button>

                <div className="flex items-center gap-2">
                  <Badge variant={autoSaveEnabled ? 'default' : 'warning'}>
                    <Clock className="w-3 h-3 mr-1" />
                    {autoSaveEnabled ? 'Sauvegarde auto' : 'Sauvegarde désactivée'}
                  </Badge>
                </div>

                {etapeActive < ETAPES.length - 1 ? (
                  <Button type="button" onClick={handleEtapeSuivante}>
                    Suivant
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={loading} className="bg-gradient-to-r from-blue-600 to-indigo-600">
                    {loading ? 'Creation...' : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Créer le Dossier
                      </>
                    )}
                  </Button>
                )}
              </div>
            </Card>
          </form>
        </FormProvider>

        {/* Aide contextuelle */}
        {typeDossierSelectionne && (
          <Card className="mt-4 p-4 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Conseils pour ce type de dossier</h3>
                <p className="text-sm text-blue-700">
                  {TYPES_DOSSIER.find(t => t.value === typeDossierSelectionne)?.description}
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

// Composants des etapes
function EtapeIdentite() {
  const { register, watch, setValue, formState: { errors } } = useFormContext<DossierFormData>()
  const situationFamiliale = watch('metadata.situationFamilialeDetail') as string | undefined
  const nombreEnfants = watch('metadata.nombreEnfantsDetail') as number | undefined

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <User className="w-6 h-6 text-blue-600" />
        Identité complète du demandeur
      </h2>

      {/* État civil */}
      <div className="border rounded-lg p-5 space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">État civil</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nom <span className="text-red-500">*</span></label>
            <input {...register('nom')} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            {errors.nom && <p className="text-red-600 text-xs mt-1">{errors.nom.message as string}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Prénom <span className="text-red-500">*</span></label>
            <input {...register('prenom')} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            {errors.prenom && <p className="text-red-600 text-xs mt-1">{errors.prenom.message as string}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nom de naissance (jeune fille)</label>
            <input {...register('nomNaissance')} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Si différent du nom actuel" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Date de naissance <span className="text-red-500">*</span></label>
            <input type="date" {...register('dateNaissance')} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            {errors.dateNaissance && <p className="text-red-600 text-xs mt-1">{errors.dateNaissance.message as string}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Lieu de naissance <span className="text-red-500">*</span></label>
            <input {...register('lieuNaissance')} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            {errors.lieuNaissance && <p className="text-red-600 text-xs mt-1">{errors.lieuNaissance?.message as string}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Pays de naissance <span className="text-red-500">*</span></label>
            <input {...register('paysNaissance')} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            {errors.paysNaissance && <p className="text-red-600 text-xs mt-1">{errors.paysNaissance?.message as string}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nationalité <span className="text-red-500">*</span></label>
            <select {...register('nationalite')} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">Sélectionner...</option>
              <option value="Algérienne">Algérienne</option>
              <option value="Marocaine">Marocaine</option>
              <option value="Tunisienne">Tunisienne</option>
              <option value="Sénégalaise">Sénégalaise</option>
              <option value="Malienne">Malienne</option>
              <option value="Ivoirienne">Ivoirienne</option>
              <option value="Camerounaise">Camerounaise</option>
              <option value="Congolaise (RDC)">Congolaise (RDC)</option>
              <option value="Congolaise (RC)">Congolaise (RC)</option>
              <option value="Guinéenne">Guinéenne</option>
              <option value="Comorienne">Comorienne</option>
              <option value="Turque">Turque</option>
              <option value="Afghane">Afghane</option>
              <option value="Syrienne">Syrienne</option>
              <option value="Irakienne">Irakienne</option>
              <option value="Bangladaise">Bangladaise</option>
              <option value="Sri Lankaise">Sri Lankaise</option>
              <option value="Pakistanaise">Pakistanaise</option>
              <option value="Géorgienne">Géorgienne</option>
              <option value="Albanaise">Albanaise</option>
              <option value="Haïtienne">Haïtienne</option>
              <option value="Chinoise">Chinoise</option>
              <option value="Autre">Autre</option>
            </select>
            {errors.nationalite && <p className="text-red-600 text-xs mt-1">{errors.nationalite.message as string}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Sexe <span className="text-red-500">*</span></label>
            <select {...register('sexe')} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">Sélectionner...</option>
              <option value="M">Masculin</option>
              <option value="F">Féminin</option>
              <option value="AUTRE">Autre</option>
            </select>
            {errors.sexe && <p className="text-red-600 text-xs mt-1">{errors.sexe?.message as string}</p>}
          </div>
        </div>
      </div>

      {/* Documents d'identité */}
      <div className="border rounded-lg p-5 space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Documents d&apos;identité</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">N° de passeport</label>
            <input {...register('metadata.numeroPasseport')} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Ex: 12AB34567" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date d&apos;expiration passeport</label>
            <input type="date" {...register('metadata.dateExpirationPasseport')} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">N° étranger (AGDREF)</label>
            <input {...register('numeroEtranger')} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Ex: 1234567890" />
          </div>
        </div>

        {/* Photo upload */}
        <div>
          <label className="block text-sm font-medium mb-1">Photo d&apos;identité</label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors cursor-pointer">
            <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-500">Glissez une photo ou cliquez pour parcourir</p>
            <p className="text-xs text-gray-400 mt-1">Format JPEG/PNG, fond blanc, 35x45mm</p>
            <input type="file" accept="image/*" className="hidden" id="photo-upload" />
            <label htmlFor="photo-upload" className="inline-block mt-2 px-3 py-1 text-sm bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200">
              Choisir un fichier
            </label>
          </div>
        </div>
      </div>

      {/* Situation familiale */}
      <div className="border rounded-lg p-5 space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Heart className="w-5 h-5 text-pink-500" />
          Situation familiale
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Situation familiale <span className="text-red-500">*</span></label>
            <select {...register('situationFamiliale')} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">Sélectionner...</option>
              <option value="CELIBATAIRE">Célibataire</option>
              <option value="MARIE">Marié(e)</option>
              <option value="PACSE">Pacsé(e)</option>
              <option value="CONCUBINAGE">Concubinage</option>
              <option value="DIVORCE">Divorcé(e)</option>
              <option value="VEUF">Veuf/Veuve</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date de mariage/PACS</label>
            <input type="date" {...register('metadata.dateMarriage')} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
        </div>

        {/* Conjoint details */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nom du conjoint</label>
            <input {...register('metadata.conjointNom')} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Prénom du conjoint</label>
            <input {...register('metadata.conjointPrenom')} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nationalité du conjoint</label>
            <input {...register('metadata.conjointNationalite')} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" {...register('metadata.conjointEstFrancais')} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="text-sm font-medium">Conjoint français(e)</span>
            </label>
          </div>
        </div>

        {/* Enfants */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre d&apos;enfants</label>
            <input
              type="number"
              min={0}
              max={20}
              {...register('nombreEnfants', { valueAsNumber: true })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Dynamic children fields */}
        {(nombreEnfants ?? 0) > 0 && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h4 className="text-sm font-semibold text-gray-700">Détails des enfants</h4>
            {Array.from({ length: Math.min(nombreEnfants ?? 0, 10) }).map((_, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-3 pb-3 border-b border-gray-200 last:border-0">
                <div>
                  <label className="block text-xs font-medium mb-1">Prénom enfant {i + 1}</label>
                  <input {...register(`metadata.enfant_${i}_prenom`)} className="w-full px-3 py-1.5 text-sm border rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Âge</label>
                  <input type="number" min={0} max={30} {...register(`metadata.enfant_${i}_age`)} className="w-full px-3 py-1.5 text-sm border rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Nationalité</label>
                  <input {...register(`metadata.enfant_${i}_nationalite`)} className="w-full px-3 py-1.5 text-sm border rounded-lg" />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" {...register(`metadata.enfant_${i}_scolarise`)} className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                    <span className="text-xs font-medium">Scolarisé en France</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function EtapeSituation() {
  const { register, watch } = useFormContext<DossierFormData>()
  const typeLogement = watch('metadata.typeLogement') as string | undefined

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Home className="w-6 h-6 text-blue-600" />
        Coordonnées et situation de vie
      </h2>

      {/* Contact */}
      <div className="border rounded-lg p-5 space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Coordonnées</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Téléphone principal <span className="text-red-500">*</span></label>
            <input {...register('téléphone')} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="06 12 34 56 78" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Téléphone secondaire</label>
            <input {...register('metadata.telephoneSecondaire')} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Optionnel" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email <span className="text-red-500">*</span></label>
            <input type="email" {...register('email')} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
        </div>
      </div>

      {/* Adresse */}
      <div className="border rounded-lg p-5 space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Adresse actuelle</h3>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Adresse (rue) <span className="text-red-500">*</span></label>
            <input {...register('adresse')} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="123 rue de la République" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Complément d&apos;adresse</label>
            <input {...register('metadata.adresseComplement')} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Bâtiment, escalier, étage, porte..." />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Code postal <span className="text-red-500">*</span></label>
            <input {...register('codePostal')} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="75001" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Ville <span className="text-red-500">*</span></label>
            <input {...register('ville')} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">À cette adresse depuis</label>
            <input type="date" {...register('metadata.dateAdresse')} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Type de logement</label>
            <select {...register('metadata.typeLogement')} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">Sélectionner...</option>
              <option value="proprietaire">Propriétaire</option>
              <option value="locataire">Locataire</option>
              <option value="heberge">Hébergé(e) chez un tiers</option>
              <option value="foyer">Foyer / hébergement social</option>
              <option value="sans_domicile">Sans domicile fixe</option>
            </select>
          </div>
          {typeLogement === 'heberge' && (
            <div>
              <label className="block text-sm font-medium mb-1">Nom de l&apos;hébergeant</label>
              <input {...register('metadata.nomHebergeant')} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Montant loyer (€/mois)</label>
            <input type="number" min={0} {...register('metadata.montantLoyer')} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="0" />
          </div>
        </div>
      </div>

      {/* Contact urgence */}
      <div className="border rounded-lg p-5 space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Contact d&apos;urgence</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nom</label>
            <input {...register('metadata.urgenceNom')} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Téléphone</label>
            <input {...register('metadata.urgenceTelephone')} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Lien de parenté</label>
            <select {...register('metadata.urgenceLien')} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">Sélectionner...</option>
              <option value="conjoint">Conjoint(e)</option>
              <option value="parent">Parent</option>
              <option value="enfant">Enfant</option>
              <option value="frere_soeur">Frère/Sœur</option>
              <option value="ami">Ami(e)</option>
              <option value="autre">Autre</option>
            </select>
          </div>
        </div>
      </div>

      {/* Langues et transport */}
      <div className="border rounded-lg p-5 space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Langues et mobilité</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Langues parlées</label>
            <div className="grid grid-cols-2 gap-2">
              {['Français', 'Arabe', 'Anglais', 'Turc', 'Mandarin', 'Dari/Pachtoune', 'Bengali', 'Lingala', 'Wolof', 'Autre'].map(lang => (
                <label key={lang} className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="checkbox" {...register(`metadata.langue_${lang.toLowerCase().replace(/[^a-z]/g, '_')}`)} className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                  {lang}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Moyen de transport principal</label>
            <select {...register('metadata.moyenTransport')} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">Sélectionner...</option>
              <option value="transports_commun">Transports en commun</option>
              <option value="voiture">Voiture personnelle</option>
              <option value="velo">Vélo</option>
              <option value="marche">À pied</option>
              <option value="aucun">Aucun / Difficultés de mobilité</option>
            </select>
          </div>
        </div>
      </div>

      {/* Situation spéciale */}
      <div className="border rounded-lg p-5 space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-orange-500" />
          Situation particulière
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input type="checkbox" {...register('metadata.handicap')} className="w-4 h-4 rounded border-gray-300 text-blue-600" />
            <div>
              <span className="text-sm font-medium">Handicap / Invalidité</span>
              <p className="text-xs text-gray-500">RQTH, AAH, carte mobilité</p>
            </div>
          </label>
          <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input type="checkbox" {...register('metadata.problemeSante')} className="w-4 h-4 rounded border-gray-300 text-blue-600" />
            <div>
              <span className="text-sm font-medium">Problème de santé</span>
              <p className="text-xs text-gray-500">Maladie grave, ALD</p>
            </div>
          </label>
          <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input type="checkbox" {...register('metadata.suiviMedical')} className="w-4 h-4 rounded border-gray-300 text-blue-600" />
            <div>
              <span className="text-sm font-medium">Suivi médical en cours</span>
              <p className="text-xs text-gray-500">Traitement, soins réguliers</p>
            </div>
          </label>
        </div>
      </div>
    </div>
  )
}

function EtapeProfessionnel() {
  const { register, watch } = useFormContext<DossierFormData>()
  const situationPro = watch('situationPro')

  const isEmployed = ['CDI', 'CDD', 'INTERIMAIRE', 'INDEPENDANT'].includes(situationPro || '')

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Briefcase className="w-6 h-6 text-blue-600" />
        Situation professionnelle et ressources
      </h2>

      {/* Situation pro */}
      <div className="border rounded-lg p-5 space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Emploi actuel</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Situation professionnelle <span className="text-red-500">*</span></label>
            <select {...register('situationPro')} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">Sélectionner...</option>
              <option value="CDI">CDI - Contrat à durée indéterminée</option>
              <option value="CDD">CDD - Contrat à durée déterminée</option>
              <option value="INTERIMAIRE">Intérimaire</option>
              <option value="INDEPENDANT">Indépendant / Auto-entrepreneur</option>
              <option value="SANS_EMPLOI">Sans emploi</option>
              <option value="ETUDIANT">Étudiant(e)</option>
              <option value="RETRAITE">Retraité(e)</option>
              <option value="AUTRE">Autre</option>
            </select>
          </div>
        </div>

        {/* Détails emploi si en activité */}
        {isEmployed && (
          <div className="bg-blue-50 rounded-lg p-4 space-y-4">
            <h4 className="text-sm font-semibold text-blue-800">Détails de l&apos;emploi</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Employeur / Entreprise</label>
                <input {...register('metadata.employeur')} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Poste occupé</label>
                <input {...register('metadata.poste')} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Adresse de l&apos;employeur</label>
                <input {...register('metadata.adresseEmployeur')} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date de début du contrat</label>
                <input type="date" {...register('metadata.dateDebutContrat')} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type de contrat</label>
                <select {...register('metadata.typeContrat')} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="">Sélectionner...</option>
                  <option value="temps_plein">Temps plein</option>
                  <option value="temps_partiel">Temps partiel</option>
                  <option value="saisonnier">Saisonnier</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Revenus */}
      <div className="border rounded-lg p-5 space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Ressources financières</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Revenu mensuel net (€)</label>
            <input type="number" min={0} {...register('metadata.revenuMensuelNet')} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="0" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Autres revenus (€/mois)</label>
            <input type="number" min={0} {...register('metadata.autresRevenus')} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Aides, pensions..." />
          </div>
        </div>
      </div>

      {/* Niveau de français */}
      <div className="border rounded-lg p-5 space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Niveau de français</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Niveau CECRL <span className="text-red-500">*</span></label>
            <select {...register('niveauFrancais')} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">Sélectionner...</option>
              <option value="A1">A1 - Découverte</option>
              <option value="A2">A2 - Élémentaire</option>
              <option value="B1">B1 - Intermédiaire (requis naturalisation)</option>
              <option value="B2">B2 - Avancé</option>
              <option value="C1">C1 - Autonome</option>
              <option value="C2">C2 - Maîtrise</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Certification obtenue</label>
            <select {...register('metadata.certificationFrancais')} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">Aucune</option>
              <option value="TCF">TCF (Test de Connaissance du Français)</option>
              <option value="TEF">TEF (Test d&apos;Évaluation du Français)</option>
              <option value="DELF">DELF</option>
              <option value="DALF">DALF</option>
              <option value="DFP">DFP (Diplôme de Français Professionnel)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date certification</label>
            <input type="date" {...register('metadata.dateCertificationFrancais')} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
        </div>
      </div>

      {/* Formation */}
      <div className="border rounded-lg p-5 space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Formation et diplômes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Niveau d&apos;études</label>
            <select {...register('metadata.niveauEtudes')} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">Sélectionner...</option>
              <option value="sans_diplome">Sans diplôme</option>
              <option value="cap_bep">CAP / BEP</option>
              <option value="bac">Baccalauréat</option>
              <option value="licence">Licence (Bac+3)</option>
              <option value="master">Master (Bac+5)</option>
              <option value="doctorat">Doctorat</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Diplômes et formations</label>
            <textarea {...register('metadata.diplomes')} rows={3} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Listez vos diplômes, formations, certifications..." />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Historique professionnel en France</label>
          <textarea {...register('metadata.historiquePro')} rows={3} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Postes occupés en France avec dates approximatives..." />
        </div>
      </div>

      {/* Déclaration fiscale */}
      <div className="border rounded-lg p-5 space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Déclaration fiscale</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input type="checkbox" {...register('metadata.impotsPayes')} className="w-4 h-4 rounded border-gray-300 text-blue-600" />
            <div>
              <span className="text-sm font-medium">Impôts payés en France</span>
              <p className="text-xs text-gray-500">Déclarations fiscales effectuées</p>
            </div>
          </label>
          <div>
            <label className="block text-sm font-medium mb-1">Années déclarées</label>
            <input {...register('metadata.anneesDeclarees')} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Ex: 2020, 2021, 2022, 2023" />
          </div>
        </div>
      </div>
    </div>
  )
}

function EtapeAdministratif() {
  const { register, watch } = useFormContext<DossierFormData>()
  const precedentesOQTF = watch('metadata.precedentesOQTF') as boolean | undefined
  const precedentsRecours = watch('metadata.precedentsRecours') as boolean | undefined
  const dejaRefuse = watch('metadata.dejaRefuse') as boolean | undefined

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <FileCheck className="w-6 h-6 text-blue-600" />
        Parcours administratif et migratoire
      </h2>

      {/* Entrée en France */}
      <div className="border rounded-lg p-5 space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Entrée en France</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Date d&apos;arrivée en France</label>
            <input type="date" {...register('dateArrivee')} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Mode d&apos;entrée</label>
            <select {...register('metadata.modeEntree')} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">Sélectionner...</option>
              <option value="visa_court">Visa court séjour (Schengen)</option>
              <option value="visa_long">Visa long séjour (VLS-TS)</option>
              <option value="sans_visa">Sans visa</option>
              <option value="demandeur_asile">Demandeur d&apos;asile</option>
              <option value="regroupement">Regroupement familial</option>
              <option value="etudiant">Visa étudiant</option>
              <option value="autre">Autre</option>
            </select>
          </div>
        </div>
      </div>

      {/* Titre de séjour actuel */}
      <div className="border rounded-lg p-5 space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Titre de séjour actuel</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Type de titre actuel</label>
            <select {...register('metadata.titreSejourActuel')} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">Aucun titre</option>
              <option value="recepisse">Récépissé</option>
              <option value="aps">APS (Autorisation Provisoire de Séjour)</option>
              <option value="carte_1an">Carte de séjour 1 an</option>
              <option value="carte_pluriannuelle">Carte pluriannuelle 4 ans</option>
              <option value="carte_resident">Carte de résident 10 ans</option>
              <option value="carte_resident_permanent">Carte de résident permanent</option>
              <option value="visa_long_sejour">VLS-TS valant titre de séjour</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">N° de titre</label>
            <input {...register('metadata.numeroTitre')} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">N° étranger (AGDREF)</label>
            <input {...register('numeroEtranger')} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Date de délivrance</label>
            <input type="date" {...register('metadata.dateDelivrance')} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date d&apos;expiration</label>
            <input type="date" {...register('metadata.dateExpiration')} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Préfecture de rattachement</label>
            <select {...register('prefectureRattachement')} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">Sélectionner...</option>
              <option value="Paris">Préfecture de Police de Paris</option>
              <option value="Bobigny">Préfecture de Bobigny (93)</option>
              <option value="Nanterre">Préfecture de Nanterre (92)</option>
              <option value="Créteil">Préfecture de Créteil (94)</option>
              <option value="Evry">Préfecture d&apos;Évry (91)</option>
              <option value="Cergy">Préfecture de Cergy (95)</option>
              <option value="Versailles">Préfecture de Versailles (78)</option>
              <option value="Melun">Préfecture de Melun (77)</option>
              <option value="Lyon">Préfecture de Lyon (69)</option>
              <option value="Marseille">Préfecture de Marseille (13)</option>
              <option value="Toulouse">Préfecture de Toulouse (31)</option>
              <option value="Lille">Préfecture de Lille (59)</option>
              <option value="Bordeaux">Préfecture de Bordeaux (33)</option>
              <option value="Strasbourg">Préfecture de Strasbourg (67)</option>
              <option value="Nantes">Préfecture de Nantes (44)</option>
              <option value="Autre">Autre préfecture</option>
            </select>
          </div>
        </div>
      </div>

      {/* Historique */}
      <div className="border rounded-lg p-5 space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Historique des titres</h3>
        <div>
          <label className="block text-sm font-medium mb-1">Historique des titres obtenus</label>
          <textarea {...register('metadata.historiqueTitres')} rows={4} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Ex: 2019 - Récépissé (1ère demande)&#10;2020 - Carte de séjour 1 an (salarié)&#10;2021 - Renouvellement carte 1 an..." />
        </div>
      </div>

      {/* Antécédents */}
      <div className="border rounded-lg p-5 space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          Antécédents administratifs
        </h3>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-red-50">
              <input type="checkbox" {...register('metadata.precedentesOQTF')} className="w-4 h-4 rounded border-gray-300 text-red-600" />
              <div>
                <span className="text-sm font-medium">OQTF antérieure(s)</span>
                <p className="text-xs text-gray-500">Obligation de quitter le territoire</p>
              </div>
            </label>
            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-orange-50">
              <input type="checkbox" {...register('metadata.precedentsRecours')} className="w-4 h-4 rounded border-gray-300 text-orange-600" />
              <div>
                <span className="text-sm font-medium">Recours antérieur(s)</span>
                <p className="text-xs text-gray-500">TA, CNDA, recours gracieux</p>
              </div>
            </label>
          </div>

          {precedentesOQTF && (
            <div className="bg-red-50 rounded-lg p-4">
              <label className="block text-sm font-medium mb-1 text-red-800">Détails des OQTF précédentes</label>
              <textarea {...register('metadata.detailsOQTF')} rows={2} className="w-full px-4 py-2 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500" placeholder="Date(s), préfecture(s), motif(s)..." />
            </div>
          )}

          {precedentsRecours && (
            <div className="bg-orange-50 rounded-lg p-4">
              <label className="block text-sm font-medium mb-1 text-orange-800">Détails des recours précédents</label>
              <textarea {...register('metadata.detailsRecours')} rows={2} className="w-full px-4 py-2 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500" placeholder="Juridiction, date, résultat..." />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input type="checkbox" {...register('metadata.interditTerritoire')} className="w-4 h-4 rounded border-gray-300 text-red-600" />
              <div>
                <span className="text-sm font-medium text-red-700">Interdiction du territoire</span>
              </div>
            </label>
            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input type="checkbox" {...register('metadata.ficheSPEC')} className="w-4 h-4 rounded border-gray-300 text-orange-600" />
              <div>
                <span className="text-sm font-medium">Fiche S / SPEC</span>
              </div>
            </label>
            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input type="checkbox" {...register('metadata.dejaRefuse')} className="w-4 h-4 rounded border-gray-300 text-yellow-600" />
              <div>
                <span className="text-sm font-medium">Déjà refusé(e)</span>
              </div>
            </label>
          </div>

          {dejaRefuse && (
            <div className="bg-yellow-50 rounded-lg p-4">
              <label className="block text-sm font-medium mb-1 text-yellow-800">Détails du refus</label>
              <textarea {...register('metadata.detailsRefus')} rows={2} className="w-full px-4 py-2 border border-yellow-200 rounded-lg focus:ring-2 focus:ring-yellow-500" placeholder="Motif du refus, date, préfecture..." />
            </div>
          )}
        </div>
      </div>

      {/* Procédures en cours */}
      <div className="border rounded-lg p-5 space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Procédures en cours</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { id: 'proc_ta', label: 'Tribunal Administratif (TA)' },
            { id: 'proc_cnda', label: 'CNDA' },
            { id: 'proc_gracieux', label: 'Recours gracieux' },
            { id: 'proc_aucune', label: 'Aucune procédure' },
          ].map(proc => (
            <label key={proc.id} className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 text-sm">
              <input type="checkbox" {...register(`metadata.${proc.id}`)} className="w-4 h-4 rounded border-gray-300 text-blue-600" />
              {proc.label}
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

function EtapeDocuments({ onUpload, analyzing }: { onUpload: (file: File) => void; analyzing: boolean }) {
  const { watch } = useFormContext<DossierFormData>()
  const typeDossier = watch('typeDossier')
  const [uploadedDocs, setUploadedDocs] = useState<Array<{ name: string; type: string; status: 'pending' | 'validated' | 'rejected' }>>([])
  const [dragActive, setDragActive] = useState(false)

  const selectedType = TYPES_DOSSIER.find(t => t.value === typeDossier)
  const requiredDocs = selectedType?.documents || []

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      files.forEach(file => {
        onUpload(file)
        setUploadedDocs(prev => [...prev, { name: file.name, type: 'non_classé', status: 'pending' }])
      })
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    files.forEach(file => {
      onUpload(file)
      setUploadedDocs(prev => [...prev, { name: file.name, type: 'non_classé', status: 'pending' }])
    })
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Upload className="w-6 h-6 text-blue-600" />
        Documents justificatifs
      </h2>

      {/* Checklist documents requis */}
      <div className="border rounded-lg p-5 space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Documents requis pour ce dossier</h3>
        {requiredDocs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {requiredDocs.map((doc, i) => {
              const isUploaded = uploadedDocs.some(u => u.type === doc || u.name.toLowerCase().includes(doc.toLowerCase()))
              return (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${isUploaded ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                  {isUploaded ? (
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                  )}
                  <span className={`text-sm ${isUploaded ? 'text-green-800 font-medium' : 'text-gray-700'}`}>{doc}</span>
                  {!isUploaded && <Badge variant="warning" className="ml-auto text-xs">Manquant</Badge>}
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">Sélectionnez un type de dossier pour voir les documents requis.</p>
        )}
      </div>

      {/* Upload zone */}
      <div className="border rounded-lg p-5 space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Téléverser des documents</h3>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
        >
          <Upload className={`w-12 h-12 mx-auto mb-4 ${dragActive ? 'text-blue-500' : 'text-gray-400'}`} />
          <p className="text-gray-600 mb-2 font-medium">
            {dragActive ? 'Déposez les fichiers ici...' : 'Glissez-déposez vos documents ici'}
          </p>
          <p className="text-sm text-gray-500 mb-4">PDF, JPEG, PNG — Maximum 10 MB par fichier</p>
          <input
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload-docs"
          />
          <label
            htmlFor="file-upload-docs"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors"
          >
            Sélectionner des fichiers
          </label>
        </div>

        {analyzing && (
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full" />
            <div>
              <p className="text-sm font-medium text-blue-800">Analyse OCR en cours...</p>
              <p className="text-xs text-blue-600">Extraction automatique des données du document</p>
            </div>
          </div>
        )}
      </div>

      {/* Documents téléversés */}
      {uploadedDocs.length > 0 && (
        <div className="border rounded-lg p-5 space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Documents téléversés ({uploadedDocs.length})</h3>
          <div className="space-y-2">
            {uploadedDocs.map((doc, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{doc.name}</p>
                    <select
                      value={doc.type}
                      onChange={(e) => {
                        setUploadedDocs(prev => prev.map((d, idx) => idx === i ? { ...d, type: e.target.value } : d))
                      }}
                      className="text-xs border rounded px-2 py-0.5 mt-1"
                    >
                      <option value="non_classé">— Type de document —</option>
                      {requiredDocs.map(rd => (
                        <option key={rd} value={rd}>{rd}</option>
                      ))}
                      <option value="autre">Autre</option>
                    </select>
                  </div>
                </div>
                <Badge variant={doc.status === 'validated' ? 'default' : doc.status === 'rejected' ? 'destructive' : 'warning'}>
                  {doc.status === 'validated' ? '✓ Validé' : doc.status === 'rejected' ? '✗ Rejeté' : '⏳ En attente'}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* OCR Status */}
      <div className="border rounded-lg p-5 space-y-3">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          Extraction IA (OCR)
        </h3>
        <div className="bg-purple-50 rounded-lg p-4">
          <p className="text-sm text-purple-800">
            L&apos;IA analyse automatiquement vos documents pour pré-remplir le formulaire. Les champs détectés seront mis en surbrillance.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-xs text-gray-600">Extraction réussie</span>
            <div className="w-3 h-3 rounded-full bg-yellow-500 ml-3" />
            <span className="text-xs text-gray-600">Vérification manuelle requise</span>
            <div className="w-3 h-3 rounded-full bg-gray-300 ml-3" />
            <span className="text-xs text-gray-600">Non analysé</span>
          </div>
        </div>
      </div>

      {/* Vérifier complétude */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => {
            const missing = requiredDocs.filter(doc =>
              !uploadedDocs.some(u => u.type === doc || u.name.toLowerCase().includes(doc.toLowerCase()))
            )
            if (missing.length === 0) {
              alert('✓ Tous les documents requis sont présents !')
            } else {
              alert(`Documents manquants :\n${missing.map(m => `• ${m}`).join('\n')}`)
            }
          }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <CheckCircle className="w-4 h-4" />
          Vérifier complétude
        </button>
      </div>
    </div>
  )
}

function EtapeValidation() {
  const { watch } = useFormContext()
  const data = watch()
  
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Recapitulatif</h2>
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Informations du dossier</h3>
        <dl className="space-y-2">
          <div className="flex justify-between">
            <dt className="text-gray-600">Type:</dt>
            <dd className="font-medium">{data.typeDossier}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-600">Client:</dt>
            <dd className="font-medium">{data.prenom} {data.nom}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-600">Email:</dt>
            <dd className="font-medium">{data.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-600">Téléphone:</dt>
            <dd className="font-medium">{data.téléphone}</dd>
          </div>
        </dl>
      </Card>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          [Check] <strong>Mode Super Admin:</strong> Ce dossier sera cree avec des donnees anonymisees. L'avocat (Me. Dupont) sera notifie en backup et pourra acceder au dossier pour traitement.
        </p>
        <p className="text-xs text-blue-600 mt-2">
           Les donnees personnelles sont masquees pour des raisons de confidentialité.
        </p>
      </div>
    </div>
  )
}
