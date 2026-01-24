'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

export default function ClientNavigation() {
  const pathname = usePathname();

  const navItems = [
    { href: '/client', label: 'Tableau de bord', icon: '🏠' },
    { href: '/client/dossiers', label: 'Mes Dossiers', icon: '[emoji]' },
    { href: '/client/documents', label: 'Documents', icon: '[emoji]' },
    { href: '/client/messages', label: 'Messagerie', icon: '[emoji]' },
    { href: '/client/profil', label: 'Profil', icon: '[emoji]' },
  ];

  return (
    <nav className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/client" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              IA Poste Manager
            </Link>
            <div className="flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
                    pathname === item.href
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/auth/login' })}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold transition-colors"
          >
            Deconnexion
          </button>
        </div>
      </div>
    </nav>
  );
}
