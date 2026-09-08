'use client';

import Link from 'next/link';
import { Card } from '@/components/ui';
import { AlertTriangle } from 'lucide-react';
import { useIntakeNeedsHelp, type IntakeSummary } from '@/hooks/useIntakeNeedsHelp';
import { IntakeExportButton } from '@/components/intake/IntakeExportButton';

/**
 * IntakeNeedsHelpWidget — fait "remonter" les demandes clients qui ont besoin
 * d'une intervention (PENDING / IN_PROGRESS / NEEDS_HELP). Affiche uniquement
 * des métadonnées non sensibles (type, statut, complétude).
 */

const STATUS_LABEL: Record<IntakeSummary['status'], string> = {
  PENDING: 'À traiter',
  IN_PROGRESS: 'En cours',
  NEEDS_HELP: 'Aide requise',
  COMPLETE: 'Complet',
};

const STATUS_STYLE: Record<IntakeSummary['status'], string> = {
  PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  IN_PROGRESS: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
  NEEDS_HELP: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
  COMPLETE: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200',
};

export function IntakeNeedsHelpWidget() {
  const { data, isLoading, isError } = useIntakeNeedsHelp();

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-amber-500" />
        <h3 className="font-semibold text-slate-900 dark:text-white">Demandes clients à traiter</h3>
        {data && data.count > 0 && (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/40 dark:text-red-200">
            {data.count}
          </span>
        )}
        <span className="ml-auto">
          <IntakeExportButton />
        </span>
      </div>

      {isLoading && <p className="text-sm text-slate-500">Chargement…</p>}
      {isError && <p className="text-sm text-red-600">Impossible de charger les demandes.</p>}

      {data && data.items.length === 0 && (
        <p className="text-sm text-slate-500">Aucune demande en attente. 🎉</p>
      )}

      {data && data.items.length > 0 && (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {data.items.map((item) => (
            <li key={item.id}>
              <Link
                href={`/intake/${item.id}`}
                className="flex items-center gap-3 py-2 hover:opacity-80"
              >
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[item.status]}`}
                >
                  {STATUS_LABEL[item.status]}
                </span>
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {item.type}
                </span>
                <span className="ml-auto text-xs text-slate-500">{item.completeness}%</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
