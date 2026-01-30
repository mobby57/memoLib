'use client';

import Link from 'next/link';
import BrandLogo from '@/components/BrandLogo';
import { CheckCircle2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-b from-brand-50 to-white py-20 hero-pattern">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1">
              <div className="mb-4 flex items-center gap-3">
                <BrandLogo size={48} className="rounded-md" />
                <span className="sr-only">Logo Memolib</span>
              </div>
              <Badge>Modernisez vos services juridiques</Badge>
              <h1 className="mt-3 text-5xl font-bold tracking-tight">Trouvez l’aide juridique, simplement</h1>
              <p className="mt-3 text-lg text-gray-600 max-w-xl">Memolib connecte les personnes et les avocats avec des parcours clairs, des paiements intégrés et une conformité transparente.</p>
              <div className="mt-6 flex gap-3">
                <Link
                  href="/clients"
                  className="inline-flex items-center justify-center font-medium rounded-lg transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 bg-brand-600 text-white hover:bg-brand-700 focus-visible:ring-brand-600 px-4 py-2"
                >
                  Accès clients
                </Link>
                <Link
                  href="/legal/avocat"
                  className="inline-flex items-center justify-center font-medium rounded-lg transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 bg-transparent text-brand-700 border border-brand-200 hover:bg-brand-50 focus-visible:ring-brand-600 px-4 py-2"
                >
                  Espace avocat
                </Link>
              </div>
              <ul className="mt-6 grid gap-2 text-gray-700">
                {['Demande guidée pas à pas', 'Dépôt sécurisé des pièces', 'Paiement et reçus intégrés'].map((f) => (
                  <li key={f} className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-brand-600" /> {f}</li>
                ))}
              </ul>
            </div>
            <div className="flex-1 card p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-brand-50 rounded-lg">
                  <p className="text-sm text-gray-600">Revenu (30j)</p>
                  <p className="text-2xl font-bold">$54,283</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Conversion</p>
                  <p className="text-2xl font-bold">3.24%</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Utilisateurs actifs</p>
                  <p className="text-2xl font-bold">1,248</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <p className="text-sm text-gray-600">Latence moyenne</p>
                  <p className="text-2xl font-bold">245ms</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Shortcuts */}
      <section className="py-12">
        <div className="container grid gap-4 sm:grid-cols-2">
          <Link href="/admin/analytics" className="card p-6 hover:shadow-md transition">
            <h2 className="text-lg font-semibold">Analytics</h2>
            <p className="text-gray-600">Graphiques et tendances.</p>
          </Link>
          <Link href="/admin/integrations" className="card p-6 hover:shadow-md transition">
            <h2 className="text-lg font-semibold">Intégrations</h2>
            <p className="text-gray-600">Connecter des services externes.</p>
          </Link>
        </div>
      </section>
    </main>
  );
}
