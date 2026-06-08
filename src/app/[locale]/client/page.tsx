"use client"

import { useState, useEffect } from "react"
import { FileText, Upload, CheckCircle, Clock, AlertTriangle, Shield } from "lucide-react"
import DossierChecklist from "@/components/dossiers/DossierChecklist"

interface ClientDossier {
  id: string
  numero: string
  typeDossier: string
  statut: string
  dateCreation: string
  responsable?: string
}

export default function EspaceClientPage() {
  const [dossiers, setDossiers] = useState<ClientDossier[]>([])
  const [selectedDossier, setSelectedDossier] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/client/dossiers")
      .then(r => r.json())
      .then(data => {
        setDossiers(data.dossiers || [])
        if (data.dossiers?.length > 0) setSelectedDossier(data.dossiers[0].id)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* En-tête */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mon espace dossier</h1>
            <p className="text-sm text-gray-500">Suivez l'avancement et envoyez vos pièces</p>
          </div>
        </div>

        {dossiers.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Aucun dossier en cours</h2>
            <p className="text-gray-500">Votre avocat créera votre dossier et vous pourrez suivre son avancement ici.</p>
          </div>
        ) : (
          <>
            {/* Sélecteur de dossier si plusieurs */}
            {dossiers.length > 1 && (
              <div className="mb-6 flex gap-2 flex-wrap">
                {dossiers.map(d => (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDossier(d.id)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      selectedDossier === d.id
                        ? "bg-blue-600 text-white shadow-lg"
                        : "bg-white text-gray-600 border border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    {d.numero} — {d.typeDossier.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            )}

            {/* Info dossier sélectionné */}
            {selectedDossier && (
              <div className="space-y-6">
                <DossierStatusCard dossier={dossiers.find(d => d.id === selectedDossier)!} />
                <DossierChecklist dossierId={selectedDossier} viewMode="client" />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function DossierStatusCard({ dossier }: { dossier: ClientDossier }) {
  const statusConfig: Record<string, { icon: typeof Clock; color: string; label: string }> = {
    en_cours: { icon: Clock, label: "En cours de traitement", color: "text-blue-600 bg-blue-50" },
    instruction: { icon: FileText, label: "En instruction", color: "text-amber-600 bg-amber-50" },
    complet: { icon: CheckCircle, label: "Dossier complet", color: "text-green-600 bg-green-50" },
    audience: { icon: AlertTriangle, label: "Audience programmée", color: "text-red-600 bg-red-50" },
  }
  const status = statusConfig[dossier.statut] || statusConfig.en_cours
  const Icon = status.icon

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">Dossier {dossier.numero}</p>
        <p className="font-semibold text-gray-900">{dossier.typeDossier.replace(/_/g, " ")}</p>
        {dossier.responsable && <p className="text-xs text-gray-400 mt-1">Avocat : {dossier.responsable}</p>}
      </div>
      <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${status.color}`}>
        <Icon className="w-5 h-5" />
        <span className="text-sm font-medium">{status.label}</span>
      </div>
    </div>
  )
}
