"use client"

import { useState, useEffect } from "react"
import { CheckCircle, Circle, Upload, Clock, AlertTriangle, FileText, Shield, Heart, Briefcase } from "lucide-react"

// ─── TYPES ───────────────────────────────────────────────────

interface ChecklistItem {
  id: string
  label: string
  category: string
  required: boolean
  status: "missing" | "received" | "validated" | "rejected"
  receivedAt?: string
  helpText?: string
  reason?: string
}

interface DossierProgress {
  numero: string
  type: string
  complete: boolean
  progress: { percentage: number; received: number; total: number }
  items: ChecklistItem[]
  inboxEmail?: string
  message?: string
}

interface Props {
  dossierId: string
  /** "avocat" = vue complète, "client" = vue simplifiée */
  viewMode?: "avocat" | "client"
  onUpload?: (itemId: string) => void
}

// ─── COMPOSANT PRINCIPAL ─────────────────────────────────────

export default function DossierChecklist({ dossierId, viewMode = "avocat", onUpload }: Props) {
  const [data, setData] = useState<DossierProgress | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const endpoint = viewMode === "client"
      ? `/api/client/dossiers/${dossierId}/checklist`
      : `/api/dossiers/${dossierId}/checklist`

    fetch(endpoint)
      .then(r => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [dossierId, viewMode])

  if (loading) return <div className="animate-pulse bg-gray-100 rounded-2xl h-64" />
  if (!data) return <div className="text-red-500 p-4">Erreur de chargement</div>

  const { progress, items, complete } = data
  const categories = groupByCategory(items)

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      {/* En-tête + Barre de progression */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold">Pièces du dossier {data.numero}</h2>
            <p className="text-blue-100 text-sm">{data.type}</p>
          </div>
          <StatusBadge complete={complete} percentage={progress.percentage} />
        </div>

        {/* Barre de progression */}
        <ProgressBar percentage={progress.percentage} received={progress.received} total={progress.total} />

        {data.message && (
          <p className="mt-3 text-sm text-blue-100">{data.message}</p>
        )}
      </div>

      {/* Liste par catégorie */}
      <div className="p-6 space-y-6">
        {Object.entries(categories).map(([category, categoryItems]) => (
          <CategorySection
            key={category}
            category={category}
            items={categoryItems}
            viewMode={viewMode}
            onUpload={onUpload}
          />
        ))}
      </div>

      {/* Email inbox */}
      {data.inboxEmail && viewMode === "client" && (
        <div className="border-t border-gray-100 px-6 py-4 bg-blue-50">
          <p className="text-sm text-gray-700">
            📧 Envoyez vos documents par email à : <span className="font-mono font-bold text-blue-700">{data.inboxEmail}</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">Les pièces seront automatiquement classées dans votre dossier.</p>
        </div>
      )}
    </div>
  )
}

// ─── BARRE DE PROGRESSION ────────────────────────────────────

function ProgressBar({ percentage, received, total }: { percentage: number; received: number; total: number }) {
  const getColor = () => {
    if (percentage === 100) return "bg-green-400"
    if (percentage >= 70) return "bg-yellow-400"
    if (percentage >= 40) return "bg-orange-400"
    return "bg-red-400"
  }

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{received}/{total} pièces reçues</span>
        <span className="font-bold">{percentage}%</span>
      </div>
      <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${getColor()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

// ─── BADGE STATUT ────────────────────────────────────────────

function StatusBadge({ complete, percentage }: { complete: boolean; percentage: number }) {
  if (complete) {
    return (
      <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
        <CheckCircle className="w-4 h-4" /> Complet
      </span>
    )
  }
  if (percentage >= 70) {
    return (
      <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
        <Clock className="w-4 h-4" /> Presque complet
      </span>
    )
  }
  return (
    <span className="bg-red-500/80 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
      <AlertTriangle className="w-4 h-4" /> Incomplet
    </span>
  )
}

// ─── SECTION PAR CATÉGORIE ───────────────────────────────────

const CATEGORY_CONFIG: Record<string, { icon: typeof FileText; label: string; color: string }> = {
  identite: { icon: Shield, label: "Identité", color: "text-purple-600" },
  juridique: { icon: FileText, label: "Juridique", color: "text-blue-600" },
  justificatif: { icon: Briefcase, label: "Justificatifs", color: "text-amber-600" },
  medical: { icon: Heart, label: "Médical", color: "text-red-600" },
  document: { icon: FileText, label: "Documents", color: "text-gray-600" },
}

function CategorySection({ category, items, viewMode, onUpload }: {
  category: string
  items: ChecklistItem[]
  viewMode: "avocat" | "client"
  onUpload?: (itemId: string) => void
}) {
  const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.document
  const Icon = config.icon
  const receivedCount = items.filter(i => i.status !== "missing").length

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-5 h-5 ${config.color}`} />
        <h3 className="font-semibold text-gray-800">{config.label}</h3>
        <span className="text-xs text-gray-400 ml-auto">{receivedCount}/{items.length}</span>
      </div>
      <div className="space-y-2 ml-7">
        {items.map(item => (
          <ChecklistRow key={item.id} item={item} viewMode={viewMode} onUpload={onUpload} />
        ))}
      </div>
    </div>
  )
}

// ─── LIGNE DE CHECKLIST ──────────────────────────────────────

function ChecklistRow({ item, viewMode, onUpload }: {
  item: ChecklistItem
  viewMode: "avocat" | "client"
  onUpload?: (itemId: string) => void
}) {
  const statusConfig = {
    missing: { icon: Circle, color: "text-gray-300", bg: "bg-white", border: "border-gray-200" },
    received: { icon: Clock, color: "text-yellow-500", bg: "bg-yellow-50", border: "border-yellow-200" },
    validated: { icon: CheckCircle, color: "text-green-500", bg: "bg-green-50", border: "border-green-200" },
    rejected: { icon: AlertTriangle, color: "text-red-500", bg: "bg-red-50", border: "border-red-200" },
  }

  const config = statusConfig[item.status]
  const Icon = config.icon

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border ${config.border} ${config.bg} transition-all`}>
      <Icon className={`w-5 h-5 flex-shrink-0 ${config.color}`} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm ${item.status === "validated" ? "line-through text-gray-400" : "text-gray-800"}`}>
            {item.label}
          </span>
          {item.required && item.status === "missing" && (
            <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">obligatoire</span>
          )}
        </div>
        {item.helpText && viewMode === "client" && item.status === "missing" && (
          <p className="text-xs text-gray-500 mt-0.5">{item.helpText}</p>
        )}
        {item.receivedAt && (
          <p className="text-xs text-gray-400 mt-0.5">Reçu le {new Date(item.receivedAt).toLocaleDateString("fr-FR")}</p>
        )}
      </div>

      {item.status === "missing" && onUpload && (
        <button
          onClick={() => onUpload(item.id)}
          className="flex-shrink-0 p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
          title="Envoyer ce document"
        >
          <Upload className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

// ─── HELPERS ─────────────────────────────────────────────────

function groupByCategory(items: ChecklistItem[]): Record<string, ChecklistItem[]> {
  const groups: Record<string, ChecklistItem[]> = {}
  for (const item of items) {
    const cat = item.category || "document"
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(item)
  }
  return groups
}
