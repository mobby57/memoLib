'use client';

import { useState, useEffect } from "react"
import { Brain, AlertTriangle, FileText, Clock, Zap } from "lucide-react"

interface MorningBriefData {
  date: string
  stats: { oqtfAtRisk: number; incomplete: number; criticalDeadlines: number; relancesRecommandees: number }
  dossiersAtRisk: { numero: string; type: string; deadlines: { label: string; daysRemaining: number }[] }[]
  criticalDeadlines: { dossier: string; type: string; label: string; daysRemaining: number }[]
}

export default function MorningBrief() {
  const [data, setData] = useState<MorningBriefData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/ai/copilot/morning-brief")
      .then(r => r.ok ? r.json() : null)
      .then(setData)
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="animate-pulse bg-indigo-50 rounded-2xl h-32" />
  if (!data) return null

  const { stats } = data
  const total = stats.oqtfAtRisk + stats.incomplete + stats.criticalDeadlines + stats.relancesRecommandees
  if (total === 0) return null

  return (
    <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5" />
        <h2 className="font-bold text-lg">Copilote CESEDA — {data.date}</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {stats.oqtfAtRisk > 0 && <StatCard icon={AlertTriangle} value={stats.oqtfAtRisk} label="OQTF à risque" urgent />}
        {stats.criticalDeadlines > 0 && <StatCard icon={Clock} value={stats.criticalDeadlines} label="Délais critiques" urgent />}
        {stats.incomplete > 0 && <StatCard icon={FileText} value={stats.incomplete} label="Dossiers incomplets" />}
        {stats.relancesRecommandees > 0 && <StatCard icon={Zap} value={stats.relancesRecommandees} label="Relances à faire" />}
      </div>

      {data.criticalDeadlines.length > 0 && (
        <div className="bg-white/10 rounded-xl p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/70 mb-2">Échéances imminentes</p>
          {data.criticalDeadlines.slice(0, 3).map((dl, i) => (
            <div key={i} className="flex items-center justify-between py-1 text-sm">
              <span>{dl.dossier} — {dl.label}</span>
              <span className="font-bold text-yellow-300">J-{dl.daysRemaining}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StatCard({ icon: Icon, value, label, urgent }: { icon: any; value: number; label: string; urgent?: boolean }) {
  return (
    <div className={`rounded-xl p-3 ${urgent ? "bg-red-500/20" : "bg-white/10"}`}>
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4" />
        <span className="text-2xl font-bold">{value}</span>
      </div>
      <p className="text-xs text-white/80 mt-1">{label}</p>
    </div>
  )
}
