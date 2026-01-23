"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ProcedureType, PROCEDURE_COLORS } from "@/types/cesda"

export default function NewWorkspacePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    procedureType: "" as ProcedureType | "",
    title: "",
    description: "",
    clientId: "",
    notificationDate: "",
    metadata: {} as any,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.procedureType) {
      alert("Veuillez sélectionner un type de procédure")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error("Erreur lors de la création")

      const workspace = await response.json()
      router.push(`/workspaces/${workspace.id}`)
    } catch (error) {
      console.error("Error creating workspace:", error)
      alert("Erreur lors de la création du dossier")
    } finally {
      setLoading(false)
    }
  }

  const renderMetadataFields = () => {
    switch (formData.procedureType) {
      case "OQTF":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type OQTF
              </label>
              <select
                value={formData.metadata.type_oqtf || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, type_oqtf: e.target.value },
                  })
                }
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionner...</option>
                <option value="sans_delai">Sans délai (48h)</option>
                <option value="avec_delai">Avec délai de départ volontaire (30j)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interdiction de retour
              </label>
              <div className="flex items-center gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={formData.metadata.interdiction_retour === true}
                    onChange={() =>
                      setFormData({
                        ...formData,
                        metadata: { ...formData.metadata, interdiction_retour: true },
                      })
                    }
                    className="mr-2"
                  />
                  Oui
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={formData.metadata.interdiction_retour === false}
                    onChange={() =>
                      setFormData({
                        ...formData,
                        metadata: { ...formData.metadata, interdiction_retour: false },
                      })
                    }
                    className="mr-2"
                  />
                  Non
                </label>
              </div>
            </div>
            {formData.metadata.interdiction_retour && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Durée interdiction (ans)
                </label>
                <input
                  type="number"
                  value={formData.metadata.duree_interdiction || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      metadata: {
                        ...formData.metadata,
                        duree_interdiction: parseInt(e.target.value),
                      },
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>
        )

      case "ASILE":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instance
              </label>
              <select
                value={formData.metadata.instance || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, instance: e.target.value },
                  })
                }
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionner...</option>
                <option value="OFPRA">OFPRA</option>
                <option value="CNDA">CNDA</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Numéro OFPRA/CNDA
              </label>
              <input
                type="text"
                value={formData.metadata.numero_ofpra || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, numero_ofpra: e.target.value },
                  })
                }
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )

      case "REGROUPEMENT_FAMILIAL":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Membres de la famille (séparés par virgules)
              </label>
              <input
                type="text"
                placeholder="Ex: Conjoint, Enfant 1, Enfant 2"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    metadata: {
                      ...formData.metadata,
                      membres_famille: e.target.value.split(",").map((m) => m.trim()),
                    },
                  })
                }
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Nouveau Dossier CESDA</h1>
          <p className="text-gray-600 mt-1">
            Créer un nouveau dossier de contentieux des étrangers
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-8 space-y-6">
          {/* Type de procédure */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type de procédure *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {(Object.keys(PROCEDURE_COLORS) as ProcedureType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({ ...formData, procedureType: type })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.procedureType === type
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  style={{
                    backgroundColor:
                      formData.procedureType === type
                        ? `${PROCEDURE_COLORS[type]}20`
                        : undefined,
                  }}
                >
                  <div className="font-medium text-sm">{type}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Titre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Titre du dossier *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Recours OQTF M. Dupont"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              placeholder="Contexte et détails du dossier..."
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Date de notification */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date de notification *
            </label>
            <input
              type="date"
              required
              value={formData.notificationDate}
              onChange={(e) => setFormData({ ...formData, notificationDate: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Metadata fields based on procedure type */}
          {formData.procedureType && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Informations spécifiques
              </h3>
              {renderMetadataFields()}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 pt-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {loading ? "Création..." : "Créer le dossier"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
