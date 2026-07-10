'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Construction, ArrowLeft } from 'lucide-react';

/**
 * Page placeholder pour les fonctionnalités en cours de développement.
 * Utilisée à la place de pages vides qui cassent l'UX.
 */
export default function ComingSoonPage() {
  const pathname = usePathname() ?? '';
  const locale = pathname.split('/')[1] || 'fr';

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Construction className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Bientôt disponible</h1>
        <p className="text-gray-500 mb-6">
          Cette fonctionnalité est en cours de développement et sera disponible prochainement.
        </p>
        <Link
          href={`/${locale}/dashboard`}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au dashboard
        </Link>
      </div>
    </div>
  );
}
