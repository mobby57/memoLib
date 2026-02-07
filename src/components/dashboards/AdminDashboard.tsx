'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import QuickSearch from '@/components/QuickSearch'
import { FileText, Users, AlertTriangle, Calendar, Plus, Brain } from 'lucide-react'

interface DossierUrgent {
  id: string
  numero: string
  client: string
  type: string
  echeance: string
  priorite: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalDossiers: 0,
    dossiersUrgents: 0,
    totalClients: 0,
    facturesEnAttente: 0
  })
  const [dossiersUrgents, setDossiersUrgents] = useState<DossierUrgent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [statsRes, urgentsRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/dossiers/urgents')
      ])
      
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }
      
      if (urgentsRes.ok) {
        const urgentsData = await urgentsRes.json()
        setDossiersUrgents(urgentsData)
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
        <h1 className="text-3xl font-bold">Dashboard Cabinet</h1>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Brain className="w-4 h-4 mr-2" />
            IA Avancee
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nouveau Dossier
          </Button>
        </div>
      </div>

      {/* Recherche rapide */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <QuickSearch className="lg:col-span-1" />
        
        <div className="lg:col-span-2">
          {/* Stats cabinet */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Dossiers Actifs</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalDossiers}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Dossiers Urgents</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.dossiersUrgents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Factures en Attente</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.facturesEnAttente}</div>
          </CardContent>
        </Card>
      </div>
      </div>

      {/* Dossiers urgents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
            Dossiers Urgents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dossiersUrgents.map((dossier) => (
              <div key={dossier.id} className="flex items-center justify-between p-4 border rounded-lg bg-red-50">
                <div className="flex items-center space-x-4">
                  <div>
                    <h3 className="font-semibold">{dossier.numero}</h3>
                    <p className="text-sm text-muted-foreground">
                      {dossier.client} - {dossier.type}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="danger">
                    {dossier.priorite}
                  </Badge>
                  <span className="text-sm font-medium text-red-600">
                    echeance: {dossier.echeance}
                  </span>
                  <Button variant="outline" size="sm">
                    Traiter
                  </Button>
                </div>
              </div>
            ))}
            {dossiersUrgents.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Aucun dossier urgent
              </p>
            )}
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}
