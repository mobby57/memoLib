"use client"

import { useState } from "react"
import { Users, Heart, Briefcase, Clock, AlertTriangle, CheckCircle, Loader2 } from "lucide-react"

interface Props {
  dossierId: string
  typeDossier: string
  onGenerated?: () => void
}

interface ContextForm {
  hasChildren: boolean
  childrenCount: number
  hasSpouse: boolean
  spouseHasTitle: boolean
  hasMedicalIssue: boolean
  isEmployed: boolean
  yearsInFrance: number
  isInRetention: boolean
  specificNeeds: string[]
}

export default function ClientContextForm({ dossierId, typeDossier, onGenerated }: Props) {
  const [form, setForm] = useState<ContextForm>({
    hasChildren: false,
    childrenCount: 0,
    hasSpouse: false,
    spouseHasTitle: false,
    hasMedicalIssue: false,
    isEmployed: false,
    yearsInFrance: 0,
    isInRetention: false,
    specificNeeds: [],
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ itemsCount: number } | null>(null)
  const [error, setError] = useState("")

  const handleSubmit = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`/api/dossiers/${dossierId}/checklist/contextual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, typeDossier }),
      })
      if (!res.ok) throw new Error("Erreur serveur")
      const data = await res.json()
      setResult(data)
      onGenerated?.()
    } catch {
      setError("Erreur lors de la génération de la checklist")
    } finally {
      setLoading(false)
    }
  }

  if (result) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
        <h3 className="font-bold text-green-900 text-lg">Checklist générée</h3>
        <p className="text-green-700 mt-1">{result.itemsCount} pièces personnalisées selon la situation du client</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
      <h3 className="font-bold text-lg text-gray-900 mb-1">Situation du client</h3>
      <p className="text-sm text-gray-500 mb-6">Renseignez le contexte pour générer la liste de pièces adaptée</p>

      <div className="space-y-5">
        {/* Famille */}
        <Section icon={Users} label="Situation familiale" color="text-purple-600">
          <Toggle label="Enfants en France" checked={form.hasChildren} onChange={v => setForm(f => ({ ...f, hasChildren: v, childrenCount: v ? 1 : 0 }))} />
          {form.hasChildren && (
            <NumberInput label="Nombre d'enfants" value={form.childrenCount} onChange={v => setForm(f => ({ ...f, childrenCount: v }))} min={1} max={10} />
          )}
          <Toggle label="Conjoint/partenaire" checked={form.hasSpouse} onChange={v => setForm(f => ({ ...f, hasSpouse: v }))} />
          {form.hasSpouse && (
            <Toggle label="Conjoint a un titre de séjour" checked={form.spouseHasTitle} onChange={v => setForm(f => ({ ...f, spouseHasTitle: v }))} indent />
          )}
        </Section>

        {/* Médical */}
        <Section icon={Heart} label="Situation médicale" color="text-red-600">
          <Toggle label="Problème de santé grave" checked={form.hasMedicalIssue} onChange={v => setForm(f => ({ ...f, hasMedicalIssue: v }))} />
          {form.hasMedicalIssue && (
            <Toggle label="Demande étranger malade (Art. L425-9)" checked={form.specificNeeds.includes("etranger_malade")}
              onChange={v => setForm(f => ({ ...f, specificNeeds: v ? [...f.specificNeeds, "etranger_malade"] : f.specificNeeds.filter(n => n !== "etranger_malade") }))} indent />
          )}
        </Section>

        {/* Professionnel */}
        <Section icon={Briefcase} label="Situation professionnelle" color="text-amber-600">
          <Toggle label="Employé actuellement" checked={form.isEmployed} onChange={v => setForm(f => ({ ...f, isEmployed: v }))} />
          <NumberInput label="Années de présence en France" value={form.yearsInFrance} onChange={v => setForm(f => ({ ...f, yearsInFrance: v }))} min={0} max={40} />
        </Section>

        {/* Urgence */}
        {typeDossier.includes("OQTF") && (
          <Section icon={AlertTriangle} label="Situation d'urgence" color="text-red-600">
            <Toggle label="Actuellement en rétention (CRA)" checked={form.isInRetention} onChange={v => setForm(f => ({ ...f, isInRetention: v }))} />
          </Section>
        )}
      </div>

      {error && <p className="text-red-600 text-sm mt-4">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="mt-6 w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Génération...</> : "Générer la checklist personnalisée"}
      </button>
    </div>
  )
}

// ─── SOUS-COMPOSANTS ─────────────────────────────────────────

function Section({ icon: Icon, label, color, children }: { icon: typeof Users; label: string; color: string; children: React.ReactNode }) {
  return (
    <div className="border border-gray-100 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-5 h-5 ${color}`} />
        <span className="font-medium text-gray-800 text-sm">{label}</span>
      </div>
      <div className="space-y-3 ml-7">{children}</div>
    </div>
  )
}

function Toggle({ label, checked, onChange, indent }: { label: string; checked: boolean; onChange: (v: boolean) => void; indent?: boolean }) {
  return (
    <label className={`flex items-center gap-3 cursor-pointer ${indent ? "ml-4" : ""}`}>
      <div className={`w-10 h-5 rounded-full transition-colors ${checked ? "bg-blue-600" : "bg-gray-200"} relative`}>
        <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
      </div>
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  )
}

function NumberInput({ label, value, onChange, min, max }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 min-w-[180px]">{label}</span>
      <input
        type="number"
        value={value}
        onChange={e => onChange(Math.max(min, Math.min(max, parseInt(e.target.value) || 0)))}
        min={min} max={max}
        className="w-20 px-3 py-1.5 border border-gray-200 rounded-lg text-center text-sm"
      />
    </div>
  )
}
