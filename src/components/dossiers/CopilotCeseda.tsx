"use client"

import { useState } from "react"
import { Brain, Shield, AlertTriangle, CheckCircle, FileText, Clock, Zap, TrendingUp, TrendingDown, Lock, Loader2, ChevronDown, ChevronRight, Scale } from "lucide-react"

interface CopilotAnalysis {
  disclaimer: string
  summary: { situation: string[]; narrative: string; riskLevel: string }
  strengths: { label: string; explanation: string; confidence: number }[]
  weaknesses: { label: string; explanation: string; confidence: number }[]
  completeness: { score: number; missing: string[]; recommendation: string }
  cesedaAnalysis: { procedure: string; articles: { reference: string; objet: string }[]; jurisprudences: { reference: string; principe: string }[]; recours: { type: string; juridiction: string; delai: string; conseil: string }[] }
  deadlines: { label: string; daysRemaining?: number; riskLevel: string; explanation: string }[]
  blockages: { cause: string; severity: string; solution: string }[]
  actions: { priority: number; action: string; reason: string; type: string }[]
  confidence: number
}

export default function CopilotCeseda({ dossierId }: { dossierId: string }) {
  const [analysis, setAnalysis] = useState<CopilotAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const runAnalysis = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`/api/ai/copilot/${dossierId}`)
      if (!res.ok) throw new Error("Erreur d'analyse")
      setAnalysis(await res.json())
    } catch { setError("Impossible d'analyser le dossier") }
    finally { setLoading(false) }
  }

  if (!analysis) {
    return (
      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border border-indigo-100 p-6 text-center">
        <Brain className="w-12 h-12 text-indigo-600 mx-auto mb-3" />
        <h3 className="font-bold text-lg text-gray-900 mb-1">Copilote CESEDA</h3>
        <p className="text-sm text-gray-600 mb-4">Analyse complète du dossier : forces, faiblesses, délais, articles applicables, actions recommandées</p>
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        <button onClick={runAnalysis} disabled={loading} className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 flex items-center gap-2 mx-auto">
          {loading ? <><Loader2 className="w-5 h-5 animate-spin" />Analyse en cours...</> : <><Zap className="w-5 h-5" />Analyser le dossier</>}
        </button>
      </div>
    )
  }

  const riskColors: Record<string, string> = { faible: "bg-green-100 text-green-700", moyen: "bg-yellow-100 text-yellow-700", "élevé": "bg-orange-100 text-orange-700", critique: "bg-red-100 text-red-700" }

  return (
    <div className="space-y-4">
      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2">
        <Scale className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-amber-800">{analysis.disclaimer}</p>
      </div>

      {/* Résumé stratégique */}
      <Card title="Résumé stratégique" icon={Brain} color="indigo">
        <div className="flex flex-wrap gap-2 mb-3">
          {analysis.summary.situation.map((s, i) => <span key={i} className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-medium">{s}</span>)}
          <span className={`px-2 py-1 rounded-lg text-xs font-bold ${riskColors[analysis.summary.riskLevel]}`}>Risque {analysis.summary.riskLevel}</span>
        </div>
        <p className="text-sm text-gray-700">{analysis.summary.narrative}</p>
        <ConfidenceBadge value={analysis.confidence} />
      </Card>

      {/* Forces + Faiblesses côte à côte */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title={`Forces (${analysis.strengths.length})`} icon={TrendingUp} color="green">
          {analysis.strengths.length === 0 ? <p className="text-sm text-gray-500 italic">Aucune force identifiée — enrichir le dossier</p> :
            analysis.strengths.map((s, i) => <PointItem key={i} label={s.label} explanation={s.explanation} type="strength" confidence={s.confidence} />)}
        </Card>
        <Card title={`Faiblesses (${analysis.weaknesses.length})`} icon={TrendingDown} color="red">
          {analysis.weaknesses.length === 0 ? <p className="text-sm text-gray-500 italic">Aucune faiblesse identifiée</p> :
            analysis.weaknesses.map((w, i) => <PointItem key={i} label={w.label} explanation={w.explanation} type="weakness" confidence={w.confidence} />)}
        </Card>
      </div>

      {/* Complétude */}
      <Card title="Complétude documentaire" icon={FileText} color="blue">
        <div className="flex items-center gap-4 mb-3">
          <div className="relative w-16 h-16">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e5e7eb" strokeWidth="3" />
              <circle cx="18" cy="18" r="15.5" fill="none" stroke={analysis.completeness.score >= 80 ? "#22c55e" : analysis.completeness.score >= 50 ? "#eab308" : "#ef4444"} strokeWidth="3" strokeDasharray={`${analysis.completeness.score * 0.974} 97.4`} strokeLinecap="round" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">{analysis.completeness.score}%</span>
          </div>
          <p className="text-sm text-gray-700 flex-1">{analysis.completeness.recommendation}</p>
        </div>
        {analysis.completeness.missing.length > 0 && (
          <div className="mt-2">
            <p className="text-xs font-semibold text-red-600 mb-1">Pièces manquantes :</p>
            <ul className="space-y-1">{analysis.completeness.missing.map((m, i) => <li key={i} className="text-xs text-gray-600 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-red-400 rounded-full" />{m}</li>)}</ul>
          </div>
        )}
      </Card>

      {/* CESEDA */}
      <Card title="Analyse CESEDA" icon={Scale} color="purple">
        {analysis.cesedaAnalysis.articles.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Articles applicables</p>
            {analysis.cesedaAnalysis.articles.slice(0, 5).map((a, i) => <div key={i} className="text-sm py-1 border-b border-gray-100 last:border-0"><span className="font-medium text-indigo-700">{a.reference}</span> — {a.objet}</div>)}
          </div>
        )}
        {analysis.cesedaAnalysis.jurisprudences.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Jurisprudence pertinente</p>
            {analysis.cesedaAnalysis.jurisprudences.slice(0, 3).map((j, i) => <div key={i} className="text-sm py-1 border-b border-gray-100 last:border-0"><span className="font-medium">{j.reference}</span><br /><span className="text-gray-600 text-xs">{j.principe}</span></div>)}
          </div>
        )}
        {analysis.cesedaAnalysis.recours.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Voies de recours</p>
            {analysis.cesedaAnalysis.recours.map((r, i) => <div key={i} className="text-sm py-1 border-b border-gray-100 last:border-0"><span className="font-medium">{r.type}</span> → {r.juridiction} ({r.delai})</div>)}
          </div>
        )}
      </Card>

      {/* Délais */}
      {analysis.deadlines.length > 0 && (
        <Card title="Délais & Risques" icon={Clock} color="orange">
          {analysis.deadlines.map((d, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${riskColors[d.riskLevel]}`}>{d.riskLevel}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{d.label}</p>
                <p className="text-xs text-gray-500">{d.explanation}</p>
              </div>
              {d.daysRemaining !== undefined && <span className="text-sm font-bold text-gray-900">J-{d.daysRemaining}</span>}
            </div>
          ))}
        </Card>
      )}

      {/* Blocages */}
      {analysis.blockages.length > 0 && (
        <Card title="Blocages identifiés" icon={Lock} color="red">
          {analysis.blockages.map((b, i) => (
            <div key={i} className="py-2 border-b border-gray-100 last:border-0">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${b.severity === 'bloquant' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                <p className="text-sm font-medium text-gray-800">{b.cause}</p>
              </div>
              <p className="text-xs text-gray-600 ml-4 mt-1">→ {b.solution}</p>
            </div>
          ))}
        </Card>
      )}

      {/* Actions recommandées */}
      <Card title="Actions recommandées" icon={Zap} color="blue">
        {analysis.actions.map((a, i) => (
          <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">{a.priority}</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">{a.action}</p>
              <p className="text-xs text-gray-500">{a.reason}</p>
            </div>
            <ActionBadge type={a.type} />
          </div>
        ))}
      </Card>

      {/* Bouton relancer */}
      <button onClick={runAnalysis} className="w-full py-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium">
        ↻ Relancer l'analyse
      </button>
    </div>
  )
}

// ─── SOUS-COMPOSANTS ─────────────────────────────────────────

function Card({ title, icon: Icon, color, children }: { title: string; icon: any; color: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true)
  const colorMap: Record<string, string> = { indigo: "text-indigo-600", green: "text-green-600", red: "text-red-600", blue: "text-blue-600", purple: "text-purple-600", orange: "text-orange-600" }
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-2 p-4 hover:bg-gray-50 transition-colors">
        <Icon className={`w-5 h-5 ${colorMap[color]}`} />
        <span className="font-semibold text-gray-900 text-sm flex-1 text-left">{title}</span>
        {open ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  )
}

function PointItem({ label, explanation, type, confidence }: { label: string; explanation: string; type: "strength" | "weakness"; confidence: number }) {
  return (
    <div className="py-2 border-b border-gray-50 last:border-0">
      <div className="flex items-center gap-2">
        {type === "strength" ? <CheckCircle className="w-4 h-4 text-green-500" /> : <AlertTriangle className="w-4 h-4 text-red-500" />}
        <span className="text-sm font-medium text-gray-800">{label}</span>
        <span className="text-[10px] text-gray-400 ml-auto">{Math.round(confidence * 100)}%</span>
      </div>
      <p className="text-xs text-gray-600 ml-6 mt-0.5">{explanation}</p>
    </div>
  )
}

function ConfidenceBadge({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  return <p className="text-[10px] text-gray-400 mt-2">Confiance globale de l'analyse : {pct}%{pct < 70 && " — enrichir le dossier pour améliorer la précision"}</p>
}

function ActionBadge({ type }: { type: string }) {
  const config: Record<string, { label: string; color: string }> = {
    urgent: { label: "URGENT", color: "bg-red-100 text-red-700" },
    document: { label: "DOC", color: "bg-blue-100 text-blue-700" },
    contact: { label: "RELANCE", color: "bg-yellow-100 text-yellow-700" },
    recours: { label: "RECOURS", color: "bg-purple-100 text-purple-700" },
    verification: { label: "VÉRIF", color: "bg-gray-100 text-gray-700" },
  }
  const c = config[type] || config.verification
  return <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${c.color}`}>{c.label}</span>
}
