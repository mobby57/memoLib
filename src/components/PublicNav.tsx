import Link from 'next/link';

export function PublicNav() {
  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl">⚖️</span>
          <span className="text-lg font-bold text-gray-900">MemoLib</span>
        </Link>
        <div className="hidden md:flex items-center gap-6 text-sm text-gray-600">
          <Link href="/logiciel-avocat" className="hover:text-gray-900 transition-colors">Produit</Link>
          <Link href="/pricing" className="hover:text-gray-900 transition-colors">Tarifs</Link>
          <Link href="/demo" className="hover:text-gray-900 transition-colors">Démo</Link>
          <Link href="/faq" className="hover:text-gray-900 transition-colors">FAQ</Link>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/fr/auth/login" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Connexion</Link>
          <Link href="/fr/auth/register?plan=PILOT" className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">Essai gratuit</Link>
        </div>
      </div>
    </nav>
  );
}
