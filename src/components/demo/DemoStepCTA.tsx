'use client';

import Link from 'next/link';
import { Rocket } from 'lucide-react';

export function DemoStepCTA({ nextHref, nextLabel }: { nextHref?: string; nextLabel?: string }) {
  return (
    <div className="mt-8 rounded-xl border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Rocket className="w-5 h-5 text-green-600" />
        <p className="text-sm text-gray-700">
          <span className="font-semibold">Envie de tester avec vos propres emails ?</span> Essai gratuit 30 jours, sans CB.
        </p>
      </div>
      <div className="flex gap-3">
        {nextHref && (
          <Link href={nextHref} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 px-4 py-2 border border-indigo-200 rounded-lg">
            {nextLabel || 'Étape suivante'}
          </Link>
        )}
        <Link href="/fr/auth/register?plan=PILOT" className="text-sm font-semibold bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">
          Créer mon cabinet
        </Link>
      </div>
    </div>
  );
}
