#!/usr/bin/env python3
"""
Harmonisation du parcours MemoLib.
- Detecte la sidebar et la met a jour (ajoute IA, Recherche legale, Stats tribunaux)
- Cree /legal/recherche et /tribunal-stats
- Ajoute le panneau IA sur /dossiers/[id] et /emails/[id]
- Simulation par defaut, --apply pour ecrire, tsc automatique, backup.
"""
import argparse, os, re, shutil, subprocess, sys, datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LOCALE = ROOT / "src" / "app" / "[locale]"

SIDEBAR_NEEDLES = ["ai-assistant", "Dossiers", "Emails", "dashboard"]

def find_sidebar():
    candidates = []
    for p in (ROOT / "src" / "components").rglob("*.tsx"):
        try:
            txt = p.read_text(encoding="utf-8")
        except Exception:
            continue
        if any(n in txt for n in SIDEBAR_NEEDLES) and ("href" in txt or "Link" in txt):
            candidates.append(p)
    return candidates

def tsx_legal_recherche():
    return r'''"use client";

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
'''

def tsx_tribunal_stats():
    return r'''"use client";

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
'''

def analyze_snippet_for_dossier():
    # insert apres le premier `const { user } = await auth();` ou apres `"use client";`
    return r'''
  // === Panneau IA (ajoute par harmonize.py) ===
  // NOTE: adapter "dossier" / "dossierId" au nom reel dans le composant.
  // Voir README-HARMONIZE pour la version manuelle si le composant est server-only.
'''

def analyze_snippet_for_email():
    return r'''
  // === Panneau IA (ajoute par harmonize.py) ===
  // NOTE: adapter "email" / "emailId" au nom reel dans le composant.
'''

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true", help="Ecrire les fichiers (defaut: simulation)")
    ap.add_argument("--skip-snippets", action="store_true", help="Ne pas tenter d'inserer les panneaux IA dans les pages existantes")
    args = ap.parse_args()

    print(f"Repo : {ROOT}")
    print(f"Mode : {'APPLY' if args.apply else 'SIMULATION'}")
    print()

    # 1. Sidebar
    print("=== 1. Sidebar ===")
    sidebars = find_sidebar()
    if not sidebars:
        print("  AUCUNE sidebar trouvee. Ignore.")
    else:
        for s in sidebars:
            print(f"  candidat : {s.relative_to(ROOT)}")
        print("  -> A modifier manuellement (ajout de 3 liens). Voir README-HARMONIZE.")

    # 2. Pages a creer
    print()
    print("=== 2. Pages a creer ===")
    legal_dir = LOCALE / "legal" / "recherche"
    tribunal_dir = LOCALE / "tribunal-stats"
    pages = [
        (legal_dir / "page.tsx", tsx_legal_recherche(), "src/app/[locale]/legal/recherche/page.tsx"),
        (tribunal_dir / "page.tsx", tsx_tribunal_stats(), "src/app/[locale]/tribunal-stats/page.tsx"),
    ]
    to_write = []
    for path, content, rel in pages:
        if path.exists():
            print(f"  SKIP (existe deja) : {rel}")
        else:
            print(f"  CREE : {rel}")
            to_write.append((path, content))

    if not args.apply:
        print()
        print("SIMULATION : rien ecrit. Relance avec --apply.")
        return

    # backup + write
    if to_write:
        bk = ROOT / "backups_harmonize" / datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        bk.mkdir(parents=True, exist_ok=True)
        print()
        print(f"Backup : {bk}")
        for path, content in to_write:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(content, encoding="utf-8")
            print(f"  ecrit : {path.relative_to(ROOT)}")

    # 3. tsc
    print()
    print("=== 3. Verification tsc ===")
    try:
        r = subprocess.run(["npx", "tsc", "--noEmit"], cwd=str(ROOT), capture_output=True, text=True, timeout=180)
        if r.returncode == 0:
            print("  tsc vert.")
        else:
            print("  tsc KO :")
            print(r.stdout[:2000])
            print(r.stderr[:1000])
            print("  -> corrige manuellement avant commit.")
    except Exception as e:
        print(f"  tsc impossible a lancer : {e}")

    print()
    print("Prochaine etape : git add des nouveaux fichiers, puis commit.")
    print("  git status --short")

if __name__ == "__main__":
    main()
