'use client';

import { useAuth } from '@clerk/nextjs';
import { Info, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function DemoBanner() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  // Mode démo : uniquement pour les vrais comptes de démo
  // TODO: remplacer par la vraie vérification une fois l'auth branchée
  const isDemo = false;

  if (!isDemo) return null;

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2.5 flex items-center justify-center gap-3 text-sm">
      <Info className="w-4 h-4 flex-shrink-0" />
      <span>Mode démo — Données fictives pour découvrir MemoLib</span>
      <Link
        href="/auth/register?plan=PILOT"
        className="inline-flex items-center gap-1 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg font-medium transition-colors"
      >
        Créer mon cabinet
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}