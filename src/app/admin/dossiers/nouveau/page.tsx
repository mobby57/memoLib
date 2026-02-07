'use client';

// Force dynamic to prevent prerendering errors with React hooks
export const dynamic = 'force-dynamic';

/**
 * Formulaire Avocat - Creation de Dossier pour un Client
 * Interface complete pour que l'avocat cree un dossier au nom d'un client
 */

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { 
  FileText, User, Briefcase, Save, ArrowLeft,
  Calendar, AlertCircle, CheckCircle
} from 'lucide-react'
import { Card } from '@/components/ui'
import { Badge } from '@/components/ui'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/forms/Button'

// Schema de validation
const dossierSchema = z.object({
  clientId: z.string().min(1, 'Client requis'),
  typeDossier: z.enum([
    'TITRE_SEJOUR', 'RECOURS_OQTF', 'NATURALISATION', 
    'REGROUPEMENT_FAMILIAL', 'ASILE', 'VISA', 'AUTRE'
  ]),
  objetDemande: z.string().min(10, 'Minimum 10 caracteres'),
  priorite: z.enum(['NORMALE', 'HAUTE', 'URGENTE', 'CRITIQUE']),
  dateEcheance: z.string().optional(),
  statut: z.enum(['BROUILLON', 'EN_COURS', 'EN_ATTENTE', 'TERMINE', 'REJETE', 'ANNULE']).optional(),
  notes: z.string().optional(),
})

type DossierFormData = z.infer<typeof dossierSchema>

const TYPES_DOSSIER = [
  { value: 'TITRE_SEJOUR', label: 'Titre de Sejour' },
  { value: 'RECOURS_OQTF', label: 'Recours OQTF' },
  { value: 'NATURALISATION', label: 'Naturalisation' },
  { value: 'REGROUPEMENT_FAMILIAL', label: 'Regroupement Familial' },
  { value: 'ASILE', label: 'Demande d\'Asile' },
  { value: 'VISA', label: 'Visa' },
  { value: 'AUTRE', label: 'Autre' },
]

interface Client {
  id: string
  firstName: string
  lastName: string
  email: string
}

export default function NouveauDossierAvocatPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingClients, setLoadingClients] = useState(true)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<DossierFormData>({
    resolver: zodResolver(dossierSchema),
    defaultValues: {
      priorite: 'NORMALE',
      statut: 'EN_COURS',
    },
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    } else if (session?.user?.role !== 'AVOCAT' && session?.user?.role !== 'ADMIN') {
      router.push('/dashboard')
    } else {
      fetchClients()
    }
  }, [session, status])

  const fetchClients = async () => {
    try {
      setLoadingClients(true)
      const res = await fetch('/api/admin/clients')
      if (!res.ok) throw new Error('Erreur chargement clients')
      
      const data = await res.json()
      setClients(data.clients || [])
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger la liste des clients'
      })
    } finally {
      setLoadingClients(false)
    }
  }

  const onSubmit = async (data: DossierFormData) => {
    try {
      setLoading(true)
      
      const res = await fetch('/api/admin/dossiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Erreur creation dossier')
      }

      const result = await res.json()
      
      toast({
        variant: 'success',
        title: 'Dossier cree',
        description: `Dossier ${result.dossier.numeroDossier} cree avec succes`
      })

      router.push('/admin/dossiers')
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

  const selectedClient = watch('clientId')
  const clientInfo = clients.find(c => c.id === selectedClient)

  if (loadingClients) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
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
          
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FileText className="text-blue-600" size={32} />
            Nouveau Dossier Client
          </h1>
          <p className="text-gray-600 mt-2">
            Creer un nouveau dossier pour un client existant
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Selection Client */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <User className="text-blue-600" size={24} />
              Client
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selectionner un client *
                </label>
                <select
                  {...register('clientId')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">-- Choisir un client --</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.firstName} {client.lastName} ({client.email})
                    </option>
                  ))}
                </select>
                {errors.clientId && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.clientId.message}
                  </p>
                )}
              </div>

              {clientInfo && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">Client selectionne:</p>
                  <p className="text-blue-700">
                    {clientInfo.firstName} {clientInfo.lastName} - {clientInfo.email}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Informations Dossier */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Briefcase className="text-blue-600" size={24} />
              Informations du Dossier
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Type de dossier */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de dossier *
                </label>
                <select
                  {...register('typeDossier')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Choisir un type --</option>
                  {TYPES_DOSSIER.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {errors.typeDossier && (
                  <p className="mt-1 text-sm text-red-600">{errors.typeDossier.message}</p>
                )}
              </div>

              {/* Priorite */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priorite *
                </label>
                <select
                  {...register('priorite')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="NORMALE">Normale</option>
                  <option value="HAUTE">Haute</option>
                  <option value="URGENTE">Urgente</option>
                  <option value="CRITIQUE">Critique</option>
                </select>
                {errors.priorite && (
                  <p className="mt-1 text-sm text-red-600">{errors.priorite.message}</p>
                )}
              </div>

              {/* Statut */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Statut initial
                </label>
                <select
                  {...register('statut')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="BROUILLON">Brouillon</option>
                  <option value="EN_COURS">En cours</option>
                  <option value="EN_ATTENTE">En attente</option>
                </select>
              </div>

              {/* Date echeance */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date d'echeance
                </label>
                <input
                  type="date"
                  {...register('dateEcheance')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {errors.dateEcheance && (
                  <p className="mt-1 text-sm text-red-600">{errors.dateEcheance.message}</p>
                )}
              </div>

              {/* Objet de la demande */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Objet de la demande *
                </label>
                <textarea
                  {...register('objetDemande')}
                  rows={3}
                  placeholder="Decrivez l'objet de la demande (minimum 10 caracteres)..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                ></textarea>
                {errors.objetDemande && (
                  <p className="mt-1 text-sm text-red-600">{errors.objetDemande.message}</p>
                )}
              </div>

              {/* Notes internes */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes internes (optionnel)
                </label>
                <textarea
                  {...register('notes')}
                  rows={4}
                  placeholder="Notes ou commentaires internes sur le dossier..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                ></textarea>
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
                  Creation...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Creer le Dossier
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
