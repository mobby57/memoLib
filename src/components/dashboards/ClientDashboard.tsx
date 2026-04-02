'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import QuickSearch from '@/components/QuickSearch'
import { FileText, Calendar, Euro, MessageSquare, Upload } from 'lucide-react'

interface ClientDossier {
  id: string
  numero: string
  type: string
  statut: string
  echeance?: string
  description: string
}

export default function ClientDashboard() {
  const [dossier, setDossier] = useState<ClientDossier | null>(null)
  const [stats, setStats] = useState({
    documentsUploaded: 0,
    facturesEnAttente: 0,
    prochainRdv: null as string | null
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchClientData()
  }, [])

  const fetchClientData = async () => {
    try {
      const [dossierRes, statsRes] = await Promise.all([
        fetch('/api/client/dossier'),
        fetch('/api/client/stats')
      ])
      
      if (dossierRes.ok) {
        const dossierData = await dossierRes.json()
        setDossier(dossierData)
      }
      
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }
    } catch (error) {
      console.error('Erreur chargement dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Chargement...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Mon Dossier</h1>
        <Button>
          <MessageSquare className="w-4 h-4 mr-2" />
          Contacter mon Avocat
        </Button>
      </div>

      {/* Recherche rapide */}
      <QuickSearch className="mb-6" />
      
      {/* Stats client */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents Envoyes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.documentsUploaded}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Factures en Attente</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.facturesEnAttente}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prochain RDV</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {stats.prochainRdv || 'Aucun RDV planifie'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dossier principal */}
      {dossier && (
        <Card>
          <CardHeader>
            <CardTitle>Mon Dossier - {dossier.numero}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{dossier.type}</h3>
                  <p className="text-sm text-muted-foreground">
                    {dossier.description}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={dossier.statut === 'EN_COURS' ? 'info' : 'default'}>
                    {dossier.statut}
                  </Badge>
                  {dossier.echeance && (
                    <span className="text-sm font-medium">
                      echeance: {dossier.echeance}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Ajouter Document
                </Button>
                <Button variant="outline">
                  <Calendar className="w-4 h-4 mr-2" />
                  Prendre RDV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!dossier && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">
              Aucun dossier actif. Contactez votre avocat pour plus d'informations.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
