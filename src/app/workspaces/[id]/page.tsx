"use client";

// Force dynamic to prevent prerendering errors with React hooks
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import DeadlineTimer from "@/components/cesda/DeadlineTimer"
import UrgencyBadge from "@/components/cesda/UrgencyBadge"
import ChecklistContainer from "@/components/cesda/ChecklistContainer"
import { PROCEDURE_COLORS, ProcedureType } from "@/types/cesda"

export default function WorkspaceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [workspace, setWorkspace] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"overview" | "documents" | "timeline">("overview")

  useEffect(() => {
    if (params.id) {
      fetchWorkspace()
    }
  }, [params.id])

  const fetchWorkspace = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/workspaces/${params.id}`)
      if (!response.ok) throw new Error("Erreur lors du chargement")

      const data = await response.json()
      setWorkspace(data)
    } catch (error) {
      console.error("Error fetching workspace:", error)
      alert("Erreur lors du chargement du dossier")
    } finally {
      setLoading(false)
    }
  }

  const handleChecklistToggle = async (itemId: string, completed: boolean) => {
    try {
      const response = await fetch(`/api/workspaces/${params.id}/checklist/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed }),
      })

      if (!response.ok) throw new Error("Erreur lors de la mise à jour")

      // Rafraîchir le workspace
      await fetchWorkspace()
    } catch (error) {
      console.error("Error toggling checklist:", error)
      alert("Erreur lors de la mise à jour")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="text-gray-600 mt-4">Chargement du dossier...</p>
        </div>
      </div>
    )
  }

  if (!workspace) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Dossier non trouvé</p>
          <button
            onClick={() => router.push("/workspaces")}
            className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Retour aux dossiers
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <button
            onClick={() => router.push("/workspaces")}
            className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2"
          >
            ← Retour aux dossiers
          </button>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span
                  className="px-3 py-1 rounded-full text-sm font-medium"
                  style={{
                    backgroundColor: `${PROCEDURE_COLORS[workspace.procedureType as ProcedureType]}20`,
                    color: PROCEDURE_COLORS[workspace.procedureType as ProcedureType],
                  }}
                >
                  {workspace.procedureType}
                </span>
                <UrgencyBadge level={workspace.urgencyLevel} />
                <span className="text-sm text-gray-500">#{workspace.reference}</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">{workspace.title}</h1>
              {workspace.description && (
                <p className="text-gray-600 mt-2">{workspace.description}</p>
              )}
              {workspace.client && (
                <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                  <span className="font-medium">Client:</span>
                  <span>
                    {workspace.client.firstName} {workspace.client.lastName}
                  </span>
                  {workspace.client.email && <span>• {workspace.client.email}</span>}
                </div>
              )}
            </div>

            <div className="ml-8">
              <DeadlineTimer
                deadlineDate={new Date(workspace.deadlineDate)}
                notificationDate={
                  workspace.notificationDate ? new Date(workspace.notificationDate) : undefined
                }
                urgencyLevel={workspace.urgencyLevel}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab("overview")}
              className={`py-4 border-b-2 font-medium transition-colors ${
                activeTab === "overview"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Vue d'ensemble
            </button>
            <button
              onClick={() => setActiveTab("documents")}
              className={`py-4 border-b-2 font-medium transition-colors ${
                activeTab === "documents"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Documents ({workspace.documents?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab("timeline")}
              className={`py-4 border-b-2 font-medium transition-colors ${
                activeTab === "timeline"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Chronologie
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Checklist */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Liste de contrôle</h2>
                <ChecklistContainer
                  items={workspace.checklist || []}
                  onToggle={handleChecklistToggle}
                />
              </div>

              {/* Alerts */}
              {workspace.alerts && workspace.alerts.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Alertes</h2>
                  <div className="space-y-3">
                    {workspace.alerts.map((alert: any) => (
                      <div
                        key={alert.id}
                        className={`p-4 rounded-lg border-l-4 ${
                          alert.type === "deadline_critical"
                            ? "border-red-600 bg-red-50"
                            : alert.type === "deadline_warning"
                            ? "border-orange-600 bg-orange-50"
                            : "border-blue-600 bg-blue-50"
                        }`}
                      >
                        <div className="font-medium">{alert.title}</div>
                        <div className="text-sm text-gray-600 mt-1">{alert.message}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Info card */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="font-bold text-gray-900 mb-4">Informations</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <div className="text-gray-600">Créé le</div>
                    <div className="font-medium">
                      {new Date(workspace.createdAt).toLocaleDateString("fr-FR")}
                    </div>
                  </div>
                  {workspace.notificationDate && (
                    <div>
                      <div className="text-gray-600">Date de notification</div>
                      <div className="font-medium">
                        {new Date(workspace.notificationDate).toLocaleDateString("fr-FR")}
                      </div>
                    </div>
                  )}
                  <div>
                    <div className="text-gray-600">Échéance</div>
                    <div className="font-medium">
                      {new Date(workspace.deadlineDate).toLocaleDateString("fr-FR")}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Statut</div>
                    <div className="font-medium capitalize">{workspace.status}</div>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="font-bold text-gray-900 mb-4">Statistiques</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Documents</span>
                    <span className="font-bold text-lg">
                      {workspace.documents?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Brouillons</span>
                    <span className="font-bold text-lg">
                      {workspace.documentDrafts?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Événements</span>
                    <span className="font-bold text-lg">
                      {workspace.timeline?.length || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "documents" && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Documents</h2>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium">
                + Ajouter un document
              </button>
            </div>
            {workspace.documents && workspace.documents.length > 0 ? (
              <div className="space-y-3">
                {workspace.documents.map((doc: any) => (
                  <div
                    key={doc.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium">{doc.name}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          {doc.type} • {(doc.size / 1024).toFixed(0)} KB •{" "}
                          {new Date(doc.uploadedAt).toLocaleDateString("fr-FR")}
                        </div>
                      </div>
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        Télécharger
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-8">Aucun document</p>
            )}
          </div>
        )}

        {activeTab === "timeline" && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Chronologie</h2>
            {workspace.timeline && workspace.timeline.length > 0 ? (
              <div className="space-y-4">
                {workspace.timeline.map((event: any, index: number) => (
                  <div key={event.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                      {index < workspace.timeline.length - 1 && (
                        <div className="w-0.5 h-full bg-gray-300 mt-1"></div>
                      )}
                    </div>
                    <div className="flex-1 pb-8">
                      <div className="font-medium">{event.title}</div>
                      <div className="text-sm text-gray-600 mt-1">{event.description}</div>
                      <div className="text-xs text-gray-500 mt-2">
                        {new Date(event.createdAt).toLocaleString("fr-FR")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-8">Aucun événement</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
