'use client';

import { useEffect } from 'react';
import { Card, Alert, Button, useToast } from '@/components/ui';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { UnsavedChangesBar } from '@/components/settings/UnsavedChangesBar';
import {
  useIntakeRequest,
  useUpdateIntakeRequest,
  useUploadIntakeDocument,
  useIntakeUploadedFiles,
  useDeleteIntakeDocument,
  intakeFileDownloadUrl,
  type IntakeRequestDetail,
} from '@/hooks/useIntakeRequest';

/**
 * IntakeForm — formulaire dynamique de collecte pour une demande client.
 *
 * Rend les champs attendus (requiredFields) + les documents requis (cases à
 * cocher "fourni"), suit la complétude, gère le dirty-state ("modifications non
 * enregistrées") et permet de signaler "besoin d'aide".
 *
 * Chaîne : ce composant → useIntakeRequest/useUpdate → /api/intake/[id]
 *          → RBAC (dossiers:read/manage) → service (déchiffre/rechiffre) → DB.
 */

type FormShape = {
  data: Record<string, unknown>;
  providedDocuments: string[];
};

export function IntakeForm({ id }: { id: string }) {
  const { addToast } = useToast();
  const { data: intake, isLoading, isError } = useIntakeRequest(id);
  const update = useUpdateIntakeRequest(id);
  const uploadDoc = useUploadIntakeDocument(id);
  const { data: uploaded } = useIntakeUploadedFiles(id);
  const deleteDoc = useDeleteIntakeDocument(id);

  const form = useUnsavedChanges<FormShape>({ data: {}, providedDocuments: [] });

  useEffect(() => {
    if (intake) {
      form.commit({
        data: { ...intake.data },
        providedDocuments: [...intake.providedDocuments],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intake]);

  if (isLoading) {
    return (
      <Card className="p-6">
        <p className="text-sm text-slate-500">Chargement de la demande…</p>
      </Card>
    );
  }

  if (isError || !intake) {
    return (
      <Alert variant="error" title="Introuvable">
        Cette demande d’intake est introuvable ou vous n’y avez pas accès.
      </Alert>
    );
  }

  const setField = (fieldId: string, value: unknown) => {
    form.set('data', { ...form.values.data, [fieldId]: value });
  };

  const save = async (needsHelp = false) => {
    try {
      const updated = await update.mutateAsync({
        data: form.values.data,
        providedDocuments: form.values.providedDocuments,
        needsHelp,
      });
      form.commit({ data: { ...updated.data }, providedDocuments: [...updated.providedDocuments] });
      addToast({
        variant: 'success',
        title: needsHelp ? 'Aide demandée' : 'Enregistré',
        message: needsHelp
          ? 'La demande a été signalée comme nécessitant de l’aide.'
          : `Complétude : ${updated.completeness}%`,
      });
    } catch (e) {
      addToast({
        variant: 'error',
        title: 'Erreur',
        message: e instanceof Error ? e.message : 'Impossible d’enregistrer.',
      });
    }
  };

  const inputCls =
    'w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white';
  const labelCls = 'mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300';

  return (
    <div className="space-y-6">
      <IntakeHeader intake={intake} />

      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Informations</h3>
        <div className="space-y-4">
          {intake.requiredFields.length === 0 && (
            <p className="text-sm text-slate-500">Aucun champ défini pour ce type de demande.</p>
          )}
          {intake.requiredFields.map((field) => {
            const value = (form.values.data[field.id] as string | undefined) ?? '';
            return (
              <div key={field.id}>
                <label className={labelCls} htmlFor={field.id}>
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                <input
                  id={field.id}
                  type={field.type === 'date' ? 'date' : 'text'}
                  className={inputCls}
                  value={value}
                  onChange={(e) => setField(field.id, e.target.value)}
                />
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
          Documents requis
        </h3>
        <ul className="space-y-3">
          {intake.requiredDocuments.map((doc) => {
            const provided = intake.providedDocuments.includes(doc);
            return (
              <li key={doc} className="flex flex-wrap items-center gap-3">
                <span className="min-w-[180px] text-sm text-slate-900 dark:text-slate-100">{doc}</span>
                {provided ? (
                  <span className="text-xs font-medium text-green-600">✓ fourni</span>
                ) : (
                  <span className="text-xs text-amber-600">manquant</span>
                )}
                <label className="ml-auto cursor-pointer text-xs text-blue-600 hover:underline">
                  {provided ? 'Remplacer' : 'Déposer un fichier'}
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.txt"
                    disabled={uploadDoc.isPending}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      e.target.value = ''; // permet de re-sélectionner le même fichier
                      if (!file) return;
                      try {
                        await uploadDoc.mutateAsync({ documentLabel: doc, file });
                        addToast({
                          variant: 'success',
                          title: 'Pièce déposée',
                          message: `${doc} : ${file.name} (chiffré)`,
                        });
                      } catch (err) {
                        addToast({
                          variant: 'error',
                          title: 'Échec du dépôt',
                          message: err instanceof Error ? err.message : 'Erreur upload',
                        });
                      }
                    }}
                  />
                </label>
              </li>
            );
          })}
        </ul>
        {uploadDoc.isPending && (
          <p className="mt-3 text-xs text-slate-500">Envoi et chiffrement en cours…</p>
        )}

        {uploaded && uploaded.files.length > 0 && (
          <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
            <h4 className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              Pièces déposées
            </h4>
            <ul className="space-y-1">
              {uploaded.files.map((f) => (
                <li key={f.id} className="flex items-center gap-2 text-sm">
                  <span className="text-slate-500">{f.documentLabel} —</span>
                  <a
                    href={intakeFileDownloadUrl(id, f.id)}
                    className="text-blue-600 hover:underline"
                    download
                  >
                    {f.fileName}
                  </a>
                  <span className="text-xs text-slate-400">
                    ({Math.round(f.size / 1024)} Ko)
                  </span>
                  <button
                    type="button"
                    className="ml-auto text-xs text-red-600 hover:underline disabled:opacity-50"
                    disabled={deleteDoc.isPending}
                    onClick={async () => {
                      try {
                        await deleteDoc.mutateAsync(f.id);
                        addToast({ variant: 'success', title: 'Pièce supprimée', message: f.fileName });
                      } catch (err) {
                        addToast({
                          variant: 'error',
                          title: 'Échec',
                          message: err instanceof Error ? err.message : 'Suppression impossible',
                        });
                      }
                    }}
                  >
                    Supprimer
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => save(true)} disabled={update.isPending}>
          Signaler « besoin d’aide »
        </Button>
      </div>

      <UnsavedChangesBar
        visible={form.isDirty}
        saving={update.isPending}
        onSave={() => save(false)}
        onCancel={form.reset}
      />
    </div>
  );
}

function IntakeHeader({ intake }: { intake: IntakeRequestDetail }) {
  return (
    <Card className="p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Demande {intake.type}
          </h2>
          <p className="text-sm text-slate-500">
            Origine : {intake.origin}
            {intake.clientEmail ? ` · ${intake.clientEmail}` : ''}
          </p>
        </div>
        <div className="min-w-[160px]">
          <div className="mb-1 flex justify-between text-xs text-slate-500">
            <span>Complétude</span>
            <span>{intake.completeness}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              className="h-full rounded-full bg-blue-600 transition-all"
              style={{ width: `${intake.completeness}%` }}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
