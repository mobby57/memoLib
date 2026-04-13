'use client';

import Link from 'next/link';

export function LegalFooter() {
  return (
    <footer className="border-t border-gray-200 bg-white/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-gray-500">
        <p>© {new Date().getFullYear()} MemoLib — Outil de gestion juridique</p>
        <nav className="flex items-center gap-4">
          <Link href="/legal/cgu" className="hover:text-gray-700">
            CGU/CGV
          </Link>
          <Link href="/legal/privacy" className="hover:text-gray-700">
            Confidentialité
          </Link>
          <span className="text-gray-400">|</span>
          <span className="text-xs italic">
            Outil d&apos;aide — ne constitue pas un conseil juridique
          </span>
        </nav>
      </div>
    </footer>
  );
}
