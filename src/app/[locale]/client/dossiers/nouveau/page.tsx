'use client';

// Force dynamic to prevent prerendering errors with React hooks
export const dynamic = 'force-dynamic';

/**
 * Interface Client - Formulaire Simplifie de Demande
 * Les clients creent leur demande, l'avocat la transforme en dossier complet
 */

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { 
  FileText, Send, ArrowLeft, AlertCircle, CheckCircle,
  Briefcase, Calendar
} from 'lucide-react'
import { Card } from '@/components/ui'
import { Badge } from '@/components/ui'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/forms/Button'

// Schema simplifie pour les clients
const demandeSchema = z.object({
  typeDossier: z.enum([
    'TITRE_SEJOUR', 'RECOURS_OQTF', 'NATURALISATION', 
    'REGROUPEMENT_FAMILIAL', 'ASILE', 'VISA', 'AUTRE'
  ]),
  objetDemande: z.string().min(20, 'Decrivez votre demande en minimum 20 caracteres'),
  dateEcheance: z.string().optional(),
  urgence: z.boolean().optional(),
  complementInfo: z.string().optional(),
})

type DemandeFormData = z.infer<typeof demandeSchema>

const TYPES_DEMANDE = [
  { 
    value: 'TITRE_SEJOUR', 
    label: 'Titre de Sejour', 
    icon: '',
    description: 'Premiere demande ou renouvellement de titre de sejour'
  },
  { 
    value: 'RECOURS_OQTF', 
    label: 'Recours OQTF', 
    icon: '?',
    description: 'Contestation d\'une Obligation de Quitter le Territoire'
  },
  { 
    value: 'NATURALISATION', 
    label: 'Naturalisation', 
    icon: '????',
    description: 'Demande de naturalisation francaise'
  },
  { 
    value: 'REGROUPEMENT_FAMILIAL', 
    label: 'Regroupement Familial', 
    icon: '???',
    description: 'Faire venir votre famille en France'
  },
  { 
    value: 'ASILE', 
    label: 'Demande d\'Asile', 
    icon: '?',
    description: 'Protection internationale'
  },
  { 
    value: 'VISA', 
    label: 'Visa', 
    icon: '?',
    description: 'Demande de visa (court ou long sejour)'
  },
  { 
    value: 'AUTRE', 
    label: 'Autre demande', 
    icon: '',
    description: 'Autre type de demarche administrative'
  },
]

export default function NouvelleDemandePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(false)
  const [selectedType, setSelectedType] = useState<string>('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<DemandeFormData>({
    resolver: zodResolver(demandeSchema),
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    } else if (session?.user?.role !== 'CLIENT') {
      router.push('/dashboard')
    }
  }, [session, status])

  const onSubmit = async (data: DemandeFormData) => {
    try {
      setLoading(true)
      
      const res = await fetch('/api/client/demandes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          priorite: data.urgence ? 'URGENTE' : 'NORMALE',
          statut: 'BROUILLON', // Les demandes clients commencent en brouillon
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Erreur lors de l\'envoi de la demande')
      }

      const result = await res.json()
      
      toast({
        variant: 'success',
        title: 'Demande envoyee !',
        description: 'Votre demande a ete transmise a votre avocat qui la traitera dans les plus brefs delais.'
      })

      router.push('/client/dossiers')
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: (error as Error).message
      })
    } finally {
      setLoading(false)
    }
  }

  const urgence = watch('urgence')

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => router.back()}
            className="mb-4 bg-gray-600 hover:bg-gray-700 text-white flex items-center gap-2"
          >
            <ArrowLeft size={20} />
            Retour
          </Button>
          
          <div className="bg-white rounded-xl shadow-md p-6">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <FileText className="text-blue-600" size={32} />
              Nouvelle Demande
            </h1>
            <p className="text-gray-600 mt-2">
              Decrivez votre situation et votre demande. Votre avocat vous contactera rapidement.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Selection du type de demande */}
          <Card className="p-6 bg-white">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Briefcase className="text-blue-600" size={24} />
              Type de demarche
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {TYPES_DEMANDE.map((type) => (
                <div
                  key={type.value}
                  onClick={() => {
                    setSelectedType(type.value)
                    setValue('typeDossier', type.value as any)
                  }}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedType === type.value
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{type.icon}</span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{type.label}</h3>
                      <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                    </div>
                    {selectedType === type.value && (
                      <CheckCircle className="text-blue-600" size={20} />
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {errors.typeDossier && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle size={14} />
                {errors.typeDossier.message}
              </p>
            )}
          </Card>

          {/* Description de la demande */}
          <Card className="p-6 bg-white">
            <h2 className="text-xl font-semibold mb-4">Decrivez votre demande</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Objet de votre demande *
                </label>
                <textarea
                  {...register('objetDemande')}
                  rows={5}
                  placeholder="Decrivez votre situation et ce que vous souhaitez obtenir (minimum 20 caracteres)...

Exemples :
- Je souhaite renouveler mon titre de sejour qui expire le 15/06/2026
- J'ai recu une OQTF et je souhaite faire un recours
- Je vis en France depuis 5 ans et souhaite demander la naturalisation"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                ></textarea>
                {errors.objetDemande && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.objetDemande.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Date echeance */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date limite (si applicable)
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="date"
                      {...register('dateEcheance')}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Par ex: date d'expiration de titre, date d'audience...
                  </p>
                </div>

                {/* Urgence */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Situation urgente ?
                  </label>
                  <div className="flex items-center gap-3 h-12">
                    <input
                      type="checkbox"
                      {...register('urgence')}
                      id="urgence"
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="urgence" className="text-gray-700 cursor-pointer">
                      Oui, c'est urgent
                    </label>
                  </div>
                  {urgence && (
                    <Badge variant="danger" >
                       Traitement prioritaire
                    </Badge>
                  )}
                </div>
              </div>

              {/* Informations complementaires */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Informations complementaires (optionnel)
                </label>
                <textarea
                  {...register('complementInfo')}
                  rows={3}
                  placeholder="Ajoutez toute information utile : documents deja en votre possession, demarches deja effectuees, questions specifiques..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                ></textarea>
              </div>
            </div>
          </Card>

          {/* Informations */}
          <Card className="p-4 bg-blue-50 border border-blue-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-blue-600 mt-1" size={20} />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">a savoir :</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Votre demande sera transmise a votre avocat</li>
                  <li>Vous recevrez une confirmation par email</li>
                  <li>L'avocat vous contactera sous 24-48h</li>
                  <li>Vous pourrez suivre l'avancement dans votre espace "Mes Dossiers"</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              type="button"
              onClick={() => router.back()}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send size={20} />
                  Envoyer ma Demande
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
