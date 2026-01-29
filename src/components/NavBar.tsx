"use client";

import Link from 'next/link';
import BrandLogo from './BrandLogo';

export default function NavBar() {
  return (
    <header className="border-b border-gray-100 bg-white/80 backdrop-blur">
      <div className="container flex h-14 items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <BrandLogo size={36} className="rounded-md" />
          <span className="text-lg font-semibold tracking-tight">Memolib</span>
        </Link>
        <nav className="flex items-center gap-3">
          <Link href="/clients" className="btn-secondary">Clients</Link>
          <Link href="/legal/avocat" className="btn-secondary">Avocat</Link>
          <Link href="/billing" className="btn-secondary">Paiements</Link>
          <Link href="/admin/dashboard" className="btn-primary">Admin</Link>
        </nav>
      </div>
    </header>
  );
}
