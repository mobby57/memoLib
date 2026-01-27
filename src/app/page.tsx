'use client';

// Force dynamic to prevent prerendering errors with React hooks
export const dynamic = 'force-dynamic';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  FileText,
  Users,
  DollarSign,
  Shield,
  Zap,
  TrendingUp,
  ChevronRight,
  CheckCircle,
  LogIn,
  UserPlus,
  Calendar,
  MessageSquare,
  CreditCard,
  Star,
  ChevronDown,
  Play,
  ArrowRight,
  Clock,
  Award,
  Globe,
  Lock,
} from 'lucide-react';

// Animation counter hook
function useCounter(end: number, duration: number = 2000) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isVisible) return;
    let startTime: number;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [end, duration, isVisible]);

  return { count, setIsVisible };
}

// Testimonials data
const testimonials = [
  {
    name: 'Maître Sophie Martin',
    role: 'Avocate en droit des affaires',
    cabinet: 'Cabinet Martin & Associés',
    content:
      'IA Poste Manager a révolutionné notre gestion quotidienne. Le gain de temps est considérable et mes clients apprécient le suivi en temps réel.',
    avatar: 'SM',
    rating: 5,
  },
  {
    name: 'Maître Jean-Pierre Dubois',
    role: 'Avocat pénaliste',
    cabinet: 'Dubois Avocats',
    content:
      "L'IA intégrée nous aide à analyser les dossiers plus rapidement. Un outil indispensable pour tout cabinet moderne.",
    avatar: 'JD',
    rating: 5,
  },
  {
    name: 'Maître Claire Bernard',
    role: 'Avocate en droit de la famille',
    cabinet: 'Cabinet Bernard',
    content:
      "La facturation automatisée et le suivi des paiements m'ont fait économiser des heures chaque semaine. Je recommande vivement !",
    avatar: 'CB',
    rating: 5,
  },
];

// FAQ data
const faqs = [
  {
    question: "Comment fonctionne l'essai gratuit ?",
    answer:
      "Vous bénéficiez de 14 jours d'essai gratuit avec accès complet à toutes les fonctionnalités. Aucune carte bancaire n'est requise pour commencer.",
  },
  {
    question: 'Mes données sont-elles sécurisées ?',
    answer:
      'Absolument. Nous utilisons un chiffrement AES-256 et nos serveurs sont hébergés en Europe, conformément au RGPD. Vos données client sont strictement confidentielles.',
  },
  {
    question: 'Puis-je migrer mes données existantes ?',
    answer:
      "Oui, nous proposons un service d'import gratuit pour vos clients, dossiers et factures depuis Excel, CSV ou d'autres logiciels de gestion.",
  },
  {
    question: 'Le logiciel est-il adapté aux petits cabinets ?',
    answer:
      "Parfaitement ! Nous proposons des plans adaptés à toutes les tailles de cabinet, de l'avocat indépendant aux grands cabinets multi-sites.",
  },
  {
    question: 'Comment fonctionne le support ?',
    answer:
      "Support par email et chat en direct inclus dans tous les plans. Les plans Premium bénéficient d'un support téléphonique prioritaire.",
  },
];

export default function HomePage() {
  const { data: session, status } = useSession();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  // Animated counters
  const cabinets = useCounter(500, 2000);
  const dossiers = useCounter(15000, 2500);
  const satisfaction = useCounter(98, 1500);
  const economies = useCounter(40, 1800);

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial(prev => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Trigger counter animation on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            cabinets.setIsVisible(true);
            dossiers.setIsVisible(true);
            satisfaction.setIsVisible(true);
            economies.setIsVisible(true);
          }
        });
      },
      { threshold: 0.3 }
    );

    const statsSection = document.getElementById('stats-section');
    if (statsSection) observer.observe(statsSection);

    return () => observer.disconnect();
  }, []);

  // Afficher la landing page sans redirection automatique
  // L'utilisateur doit cliquer sur "Dashboard" ou "Connexion" pour naviguer

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Navigation */}
      <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-xl font-bold text-blue-600 dark:text-blue-400">
              IA Poste Manager
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link
                href="/pricing"
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Tarifs
              </Link>
              <Link
                href="/demo"
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Demo
              </Link>
              <Link
                href="/contact"
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Contact
              </Link>
              {status === 'authenticated' ? (
                <Link
                  href="/dashboard"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Connexion
                  </Link>
                  <Link
                    href="/auth/register"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    S'inscrire
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium mb-6 animate-bounce">
              <Zap className="w-4 h-4" />
              Nouveau : IA générative intégrée
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 dark:text-white mb-6">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 animate-gradient">
                IA Poste Manager
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-4 max-w-3xl mx-auto">
              La plateforme intelligente de gestion pour cabinets d'avocats
            </p>
            <p className="text-lg text-gray-500 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
              Gérez vos dossiers, clients et factures avec une solution moderne et sécurisée,
              optimisée par l'intelligence artificielle
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              {status === 'authenticated' ? (
                <Link
                  href="/dashboard"
                  className="group inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl hover:scale-105"
                >
                  <LogIn className="mr-2 w-5 h-5" />
                  Accéder au Dashboard
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="group inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    <Play className="mr-2 w-5 h-5" />
                    Essai gratuit 14 jours
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    href="/demo"
                    className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800 border-2 border-blue-200 dark:border-blue-800 rounded-xl hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 transition-all"
                  >
                    <Calendar className="mr-2 w-5 h-5" />
                    Demander une démo
                  </Link>
                </>
              )}
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-500" />
                <span>RGPD Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-500" />
                <span>Chiffrement AES-256</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-indigo-500" />
                <span>Hébergé en Europe</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section with animated counters */}
      <div id="stats-section" className="py-16 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            <div className="p-6">
              <div className="text-4xl md:text-5xl font-bold mb-2">{cabinets.count}+</div>
              <div className="text-blue-200">Cabinets actifs</div>
            </div>
            <div className="p-6">
              <div className="text-4xl md:text-5xl font-bold mb-2">
                {dossiers.count.toLocaleString()}+
              </div>
              <div className="text-blue-200">Dossiers gérés</div>
            </div>
            <div className="p-6">
              <div className="text-4xl md:text-5xl font-bold mb-2">{satisfaction.count}%</div>
              <div className="text-blue-200">Satisfaction client</div>
            </div>
            <div className="p-6">
              <div className="text-4xl md:text-5xl font-bold mb-2">{economies.count}%</div>
              <div className="text-blue-200">Temps économisé</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Fonctionnalites principales
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Tout ce dont vous avez besoin pour gerer votre cabinet efficacement
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Gestion des Dossiers
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Organisez et suivez tous vos dossiers juridiques en un seul endroit avec une
                interface intuitive
              </p>
            </div>

            <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl border border-green-200 dark:border-green-800">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-4">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Facturation Automatisee
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Creez et gerez vos factures facilement avec calcul automatique de la TVA et suivi
                des paiements
              </p>
            </div>

            <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl border border-purple-200 dark:border-purple-800">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Gestion Clients
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Centralisez toutes les informations de vos clients, particuliers et entreprises
              </p>
            </div>

            <div className="p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
              <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Analytics & Reporting
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Visualisez vos performances avec des graphiques et statistiques detaillees
              </p>
            </div>

            <div className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
              <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Intelligence Artificielle
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Beneficiez de suggestions et d'automatisations intelligentes pour gagner du temps
              </p>
            </div>

            <div className="p-6 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-xl border border-red-200 dark:border-red-800">
              <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Securite & Conformite
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Vos donnees sont protegees avec un chiffrement de niveau entreprise et conformite
                RGPD
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-24 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                Pourquoi choisir IA Poste Manager ?
              </h2>
              <div className="space-y-4">
                {[
                  { text: 'Interface moderne et intuitive', icon: Award },
                  { text: 'Mode sombre pour un confort optimal', icon: Shield },
                  { text: 'Recherche et filtres avancés', icon: FileText },
                  { text: 'Notifications en temps réel', icon: Clock },
                  { text: 'Export de données (CSV, PDF)', icon: DollarSign },
                  { text: 'Support multi-tenant', icon: Users },
                  { text: 'Mises à jour régulières', icon: Zap },
                ].map((benefit, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <benefit.icon className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-lg text-gray-700 dark:text-gray-300">{benefit.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-6 h-6 text-yellow-500" />
                <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                  Offre de lancement
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Démarrez dès aujourd'hui
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Rejoignez les cabinets d'avocats qui font confiance à IA Poste Manager pour
                optimiser leur gestion quotidienne.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>14 jours d'essai gratuit</span>
                </li>
                <li className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Aucune carte bancaire requise</span>
                </li>
                <li className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Migration gratuite de vos données</span>
                </li>
              </ul>
              <Link
                href="/auth/register"
                className="block w-full text-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-medium shadow-lg hover:shadow-xl"
              >
                Commencer gratuitement
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="py-24 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Ils nous font confiance
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Découvrez ce que nos clients disent de nous
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className={`p-6 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 transition-all duration-500 ${
                  currentTestimonial === index
                    ? 'scale-105 shadow-xl border-blue-300 dark:border-blue-700'
                    : 'hover:scale-102'
                }`}
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-6 italic">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {testimonial.role}
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">
                      {testimonial.cabinet}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Testimonial indicators */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentTestimonial(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  currentTestimonial === index
                    ? 'bg-blue-600 w-8'
                    : 'bg-gray-300 dark:bg-gray-600 hover:bg-blue-400'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-24 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Questions fréquentes
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Tout ce que vous devez savoir sur IA Poste Manager
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                >
                  <span className="font-medium text-gray-900 dark:text-white">{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${
                      openFaq === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    openFaq === index ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <p className="px-6 pb-4 text-gray-600 dark:text-gray-400">{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 dark:text-gray-400 mb-4">Vous avez d'autres questions ?</p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              <MessageSquare className="w-5 h-5" />
              Contactez notre équipe
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-4">IA Poste Manager</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                La solution intelligente pour les cabinets d'avocats modernes.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Produit</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/pricing"
                    className="text-gray-600 dark:text-gray-400 hover:text-blue-600"
                  >
                    Tarifs
                  </Link>
                </li>
                <li>
                  <Link
                    href="/demo"
                    className="text-gray-600 dark:text-gray-400 hover:text-blue-600"
                  >
                    Demander une demo
                  </Link>
                </li>
                <li>
                  <Link
                    href="/auth/register"
                    className="text-gray-600 dark:text-gray-400 hover:text-blue-600"
                  >
                    S'inscrire
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Ressources</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/contact"
                    className="text-gray-600 dark:text-gray-400 hover:text-blue-600"
                  >
                    Contact
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact?type=support"
                    className="text-gray-600 dark:text-gray-400 hover:text-blue-600"
                  >
                    Support
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600">
                    CGU
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600">
                    Confidentialite
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600">
                    RGPD
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
            <p className="text-center text-gray-600 dark:text-gray-400">
              2026 IA Poste Manager. Tous droits reserves.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
