'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import BrandLogo from './BrandLogo';

export default function NavBar() {
  const pathname = usePathname() ?? '';
  const locale = pathname.split('/')[1] || 'fr';
  const lhref = (path: string) => `/${locale}${path}`;

  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href={lhref('/')} className="flex items-center gap-3">
          <BrandLogo size={36} className="rounded-md" />
          <span className="text-lg font-semibold tracking-tight text-slate-900">MemoLib</span>
        </Link>

        <nav aria-label="Navigation publique" className="flex items-center gap-2">
          <Link
            href={lhref('/features')}
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 sm:inline-flex"
          >
            Fonctionnalités
          </Link>
          <Link
            href={lhref('/auth/login')}
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Se connecter
          </Link>
          <Link
            href={lhref('/auth/register')}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            Essayer MemoLib
          </Link>
        </nav>
      </div>
    </header>
  );
}
