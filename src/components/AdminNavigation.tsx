'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useClerk } from '@clerk/nextjs';
import {
  Bell,
  CalendarClock,
  FileText,
  FolderOpen,
  Inbox,
  LogOut,
  Settings,
  Users,
} from 'lucide-react';

export default function AdminNavigation() {
  const pathname = usePathname() ?? '';
  const locale = pathname.split('/')[1] || 'fr';
  const { signOut } = useClerk();
  const lhref = (path: string) => `/${locale}${path}`;

  const navigation = [
    { href: '/inbox', label: 'Inbox', icon: Inbox },
    { href: '/admin/dossiers', label: 'Dossiers', icon: FolderOpen },
    { href: '/admin/clients', label: 'Clients', icon: Users },
    { href: '/admin/documents', label: 'Documents', icon: FileText },
    { href: '/admin/parametres', label: 'Paramètres', icon: Settings },
  ];

  const isActive = (href: string) => {
    const target = lhref(href);
    return pathname === target || pathname.startsWith(`${target}/`);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-6 px-4 sm:px-6">
        <Link href={lhref('/dashboard')} className="flex shrink-0 items-center gap-2">
          <span className="text-lg font-bold tracking-tight text-slate-900">MemoLib</span>
          <span className="hidden rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700 sm:inline">
            Cabinet
          </span>
        </Link>

        <nav aria-label="Navigation principale" className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
          {navigation.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={lhref(href)}
                aria-current={active ? 'page' : undefined}
                className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-1 border-l border-slate-200 pl-2">
          <Link
            href={lhref('/admin/integration')}
            aria-label="Intégrations et connexion email"
            title="Intégrations et connexion email"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-900"
          >
            <CalendarClock className="h-4 w-4" />
          </Link>
          <button
            type="button"
            aria-label="Notifications"
            title="Notifications"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-900"
          >
            <Bell className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => signOut({ redirectUrl: lhref('/auth/login') })}
            className="ml-1 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden lg:inline">Déconnexion</span>
          </button>
        </div>
      </div>
    </header>
  );
}
