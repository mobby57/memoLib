'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileText,
  FolderOpen,
  Mail,
  MessageSquare,
  RefreshCw,
  Sparkles,
  User,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface DossierData {
  id: string;
  numero?: string;
  objet?: string;
  description?: string;
  typeDossier?: string;
  statut?: string;
  status?: string;
  priorite?: string;
  dateCreation?: string;
  dateOuverture?: string;
  updatedAt?: string;
  client?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    type?: string;
  };
  documents?: Array<Record<string, any>>;
  delais?: Array<Record<string, any>>;
  evenements?: Array<Record<string, any>>;
  _count?: { documents?: number; delais?: number; evenements?: number };
}

const label = (value?: string) =>
  (value || '—').replaceAll('_', ' ').toLowerCase().replace(/^./, c => c.toUpperCase());

const priorityClass = (value?: string) => {
  switch (value?.toUpperCase()) {
    case 'CRITIQUE':
    case 'URGENTE':
    case 'URGENT':
      return 'border-red-200 bg-red-50 text-red-700';
    case 'HAUTE':
      return 'border-amber-200 bg-amber-50 text-amber-700';
    default:
      return 'border-slate-200 bg-slate-50 text-slate-600';
  }
};

export default function DossierWorkspacePage() {
  const params = useParams<{ locale: string; id: string }>();
  const router = useRouter();
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const [dossier, setDossier] = useState<DossierData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'deadlines' | 'timeline'>('overview');
  const [saving, setSaving] = useState(false);

  const locale = params.locale || 'fr';
  const id = params.id;

  const loadDossier = async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/dossiers/${encodeURIComponent(id)}`, { cache: 'no-store' });
      if (response.status === 401) {
        router.push(`/${locale}/auth/login`);
        return;
      }
      if (!response.ok) throw new Error(response.status === 404 ? 'Dossier introuvable.' : 'Impossible de charger le dossier.');
      const data = await response.json();
      setDossier(data.dossier ?? null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Une erreur est survenue.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) void loadDossier();
  }, [isAuthenticated, id]);

  const nextDeadline = useMemo(() => {
    if (!dossier?.delais?.length) return null;
    return [...dossier.delais]
      .filter(item => item.dateEcheance)
      .sort((a, b) => new Date(a.dateEcheance).getTime() - new Date(b.dateEcheance).getTime())[0] ?? null;
  }, [dossier]);

  const updateField = async (field: 'statut' | 'priorite', value: string) => {
    if (!dossier || !value) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/dossiers/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      if (!response.ok) throw new Error('Impossible d’enregistrer la modification.');
      const data = await response.json();
      setDossier(data.dossier ?? { ...dossier, [field]: value });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Erreur de sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return <main className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="animate-spin h-8 w-8 rounded-full border-2 border-slate-300 border-t-slate-800" /></main>;
  }

  if (!isAuthenticated) {
    return <main className="min-h-screen bg-slate-50 flex items-center justify-center"><Link href={`/${locale}/auth/login`} className="rounded-lg bg-slate-900 px-5 py-3 text-white">Se connecter</Link></main>;
  }

  if (error || !dossier) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-3xl rounded-2xl border bg-white p-10 text-center">
          <FolderOpen className="mx-auto h-12 w-12 text-slate-300" />
          <h1 className="mt-4 text-xl font-bold">Dossier indisponible</h1>
          <p className="mt-2 text-sm text-slate-500">{error || 'Ce dossier n’existe pas ou vous n’avez pas accès.'}</p>
          <Link href={`/${locale}/dossiers`} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"><ArrowLeft className="h-4 w-4" /> Retour aux dossiers</Link>
        </div>
      </main>
    );
  }

  const clientName = [dossier.client?.firstName, dossier.client?.lastName].filter(Boolean).join(' ') || 'Client non identifié';
  const status = dossier.statut || dossier.status || 'EN_COURS';
  const priority = dossier.priorite || 'NORMALE';
  const documents = dossier.documents || [];
  const deadlines = dossier.delais || [];
  const events = dossier.evenements || [];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-[1450px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link href={`/${locale}/dossiers`} className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"><ArrowLeft className="h-4 w-4" /> Tous les dossiers</Link>
          <div className="flex flex-wrap gap-2">
            <Link href={`/${locale}/inbox`} className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-medium"><Mail className="h-4 w-4" /> Inbox</Link>
            <Link href={`/${locale}/dossiers/${id}/chat`} className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-medium"><MessageSquare className="h-4 w-4" /> Assistant du dossier</Link>
            <button onClick={() => void loadDossier(true)} disabled={refreshing} className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-medium disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Actualiser</button>
          </div>
        </div>

        <header className="rounded-2xl border bg-white p-5 sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Dossier {dossier.numero || id}</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{dossier.objet || dossier.description || 'Dossier juridique'}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                <span className="inline-flex items-center gap-1.5"><User className="h-4 w-4" /> {clientName}</span>
                {dossier.client?.email && <span>· {dossier.client.email}</span>}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <select value={status} onChange={event => void updateField('statut', event.target.value)} disabled={saving} className="rounded-lg border bg-white px-3 py-2 text-sm font-medium">
                <option value="BROUILLON">Brouillon</option>
                <option value="EN_COURS">En cours</option>
                <option value="EN_ATTENTE">En attente</option>
                <option value="TERMINE">Terminé</option>
                <option value="CLOS">Clos</option>
                <option value="ARCHIVE">Archivé</option>
              </select>
              <select value={priority} onChange={event => void updateField('priorite', event.target.value)} disabled={saving} className={`rounded-lg border px-3 py-2 text-sm font-semibold ${priorityClass(priority)}`}>
                <option value="NORMALE">Priorité normale</option>
                <option value="HAUTE">Priorité haute</option>
                <option value="URGENTE">Priorité urgente</option>
                <option value="CRITIQUE">Priorité critique</option>
              </select>
            </div>
          </div>
        </header>

        <section className="mt-5 grid gap-4 lg:grid-cols-4">
          <div className="rounded-xl border bg-white p-4"><p className="text-xs uppercase tracking-wide text-slate-400">Type</p><p className="mt-1 font-semibold">{label(dossier.typeDossier)}</p></div>
          <div className="rounded-xl border bg-white p-4"><p className="text-xs uppercase tracking-wide text-slate-400">Documents</p><p className="mt-1 text-xl font-bold">{dossier._count?.documents ?? documents.length}</p></div>
          <div className="rounded-xl border bg-white p-4"><p className="text-xs uppercase tracking-wide text-slate-400">Échéances</p><p className="mt-1 text-xl font-bold">{dossier._count?.delais ?? deadlines.length}</p></div>
          <div className="rounded-xl border bg-white p-4"><p className="text-xs uppercase tracking-wide text-slate-400">Activité</p><p className="mt-1 text-xl font-bold">{dossier._count?.evenements ?? events.length}</p></div>
        </section>

        <section className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-3"><CalendarClock className="mt-0.5 h-6 w-6 shrink-0 text-amber-700" /><div><p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Prochaine action</p><h2 className="mt-1 font-semibold text-amber-950">{nextDeadline ? (nextDeadline.titre || nextDeadline.type || 'Échéance à traiter') : 'Aucune échéance identifiée'}</h2><p className="mt-1 text-sm text-amber-800">{nextDeadline?.dateEcheance ? new Date(nextDeadline.dateEcheance).toLocaleDateString('fr-FR', { dateStyle: 'long' }) : 'Vérifiez les pièces et la prochaine action à valider.'}</p></div></div>
            <Link href={`/${locale}/dossiers/${id}/chat`} className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-900 px-4 py-2.5 text-sm font-semibold text-white"><Sparkles className="h-4 w-4" /> Préparer l’action</Link>
          </div>
        </section>

        <nav className="mt-5 flex overflow-x-auto rounded-xl border bg-white p-1">
          {([['overview', 'Vue d’ensemble'], ['documents', 'Documents'], ['deadlines', 'Échéances'], ['timeline', 'Historique']] as const).map(([key, text]) => <button key={key} onClick={() => setActiveTab(key)} className={`whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium ${activeTab === key ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{text}</button>)}
        </nav>

        <section className="mt-5">
          {activeTab === 'overview' && (
            <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
              <div className="space-y-5">
                <div className="rounded-2xl border bg-white p-6"><h2 className="flex items-center gap-2 font-semibold"><FileText className="h-5 w-5" /> Objet et contexte</h2><p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-600">{dossier.description || dossier.objet || 'Aucune description renseignée.'}</p></div>
                <div className="rounded-2xl border bg-white p-6"><h2 className="flex items-center gap-2 font-semibold"><CheckCircle2 className="h-5 w-5" /> Validation humaine</h2><p className="mt-3 text-sm leading-6 text-slate-600">MemoLib peut organiser les informations, détecter des échéances et proposer des actions. La décision juridique et la validation finale restent à l’avocat.</p></div>
              </div>
              <aside className="rounded-2xl border bg-white p-6"><h2 className="font-semibold">Client</h2><div className="mt-4 space-y-3 text-sm"><p className="font-medium">{clientName}</p>{dossier.client?.email && <p className="text-slate-500">{dossier.client.email}</p>}{dossier.client?.phone && <p className="text-slate-500">{dossier.client.phone}</p>}<Link href={`/${locale}/clients/${dossier.client?.id || ''}`} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-900">Voir la fiche client →</Link></div></aside>
            </div>
          )}

          {activeTab === 'documents' && <div className="rounded-2xl border bg-white p-6"><h2 className="font-semibold">Documents du dossier</h2>{documents.length === 0 ? <p className="mt-8 text-center text-sm text-slate-500">Aucun document pour le moment.</p> : <div className="mt-4 divide-y">{documents.map((doc, index) => <div key={doc.id || index} className="flex items-center justify-between gap-4 py-4"><div className="flex min-w-0 items-center gap-3"><FileText className="h-5 w-5 shrink-0 text-slate-400" /><div className="min-w-0"><p className="truncate text-sm font-medium">{doc.nom || doc.name || doc.filename || `Document ${index + 1}`}</p><p className="text-xs text-slate-400">{doc.type || doc.mimeType || 'Document'}</p></div></div><span className="text-xs text-slate-400">{doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('fr-FR') : ''}</span></div>)}</div>}</div>}

          {activeTab === 'deadlines' && <div className="rounded-2xl border bg-white p-6"><h2 className="font-semibold">Échéances</h2>{deadlines.length === 0 ? <p className="mt-8 text-center text-sm text-slate-500">Aucune échéance enregistrée.</p> : <div className="mt-4 space-y-3">{deadlines.map((item, index) => <div key={item.id || index} className="flex items-start gap-4 rounded-xl border p-4"><Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" /><div><p className="font-medium">{item.titre || item.type || `Échéance ${index + 1}`}</p><p className="mt-1 text-sm text-slate-500">{item.dateEcheance ? new Date(item.dateEcheance).toLocaleDateString('fr-FR', { dateStyle: 'long' }) : 'Date non renseignée'}</p></div></div>)}</div>}</div>}

          {activeTab === 'timeline' && <div className="rounded-2xl border bg-white p-6"><h2 className="font-semibold">Historique du dossier</h2>{events.length === 0 ? <p className="mt-8 text-center text-sm text-slate-500">Aucune activité enregistrée.</p> : <div className="mt-5 space-y-5">{events.map((event, index) => <div key={event.id || index} className="relative flex gap-4"><div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-slate-400" /><div><p className="text-sm font-medium">{event.titre || event.categorie || 'Événement'}</p><p className="mt-1 text-sm text-slate-500">{event.description || ''}</p><p className="mt-1 text-xs text-slate-400">{event.dateEvenement ? new Date(event.dateEvenement).toLocaleString('fr-FR') : ''}</p></div></div>)}</div>}</div>}
        </section>
      </div>
    </main>
  );
}
