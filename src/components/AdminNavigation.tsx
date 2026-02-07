'use client';

import Link from 'next/link';

export default function AdminNavigation() {
  return (
    <nav className="sticky top-0 z-50 bg-white shadow-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-1">
            <Link
              href="/admin"
              className="px-4 py-2 rounded-lg font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all"
            >
              ?? Dashboard
            </Link>
            <Link
              href="/admin/clients"
              className="px-4 py-2 rounded-lg font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all"
            >
               Clients
            </Link>
            <Link
              href="/admin/dossiers"
              className="px-4 py-2 rounded-lg font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all"
            >
               Dossiers
            </Link>
            <Link
              href="/admin/documents"
              className="px-4 py-2 rounded-lg font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all"
            >
               Documents
            </Link>
            <Link
              href="/admin/messages"
              className="px-4 py-2 rounded-lg font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all"
            >
               Messages
            </Link>
            <Link
              href="/admin/email-monitoring"
              className="px-4 py-2 rounded-lg font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all"
            >
               Emails
            </Link>
            <Link
              href="/admin/ai-usage"
              className="px-4 py-2 rounded-lg font-semibold text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-all"
            >
              ?? Usage IA
            </Link>
            <Link
              href="/admin/costs"
              className="px-4 py-2 rounded-lg font-semibold text-gray-700 hover:bg-green-50 hover:text-green-600 transition-all"
            >
              ?? Coûts IA
            </Link>
            <Link
              href="/admin/parametres"
              className="px-4 py-2 rounded-lg font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all"
            >
              ?? Parametres
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full text-sm font-semibold">
              ADMIN
            </span>
            <Link
              href="/api/auth/signout"
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold transition-colors"
            >
              Deconnexion
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
