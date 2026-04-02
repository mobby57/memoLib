'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { listDossiers, type DossierListItem } from '@/lib/services/dossiers-api';

type DossierStatus = 'nouveau' | 'en_cours' | 'bloque' | 'clos' | 'archive' | 'all';
type DossierPriority = 'haute' | 'normale';

type Dossier = {
  id: string;
  numero: string;
  client: string;
  objet: string;
  status: DossierStatus;
  priority: DossierPriority;
  updatedAt: string;
};

type DossiersPageProps = {
  params: {
    locale: string;
  };
};

const statusClass: Record<Exclude<DossierStatus, 'all'>, string> = {
  nouveau: 'bg-cyan-100 text-cyan-700',
  en_cours: 'bg-blue-100 text-blue-700',
  bloque: 'bg-rose-100 text-rose-700',
  clos: 'bg-slate-100 text-slate-700',
  archive: 'bg-purple-100 text-purple-700',
};

const priorityClass: Record<DossierPriority, string> = {
  haute: 'bg-orange-100 text-orange-700',
  normale: 'bg-slate-100 text-slate-700',
};

const statusLabel: Record<Exclude<DossierStatus, 'all'>, string> = {
  nouveau: 'Nouveau',
  en_cours: 'En cours',
  bloque: 'Bloque',
  clos: 'Clos',
  archive: 'Archive',
};

function normalizeStatus(value: string | null | undefined): Exclude<DossierStatus, 'all'> {
  const normalized = (value || '').toLowerCase().replace('-', '_');

  if (normalized === 'en_cours' || normalized === 'en cours') return 'en_cours';
  if (normalized === 'nouveau') return 'nouveau';
  if (normalized === 'bloque') return 'bloque';
  if (normalized === 'archive') return 'archive';
  if (normalized === 'clos' || normalized === 'cloture' || normalized === 'ferme') return 'clos';

  return 'en_cours';
}

function normalizePriority(value: string | null | undefined): DossierPriority {
  return (value || '').toLowerCase() === 'haute' ? 'haute' : 'normale';
}

function toUiDossier(item: DossierListItem): Dossier {
  const clientName = [item.client?.firstName, item.client?.lastName].filter(Boolean).join(' ').trim();
  const updatedAtIso = item.updatedAt || item.dateCreation || null;

  return {
    id: item.id,
    numero: item.numero,
    client: clientName.length > 0 ? clientName : 'Client inconnu',
    objet: item.description?.trim() || item.typeDossier || 'Sans objet',
    status: normalizeStatus(item.statut),
    priority: normalizePriority(item.priorite),
    updatedAt: updatedAtIso ? new Date(updatedAtIso).toLocaleDateString('fr-FR') : 'Date inconnue',
  };
}

export default function DossiersPage({ params }: DossiersPageProps) {
  const pageSize = 20;
  const [sortBy, setSortBy] = useState<'dateCreation' | 'updatedAt' | 'priorite' | 'statut'>('dateCreation');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<DossierStatus>('all');

  useEffect(() => {
    let active = true;

    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await listDossiers({
          page,
          limit: pageSize,
          statut: status === 'all' ? undefined : status,
          sortBy,
          sortOrder,
        });
        if (!active) return;
        setDossiers(response.data.map(toUiDossier));
        setTotalPages(Math.max(1, response.pagination.pages));
        setTotalCount(response.pagination.total);
      } catch (fetchError) {
        if (!active) return;
        const message = fetchError instanceof Error ? fetchError.message : 'Erreur de chargement';
        setError(message);
      } finally {
        if (active) setLoading(false);
      }
    };

    run();

    return () => {
      active = false;
    };
  }, [page, pageSize, sortBy, sortOrder, status]);

  useEffect(() => {
    setPage(1);
  }, [status]);

  useEffect(() => {
    setPage(1);
  }, [sortBy, sortOrder]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return dossiers.filter((dossier) => {
      const matchesStatus = status === 'all' || dossier.status === status;
      const matchesQuery =
        normalized.length === 0 ||
        dossier.numero.toLowerCase().includes(normalized) ||
        dossier.client.toLowerCase().includes(normalized) ||
        dossier.objet.toLowerCase().includes(normalized);

      return matchesStatus && matchesQuery;
    });
  }, [dossiers, query, status]);

  return (
    <div className="space-y-6">
      <header className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Dossiers</h1>
            <p className="text-sm text-slate-500">Suivi centralise des dossiers CESEDA et recours</p>
          </div>

          <Link
            href={`/${params.locale}/dossiers/new`}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Nouveau dossier
          </Link>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[2fr,1fr,1fr]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher par numero, client ou objet"
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-blue-500"
            />
          </label>

          <div className="relative">
            <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as 'all' | DossierStatus)}
              className="w-full appearance-none rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-blue-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="nouveau">Nouveau</option>
              <option value="en_cours">En cours</option>
              <option value="bloque">Bloque</option>
              <option value="clos">Clos</option>
              <option value="archive">Archive</option>
            </select>
          </div>

          <div className="relative">
            <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <select
              value={`${sortBy}:${sortOrder}`}
              onChange={(event) => {
                const [nextSortBy, nextSortOrder] = event.target.value.split(':');
                setSortBy(nextSortBy as 'dateCreation' | 'updatedAt' | 'priorite' | 'statut');
                setSortOrder(nextSortOrder as 'asc' | 'desc');
              }}
              className="w-full appearance-none rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-blue-500"
            >
              <option value="dateCreation:desc">Tri: plus recents</option>
              <option value="dateCreation:asc">Tri: plus anciens</option>
              <option value="updatedAt:desc">Tri: maj recente</option>
              <option value="priorite:desc">Tri: priorite haute</option>
              <option value="statut:asc">Tri: statut</option>
            </select>
          </div>
        </div>
      </header>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-[1.2fr,1fr,1fr,1fr,auto] border-b border-slate-200 bg-slate-50 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <span>Dossier</span>
          <span>Client</span>
          <span>Statut</span>
          <span>Priorite</span>
          <span></span>
        </div>

        {loading ? (
          <div className="px-6 py-10 text-center text-sm text-slate-500">Chargement des dossiers...</div>
        ) : error ? (
          <div className="space-y-3 px-6 py-10 text-center">
            <p className="text-sm text-rose-600">{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Reessayer
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-slate-500">Aucun dossier ne correspond aux filtres.</div>
        ) : (
          filtered.map((dossier) => (
            <article
              key={dossier.id}
              className="grid grid-cols-[1.2fr,1fr,1fr,1fr,auto] items-center gap-3 border-b border-slate-100 px-6 py-4 last:border-b-0"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900">{dossier.numero}</p>
                <p className="text-xs text-slate-500">{dossier.objet}</p>
              </div>

              <p className="text-sm text-slate-700">{dossier.client}</p>

              <span className={`inline-flex w-fit rounded-full px-2 py-1 text-xs font-semibold ${statusClass[dossier.status]}`}>
                {statusLabel[dossier.status]}
              </span>

              <span className={`inline-flex w-fit rounded-full px-2 py-1 text-xs font-semibold uppercase ${priorityClass[dossier.priority]}`}>
                {dossier.priority}
              </span>

              <Link
                href={`/${params.locale}/dossiers/${dossier.id}`}
                className="text-sm font-semibold text-blue-600 transition hover:text-blue-700"
              >
                Ouvrir
              </Link>
            </article>
          ))
        )}
      </section>

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm text-slate-600 shadow-sm">
        <p>
          Page {page} / {totalPages} • {totalCount} dossier(s)
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Precedent
          </button>
          <button
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Suivant
          </button>
        </div>
      </section>
    </div>
  );
}
