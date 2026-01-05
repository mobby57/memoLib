"use client"

import Link from "next/link"
import { ProcedureType, PROCEDURE_COLORS, PROCEDURE_LABELS } from "@/types/cesda"
import UrgencyBadge from "./UrgencyBadge"
import type { WorkspaceWithRelations } from "@/types/cesda"

interface WorkspaceCardProps {
  workspace: WorkspaceWithRelations
  onClick?: () => void
}

export default function WorkspaceCard({ workspace, onClick }: WorkspaceCardProps) {
  const procedureColor = PROCEDURE_COLORS[workspace.procedureType as ProcedureType]
  const procedureLabel = PROCEDURE_LABELS[workspace.procedureType as ProcedureType]

  const getTimeUntilDeadline = () => {
    if (!workspace.deadlineDate) return null
    const now = new Date()
    const deadline = new Date(workspace.deadlineDate)
    const diff = deadline.getTime() - now.getTime()

    if (diff <= 0) return "Expiré"

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}j restants`
    return `${hours}h restantes`
  }

  const timeRemaining = getTimeUntilDeadline()

  return (
    <Link
      href={`/workspaces/${workspace.id}`}
      onClick={onClick}
      className="block bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg hover:border-gray-300 transition-all duration-200"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-1 h-6 rounded-full"
              style={{ backgroundColor: procedureColor }}
            />
            <h3 className="font-semibold text-gray-900 text-lg">{workspace.title}</h3>
          </div>
          <p className="text-sm text-gray-600">{workspace.client.firstName} {workspace.client.lastName}</p>
        </div>
        <UrgencyBadge level={workspace.urgencyLevel as any} size="sm" />
      </div>

      {/* Type de procédure */}
      <div className="mb-3">
        <span
          className="inline-block px-2 py-1 text-xs font-medium rounded"
          style={{
            backgroundColor: `${procedureColor}15`,
            color: procedureColor,
          }}
        >
          {procedureLabel}
        </span>
      </div>

      {/* Description */}
      {workspace.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{workspace.description}</p>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="text-lg font-bold text-gray-900">
            {workspace._count?.checklist || 0}
          </div>
          <div className="text-xs text-gray-600">Checklist</div>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="text-lg font-bold text-gray-900">
            {workspace._count?.documents || 0}
          </div>
          <div className="text-xs text-gray-600">Documents</div>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="text-lg font-bold text-gray-900">
            {workspace._count?.alerts || 0}
          </div>
          <div className="text-xs text-gray-600">Alertes</div>
        </div>
      </div>

      {/* Deadline */}
      {workspace.deadlineDate && (
        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
          <div className="flex items-center gap-2">
            <span className="text-sm">⏱️</span>
            <span className="text-sm text-gray-700">Échéance:</span>
          </div>
          <div className="text-right">
            <div className={`text-sm font-semibold ${
              timeRemaining === "Expiré" || timeRemaining?.includes("h")
                ? "text-red-600"
                : "text-gray-900"
            }`}>
              {timeRemaining}
            </div>
            <div className="text-xs text-gray-500">
              {new Date(workspace.deadlineDate).toLocaleDateString("fr-FR")}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <span>
          Créé le {new Date(workspace.createdAt).toLocaleDateString("fr-FR")}
        </span>
        {workspace.reference && <span className="font-mono">{workspace.reference}</span>}
      </div>
    </Link>
  )
}
