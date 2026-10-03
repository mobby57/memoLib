'use client';

import { useEffect } from 'react';
import { Card, Alert, useToast } from '@/components/ui';
import { useSettings, useUpdateSettings, SettingsError } from '@/hooks/useSettings';
import { usePermissions, RBAC_PERMISSIONS } from '@/hooks/usePermissions';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { UnsavedChangesBar } from '@/components/settings/UnsavedChangesBar';
import { LANGUAGES, TIMEZONES, DATE_FORMATS } from '@/lib/validation/settings.schema';
import type { TenantSettingsUpdate } from '@/lib/validation/settings.schema';

/**
 * CabinetSettingsSection — configuration cabinet (TenantSettings).
 *
 * Chaîne : ce composant → useSettings/useUpdateSettings → /api/settings/tenant
 *          → RBAC (settings:read/write) → service → DB.
 *
 * L'écriture est gardée côté UI par settings:write (bouton désactivé / champs en
 * lecture seule si absent), MAIS la vraie protection reste côté API.
 */

type FormValues = {
  cabinetName: string;
  cabinetPhone: string;
  cabinetEmail: string;
  cabinetAddress: string;
  defaultLanguage: string;
  defaultTimezone: string;
  dateFormat: string;
  emailNotifications: boolean;
  deadlineNotifications: boolean;
  ocrEnabled: boolean;
  aiEnabled: boolean;
};

const EMPTY: FormValues = {
  cabinetName: '',
  cabinetPhone: '',
  cabinetEmail: '',
  cabinetAddress: '',
  defaultLanguage: 'fr',
  defaultTimezone: 'Europe/Paris',
  dateFormat: 'DD/MM/YYYY',
  emailNotifications: true,
  deadlineNotifications: true,
  ocrEnabled: false,
  aiEnabled: true,
};

/** Transforme le diff du formulaire en patch API (chaînes vides → null). */
function toPatch(diff: Partial<FormValues>): TenantSettingsUpdate {
  const patch: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(diff)) {
    if (typeof value === 'string' && ['cabinetName', 'cabinetPhone', 'cabinetEmail', 'cabinetAddress'].includes(key)) {
      patch[key] = value.trim() === '' ? null : value.trim();
    } else {
      patch[key] = value;
    }
  }
  return patch as TenantSettingsUpdate;
}

export function CabinetSettingsSection() {
  const { addToast } = useToast();
  const { can } = usePermissions();
  const canWrite = can(RBAC_PERMISSIONS.SETTINGS_WRITE);

  const { data, isLoading, isError, error } = useSettings();
  const updateMutation = useUpdateSettings();

  const form = useUnsavedChanges<FormValues>(EMPTY);

  // Initialise le formulaire dès que la config serveur arrive.
  useEffect(() => {
    if (data) {
      form.commit({
        cabinetName: data.cabinetName ?? '',
        cabinetPhone: data.cabinetPhone ?? '',
        cabinetEmail: data.cabinetEmail ?? '',
        cabinetAddress: data.cabinetAddress ?? '',
        defaultLanguage: data.defaultLanguage,
        defaultTimezone: data.defaultTimezone,
        dateFormat: data.dateFormat,
        emailNotifications: data.emailNotifications,
        deadlineNotifications: data.deadlineNotifications,
        ocrEnabled: data.ocrEnabled,
        aiEnabled: data.aiEnabled,
      });
    }
    // form.commit est stable (useCallback) ; on ne dépend que de data.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const handleSave = async () => {
    const patch = toPatch(form.diff);
    if (Object.keys(patch).length === 0) return;
    try {
      const updated = await updateMutation.mutateAsync(patch);
      form.commit({
        cabinetName: updated.cabinetName ?? '',
        cabinetPhone: updated.cabinetPhone ?? '',
        cabinetEmail: updated.cabinetEmail ?? '',
        cabinetAddress: updated.cabinetAddress ?? '',
        defaultLanguage: updated.defaultLanguage,
        defaultTimezone: updated.defaultTimezone,
        dateFormat: updated.dateFormat,
        emailNotifications: updated.emailNotifications,
        deadlineNotifications: updated.deadlineNotifications,
        ocrEnabled: updated.ocrEnabled,
        aiEnabled: updated.aiEnabled,
      });
      addToast({ variant: 'success', title: 'Paramètres enregistrés', message: 'La configuration du cabinet a été mise à jour.' });
    } catch (e) {
      const message =
        e instanceof SettingsError && e.status === 403
          ? "Vous n'avez pas la permission de modifier ces paramètres."
          : e instanceof Error
            ? e.message
            : 'Impossible d’enregistrer.';
      addToast({ variant: 'error', title: 'Erreur', message });
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <p className="text-sm text-slate-500">Chargement de la configuration…</p>
      </Card>
    );
  }

  if (isError) {
    const forbidden = error instanceof SettingsError && error.status === 403;
    return (
      <Alert variant="error" title={forbidden ? 'Accès refusé' : 'Erreur'}>
        {forbidden
          ? "Vous n'avez pas accès à la configuration du cabinet."
          : 'Impossible de charger la configuration.'}
      </Alert>
    );
  }

  const disabled = !canWrite;
  const inputCls =
    'w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-white';
  const labelCls = 'mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300';

  return (
    <div className="space-y-6">
      {!canWrite && (
        <Alert variant="info" title="Lecture seule">
          Vous pouvez consulter la configuration du cabinet mais pas la modifier.
        </Alert>
      )}

      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Identité du cabinet</h3>
        <div className="space-y-4">
          <div>
            <label className={labelCls} htmlFor="cabinetName">Nom du cabinet</label>
            <input
              id="cabinetName"
              type="text"
              className={inputCls}
              disabled={disabled}
              value={form.values.cabinetName}
              onChange={(e) => form.set('cabinetName', e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls} htmlFor="cabinetPhone">Téléphone</label>
              <input
                id="cabinetPhone"
                type="tel"
                className={inputCls}
                disabled={disabled}
                value={form.values.cabinetPhone}
                onChange={(e) => form.set('cabinetPhone', e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="cabinetEmail">Email</label>
              <input
                id="cabinetEmail"
                type="email"
                className={inputCls}
                disabled={disabled}
                value={form.values.cabinetEmail}
                onChange={(e) => form.set('cabinetEmail', e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className={labelCls} htmlFor="cabinetAddress">Adresse</label>
            <input
              id="cabinetAddress"
              type="text"
              className={inputCls}
              disabled={disabled}
              value={form.values.cabinetAddress}
              onChange={(e) => form.set('cabinetAddress', e.target.value)}
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Préférences régionales</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className={labelCls} htmlFor="defaultLanguage">Langue par défaut</label>
            <select
              id="defaultLanguage"
              className={inputCls}
              disabled={disabled}
              value={form.values.defaultLanguage}
              onChange={(e) => form.set('defaultLanguage', e.target.value)}
            >
              {LANGUAGES.map((l) => (
                <option key={l} value={l}>{l.toUpperCase()}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="defaultTimezone">Fuseau horaire</label>
            <select
              id="defaultTimezone"
              className={inputCls}
              disabled={disabled}
              value={form.values.defaultTimezone}
              onChange={(e) => form.set('defaultTimezone', e.target.value)}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="dateFormat">Format de date</label>
            <select
              id="dateFormat"
              className={inputCls}
              disabled={disabled}
              value={form.values.dateFormat}
              onChange={(e) => form.set('dateFormat', e.target.value)}
            >
              {DATE_FORMATS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Notifications & fonctionnalités</h3>
        <div className="space-y-4">
          <ToggleRow
            label="Notifications par email"
            checked={form.values.emailNotifications}
            disabled={disabled}
            onChange={(v) => form.set('emailNotifications', v)}
          />
          <ToggleRow
            label="Alertes d’échéances"
            checked={form.values.deadlineNotifications}
            disabled={disabled}
            onChange={(v) => form.set('deadlineNotifications', v)}
          />
          <ToggleRow
            label="Activer l’IA"
            checked={form.values.aiEnabled}
            disabled={disabled}
            onChange={(v) => form.set('aiEnabled', v)}
          />
          <ToggleRow
            label="Activer l’OCR"
            checked={form.values.ocrEnabled}
            disabled={disabled}
            onChange={(v) => form.set('ocrEnabled', v)}
          />
        </div>
      </Card>

      {canWrite && (
        <UnsavedChangesBar
          visible={form.isDirty}
          saving={updateMutation.isPending}
          onSave={handleSave}
          onCancel={form.reset}
        />
      )}
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-medium text-slate-900 dark:text-white">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition-colors disabled:opacity-60 ${
          checked ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
        }`}
      >
        <span
          className={`absolute top-[2px] h-5 w-5 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-[22px]' : 'translate-x-[2px]'
          }`}
        />
      </button>
    </div>
  );
}
