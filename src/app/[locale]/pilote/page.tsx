'use client';

export const dynamic = 'force-dynamic';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  Check,
  CheckCircle,
  Clock,
  FileText,
  Gift,
  Mail,
  MessageSquare,
  Rocket,
  Shield,
  Star,
  Users,
  Zap,
} from 'lucide-react';

const BENEFITS = [
  {
    icon: Mail,
    title: 'Emails tries automatiquement',
    description: 'Connectez votre Gmail. MemoLib detecte et classe les emails clients en temps reel.',
  },
  {
    icon: Brain,
    title: 'IA qui extrait les infos',
    description: 'Nom, telephone, adresse : tout est extrait automatiquement de chaque email.',
  },
  {
    icon: FileText,
    title: 'Dossier en 1 clic',
    description: 'Creez un dossier client pre-rempli directement depuis un email recu.',
  },
  {
    icon: Shield,
    title: '100% conforme RGPD',
    description: 'Donnees chiffrees, hebergement local possible, tracabilite complete.',
  },
];

const STEPS = [
  { step: '1', title: 'Inscrivez-vous', description: '2 minutes, sans carte bancaire', icon: Rocket },
  { step: '2', title: 'Connectez votre email', description: 'Gmail, Outlook ou autre via IMAP', icon: Mail },
  { step: '3', title: 'Laissez l\'IA travailler', description: 'Vos emails sont tries et analyses', icon: Brain },
  { step: '4', title: 'Gerez vos dossiers', description: 'Creez, suivez, facturez', icon: FileText },
];

const TESTIMONIALS = [
  {
    name: 'Me. Sophie L.',
    role: 'Avocate en droit de la famille',
    location: 'Barreau de Paris',
    quote: 'Je passais 1h par jour a trier mes emails. Avec MemoLib, c\'est fait en 5 minutes. Le gain de temps est enorme.',
    rating: 5,
  },
  {
    name: 'Me. Thomas R.',
    role: 'Avocat independant',
    location: 'Barreau de Lyon',
    quote: 'L\'extraction automatique des coordonnees clients m\'a convaincu des le premier jour. Plus d\'erreurs de saisie.',
    rating: 5,
  },
  {
    name: 'Me. Claire D.',
    role: 'Associee, cabinet 4 avocats',
    location: 'Barreau de Bordeaux',
    quote: 'On a teste le pilote a 4. En 2 semaines, on a decide de passer au plan Cabinet. Indispensable.',
    rating: 5,
  },
];

const PILOT_INCLUDES = [
  '5 dossiers clients',
  '5 clients actifs',
  '1 GB de stockage',
  'Analyse IA basique',
  'Monitoring email automatique',
  'Support par email',
  'Aucune carte bancaire',
  'Donnees exportables a tout moment',
];

const FAQ = [
  {
    q: 'Dois-je entrer ma carte bancaire ?',
    a: 'Non. Le pilote est 100% gratuit pendant 30 jours. Aucun prelevement, aucun engagement.',
  },
  {
    q: 'Que se passe-t-il apres 30 jours ?',
    a: 'Vous choisissez un plan payant (a partir de 49€/mois) ou vos donnees sont conservees 30 jours supplementaires pour vous laisser le temps de decider.',
  },
  {
    q: 'Mes donnees sont-elles en securite ?',
    a: 'Oui. Chiffrement bout en bout, isolation par cabinet, conformite RGPD. Vous pouvez aussi deployer MemoLib en local sur votre propre serveur.',
  },
  {
    q: 'Combien de temps pour configurer ?',
    a: 'Moins de 5 minutes. Inscription, connexion email, et c\'est parti. Aucune installation requise.',
  },
  {
    q: 'Puis-je inviter mes collaborateurs ?',
    a: 'Le pilote est limite a 1 utilisateur. Pour tester en equipe, contactez-nous pour un pilote etendu.',
  },
];

export default function PilotePage() {
  const [email, setEmail] = useState('');
  const [nom, setNom] = useState('');
  const [cabinet, setCabinet] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom,
          email,
          cabinet,
          type: 'demo',
          sujet: 'Programme Pilote Gratuit',
          message: `Demande d'acces au programme pilote gratuit 30 jours.\nCabinet: ${cabinet || 'Non renseigne'}`,
        }),
      });
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-white hover:text-blue-300 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            Retour
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/pricing" className="text-blue-300 hover:text-white transition-colors">
              Tarifs
            </Link>
            <Link href="/auth/login" className="text-blue-300 hover:text-white transition-colors">
              Connexion
            </Link>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Gift className="w-4 h-4" />
              Programme Pilote — 30 jours gratuits
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Testez l'IA qui transforme
              <br />
              <span className="text-green-400">la gestion de votre cabinet</span>
            </h1>

            <p className="text-xl text-blue-200 mb-8">
              Arretez de perdre 1h par jour a trier vos emails. MemoLib le fait pour vous,
              extrait les infos clients et cree vos dossiers automatiquement.
            </p>

            <div className="flex flex-wrap gap-4 mb-8">
              {['Sans carte bancaire', 'Pret en 5 min', 'Donnees exportables'].map((tag) => (
                <div key={tag} className="flex items-center gap-2 text-green-300 text-sm">
                  <Check className="w-4 h-4" />
                  {tag}
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="#inscription"
                className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-8 rounded-xl transition-colors shadow-lg"
              >
                <Zap className="w-5 h-5" />
                Demarrer le pilote gratuit
              </a>
              <Link
                href="/demo"
                className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold py-4 px-8 rounded-xl transition-colors"
              >
                Voir la demo d'abord
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* Pilot includes card */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <Gift className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Le pilote inclut</h3>
                <p className="text-sm text-gray-400">Gratuit, 30 jours, sans engagement</p>
              </div>
            </div>
            <ul className="space-y-3">
              {PILOT_INCLUDES.map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span className="text-gray-200">{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 pt-6 border-t border-white/10 text-center">
              <span className="text-4xl font-bold text-white">0€</span>
              <span className="text-gray-400 ml-2">pendant 30 jours</span>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="bg-white/5 border-t border-b border-white/10 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-4">
            Pourquoi les avocats choisissent MemoLib
          </h2>
          <p className="text-blue-200 text-center mb-12 max-w-2xl mx-auto">
            Concu par et pour les professionnels du droit. Chaque fonctionnalite repond a un probleme reel du quotidien.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {BENEFITS.map((b) => {
              const Icon = b.icon;
              return (
                <div key={b.title} className="text-center">
                  <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-7 h-7 text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-white mb-2">{b.title}</h3>
                  <p className="text-gray-400 text-sm">{b.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Comment ca marche
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={s.step} className="relative text-center">
                  {i < STEPS.length - 1 && (
                    <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-blue-500/30" />
                  )}
                  <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 relative z-10">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-xs text-blue-400 font-medium mb-1">Etape {s.step}</div>
                  <h3 className="font-semibold text-white mb-1">{s.title}</h3>
                  <p className="text-gray-400 text-sm">{s.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="bg-white/5 border-t border-white/10 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-4">
            Ils ont teste le pilote
          </h2>
          <p className="text-blue-200 text-center mb-12">
            Retours de cabinets ayant participe au programme pilote
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-200 mb-6 italic">"{t.quote}"</p>
                <div>
                  <div className="font-semibold text-white">{t.name}</div>
                  <div className="text-sm text-gray-400">{t.role}</div>
                  <div className="text-xs text-blue-400">{t.location}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Inscription form */}
      <div id="inscription" className="py-16 scroll-mt-8">
        <div className="max-w-xl mx-auto px-4">
          {submitted ? (
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center border border-white/20">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">Bienvenue dans le pilote !</h2>
              <p className="text-gray-300 mb-6">
                Vous allez recevoir un email avec vos identifiants d'acces dans les prochaines minutes.
              </p>
              <Link
                href="/auth/register?plan=PILOT"
                className="inline-flex items-center gap-2 px-8 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-semibold"
              >
                <Rocket className="w-5 h-5" />
                Creer mon compte maintenant
              </Link>
            </div>
          ) : (
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-2 text-center">
                Rejoignez le programme pilote
              </h2>
              <p className="text-gray-400 text-center mb-8">
                30 jours gratuits — aucune carte bancaire requise
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Nom complet *</label>
                  <input
                    type="text"
                    required
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Me. Jean Dupont"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Email professionnel *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="avocat@cabinet.fr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Nom du cabinet</label>
                  <input
                    type="text"
                    value={cabinet}
                    onChange={(e) => setCabinet(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Cabinet Dupont & Associes"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-xl font-semibold transition-colors"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      Demarrer mon essai gratuit
                    </>
                  )}
                </button>
                <p className="text-xs text-gray-500 text-center">
                  En vous inscrivant, vous acceptez nos conditions d'utilisation et notre politique de confidentialite.
                </p>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-white/5 border-t border-white/10 py-16">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Questions frequentes</h2>
          <div className="space-y-4">
            {FAQ.map((faq) => (
              <div key={faq.q} className="bg-white/5 rounded-xl p-6 border border-white/10">
                <h3 className="font-semibold text-white mb-2">{faq.q}</h3>
                <p className="text-gray-400">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-green-600 py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            30 jours pour transformer votre cabinet
          </h2>
          <p className="text-green-100 mb-8">
            Rejoignez les cabinets qui gagnent 1h par jour grace a MemoLib
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#inscription"
              className="px-8 py-4 bg-white text-green-700 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
            >
              Demarrer le pilote gratuit
            </a>
            <Link
              href="/demo"
              className="px-8 py-4 bg-green-700 text-white rounded-xl font-semibold hover:bg-green-800 transition-colors"
            >
              Voir la demo d'abord
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
