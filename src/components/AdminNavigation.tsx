'use client';
import { useRouter } from 'next/navigation';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminNavigation() {
  const router = useRouter();
  const handleSignout = async (e: React.MouseEvent) => {
    e.preventDefault();
    await fetch('/api/auth/signout', { method: 'POST', credentials: 'include' });
    router.push(`/${locale}`);
  };

  const pathname = usePathname() ?? '';
  const locale = pathname.split('/')[1] || 'fr';
  const lhref = (path: string) => `/${locale}${path}`;

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-1">
            <Link
              href={lhref("/admin")}
              className="px-4 py-2 rounded-lg font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all"
            >
              ?? Dashboard
            </Link>
            <Link
              href={lhref("/admin/clients")}
              className="px-4 py-2 rounded-lg font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all"
            >
               Clients
            </Link>
            <Link
              href={lhref("/admin/dossiers")}
              className="px-4 py-2 rounded-lg font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all"
            >
               Dossiers
            </Link>
            <Link
              href={lhref("/admin/documents")}
              className="px-4 py-2 rounded-lg font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all"
            >
               Documents
            </Link>
            <Link
              href={lhref("/admin/messages")}
              className="px-4 py-2 rounded-lg font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all"
            >
               Messages
            </Link>
            <Link
              href={lhref("/admin/email-monitoring")}
              className="px-4 py-2 rounded-lg font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all"
            >
               Emails
            </Link>
            <Link
              href={lhref("/admin/ai-usage")}
              className="px-4 py-2 rounded-lg font-semibold text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-all"
            >
              ?? Usage IA
            </Link>
            <Link
              href={lhref("/admin/costs")}
              className="px-4 py-2 rounded-lg font-semibold text-gray-700 hover:bg-green-50 hover:text-green-600 transition-all"
            >
              ?? Coets IA
            </Link>
            <Link
              href={lhref("/admin/parametres")}
              className="px-4 py-2 rounded-lg font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all"
            >
              ?? Parametres
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full text-sm font-semibold">
              ADMIN
            </span>
            <button type="button" onClick={handleSignout}>
              Deconnexion
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
