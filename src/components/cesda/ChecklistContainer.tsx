"use client"

import { useState } from "react"
import { ChecklistCategory, type ChecklistItemData } from "@/types/cesda"

interface ChecklistContainerProps {
  workspaceId?: string
  items: ChecklistItemData[]
  onToggle?: (itemId: string, completed: boolean) => Promise<void>
  readonly?: boolean
}

export default function ChecklistContainer({
  workspaceId,
  items,
  onToggle,
  readonly = false,
}: ChecklistContainerProps) {
  const [loading, setLoading] = useState<string | null>(null)

  const handleToggle = async (itemId: string, currentState: boolean) => {
    if (readonly || !onToggle) return

    setLoading(itemId)
    try {
      await onToggle(itemId, !currentState)
    } catch (error) {
      console.error("Failed to toggle checklist item:", error)
    } finally {
      setLoading(null)
    }
  }

  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = []
    }
    const category = acc[item.category]
    if (category) {
      category.push(item)
    }
    return acc
  }, {} as Record<string, ChecklistItemData[]>)

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case ChecklistCategory.VERIFICATIONS:
        return "Verifications juridiques"
      case ChecklistCategory.PIECES:
        return "Pieces a obtenir"
      case ChecklistCategory.ACTIONS:
        return "Actions a effectuer"
      default:
        return category
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case ChecklistCategory.VERIFICATIONS:
        return "[Check]"
      case ChecklistCategory.PIECES:
        return "[emoji]"
      case ChecklistCategory.ACTIONS:
        return ""
      default:
        return "-"
    }
  }

  const calculateProgress = () => {
    if (items.length === 0) return 0
    const completed = items.filter((i) => i.completed).length
    return Math.round((completed / items.length) * 100)
  }

  const progress = calculateProgress()

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900">Progression</h3>
          <span className="text-sm font-medium text-gray-700">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              progress === 100
                ? "bg-green-600"
                : progress > 66
                ? "bg-blue-500"
                : progress > 33
                ? "bg-yellow-500"
                : "bg-gray-400"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-2 text-xs text-gray-600">
          {items.filter((i) => i.completed).length} sur {items.length} elements completes
        </div>
      </div>

      {/* Checklist items grouped by category */}
      {Object.entries(groupedItems)
        .sort(([a], [b]) => {
          const order = [
            ChecklistCategory.VERIFICATIONS,
            ChecklistCategory.PIECES,
            ChecklistCategory.ACTIONS,
          ]
          return order.indexOf(a as any) - order.indexOf(b as any)
        })
        .map(([category, categoryItems]) => (
          <div key={category} className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="text-lg">{getCategoryIcon(category)}</span>
              {getCategoryLabel(category)}
              <span className="ml-auto text-sm font-normal text-gray-500">
                {categoryItems.filter((i) => i.completed).length}/{categoryItems.length}
              </span>
            </h4>

            <div className="space-y-2">
              {categoryItems
                .sort((a, b) => a.order - b.order)
                .map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 border rounded-lg transition-all ${
                      item.completed
                        ? "bg-green-50 border-green-200"
                        : item.required
                        ? "bg-orange-50 border-orange-200"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => handleToggle(item.id, item.completed)}
                        disabled={readonly || loading === item.id}
                        className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-medium ${
                              item.completed
                                ? "text-green-900 line-through"
                                : "text-gray-900"
                            }`}
                          >
                            {item.label}
                          </span>
                          {item.required && !item.completed && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              Requis
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                        )}
                        {item.completed && item.completedAt && (
                          <p className="text-xs text-gray-500 mt-1">
                            [Check] Complete le{" "}
                            {new Date(item.completedAt).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        )}
                      </div>
                    </label>
                  </div>
                ))}
            </div>
          </div>
        ))}

      {items.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">Aucun element de checklist pour ce workspace.</p>
        </div>
      )}
    </div>
  )
}
