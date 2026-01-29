import Link from 'next/link';
import SectionHeader from '@/components/ui/SectionHeader';
import StatsGrid from '@/components/ui/StatsGrid';
import Button from '@/components/ui/Button';
import { CreditCard, Shield, Zap } from 'lucide-react';

export default function ClientsPage() {
  const stats = [
    { label: 'Paiements traités', value: '12,487', icon: CreditCard, trend: '+4.2%', trendUp: true },
    { label: 'Disponibilité', value: '99.95%', icon: Shield, trend: '+0.1%', trendUp: true },
    { label: 'Latence moyenne', value: '245ms', icon: Zap, trend: '-8%', trendUp: true },
    { label: 'Satisfaction', value: '4.8/5', trend: '+0.2%', trendUp: true },
  ];

  return (
    <main className="min-h-screen">
      <SectionHeader
        title="Accès Clients — Vous cherchez un avocat ?"
        subtitle="Décrivez votre situation, joignez vos pièces et choisissez l’avocat qui vous convient. Nous vous accompagnons pas à pas."
        actions={
          <div className="flex gap-2">
            <Link href="/billing" className="btn-primary">Démarrer une demande</Link>
            <Button variant="ghost">Parler à un conseiller</Button>
          </div>
        }
      />

      <section className="container py-10 space-y-8">
        <StatsGrid items={stats} />

        <div className="grid gap-4 md:grid-cols-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold">Comment ça marche</h3>
            <p className="text-gray-700 mt-2">1) Décrivez votre situation. 2) Joignez vos documents. 3) Choisissez un avocat. 4) Suivez l’avancement dans votre espace.</p>
            <div className="mt-4">
              <Link href="/billing" className="btn-secondary">Démarrer maintenant</Link>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold">Vos données en sécurité</h3>
            <p className="text-gray-700 mt-2">Chiffrement, contrôle d’accès et traçabilité pour protéger vos informations personnelles et pièces jointes.</p>
            <div className="mt-4">
              <Link href="/privacy" className="btn-secondary">En savoir plus</Link>
            </div>
          </div>
          <div className="md:col-span-2">
            <img src="/hero-help.svg" alt="Illustration d’aide juridique: balance de la justice et personnes" className="w-full rounded-xl border border-gray-100 shadow-sm" />
          </div>
        </div>
      </section>
    </main>
  );
}
