'use client';

import { Button } from '@/components/ui';

/**
 * UnsavedChangesBar — barre d'action affichée quand un formulaire de paramètres
 * a des modifications non enregistrées. Fixée en bas de la zone de contenu.
 */

export interface UnsavedChangesBarProps {
  visible: boolean;
  saving?: boolean;
  onSave: () => void;
  onCancel: () => void;
}

export function UnsavedChangesBar({ visible, saving, onSave, onCancel }: UnsavedChangesBarProps) {
  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Modifications non enregistrées"
      className="sticky bottom-0 z-10 mt-6 flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-amber-900/50 dark:bg-amber-950/30"
    >
      <p className="text-sm text-amber-800 dark:text-amber-200">
        Vous avez des modifications non enregistrées.
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onCancel} disabled={saving}>
          Annuler
        </Button>
        <Button size="sm" onClick={onSave} disabled={saving}>
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
      </div>
    </div>
  );
}
