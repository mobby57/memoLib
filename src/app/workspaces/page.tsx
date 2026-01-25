"use client";

// Force dynamic to prevent prerendering errors with React hooks
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react"
import Link from "next/link"
import WorkspaceCard from "@/components/cesda/WorkspaceCard"
// Types imported where needed

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    procedureType: "",
    urgencyLevel: "",
    status: "",
  })

  useEffect(() => {
    fetchWorkspaces()
  }, [filters])

  const fetchWorkspaces = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.procedureType) params.set("procedureType", filters.procedureType)
      if (filters.urgencyLevel) params.set("urgencyLevel", filters.urgencyLevel)
      if (filters.status) params.set("status", filters.status)

      const response = await fetch(`/api/workspaces?${params.toString()}`)
      if (!response.ok) throw new Error("Erreur lors du chargement")

      const data = await response.json()
      setWorkspaces(data)
    } catch (error) {
      console.error("Error fetching workspaces:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mes Dossiers CESDA</h1>
            <p className="text-gray-600 mt-1">
              Gestion des procedures contentieuses des etrangers
            </p>
          </div>
          <Link
            href="/workspaces/new"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            + Nouveau Dossier
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de procedure
              </label>
              <select
                value={filters.procedureType}
                onChange={(e) => setFilters({ ...filters, procedureType: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Tous</option>
                <option value="OQTF">OQTF</option>
                <option value="ASILE">Asile</option>
                <option value="REFUS_TITRE">Refus de titre</option>
                <option value="RETRAIT_TITRE">Retrait de titre</option>
                <option value="REGROUPEMENT_FAMILIAL">Regroupement familial</option>
                <option value="NATURALISATION">Naturalisation</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Niveau d'urgence
              </label>
              <select
                value={filters.urgencyLevel}
                onChange={(e) => setFilters({ ...filters, urgencyLevel: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Tous</option>
                <option value="CRITIQUE">[emoji] Critique</option>
                <option value="ELEVE">[emoji] eleve</option>
                <option value="MOYEN">[emoji] Moyen</option>
                <option value="FAIBLE">[emoji] Faible</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Statut
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Tous</option>
                <option value="active">Actif</option>
                <option value="pending">En attente</option>
                <option value="closed">Clos</option>
                <option value="archived">Archive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-sm text-gray-600">Total dossiers</div>
            <div className="text-2xl font-bold text-gray-900">{workspaces.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-sm text-gray-600">Critiques</div>
            <div className="text-2xl font-bold text-red-600">
              {workspaces.filter((w) => w.urgencyLevel === "CRITIQUE").length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-sm text-gray-600">eleve</div>
            <div className="text-2xl font-bold text-orange-600">
              {workspaces.filter((w) => w.urgencyLevel === "ELEVE").length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-sm text-gray-600">Actifs</div>
            <div className="text-2xl font-bold text-blue-600">
              {workspaces.filter((w) => w.status === "active").length}
            </div>
          </div>
        </div>

        {/* Workspaces Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="text-gray-600 mt-4">Chargement des dossiers...</p>
          </div>
        ) : workspaces.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <p className="text-gray-600 text-lg">Aucun dossier trouve</p>
            <Link
              href="/workspaces/new"
              className="inline-block mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              Creer votre premier dossier [Next]
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workspaces.map((workspace) => (
              <WorkspaceCard key={workspace.id} workspace={workspace} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
