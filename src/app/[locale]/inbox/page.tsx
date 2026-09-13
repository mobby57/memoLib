'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Archive, ArrowRight, CheckCircle2, Clock3, FileText, FolderOpen, Inbox, Mail, RefreshCw, Search, Sparkles, Users, XCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface EmailItem {
  id: string;
  from: string;
  subject: string;
  body: string;
  category?: string;
  urgency?: string;
  receivedAt: string;
  processingStatus?: string;
  aiAnalysis?: string;
}

const urgencyLabel = (urgency?: string) => {
  switch (urgency?.toLowerCase()) {
    case 'high':
    case 'urgent':
      return { label: 'Urgent', className: 'bg-red-50 text-red-700 border-red-200' };
    case 'medium':
      return { label: 'À traiter', className: 'bg-amber-50 text-amber-700 border-amber-200' };
    default:
      return { label: 'Normal', className: 'bg-slate-50 text-slate-600 border-slate-200' };
  }
};

export default function InboxPage() {
  const { isLoading, isAuthenticated, user } = useAuth();
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loadEmails = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const response = await fetch('/api/emails?status=RECEIVED&limit=50', { cache: 'no-store' });
      if (!response.ok) throw new Error('Impossible de charger la boîte de réception.');
      const data = await response.json();
      const nextEmails = Array.isArray(data.emails) ? data.emails : [];
      setEmails(nextEmails);
      setSelectedId(current => current && nextEmails.some((email: EmailItem) => email.id === current) ? current : nextEmails[0]?.id ?? null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Une erreur est survenue.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) void loadEmails();
  }, [isAuthenticated]);

  const filteredEmails = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return emails;
    return emails.filter(email => `${email.from} ${email.subject} ${email.body} ${email.category ?? ''}`.toLowerCase().includes(normalized));
  }, [emails, query]);

  const selectedEmail = filteredEmails.find(email => email.id === selectedId) ?? filteredEmails[0];
  const urgentCount = emails.filter(email => ['high', 'urgent'].includes(email.urgency?.toLowerCase() ?? '')).length;

  if (isLoading) {
    return <main className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="animate-spin h-8 w-8 rounded-full border-2 border-slate-300 border-t-slate-800" /></main>;
  }

  if (!isAuthenticated) {
    return <main className="min-h-screen bg-slate-50 flex items-center justify-center"><Link className="rounded-lg bg-slate-900 px-5 py-3 text-white" href="/fr/auth/login">Se connecter</Link></main>;
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Espace cabinet</p>
            <h1 className="mt-1 flex items-center gap-3 text-2xl font-bold tracking-tight"><Inbox className="h-7 w-7" /> Boîte de réception</h1>
            <p className="mt-1 text-sm text-slate-500">Les messages à traiter avant de passer aux dossiers.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/fr/dossiers" className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"><FolderOpen className="h-4 w-4" /> Dossiers</Link>
            <Link href="/fr/clients" className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"><Users className="h-4 w-4" /> Clients</Link>
            <button onClick={() => void loadEmails(true)} disabled={refreshing} className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Actualiser</button>
          </div>
        </header>

        <section className="mb-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border bg-white p-4"><p className="text-xs font-medium uppercase tracking-wide text-slate-500">À traiter</p><p className="mt-1 text-2xl font-bold">{emails.length}</p></div>
          <div className="rounded-xl border bg-white p-4"><p className="text-xs font-medium uppercase tracking-wide text-slate-500">Urgents</p><p className="mt-1 text-2xl font-bold text-red-600">{urgentCount}</p></div>
          <div className="rounded-xl border bg-white p-4"><p className="text-xs font-medium uppercase tracking-wide text-slate-500">Cabinet</p><p className="mt-1 truncate text-sm font-semibold">{user?.tenantId ? 'Connecté' : 'Configuration à terminer'}</p></div>
        </section>

        <div className="mb-4 flex items-center gap-3 rounded-xl border bg-white px-4 py-3">
          <Search className="h-5 w-5 text-slate-400" />
          <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Rechercher un email, un client ou un dossier…" className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" />
        </div>

        {error && <div className="mb-4 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><XCircle className="h-5 w-5 shrink-0" /> {error}</div>}

        {loading ? (
          <div className="rounded-2xl border bg-white p-16 text-center text-slate-500">Chargement de votre boîte…</div>
        ) : filteredEmails.length === 0 ? (
          <div className="rounded-2xl border bg-white p-12 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
            <h2 className="mt-4 text-lg font-semibold">Aucun message à traiter</h2>
            <p className="mt-1 text-sm text-slate-500">Votre boîte est à jour. Les nouveaux messages apparaîtront ici.</p>
            <Link href="/fr/settings/emails" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white">Connecter une boîte mail <ArrowRight className="h-4 w-4" /></Link>
          </div>
        ) : (
          <div className="grid min-h-[620px] overflow-hidden rounded-2xl border bg-white lg:grid-cols-[380px_1fr]">
            <aside className="border-b lg:border-b-0 lg:border-r">
              <div className="border-b px-4 py-3 text-sm font-semibold">Messages ({filteredEmails.length})</div>
              <div className="max-h-[620px] overflow-y-auto">
                {filteredEmails.map(email => {
                  const urgency = urgencyLabel(email.urgency);
                  const active = selectedEmail?.id === email.id;
                  return (
                    <button key={email.id} onClick={() => setSelectedId(email.id)} className={`w-full border-b px-4 py-4 text-left transition ${active ? 'bg-slate-100' : 'hover:bg-slate-50'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0"><p className="truncate text-sm font-semibold">{email.from}</p><p className="mt-1 truncate text-sm text-slate-700">{email.subject || '(Sans objet)'}</p></div>
                        {email.urgency && <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${urgency.className}`}>{urgency.label}</span>}
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-xs text-slate-400"><Clock3 className="h-3.5 w-3.5" /> {new Date(email.receivedAt).toLocaleString('fr-FR')}</div>
                    </button>
                  );
                })}
              </div>
            </aside>

            <section className="min-w-0">
              {selectedEmail ? (
                <div className="p-5 sm:p-7">
                  <div className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0"><p className="text-xs font-medium uppercase tracking-wide text-slate-400">Nouveau message</p><h2 className="mt-1 text-xl font-bold">{selectedEmail.subject || '(Sans objet)'}</h2><p className="mt-2 text-sm text-slate-500">De {selectedEmail.from} · {new Date(selectedEmail.receivedAt).toLocaleString('fr-FR')}</p></div>
                    {selectedEmail.urgency && <span className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${urgencyLabel(selectedEmail.urgency).className}`}><AlertTriangle className="h-3.5 w-3.5" /> {urgencyLabel(selectedEmail.urgency).label}</span>}
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-3">
                    <div className="rounded-xl border bg-slate-50 p-4"><p className="text-xs text-slate-500">Classification IA</p><p className="mt-1 text-sm font-semibold">{selectedEmail.category || 'En analyse'}</p></div>
                    <div className="rounded-xl border bg-slate-50 p-4"><p className="text-xs text-slate-500">Traitement</p><p className="mt-1 text-sm font-semibold">{selectedEmail.processingStatus || 'Reçu'}</p></div>
                    <div className="rounded-xl border bg-slate-50 p-4"><p className="text-xs text-slate-500">Décision</p><p className="mt-1 text-sm font-semibold">Validation humaine</p></div>
                  </div>

                  <div className="mt-6 rounded-xl border bg-white p-5"><div className="mb-3 flex items-center gap-2 text-sm font-semibold"><Mail className="h-4 w-4" /> Message</div><div className="max-h-72 overflow-y-auto whitespace-pre-wrap text-sm leading-6 text-slate-700">{selectedEmail.body || 'Aucun contenu.'}</div></div>

                  {selectedEmail.aiAnalysis && <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50 p-5"><div className="flex items-center gap-2 text-sm font-semibold text-violet-900"><Sparkles className="h-4 w-4" /> Analyse proposée par MemoLib</div><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-violet-950">{selectedEmail.aiAnalysis}</p><p className="mt-3 text-xs text-violet-700">L'IA propose une analyse ; l'avocat garde la décision finale.</p></div>}

                  <div className="mt-6 rounded-xl border bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Prochaine étape</p><div className="mt-3 flex flex-wrap gap-2"><button className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"><FolderOpen className="h-4 w-4" /> Identifier le dossier <ArrowRight className="h-4 w-4" /></button><button className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2.5 text-sm font-medium"><Archive className="h-4 w-4" /> Archiver</button><Link href="/fr/dossiers" className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2.5 text-sm font-medium"><FileText className="h-4 w-4" /> Voir les dossiers</Link></div></div>
                </div>
              ) : null}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
