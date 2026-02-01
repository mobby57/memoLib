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
import { CesedaSpecificFields } from '@/components/dossiers/CesedaSpecificFields'

// Schema de validation Zod
const dossierSchema = z.object({
  // Informations generales
  typeDossier: z.enum([
    'TITRE_SEJOUR', 'RECOURS_OQTF', 'NATURALISATION', 
    'REGROUPEMENT_FAMILIAL', 'ASILE', 'VISA', 'AUTRE'
  ]),
  objetDemande: z.string().min(10, 'Minimum 10 caracteres'),
  priorite: z.enum(['NORMALE', 'HAUTE', 'URGENTE', 'CRITIQUE']),
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
  telephone: z.string().regex(/^0[1-9]\d{8}$/, 'Format: 0123456789'),
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
  
  // Metadonnees specifiques CESEDA (optionnelles, stockees en JSON)
  metadata: z.record(z.any()).optional(),
})

type DossierFormData = z.infer<typeof dossierSchema>

const TYPES_DOSSIER = [
  { 
    value: 'TITRE_SEJOUR', 
    label: 'Titre de Sejour', 
    icon: '',
    description: 'Premiere demande ou renouvellement',
    delais: ['60 jours avant expiration', 'Recepisse', 'Decision prefecture'],
    documents: ['Passeport', 'Photos', 'Justificatif domicile', 'Contrat travail']
  },
  { 
    value: 'RECOURS_OQTF', 
    label: 'Recours OQTF', 
    icon: '️',
    description: 'Recours contre obligation de quitter le territoire',
    delais: ['48h refere-liberte', '2 mois recours gracieux', '2 mois TA'],
    documents: ['OQTF', 'Passeport', 'Preuves attaches', 'Certificats']
  },
  { 
    value: 'NATURALISATION', 
    label: 'Naturalisation', 
    icon: '🇫🇷',
    description: 'Demande de nationalite francaise',
    delais: ['Instruction 12-18 mois', 'Entretien prefecture'],
    documents: ['Passeport', 'Titre sejour 5 ans', 'Certificat francais B1', 'Bulletins salaire']
  },
  { 
    value: 'REGROUPEMENT_FAMILIAL', 
    label: 'Regroupement Familial', 
    icon: '‍‍',
    description: 'Faire venir sa famille en France',
    delais: ['6 mois instruction', 'Visite logement'],
    documents: ['Titre sejour', 'Justificatif ressources', 'Acte mariage', 'Bail']
  },
  { 
    value: 'ASILE', 
    label: 'Demande d\'Asile', 
    icon: '🏠',
    description: 'Protection internationale',
    delais: ['Procedure acceleree 15 jours', 'Procedure normale 6 mois', 'CNDA 5 mois'],
    documents: ['Recit', 'Preuves persecution', 'Documents identite', 'Convocation OFPRA']
  },
  { 
    value: 'VISA', 
    label: 'Visa Long Sejour', 
    icon: '️',
    description: 'VLS-TS etudes, travail, famille',
    delais: ['Rendez-vous consulat', 'Instruction 15 jours-3 mois'],
    documents: ['Passeport', 'Photos', 'Assurance', 'Justificatifs motif']
  },
]

const ETAPES = [
  { id: 'type', label: 'Type de Dossier', icon: FileText },
  { id: 'ceseda', label: 'Infos Specifiques', icon: Briefcase },
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

  // Donnees anonymisees pour demo
  const methods = useForm<DossierFormData>({
    resolver: zodResolver(dossierSchema),
    mode: 'onChange',
    defaultValues: {
      priorite: 'NORMALE',
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
      telephone: '+33612345678',
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
        priorite: 'URGENTE',
        objetDemande: 'Recours contentieux contre OQTF notifiee le ',
      },
      ASILE: {
        priorite: 'HAUTE',
        objetDemande: 'Demande d\'asile - Protection internationale',
      },
      NATURALISATION: {
        priorite: 'NORMALE',
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
    setLoading(true)

    try {
      const response = await fetch('/api/dossiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
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
        description: `Dossier #${dossier.id} cree avec succes` 
      })

      setTimeout(() => router.push(`/dossiers/${dossier.id}`), 1500)
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
      0: ['typeDossier', 'objetDemande', 'priorite'],
      1: [], // CESEDA-specific fields are optional
      2: ['nom', 'prenom', 'dateNaissance', 'lieuNaissance', 'nationalite', 'sexe'],
      3: ['telephone', 'email', 'adresse', 'codePostal', 'ville', 'situationFamiliale'],
      4: ['situationPro', 'niveauFrancais'],
      5: ['dateArrivee', 'numeroEtranger', 'prefectureRattachement'],
    }
    return etapesChamps[etape] || []
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header avec Role */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                Creer un Nouveau Dossier
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
                  Precedent
                </Button>

                <div className="flex items-center gap-2">
                  <Badge variant={autoSaveEnabled ? 'default' : 'warning'}>
                    <Clock className="w-3 h-3 mr-1" />
                    {autoSaveEnabled ? 'Sauvegarde auto' : 'Sauvegarde desactivee'}
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
                        Creer le Dossier
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
  const { register, formState: { errors } } = useFormContext()
  
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Informations d'Identite</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Nom <span className="text-red-500">*</span></label>
          <input {...register('nom')} className="w-full px-4 py-2 border rounded-lg" />
          {errors.nom && <p className="text-red-600 text-sm mt-1">{errors.nom.message as string}</p>}
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Prenom <span className="text-red-500">*</span></label>
          <input {...register('prenom')} className="w-full px-4 py-2 border rounded-lg" />
          {errors.prenom && <p className="text-red-600 text-sm mt-1">{errors.prenom.message as string}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Date de naissance <span className="text-red-500">*</span></label>
          <input type="date" {...register('dateNaissance')} className="w-full px-4 py-2 border rounded-lg" />
          {errors.dateNaissance && <p className="text-red-600 text-sm mt-1">{errors.dateNaissance.message as string}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Lieu de naissance <span className="text-red-500">*</span></label>
          <input {...register('lieuNaissance')} className="w-full px-4 py-2 border rounded-lg" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Nationalite <span className="text-red-500">*</span></label>
          <input {...register('nationalite')} className="w-full px-4 py-2 border rounded-lg" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Sexe <span className="text-red-500">*</span></label>
          <select {...register('sexe')} className="w-full px-4 py-2 border rounded-lg">
            <option value="">Selectionner...</option>
            <option value="M">Masculin</option>
            <option value="F">Feminin</option>
            <option value="AUTRE">Autre</option>
          </select>
        </div>
      </div>
    </div>
  )
}

function EtapeSituation() {
  const { register } = useFormContext()
  
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Coordonnees</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Telephone <span className="text-red-500">*</span></label>
          <input {...register('telephone')} className="w-full px-4 py-2 border rounded-lg" placeholder="0601020304" />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Email <span className="text-red-500">*</span></label>
          <input type="email" {...register('email')} className="w-full px-4 py-2 border rounded-lg" />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium mb-2">Adresse <span className="text-red-500">*</span></label>
          <input {...register('adresse')} className="w-full px-4 py-2 border rounded-lg" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Code postal <span className="text-red-500">*</span></label>
          <input {...register('codePostal')} className="w-full px-4 py-2 border rounded-lg" placeholder="75001" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Ville <span className="text-red-500">*</span></label>
          <input {...register('ville')} className="w-full px-4 py-2 border rounded-lg" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Situation familiale <span className="text-red-500">*</span></label>
          <select {...register('situationFamiliale')} className="w-full px-4 py-2 border rounded-lg">
            <option value="">Selectionner...</option>
            <option value="CELIBATAIRE">Celibataire</option>
            <option value="MARIE">Marie(e)</option>
            <option value="PACSE">Pacse(e)</option>
            <option value="CONCUBINAGE">Concubinage</option>
            <option value="DIVORCE">Divorce(e)</option>
            <option value="VEUF">Veuf/Veuve</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Nombre d'enfants</label>
          <input type="number" {...register('nombreEnfants')} defaultValue={0} className="w-full px-4 py-2 border rounded-lg" />
        </div>
      </div>
    </div>
  )
}

function EtapeProfessionnel() {
  const { register } = useFormContext()
  
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Situation Professionnelle</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium mb-2">Situation professionnelle</label>
          <input {...register('situationPro')} className="w-full px-4 py-2 border rounded-lg" placeholder="Salarie CDI, etudiant, etc." />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Niveau de francais</label>
          <select {...register('niveauFrancais')} className="w-full px-4 py-2 border rounded-lg">
            <option value="">Selectionner...</option>
            <option value="A1">A1 - Debutant</option>
            <option value="A2">A2 - elementaire</option>
            <option value="B1">B1 - Intermediaire</option>
            <option value="B2">B2 - Avance</option>
            <option value="C1">C1 - Autonome</option>
            <option value="C2">C2 - Maitrise</option>
          </select>
        </div>
      </div>
    </div>
  )
}

function EtapeAdministratif() {
  const { register } = useFormContext()
  
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Informations Administratives</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Date d'arrivee en France</label>
          <input type="date" {...register('dateArrivee')} className="w-full px-4 py-2 border rounded-lg" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Numero etranger (si connu)</label>
          <input {...register('numeroEtranger')} className="w-full px-4 py-2 border rounded-lg" />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium mb-2">Prefecture de rattachement</label>
          <input {...register('prefectureRattachement')} className="w-full px-4 py-2 border rounded-lg" placeholder="ex: Prefecture de Paris" />
        </div>
      </div>
    </div>
  )
}

function EtapeDocuments({ onUpload, analyzing }: any) { 
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Documents</h2>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-600 mb-4">
          Glissez vos documents ici ou cliquez pour parcourir
        </p>
        <input 
          type="file" 
          multiple 
          onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
          className="hidden"
          id="file-upload"
        />
        <label 
          htmlFor="file-upload"
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700"
        >
          Selectionner des fichiers
        </label>
        {analyzing && <p className="mt-4 text-blue-600">Analyse en cours...</p>}
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
            <dt className="text-gray-600">Telephone:</dt>
            <dd className="font-medium">{data.telephone}</dd>
          </div>
        </dl>
      </Card>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          [Check] <strong>Mode Super Admin:</strong> Ce dossier sera cree avec des donnees anonymisees. L'avocat (Me. Dupont) sera notifie en backup et pourra acceder au dossier pour traitement.
        </p>
        <p className="text-xs text-blue-600 mt-2">
           Les donnees personnelles sont masquees pour des raisons de confidentialite.
        </p>
      </div>
    </div>
  )
}
