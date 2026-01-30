'use client';

import Link from 'next/link';
import BrandLogo from '@/components/BrandLogo';
import Badge from '@/components/ui/Badge';
import StatsGrid from '@/components/ui/StatsGrid';
import {
  ArrowRight,
  Briefcase,
  CalendarCheck,
  FileCheck2,
  Gauge,
  Handshake,
  MessageSquareMore,
  ShieldCheck,
  Users,
} from 'lucide-react';

export default function HomePage() {
  const stats = [
    { label: 'Dossiers accompagnés', value: '18K', trend: '+34% trimestre', trendUp: true, icon: Briefcase },
    { label: 'Satisfaction clients', value: '98%', trend: '+28 NPS', trendUp: true, icon: Handshake },
    { label: 'Temps moyen de réponse', value: '4 h', trend: '-38% vs 2024', trendUp: false, icon: MessageSquareMore },
    { label: 'Conformité audits', value: '100%', icon: ShieldCheck },
  ];

  const features = [
    {
      title: 'Parcours client guidé',
      description: 'Questionnaires intelligents, dépôt de pièces et paiements sécurisés dans un espace unique.',
      icon: Users,
    },
    {
      title: 'Pilotage de la performance',
      description: 'Tableaux de bord temps réel et alertes automatisées pour les équipes juridiques.',
      icon: Gauge,
    },
    {
      title: 'Workflows conformes',
      description: 'Clauses validées, traçabilité et signature électronique intégrée à chaque dossier.',
      icon: FileCheck2,
    },
  ];

  const workflow = [
    {
      title: 'Collecte ultra-simple',
      description: 'Formulaires dynamiques adaptés au profil du justiciable avec sauvegarde automatique.',
    },
    {
      title: 'Collaboration fluide',
      description: 'Chat chiffré, rappels partagés et agenda synchronisé avec vos outils existants.',
    },
    {
      title: 'Facturation unifiée',
      description: 'Propositions, acomptes et paiements récurrents gérés sans quitter Memolib.',
    },
  ];

  const testimonials = [
    {
      quote: 'Memolib a réduit de moitié notre temps de traitement tout en renforçant la confiance client.',
      author: 'Cabinet Accord & Droit',
      role: 'Direction des opérations',
    },
    {
      quote: 'Enfin une expérience numérique qui respecte les obligations légales sans sacrifier l’expérience utilisateur.',
      author: 'Maître B. Laurent',
      role: 'Avocate en droit des affaires',
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-sky-500 text-white">
        <div className="absolute inset-y-0 right-0 w-[28rem] opacity-70 blur-3xl bg-white/20" aria-hidden />
        <div className="container py-24">
          <div className="grid items-center gap-16 lg:grid-cols-[1.05fr,0.95fr]">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <BrandLogo size={52} className="bg-white/10 p-2 rounded-xl backdrop-blur" />
                <Badge className="bg-white/10 text-white border-white/20">Suite juridique augmentée</Badge>
              </div>
              <h1 className="text-4xl md:text-5xl font-semibold leading-tight" data-testid="home-hero-title">
                Memolib — Offrez une expérience juridique rassurante, personnelle et conforme.
              </h1>
              <p className="text-lg md:text-xl text-white/80 max-w-2xl">
                Memolib orchestre vos échanges, vos paiements et vos obligations réglementaires pour faire de chaque dossier un parcours fluide et sécurisé.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href="/clients"
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-brand-700 font-semibold shadow-sm transition hover:bg-white/90"
                >
                  Démarrer un dossier <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/legal/avocat"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/40 px-5 py-3 text-white font-semibold transition hover:bg-white/10"
                >
                  Rejoindre le réseau
                </Link>
              </div>
              <ul className="grid gap-2 pt-4 text-sm text-white/75">
                {[
                  'Collecte, automatisation et signature électronique dans un seul espace',
                  'Protections de données certifiées et auditables',
                  'Accompagnement personnalisé par nos équipes onboarding',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-white" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="absolute inset-0 -translate-y-6 translate-x-6 rounded-3xl bg-white/10 blur-2xl" aria-hidden />
              <div className="relative rounded-3xl bg-white text-gray-900 shadow-2xl ring-1 ring-black/5">
                <div className="border-b border-gray-100 px-8 py-6">
                  <p className="text-sm font-medium text-brand-700">Vue cabinet</p>
                  <p className="mt-1 text-xs text-gray-500">Synthèse des indicateurs clés en temps réel</p>
                </div>
                <div className="space-y-6 px-8 py-8">
                  <StatsGrid items={stats} className="gap-5 grid-cols-1 sm:grid-cols-2" />
                  <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-brand-100 to-brand-50 px-6 py-5">
                    <div>
                      <p className="text-sm text-brand-700 font-semibold">Projet prioritaire</p>
                      <p className="text-sm text-gray-600">Procédure collective - échéance dans 2 jours</p>
                    </div>
                    <Link href="/admin/dashboard" className="inline-flex items-center gap-2 text-brand-700 font-medium">
                      Ouvrir <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container -mt-16 space-y-16 pb-24">
        <div className="rounded-3xl border border-white/60 bg-white px-10 py-12 shadow-xl">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-bold text-gray-900">La plateforme pensée pour les cabinets hybrides</h2>
            <p className="mt-3 text-gray-600">
              Combinez l’efficacité d’un outil SaaS moderne avec la rigueur attendue dans le secteur juridique. Chaque fonctionnalité est conçue pour rassurer vos clients et vos équipes.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {features.map(({ title, description, icon: Icon }) => (
              <div key={title} className="rounded-2xl border border-gray-100 bg-gray-50 p-6 shadow-sm">
                <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-white shadow-sm text-brand-600">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-gray-900">{title}</h3>
                <p className="mt-2 text-sm text-gray-600">{description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Un déroulé clair pour vos clients comme pour vos équipes</h2>
            <p className="mt-3 text-gray-600 max-w-xl">
              Du premier échange à la facturation, Memolib propose une expérience cohérente, documentée et traçable. Chaque étape est paramétrable selon votre domaine de spécialisation.
            </p>
            <div className="mt-8 space-y-6">
              {workflow.map((item, index) => (
                <div key={item.title} className="flex items-start gap-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-700 font-semibold">{index + 1}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                    <p className="mt-1 text-sm text-gray-600">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-3 text-sm text-gray-500">
              <ShieldCheck className="h-5 w-5 text-brand-600" />
              Certifié RGPD • Hébergement France • Doubles facteurs d’authentification
            </div>
          </div>
          <div className="space-y-6">
            {testimonials.map((item) => (
              <figure key={item.author} className="rounded-3xl border border-gray-100 bg-white p-8 shadow-lg">
                <blockquote className="text-lg font-medium text-gray-900">“{item.quote}”</blockquote>
                <figcaption className="mt-4 text-sm text-gray-600">
                  {item.author} — {item.role}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-600 via-brand-500 to-brand-700 px-10 py-12 text-white shadow-2xl">
          <div className="absolute inset-y-0 right-0 w-32 bg-white/10 blur-2xl" aria-hidden />
          <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Prêt à offrir une expérience juridique mémorable ?</h2>
              <p className="mt-2 text-white/80 max-w-xl">
                Réservez une démonstration personnalisée pour explorer les scénarios adaptés à votre cabinet ou collectivité.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin/dashboard"
                aria-label="Programmer une démo personnalisée"
                className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-brand-700 font-semibold shadow-sm transition hover:bg-white/90"
              >
                Programmer une démo <CalendarCheck className="h-5 w-5" />
              </Link>
              <Link
                href="/support"
                aria-label="Contacter l’équipe onboarding"
                className="inline-flex items-center gap-2 rounded-lg border border-white/40 px-5 py-3 text-white font-semibold transition hover:bg-white/10"
              >
                Parlons onboarding
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
