'use client';

// Force dynamic to prevent prerendering errors with React hooks
export const dynamic = 'force-dynamic';

/**
 * Page détail d'un dossier - Vue avocat
 * Affiche toutes les informations du dossier client
 */

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { 
  FileText, ArrowLeft, User, Calendar, Clock, 
  AlertCircle, CheckCircle, Upload, MessageSquare,
  FileCheck, Edit, Trash2, Download, Send, Plus,
  Scale, Briefcase, MapPin, Phone, Mail, Globe
} from 'lucide-react'
import { Card } from '@/components/ui'
import { Badge } from '@/components/ui'
import { Button } from '@/components/forms/Button'
import { useToast } from '@/hooks/use-toast'

interface Client {
  id: string
  nom: string
  prenom: string
  email: string
  telephone?: string
  nationalite?: string
  dateNaissance?: string
  adresse?: string
}

interface Document {
  id: string
  name: string
  type: string
  size: number
  createdAt: string
  url?: string
}

interface Echeance {
  id: string
  titre: string
  date: string
  statut: 'PENDING' | 'DONE' | 'OVERDUE'
}

interface Message {
  id: string
  content: string
  createdAt: string
  isFromClient: boolean
}

interface Dossier {
  id: string
  numeroDossier: string
  typeDossier: string
  objetDemande: string
  statut: string
  priorite: string
  dateCreation: string
  dateEcheance?: string
  notes?: string
  client: Client
  documents: Document[]
  echeances: Echeance[]
  messages: Message[]
}

const STATUT_COLORS: Record<string, string> = {
  BROUILLON: 'gray',
  EN_COURS: 'blue',
  EN_ATTENTE: 'yellow',
  TERMINE: 'green',
  REJETE: 'red',
  ANNULE: 'gray',
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

export default function DossierDetailPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  
  const [dossier, setDossier] = useState<Dossier | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'info' | 'documents' | 'messages' | 'echeances'>('info')

  const dossierId = params.id as string

  useEffect(() => {
    if (dossierId) {
      fetchDossier()
    }
  }, [dossierId])

  const fetchDossier = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/dossiers/${dossierId}`)
      if (!res.ok) {
        if (res.status === 404) {
          toast({
            variant: 'destructive',
            title: 'Dossier introuvable',
            description: 'Ce dossier n\'existe pas ou a été supprimé'
          })
          router.push('/admin/dossiers')
          return
        }
        throw new Error('Erreur chargement')
      }
      
      const data = await res.json()
      setDossier(data)
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger le dossier'
      })
    } finally {
      setLoading(false)
    }
  }

  const updateStatut = async (newStatut: string) => {
    try {
      const res = await fetch(`/api/admin/dossiers/${dossierId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: newStatut }),
      })
      
      if (!res.ok) throw new Error('Erreur mise à jour')
      
      toast({
        variant: 'success',
        title: 'Statut mis à jour',
        description: `Le dossier est maintenant ${newStatut.replace('_', ' ')}`
      })
      
      fetchDossier()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de mettre à jour le statut'
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du dossier...</p>
        </div>
      </div>
    )
  }

  if (!dossier) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 text-center">
          <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Dossier introuvable</h2>
          <p className="text-gray-600 mb-4">Ce dossier n&apos;existe pas ou vous n&apos;y avez pas accès.</p>
          <Button onClick={() => router.push('/admin/dossiers')} className="bg-blue-600 text-white">
            Retour aux dossiers
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => router.push('/admin/dossiers')}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center gap-2"
              >
                <ArrowLeft size={20} />
                Retour
              </Button>
              
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <FileText className="text-blue-600" size={28} />
                  {dossier.numeroDossier}
                </h1>
                <p className="text-gray-600">
                  {TYPES_LABELS[dossier.typeDossier] || dossier.typeDossier}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant={STATUT_COLORS[dossier.statut] as any} className="text-sm px-3 py-1">
                {dossier.statut.replace('_', ' ')}
              </Badge>
              <Badge variant={dossier.priorite === 'URGENTE' ? 'red' : 'gray'} className="text-sm px-3 py-1">
                {dossier.priorite}
              </Badge>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-4 flex gap-1 border-t pt-4">
            {[
              { id: 'info', label: 'Informations', icon: Briefcase },
              { id: 'documents', label: 'Documents', icon: FileText, count: dossier.documents.length },
              { id: 'messages', label: 'Messages', icon: MessageSquare, count: dossier.messages.length },
              { id: 'echeances', label: 'Échéances', icon: Calendar, count: dossier.echeances.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    activeTab === tab.id ? 'bg-blue-500' : 'bg-gray-200'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-3 gap-6">
          {/* Colonne principale */}
          <div className="col-span-2 space-y-6">
            {/* Tab: Informations */}
            {activeTab === 'info' && (
              <>
                <Card className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Scale size={20} className="text-blue-600" />
                    Objet de la demande
                  </h2>
                  <p className="text-gray-700 whitespace-pre-wrap">{dossier.objetDemande}</p>
                  
                  {dossier.notes && (
                    <div className="mt-4 pt-4 border-t">
                      <h3 className="font-medium text-gray-900 mb-2">Notes internes</h3>
                      <p className="text-gray-600 whitespace-pre-wrap">{dossier.notes}</p>
                    </div>
                  )}
                </Card>

                {/* Actions rapides */}
                <Card className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={() => router.push(`/admin/dossiers/${dossierId}/edit`)}
                      className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                    >
                      <Edit size={16} />
                      Modifier le dossier
                    </Button>
                    <Button
                      onClick={() => updateStatut('EN_COURS')}
                      className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                      disabled={dossier.statut === 'EN_COURS'}
                    >
                      <CheckCircle size={16} />
                      Marquer en cours
                    </Button>
                    <Button
                      onClick={() => updateStatut('TERMINE')}
                      className="bg-gray-600 hover:bg-gray-700 text-white flex items-center gap-2"
                      disabled={dossier.statut === 'TERMINE'}
                    >
                      <FileCheck size={16} />
                      Clôturer
                    </Button>
                  </div>
                </Card>
              </>
            )}

            {/* Tab: Documents */}
            {activeTab === 'documents' && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <FileText size={20} className="text-blue-600" />
                    Documents ({dossier.documents.length})
                  </h2>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
                    <Upload size={16} />
                    Ajouter un document
                  </Button>
                </div>

                {dossier.documents.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="mx-auto mb-2 opacity-50" size={40} />
                    <p>Aucun document</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dossier.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="text-blue-600" size={24} />
                          <div>
                            <p className="font-medium text-gray-900">{doc.name}</p>
                            <p className="text-sm text-gray-500">
                              {(doc.size / 1024).toFixed(1)} KB • {new Date(doc.createdAt).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        </div>
                        <Button className="bg-gray-200 hover:bg-gray-300 text-gray-700">
                          <Download size={16} />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* Tab: Messages */}
            {activeTab === 'messages' && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <MessageSquare size={20} className="text-blue-600" />
                    Messages ({dossier.messages.length})
                  </h2>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
                    <Send size={16} />
                    Envoyer un message
                  </Button>
                </div>

                {dossier.messages.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="mx-auto mb-2 opacity-50" size={40} />
                    <p>Aucun message</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {dossier.messages.map((msg) => (
                      <div key={msg.id} className={`p-4 rounded-lg ${
                        msg.isFromClient ? 'bg-gray-100 ml-0 mr-12' : 'bg-blue-50 ml-12 mr-0'
                      }`}>
                        <p className="text-gray-800">{msg.content}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {msg.isFromClient ? 'Client' : 'Vous'} • {new Date(msg.createdAt).toLocaleString('fr-FR')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* Tab: Échéances */}
            {activeTab === 'echeances' && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Calendar size={20} className="text-blue-600" />
                    Échéances ({dossier.echeances.length})
                  </h2>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
                    <Plus size={16} />
                    Ajouter une échéance
                  </Button>
                </div>

                {dossier.echeances.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="mx-auto mb-2 opacity-50" size={40} />
                    <p>Aucune échéance</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dossier.echeances.map((ech) => (
                      <div key={ech.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {ech.statut === 'DONE' ? (
                            <CheckCircle className="text-green-600" size={24} />
                          ) : ech.statut === 'OVERDUE' ? (
                            <AlertCircle className="text-red-600" size={24} />
                          ) : (
                            <Clock className="text-yellow-600" size={24} />
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{ech.titre}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(ech.date).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        </div>
                        <Badge variant={
                          ech.statut === 'DONE' ? 'green' : 
                          ech.statut === 'OVERDUE' ? 'red' : 'yellow'
                        }>
                          {ech.statut === 'DONE' ? 'Fait' : ech.statut === 'OVERDUE' ? 'En retard' : 'À faire'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}
          </div>

          {/* Sidebar - Infos client */}
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User size={20} className="text-blue-600" />
                Client
              </h2>
              
              <div className="space-y-4">
                <div className="text-center pb-4 border-b">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <User className="text-blue-600" size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {dossier.client.prenom} {dossier.client.nom}
                  </h3>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-gray-600">
                    <Mail size={18} />
                    <a href={`mailto:${dossier.client.email}`} className="text-blue-600 hover:underline">
                      {dossier.client.email}
                    </a>
                  </div>
                  
                  {dossier.client.telephone && (
                    <div className="flex items-center gap-3 text-gray-600">
                      <Phone size={18} />
                      <a href={`tel:${dossier.client.telephone}`} className="text-blue-600 hover:underline">
                        {dossier.client.telephone}
                      </a>
                    </div>
                  )}
                  
                  {dossier.client.nationalite && (
                    <div className="flex items-center gap-3 text-gray-600">
                      <Globe size={18} />
                      <span>{dossier.client.nationalite}</span>
                    </div>
                  )}
                  
                  {dossier.client.adresse && (
                    <div className="flex items-center gap-3 text-gray-600">
                      <MapPin size={18} />
                      <span>{dossier.client.adresse}</span>
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => router.push(`/admin/clients/${dossier.client.id}`)}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 mt-4"
                >
                  Voir le profil client
                </Button>
              </div>
            </Card>

            {/* Timeline */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock size={20} className="text-blue-600" />
                Dates clés
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 bg-blue-600 rounded-full mt-1.5"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Création</p>
                    <p className="text-sm text-gray-500">
                      {new Date(dossier.dateCreation).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                
                {dossier.dateEcheance && (
                  <div className="flex items-start gap-3">
                    <div className="w-3 h-3 bg-orange-500 rounded-full mt-1.5"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Échéance</p>
                      <p className="text-sm text-gray-500">
                        {new Date(dossier.dateEcheance).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
