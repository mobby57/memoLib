'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createDossier, generateDossierNumero, listClients, type DossierClient } from '@/lib/services/dossiers-api';

type NewDossierPageProps = {
  params: {
    locale: string;
  };
};

export default function NewDossierPage({ params }: NewDossierPageProps) {
  const router = useRouter();
  const [clients, setClients] = useState<DossierClient[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const run = async () => {
      try {
        setLoadingClients(true);
        setError(null);
        const response = await listClients({ limit: 100 });
        if (!active) return;
        setClients(response.data);
      } catch (fetchError) {
        if (!active) return;
        const message = fetchError instanceof Error ? fetchError.message : 'Erreur de chargement des clients';
        setError(message);
      } finally {
        if (active) setLoadingClients(false);
      }
    };

    run();

    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const clientId = String(formData.get('clientId') || '');
    const typeDossier = String(formData.get('typeDossier') || '');
    const description = String(formData.get('description') || '');
    const priorite = String(formData.get('priorite') || 'normale');
    const dateEcheance = String(formData.get('dateEcheance') || '');

    if (!clientId || !typeDossier) {
      setError('Client et type de dossier sont obligatoires.');
      setIsSubmitting(false);
      return;
    }

    try {
      const created = await createDossier({
        numero: generateDossierNumero(),
        clientId,
        typeDossier,
        description,
        priorite,
        dateEcheance: dateEcheance || undefined,
      });

      router.push(`/${params.locale}/dossiers/${created.id}`);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Erreur de creation du dossier';
      setError(message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Nouveau dossier</h1>
        <p className="mt-1 text-sm text-slate-500">Creation rapide d'un dossier avec metadata CESEDA</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 md:col-span-2">
            <span className="text-sm font-medium text-slate-700">Client</span>
            <select
              required
              name="clientId"
              disabled={loadingClients}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500"
            >
              <option value="">{loadingClients ? 'Chargement clients...' : 'Selectionner un client'}</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {[client.firstName, client.lastName].filter(Boolean).join(' ')}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Type de dossier</span>
            <select
              required
              name="typeDossier"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500"
            >
              <option value="">Selectionner</option>
              <option value="oqtf">Recours OQTF</option>
              <option value="renouvellement">Renouvellement titre</option>
              <option value="regroupement">Regroupement familial</option>
              <option value="autre">Autre</option>
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Priorite</span>
            <select
              name="priorite"
              defaultValue="normale"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500"
            >
              <option value="haute">Haute</option>
              <option value="normale">Normale</option>
            </select>
          </label>
        </div>

        <label className="space-y-1 block">
          <span className="text-sm font-medium text-slate-700">Description initiale</span>
          <textarea
            name="description"
            rows={5}
            placeholder="Contexte, pieces existantes, urgence"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500"
          />
        </label>

        <label className="space-y-1 block">
          <span className="text-sm font-medium text-slate-700">Delai cible</span>
          <input
            type="date"
            name="dateEcheance"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500"
          />
        </label>

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={() => router.push(`/${params.locale}/dossiers`)}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Creation...' : 'Creer le dossier'}
          </button>
        </div>
      </form>
    </div>
  );
}
