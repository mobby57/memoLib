"use client";

import { useState } from "react";
import { Card } from "@/components/ui";

interface SearchResult {
  title: string;
  reference?: string;
  excerpt?: string;
  url?: string;
}

export default function RechercheLegalePage() {
  const [query, setQuery] = useState("");
  const [legifrance, setLegifrance] = useState<SearchResult[]>([]);
  const [jurisprudence, setJurisprudence] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSummary(null);
    try {
      const [lfRes, jurRes] = await Promise.all([
        fetch(`/api/legifrance/search?q=${encodeURIComponent(query)}`),
        fetch(`/api/jurisprudence/search?q=${encodeURIComponent(query)}`),
      ]);
      const lf = await lfRes.json().catch(() => ({}));
      const jur = await jurRes.json().catch(() => ({}));
      setLegifrance(lf.results || []);
      setJurisprudence(jur.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const summarize = async () => {
    const all = [...legifrance, ...jurisprudence];
    if (all.length === 0) return;
    const res = await fetch("/api/ai/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: all.map(r => `${r.title}: ${r.excerpt || ""}`).join("\n\n") }),
    });
    const data = await res.json().catch(() => ({}));
    setSummary(data.summary || data.analysis || "(reponse IA vide)");
  };

  return (
    <main className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Recherche legale</h1>
        <p className="text-sm text-gray-500">Legifrance + Jurisprudence, synthese par IA locale</p>
      </header>

      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") search(); }}
          placeholder="OQTF, delai 48h, refere suspension..."
          className="flex-1 rounded border px-4 py-2"
        />
        <button onClick={search} disabled={loading} className="rounded bg-blue-600 px-6 py-2 text-white">
          {loading ? "Recherche..." : "Rechercher"}
        </button>
      </div>

      {summary && (
        <Card className="p-4 bg-purple-50">
          <p className="text-sm font-semibold mb-2">Synthese IA locale</p>
          <p className="text-sm whitespace-pre-wrap">{summary}</p>
          <p className="text-xs text-gray-500 mt-2">Genere localement - aucune donnee envoyee a un tiers</p>
        </Card>
      )}

      {legifrance.length > 0 && (
        <Card className="p-4">
          <h2 className="font-semibold mb-3">Legifrance ({legifrance.length})</h2>
          <ul className="space-y-2">
            {legifrance.map((r, i) => (
              <li key={i} className="border-l-2 border-blue-500 pl-3">
                <p className="font-medium">{r.title}</p>
                {r.reference && <p className="text-sm text-gray-600">{r.reference}</p>}
                {r.excerpt && <p className="text-sm">{r.excerpt}</p>}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {jurisprudence.length > 0 && (
        <Card className="p-4">
          <h2 className="font-semibold mb-3">Jurisprudence ({jurisprudence.length})</h2>
          <ul className="space-y-2">
            {jurisprudence.map((r, i) => (
              <li key={i} className="border-l-2 border-green-500 pl-3">
                <p className="font-medium">{r.title}</p>
                {r.reference && <p className="text-sm text-gray-600">{r.reference}</p>}
                {r.excerpt && <p className="text-sm">{r.excerpt}</p>}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {(legifrance.length > 0 || jurisprudence.length > 0) && !summary && (
        <button onClick={summarize} className="rounded bg-purple-600 px-4 py-2 text-white">
          Synthetiser avec l&apos;IA locale
        </button>
      )}
    </main>
  );
}
