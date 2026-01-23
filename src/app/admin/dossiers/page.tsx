'use client'

/**
 * Dashboard Avocat - Gestion de TOUS les dossiers
 * Interface complète pour gérer les dossiers de tous les clients du cabinet
 */

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  FileText, Plus, Search, Filter, Download, 
  Calendar, Clock, AlertCircle, CheckCircle, 
  Eye, Edit, Trash2, User, Tag
} from 'lucide-react'
import { Card } from '@/components/ui'
import { Badge } from '@/components/ui'
import { Button } from '@/components/forms/Button'
import { useToast } from '@/hooks/use-toast'

interface Dossier {
  id: string
  numeroDossier: string
  typeDossier: string
  objetDemande: string
  statut: 'BROUILLON' | 'EN_COURS' | 'EN_ATTENTE' | 'TERMINE' | 'REJETE' | 'ANNULE'
  priorite: 'NORMALE' | 'HAUTE' | 'URGENTE' | 'CRITIQUE'
  dateCreation: string
  dateEcheance?: string
  client: {
    nom: string
    prenom: string
    email: string
  }
  _count?: {
    documents: number
    echeances: number
  }
}

const STATUT_COLORS = {
  BROUILLON: 'gray',
  EN_COURS: 'blue',
  EN_ATTENTE: 'yellow',
  TERMINE: 'green',
  REJETE: 'red',
  ANNULE: 'gray',
}

const PRIORITE_COLORS = {
  NORMALE: 'gray',
  HAUTE: 'yellow',
  URGENTE: 'orange',
  CRITIQUE: 'red',
}

const TYPES_LABELS: Record<string, string> = {
  TITRE_SEJOUR: 'Titre de Séjour',
  RECOURS_OQTF: 'Recours OQTF',
  NATURALISATION: 'Naturalisation',
  REGROUPEMENT_FAMILIAL: 'Regroupement Familial',
  ASILE: 'Demande d\'Asile',
  VISA: 'Visa',
  AUTRE: 'Autre',
}

export default function DossiersAvocatPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  
  const [dossiers, setDossiers] = useState<Dossier[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatut, setFilterStatut] = useState<string>('ALL')
  const [filterPriorite, setFilterPriorite] = useState<string>('ALL')
  const [sortBy, setSortBy] = useState<'date' | 'echeance' | 'priorite'>('date')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    } else if (session?.user?.role !== 'AVOCAT' && session?.user?.role !== 'ADMIN') {
      router.push('/dashboard')
    } else {
      fetchDossiers()
    }
  }, [session, status])

  const fetchDossiers = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/dossiers')
      if (!res.ok) throw new Error('Erreur chargement dossiers')
      
      const data = await res.json()
      setDossiers(data.dossiers || [])
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger les dossiers'
      })
    } finally {
      setLoading(false)
    }
  }

  const deleteDossier = async (id: string) => {
    if (!confirm('Supprimer ce dossier ? Cette action est irréversible.')) return

    try {
      const res = await fetch(`/api/admin/dossiers/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erreur suppression')
      
      toast({
        variant: 'success',
        title: 'Dossier supprimé',
        description: 'Le dossier a été supprimé avec succès'
      })
      
      fetchDossiers()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de supprimer le dossier'
      })
    }
  }

  // Filtres et tri
  const filteredDossiers = dossiers
    .filter(d => {
      const matchSearch = 
        d.numeroDossier.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.client.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.client.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.objetDemande.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchStatut = filterStatut === 'ALL' || d.statut === filterStatut
      const matchPriorite = filterPriorite === 'ALL' || d.priorite === filterPriorite
      
      return matchSearch && matchStatut && matchPriorite
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime()
      } else if (sortBy === 'echeance') {
        if (!a.dateEcheance) return 1
        if (!b.dateEcheance) return -1
        return new Date(a.dateEcheance).getTime() - new Date(b.dateEcheance).getTime()
      } else {
        const prioriteOrder = { CRITIQUE: 4, URGENTE: 3, HAUTE: 2, NORMALE: 1 }
        return prioriteOrder[b.priorite] - prioriteOrder[a.priorite]
      }
    })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <FileText className="text-blue-600" size={32} />
              Gestion des Dossiers
            </h1>
            <p className="text-gray-600 mt-2">
              {dossiers.length} dossier{dossiers.length > 1 ? 's' : ''} au total
            </p>
          </div>
          
          <Button
            onClick={() => router.push('/admin/dossiers/nouveau')}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
          >
            <Plus size={20} />
            Nouveau Dossier
          </Button>
        </div>

        {/* Filtres */}
        <Card className="p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Recherche */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher par numéro, client, objet..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filtre Statut */}
            <div>
              <select
                value={filterStatut}
                onChange={(e) => setFilterStatut(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Tous les statuts</option>
                <option value="BROUILLON">Brouillon</option>
                <option value="EN_COURS">En cours</option>
                <option value="EN_ATTENTE">En attente</option>
                <option value="TERMINE">Terminé</option>
                <option value="REJETE">Rejeté</option>
                <option value="ANNULE">Annulé</option>
              </select>
            </div>

            {/* Filtre Priorité */}
            <div>
              <select
                value={filterPriorite}
                onChange={(e) => setFilterPriorite(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Toutes priorités</option>
                <option value="CRITIQUE">Critique</option>
                <option value="URGENTE">Urgente</option>
                <option value="HAUTE">Haute</option>
                <option value="NORMALE">Normale</option>
              </select>
            </div>
          </div>

          {/* Tri */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setSortBy('date')}
              className={`px-4 py-2 rounded-lg ${
                sortBy === 'date' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Par date
            </button>
            <button
              onClick={() => setSortBy('echeance')}
              className={`px-4 py-2 rounded-lg ${
                sortBy === 'echeance' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Par échéance
            </button>
            <button
              onClick={() => setSortBy('priorite')}
              className={`px-4 py-2 rounded-lg ${
                sortBy === 'priorite' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Par priorité
            </button>
          </div>
        </Card>

        {/* Liste des dossiers */}
        {filteredDossiers.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600 text-lg">Aucun dossier trouvé</p>
            <p className="text-gray-400 mt-2">
              {searchTerm || filterStatut !== 'ALL' || filterPriorite !== 'ALL'
                ? 'Essayez de modifier vos filtres'
                : 'Créez votre premier dossier pour commencer'}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredDossiers.map((dossier) => (
              <Card key={dossier.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  {/* Infos principales */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {dossier.numeroDossier}
                      </h3>
                      <Badge variant={STATUT_COLORS[dossier.statut] as any}>
                        {dossier.statut.replace('_', ' ')}
                      </Badge>
                      <Badge variant={PRIORITE_COLORS[dossier.priorite] as any}>
                        {dossier.priorite}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div className="flex items-center gap-2 text-gray-600">
                        <User size={16} />
                        <span>{dossier.client.prenom} {dossier.client.nom}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Tag size={16} />
                        <span>{TYPES_LABELS[dossier.typeDossier] || dossier.typeDossier}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar size={16} />
                        <span>Créé le {new Date(dossier.dateCreation).toLocaleDateString('fr-FR')}</span>
                      </div>
                      {dossier.dateEcheance && (
                        <div className="flex items-center gap-2 text-orange-600">
                          <Clock size={16} />
                          <span>Échéance: {new Date(dossier.dateEcheance).toLocaleDateString('fr-FR')}</span>
                        </div>
                      )}
                    </div>

                    <p className="text-gray-700 line-clamp-2">{dossier.objetDemande}</p>

                    <div className="flex gap-4 mt-3 text-sm text-gray-500">
                      <span>{dossier._count?.documents || 0} document(s)</span>
                      <span>{dossier._count?.echeances || 0} échéance(s)</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      onClick={() => router.push(`/admin/dossiers/${dossier.id}`)}
                      className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                    >
                      <Eye size={16} />
                      Voir
                    </Button>
                    <Button
                      onClick={() => router.push(`/admin/dossiers/${dossier.id}/edit`)}
                      className="bg-gray-600 hover:bg-gray-700 text-white flex items-center gap-2"
                    >
                      <Edit size={16} />
                      Éditer
                    </Button>
                    <Button
                      onClick={() => deleteDossier(dossier.id)}
                      className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
                    >
                      <Trash2 size={16} />
                      Supprimer
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
