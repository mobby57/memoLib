"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui";

interface TribunalStat {
  tribunal: string;
  typeRecours?: string;
  tauxSucces?: number;
  nombreDossiers?: number;
}

export default function TribunalStatsPage() {
  const [stats, setStats] = useState<TribunalStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tribunal-stats")
      .then((r) => r.json())
      .then((d) => setStats(d.stats || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Stats tribunaux</h1>
        <p className="text-sm text-gray-500">
          Taux de succes par juridiction (donnees anonymisees, min. 5 dossiers)
        </p>
      </header>

      {loading ? (
        <p>Chargement...</p>
      ) : stats.length === 0 ? (
        <Card className="p-6 text-center text-gray-500">
          Pas encore assez de donnees (min. 5 dossiers par tribunal/type)
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.map((s, i) => (
            <Card key={i} className="p-4">
              <h3 className="font-semibold">{s.tribunal}</h3>
              {s.typeRecours && <p className="text-sm text-gray-600">{s.typeRecours}</p>}
              <div className="mt-3">
                <div className="text-3xl font-bold text-blue-600">{s.tauxSucces ?? 0}%</div>
                <p className="text-xs text-gray-500">sur {s.nombreDossiers ?? 0} dossiers</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
