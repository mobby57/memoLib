import Link from 'next/link';
import {
  Mail, Brain, Scale, Shield, Clock, Users, Zap, ArrowRight,
  CheckCircle, BarChart3, FileText, Bell, Lock,
  Globe, ChevronRight, BrainCircuit
} from 'lucide-react';

const PAIN_POINTS = [
  { icon: Mail, title: '50+ emails/jour', description: 'Tri manuel, classement, extraction des infos clients. Des heures perdues chaque jour.' },
  { icon: Clock, title: 'DÃ©lais OQTF ratÃ©s', description: "48h pour contester, 15 jours pour un recours. Une Ã©chÃ©ance oubliÃ©e = un client expulsÃ©." },
  { icon: FileText, title: 'Dossiers Ã©parpillÃ©s', description: "Emails dans Gmail, notes sur papier, documents sur le bureau. Aucune vue d'ensemble." },
];

const FEATURES = [
  { icon: Mail, title: 'Inbox intelligent', description: "Vos emails clients triÃ©s, classÃ©s et analysÃ©s automatiquement. Extraction des coordonnÃ©es, dÃ©tection d'urgence.", color: 'blue' },
  { icon: Brain, title: 'IA spÃ©cialisÃ©e CESEDA', description: "Calcul automatique des dÃ©lais lÃ©gaux, suggestions de procÃ©dure, analyse du dossier en temps rÃ©el.", color: 'purple' },
  { icon: Scale, title: 'Workflow juridique', description: "De la rÃ©ception de l'email Ã  la clÃ´ture du dossier. Statuts, prioritÃ©s, Ã©chÃ©ances, tout est tracÃ©.", color: 'green' },
  { icon: Bell, title: 'Alertes Ã©chÃ©ances', description: "Plus jamais un dÃ©lai ratÃ©. Alertes automatiques pour OQTF, recours, audiences, rendez-vous prÃ©fecture.", color: 'red' },
  { icon: FileText, title: 'Documents & preuves', description: "GÃ©nÃ©ration automatique de documents, horodatage lÃ©gal, signatures Ã©lectroniques eIDAS.", color: 'amber' },
  { icon: BarChart3, title: 'Tableau de bord', description: "Vue d'ensemble de votre cabinet : dossiers en cours, Ã©chÃ©ances, facturation, performance.", color: 'indigo' },
];

const HOW_IT_WORKS = [
  {
    icon: <Mail className="w-8 h-8 text-blue-600" />,
    title: "1. Connectez votre boÃ®te mail",
    description: "Liez votre compte Gmail ou Outlook en 1 clic. Tous les emails de vos clients arrivent directement dans MemoLib."
  },
  {
    icon: <BrainCircuit className="w-8 h-8 text-blue-600" />,
    title: "2. L'IA trie et crÃ©e les dossiers",
    description: "Notre IA spÃ©cialisÃ©e CESEDA analyse les emails, dÃ©tecte les urgences (OQTF) et prÃ©-remplit les dossiers automatiquement."
  },
  {
    icon: <CheckCircle className="w-8 h-8 text-blue-600" />,
    title: "3. GÃ©rez et facturez",
    description: "Suivez vos dÃ©lais, gÃ©nÃ©rez vos documents et facturez vos clients depuis un seul tableau de bord."
  }
];

const PRICING = [
  { name: 'Essai', price: 'Gratuit', period: '14 jours', description: 'Testez MemoLib sans engagement', features: ['3 dossiers', 'Email â†’ Dossier 1 clic', 'DÃ©lais auto', 'RÃ©sumÃ© IA'], cta: 'Essai gratuit', href: '/fr/sign-up', highlighted: false },
  { name: 'Essentiel', price: '89â‚¬', period: '/mois', description: 'Pour les avocats indÃ©pendants', features: ['50 dossiers actifs', '1 boÃ®te email connectÃ©e', 'DÃ©lais automatiques', 'GÃ©nÃ©ration documents', 'Recherche jurisprudence', 'Support email'], cta: 'Commencer', href: '/fr/sign-up', highlighted: false },
  { name: 'Cabinet', price: '69â‚¬', period: '/utilisateur/mois', description: 'Pour les cabinets de 3 Ã  10 avocats', features: ['Tout Essentiel +', '200 dossiers actifs', '5 boÃ®tes email', 'Multi-utilisateurs', 'Workflows automatisÃ©s', 'Brouillon rÃ©ponse IA'], cta: 'Commencer', href: '/fr/sign-up', highlighted: true },
  { name: 'Premium', price: '149â‚¬', period: '/utilisateur/mois', description: 'Pour les cabinets ambitieux', features: ['Tout Cabinet +', 'Dossiers illimitÃ©s', 'Stats tribunal (taux succÃ¨s)', 'Templates communautaires', 'API & intÃ©grations', 'Support prioritaire'], cta: 'Nous contacter', href: '/fr/contact', highlighted: false },
];

export function HomePageContent() {
  const locale = 'fr';
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 dark:bg-gray-950/80 backdrop-blur-md z-50 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">{'\u2696\uFE0F'}</span>
            <span className="text-xl font-bold text-gray-900 dark:text-white">MemoLib</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-600 dark:text-gray-300">
            <a href="#fonctionnalites" className="hover:text-gray-900 dark:hover:text-white transition-colors">FonctionnalitÃ©s</a>
            <a href="#tarifs" className="hover:text-gray-900 dark:hover:text-white transition-colors">Tarifs</a>
            <Link href="/fr/demo" className="hover:text-gray-900 dark:hover:text-white transition-colors">DÃ©mo</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href={`/${locale}/sign-in`} className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors font-medium">Connexion</Link>
            <Link href={`/${locale}/sign-up`} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">Essai gratuit</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-4 py-1.5 rounded-full text-sm font-medium mb-8">
            <Zap className="w-4 h-4" />
            Le logiciel de gestion pour cabinets d&apos;avocats
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
            GÃ©rez votre cabinet.<br /><span className="text-blue-600">Concentrez-vous sur le droit.</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed">
            MemoLib automatise la gestion de votre cabinet : emails, dossiers, deadlines, documents et facturation. L&apos;IA s&apos;occupe de l&apos;administratif, vous vous occupez de vos clients.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href={`/${locale}/sign-up`} className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-xl transition-colors shadow-lg shadow-blue-600/25">
              Essai gratuit 14 jours <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href={`/${locale}/demo/auto-login`} className="inline-flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold py-4 px-8 rounded-xl transition-colors">
              Voir la dÃ©mo <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
          <div className="flex items-center justify-center gap-8 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-500" />Sans carte bancaire</span>
            <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-green-500" />RGPD natif</span>
            <span className="flex items-center gap-1.5"><Lock className="w-4 h-4 text-green-500" />Chiffrement AES-256</span>
          </div>
        </div>
      </section>

      {/* Pain Points */}
      <section className="py-20 px-6 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-4">Vous perdez du temps chaque jour</h2>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-12 max-w-2xl mx-auto">Les cabinets d'avocats font face Ã  des dÃ©fis administratifs quotidiens.</p>
          <div className="grid md:grid-cols-3 gap-8">
            {PAIN_POINTS.map((point, i) => {
              const Icon = point.icon;
              return (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{point.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{point.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 bg-white dark:bg-gray-950">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Comment Ã§a marche ?</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Passez de la boÃ®te mail au dossier complet en moins de 5 minutes.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((step, index) => (
              <div key={index} className="bg-gray-50 dark:bg-gray-900 p-8 rounded-2xl border border-gray-100 dark:border-gray-800">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-6">
                  {step.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{step.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="fonctionnalites" className="py-20 px-6 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-4">Tout ce dont votre cabinet a besoin</h2>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-12 max-w-2xl mx-auto">Une plateforme complÃ¨te, conÃ§ue par et pour les avocats.</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              const colorMap: Record<string, string> = {
                blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
                purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
                green: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
                red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
                amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
                indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
              };
              return (
                <div key={i} className="p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 transition-colors">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${colorMap[feature.color]}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 bg-blue-600">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
          {[
            { value: '75%', label: 'Temps Ã©conomisÃ©' },
            { value: '0', label: 'DÃ©lai ratÃ©' },
            { value: '98%', label: 'ConformitÃ© CESEDA' },
            { value: '<5min', label: 'CrÃ©ation dossier' },
          ].map((stat, i) => (
            <div key={i}>
              <div className="text-4xl font-bold mb-1">{stat.value}</div>
              <div className="text-white text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Pilot */}
      <section className="py-20 px-6 bg-white dark:bg-gray-950">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Rejoignez les cabinets pilotes</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            MemoLib est actuellement en phase de test avec un groupe restreint d&apos;avocats en droit des Ã©trangers. 
            BÃ©nÃ©ficiez d&apos;un accÃ¨s privilÃ©giÃ© et d&apos;un tarif prÃ©fÃ©rentiel Ã  vie.
          </p>
          <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-6 py-3 rounded-xl font-medium">
            <Users className="w-5 h-5" />
            DÃ©jÃ  15 cabinets sur liste d'attente
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="tarifs" className="py-20 px-6 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-4">Tarifs simples, sans surprise</h2>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-12">Commencez gratuitement. Ã‰voluez quand vous Ãªtes prÃªt.</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PRICING.map((plan, i) => (
              <div key={i} className={`rounded-2xl p-6 ${plan.highlighted ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/25 scale-105' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'}`}>
                <div className="text-sm font-medium mb-2 text-gray-600">{plan.name}</div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-sm text-gray-600">{plan.period}</span>
                </div>
                <p className={`text-sm mb-6 ${plan.highlighted ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>{plan.description}</p>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm">
                      <CheckCircle className={`w-4 h-4 flex-shrink-0 ${plan.highlighted ? 'text-blue-200' : 'text-green-500'}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={plan.href} className={`block text-center py-3 px-4 rounded-xl font-semibold transition-colors text-sm ${plan.highlighted ? 'bg-white text-blue-600 hover:bg-blue-50' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="py-20 px-6 bg-white dark:bg-gray-950">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Vos donnÃ©es sont sacrÃ©es</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-12 max-w-2xl mx-auto">Secret professionnel oblige. MemoLib est conÃ§u pour la confidentialitÃ© absolue.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Shield, label: 'RGPD natif' },
              { icon: Lock, label: 'Chiffrement AES-256' },
              { icon: Globe, label: 'HÃ©bergement EU' },
              { icon: Users, label: 'Isolation par cabinet' },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="flex flex-col items-center gap-3 p-6">
                  <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center">
                    <Icon className="w-7 h-7 text-green-700 dark:text-green-400" />
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white text-sm">{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gray-900 dark:bg-gray-800">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">PrÃªt Ã  transformer votre cabinet ?</h2>
          <p className="text-gray-300 mb-8">Rejoignez les avocats qui gagnent 3 heures par jour avec MemoLib.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/fr/sign-up" className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-xl transition-colors">
              DÃ©marrer l'essai gratuit <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/fr/demo/complete" className="inline-flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-4 px-8 rounded-xl transition-colors">
              Voir la dÃ©mo interactive
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="text-xl">{'\u2696\uFE0F'}</span>
            <span className="font-bold text-gray-900 dark:text-white">MemoLib</span>
            <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">Â© 2026</span>
          </div>
          <div className="flex flex-wrap gap-6 text-sm text-gray-500 dark:text-gray-400">
            <Link href="/fr/logiciel-avocat" className="hover:text-gray-900 dark:hover:text-white transition-colors">Logiciel avocat</Link>
            <Link href="/fr/oqtf-delais-recours" className="hover:text-gray-900 dark:hover:text-white transition-colors">DÃ©lais OQTF</Link>
            <Link href="/fr/pricing" className="hover:text-gray-900 dark:hover:text-white transition-colors">Tarifs</Link>
            <Link href="/fr/faq" className="hover:text-gray-900 dark:hover:text-white transition-colors">FAQ</Link>
            <Link href="/fr/legal/cgu" className="hover:text-gray-900 dark:hover:text-white transition-colors">CGU</Link>
            <Link href="/fr/legal/mentions-legales" className="hover:text-gray-900 dark:hover:text-white transition-colors">Mentions lÃ©gales</Link>
            <Link href="/fr/privacy" className="hover:text-gray-900 dark:hover:text-white transition-colors">ConfidentialitÃ©</Link>
            <Link href="/fr/contact" className="hover:text-gray-900 dark:hover:text-white transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
