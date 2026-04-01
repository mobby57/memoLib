'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertTriangle, Clock3, FileText, ShieldCheck } from 'lucide-react';
import { getDossierById, type DossierDetail } from '@/lib/services/dossiers-api';

type DossierDetailPageProps = {
  params: {
    locale: string;
    id: string;
  };
};

function normalizeStatus(value: string | null | undefined): 'critique' | 'haute' | 'normale' {
  const normalized = (value || '').toLowerCase();
  if (normalized === 'bloque' || normalized === 'retard') return 'critique';
  if (normalized === 'nouveau' || normalized === 'en_cours') return 'haute';
  return 'normale';
}

export default function DossierDetailPage({ params }: DossierDetailPageProps) {
  const searchParams = useSearchParams();
  const created = searchParams?.get('created') === '1';
  const [dossier, setDossier] = useState<DossierDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getDossierById(params.id);
        if (!active) return;
        setDossier(data);
      } catch (fetchError) {
        if (!active) return;
        const message = fetchError instanceof Error ? fetchError.message : 'Erreur de chargement du dossier';
        setError(message);
      } finally {
        if (active) setLoading(false);
      }
    };

    run();

    return () => {
      active = false;
    };
  }, [params.id]);

  const timeline = useMemo(() => {
    if (!dossier) return [];

    return [
      {
        id: 'd1',
        at: dossier.dateCreation ? new Date(dossier.dateCreation).toLocaleString('fr-FR') : 'Date inconnue',
        label: 'Ouverture dossier',
        detail: dossier.typeDossier || 'Type non precise',
      },
      ...(dossier.legalDeadlines || []).slice(0, 3).map((deadline) => ({
        id: deadline.id,
        at: deadline.dueDate ? new Date(deadline.dueDate).toLocaleDateString('fr-FR') : 'Date inconnue',
        label: deadline.title || 'Echeance legale',
        detail: deadline.status || 'Statut non precise',
      })),
    ];
  }, [dossier]);

  if (loading) {
    return <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">Chargement du dossier...</div>;
  }

  if (error || !dossier) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 shadow-sm">
        {error || 'Dossier introuvable'}
      </div>
    );
  }

  const clientName = [dossier.client?.firstName, dossier.client?.lastName].filter(Boolean).join(' ').trim() || 'Client inconnu';
  const severity = normalizeStatus(dossier.statut);

  return (
    <div className="space-y-6">
      {created ? (
        <div role="alert" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
          Dossier cree avec succes.
        </div>
      ) : null}

      <header className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{dossier.numero}</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">{dossier.typeDossier} - {clientName}</h1>
            <p className="mt-1 text-sm text-slate-500">{dossier.description || 'Sans description'} </p>
          </div>

          <div className="flex gap-2">
            <Link
              href={`/${params.locale}/dossiers`}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Retour dossiers
            </Link>
            <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
              Ajouter une note
            </button>
          </div>
        </div>
      </header>

      <section className="grid gap-6 xl:grid-cols-[2fr,1fr]">
        <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Timeline de traitement</h3>
          <div className="mt-5 space-y-4">
            {timeline.map((event) => (
              <div key={event.id} className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{event.at}</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{event.label}</p>
                <p className="mt-1 text-sm text-slate-600">{event.detail}</p>
              </div>
            ))}
          </div>
        </article>

        <aside className="space-y-4">
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Risque actuel</h4>
            <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-rose-100 px-3 py-1 text-sm font-semibold text-rose-700">
              <AlertTriangle size={14} />
              {severity === 'critique' ? 'Critique' : severity === 'haute' ? 'Eleve' : 'Normal'}
            </p>
            <p className="mt-2 text-sm text-slate-600">Statut dossier: {dossier.statut || 'non renseigne'}.</p>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Actions immediates</h4>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              <li className="inline-flex items-center gap-2"><Clock3 size={14} />Echeances ouvertes: {(dossier.legalDeadlines || []).length}</li>
              <li className="inline-flex items-center gap-2"><FileText size={14} />Documents: {(dossier.documents || []).length}</li>
              <li className="inline-flex items-center gap-2"><ShieldCheck size={14} />Factures: {(dossier.factures || []).length}</li>
            </ul>
          </article>
        </aside>
      </section>
    </div>
  );
}
