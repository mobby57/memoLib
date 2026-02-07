'use client';

export const dynamic = 'force-dynamic';

/**
 * Page Demande de Demo - Planifier une demonstration personnalisee
 */

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { 
  Calendar, ArrowLeft, CheckCircle, Play, Users, 
  Clock, Video, MessageSquare, Building, Mail
} from 'lucide-react';

interface DemoForm {
  nom: string;
  email: string;
  telephone: string;
  cabinet: string;
  tailleEquipe: string;
  dateSouhaitee: string;
  heureSouhaitee: string;
  besoinPrincipal: string;
  commentaire: string;
}

const BESOINS = [
  'Gestion des dossiers clients',
  'Automatisation des emails',
  'Facturation et comptabilite',
  'Intelligence Artificielle juridique',
  'Collaboration d\'equipe',
  'Conformite RGPD',
  'Autre',
];

const TAILLES = [
  '1 avocat (solo)',
  '2-5 avocats',
  '6-10 avocats',
  '11-20 avocats',
  'Plus de 20 avocats',
];

export default function DemoPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState<DemoForm>({
    nom: '',
    email: '',
    telephone: '',
    cabinet: '',
    tailleEquipe: '',
    dateSouhaitee: '',
    heureSouhaitee: '',
    besoinPrincipal: '',
    commentaire: '',
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (response.ok) {
        setSuccess(true);
      } else {
        const data = await response.json();
        setError(data.error || 'Erreur lors de l\'envoi');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center border border-white/20">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Demande enregistree !</h1>
          <p className="text-gray-300 mb-4">
            Merci pour votre interet ! Notre equipe vous contactera dans les 24h pour confirmer votre creneau de demonstration.
          </p>
          <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-4 mb-6 text-left">
            <p className="text-blue-200 text-sm">
              <strong>Prochaines etapes :</strong>
            </p>
            <ul className="text-blue-300 text-sm mt-2 space-y-1">
              <li>1. Confirmation par email</li>
              <li>2. Lien visio envoye</li>
              <li>3. Demo personnalisee de 30 min</li>
            </ul>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour a l'accueil
          </Link>
        </div>
      </div>
    );
  }

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
            <Link href="/auth/register" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              S'inscrire
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left side - Benefits */}
          <div className="text-white">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center">
                <Play className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Demandez une demo</h1>
                <p className="text-blue-200">Gratuite et sans engagement</p>
              </div>
            </div>

            <p className="text-xl text-gray-300 mb-8">
              Decouvrez comment memoLib peut transformer la gestion de votre cabinet 
              lors d'une demonstration personnalisee de 30 minutes.
            </p>

            <div className="space-y-6 mb-12">
              <div className="flex items-start gap-4 bg-white/5 rounded-xl p-4">
                <Video className="w-8 h-8 text-blue-400 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-1">Visioconference privee</h3>
                  <p className="text-gray-400 text-sm">Demo en direct adaptee a vos besoins specifiques</p>
                </div>
              </div>

              <div className="flex items-start gap-4 bg-white/5 rounded-xl p-4">
                <MessageSquare className="w-8 h-8 text-green-400 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-1">Questions / Reponses</h3>
                  <p className="text-gray-400 text-sm">Posez toutes vos questions a notre expert</p>
                </div>
              </div>

              <div className="flex items-start gap-4 bg-white/5 rounded-xl p-4">
                <Clock className="w-8 h-8 text-yellow-400 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-1">30 minutes maximum</h3>
                  <p className="text-gray-400 text-sm">Efficace et concentre sur l'essentiel</p>
                </div>
              </div>

              <div className="flex items-start gap-4 bg-white/5 rounded-xl p-4">
                <Users className="w-8 h-8 text-purple-400 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-1">Invitez vos collaborateurs</h3>
                  <p className="text-gray-400 text-sm">Partagez la demo avec votre equipe</p>
                </div>
              </div>
            </div>

            {/* Testimonial */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <p className="text-gray-300 italic mb-4">
                "La demo m'a convaincu en 5 minutes. L'IA a immediatement compris 
                mes besoins en droit des etrangers."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  MD
                </div>
                <div>
                  <p className="font-medium">Me. Marie Dupont</p>
                  <p className="text-sm text-gray-400">Cabinet Dupont, Paris</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Form */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-blue-400" />
              Reservez votre creneau
            </h2>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nom complet *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.nom}
                    onChange={(e) => setForm({ ...form, nom: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
                    placeholder="Me. Jean Dupont"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email professionnel *
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
                    placeholder="avocat@cabinet.fr"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Telephone
                  </label>
                  <input
                    type="tel"
                    value={form.telephone}
                    onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
                    placeholder="01 23 45 67 89"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nom du cabinet
                  </label>
                  <input
                    type="text"
                    value={form.cabinet}
                    onChange={(e) => setForm({ ...form, cabinet: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
                    placeholder="Cabinet Dupont"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Taille de l'equipe *
                </label>
                <select
                  required
                  value={form.tailleEquipe}
                  onChange={(e) => setForm({ ...form, tailleEquipe: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" className="bg-gray-800">Selectionnez...</option>
                  {TAILLES.map((t) => (
                    <option key={t} value={t} className="bg-gray-800">{t}</option>
                  ))}
                </select>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Date souhaitee *
                  </label>
                  <input
                    type="date"
                    required
                    value={form.dateSouhaitee}
                    onChange={(e) => setForm({ ...form, dateSouhaitee: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Heure preferee *
                  </label>
                  <select
                    required
                    value={form.heureSouhaitee}
                    onChange={(e) => setForm({ ...form, heureSouhaitee: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="" className="bg-gray-800">Selectionnez...</option>
                    <option value="09:00" className="bg-gray-800">09:00</option>
                    <option value="10:00" className="bg-gray-800">10:00</option>
                    <option value="11:00" className="bg-gray-800">11:00</option>
                    <option value="14:00" className="bg-gray-800">14:00</option>
                    <option value="15:00" className="bg-gray-800">15:00</option>
                    <option value="16:00" className="bg-gray-800">16:00</option>
                    <option value="17:00" className="bg-gray-800">17:00</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Besoin principal *
                </label>
                <select
                  required
                  value={form.besoinPrincipal}
                  onChange={(e) => setForm({ ...form, besoinPrincipal: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" className="bg-gray-800">Selectionnez...</option>
                  {BESOINS.map((b) => (
                    <option key={b} value={b} className="bg-gray-800">{b}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Commentaire (optionnel)
                </label>
                <textarea
                  rows={3}
                  value={form.commentaire}
                  onChange={(e) => setForm({ ...form, commentaire: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Precisions sur vos attentes..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-lg"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Calendar className="w-5 h-5" />
                    Reserver ma demo gratuite
                  </>
                )}
              </button>

              <p className="text-center text-gray-400 text-sm">
                En soumettant ce formulaire, vous acceptez d'etre contacte par notre equipe.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
