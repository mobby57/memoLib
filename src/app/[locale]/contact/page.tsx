'use client';

export const dynamic = 'force-dynamic';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import {
  Mail,
  Phone,
  MapPin,
  Send,
  CheckCircle,
  ArrowLeft,
  MessageSquare,
  Clock,
  Building,
} from 'lucide-react';
import { FormField, FormInput, FormSelect, FormTextarea } from '@/components/forms/FormField';
import {
  FormPageLayout,
  FormCard,
  FormError,
  FormSuccessPage,
} from '@/components/forms/FormLayout';

interface ContactForm {
  nom: string;
  email: string;
  téléphone: string;
  cabinet: string;
  sujet: string;
  message: string;
  type: 'info' | 'demo' | 'support' | 'partenariat';
}

const TYPE_OPTIONS = [
  { value: 'info', label: "Demande d'informations" },
  { value: 'demo', label: 'Demande de d\u00E9monstration' },
  { value: 'support', label: 'Support technique' },
  { value: 'partenariat', label: 'Partenariat' },
];

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState<ContactForm>({
    nom: '',
    email: '',
    téléphone: '',
    cabinet: '',
    sujet: '',
    message: '',
    type: 'info',
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (response.ok) {
        setSuccess(true);
      } else {
        const data = await response.json();
        setError(data.error || "Erreur lors de l'envoi");
      }
    } catch {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <FormSuccessPage
        title="Message envoy\u00E9 !"
        message="Merci pour votre message. Notre \u00E9quipe vous recontactera dans les plus brefs d\u00E9lais."
        redirectMessage=""
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-white hover:text-blue-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour
          </Link>
          <Link href="/fr/auth/login" className="text-blue-300 hover:text-white transition-colors">
            Se connecter
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Informations de contact */}
          <div className="text-white">
            <h1 className="text-4xl font-bold mb-4">Contactez-nous</h1>
            <p className="text-xl text-blue-200 mb-8">
              Une question ? Besoin d&apos;une d\u00E9monstration ? Notre \u00E9quipe est l\u00E0
              pour vous aider.
            </p>

            <div className="space-y-6 mb-12">
              {[
                {
                  icon: Mail,
                  title: 'Email',
                  lines: ['contact@memoLib.com', 'support@memoLib.com'],
                },
                {
                  icon: Phone,
                  title: 'T\u00E9l\u00E9phone',
                  lines: ['+33 1 23 45 67 89'],
                  sub: 'Lun-Ven 9h-18h',
                },
                {
                  icon: MapPin,
                  title: 'Adresse',
                  lines: ['123 Avenue des Champs-\u00C9lys\u00E9es', '75008 Paris, France'],
                },
                { icon: Clock, title: 'Temps de r\u00E9ponse', lines: ['Moins de 24h en semaine'] },
              ].map(({ icon: Icon, title, lines, sub }) => (
                <div key={title} className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-600/30 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-blue-300" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{title}</h3>
                    {lines.map((l, i) => (
                      <p key={i} className="text-blue-200">
                        {l}
                      </p>
                    ))}
                    {sub && <p className="text-sm text-blue-300">{sub}</p>}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="font-semibold mb-4">Acc\u00E8s rapide</h3>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/pricing"
                  className="flex items-center gap-2 text-blue-200 hover:text-white transition-colors"
                >
                  <Building className="w-4 h-4" /> Nos tarifs
                </Link>
                <Link
                  href="/demo"
                  className="flex items-center gap-2 text-blue-200 hover:text-white transition-colors"
                >
                  <MessageSquare className="w-4 h-4" /> Demander une d\u00E9mo
                </Link>
                <Link
                  href="/fr/auth/register"
                  className="flex items-center gap-2 text-blue-200 hover:text-white transition-colors"
                >
                  <CheckCircle className="w-4 h-4" /> S&apos;inscrire
                </Link>
                <Link
                  href="/fr/auth/login"
                  className="flex items-center gap-2 text-blue-200 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Se connecter
                </Link>
              </div>
            </div>
          </div>

          {/* Formulaire */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Envoyez-nous un message</h2>

            <FormError message={error} />

            <form onSubmit={handleSubmit} className="space-y-5">
              <FormField label="Type de demande">
                <FormSelect
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value as ContactForm['type'] })}
                  options={TYPE_OPTIONS}
                />
              </FormField>

              <div className="grid sm:grid-cols-2 gap-4">
                <FormField label="Nom complet" required>
                  <FormInput
                    required
                    value={form.nom}
                    onChange={e => setForm({ ...form, nom: e.target.value })}
                    placeholder="Me. Jean Dupont"
                  />
                </FormField>
                <FormField label="Cabinet">
                  <FormInput
                    value={form.cabinet}
                    onChange={e => setForm({ ...form, cabinet: e.target.value })}
                    placeholder="Cabinet Dupont & Associ\u00E9s"
                  />
                </FormField>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <FormField label="Email" required icon={Mail}>
                  <FormInput
                    type="email"
                    required
                    icon={Mail}
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="avocat@cabinet.fr"
                  />
                </FormField>
                <FormField label="T\u00E9l\u00E9phone" icon={Phone}>
                  <FormInput
                    type="tel"
                    icon={Phone}
                    value={form.téléphone}
                    onChange={e => setForm({ ...form, téléphone: e.target.value })}
                    placeholder="01 23 45 67 89"
                  />
                </FormField>
              </div>

              <FormField label="Sujet" required>
                <FormInput
                  required
                  value={form.sujet}
                  onChange={e => setForm({ ...form, sujet: e.target.value })}
                  placeholder="Ex: Question sur les fonctionnalit\u00E9s IA"
                />
              </FormField>

              <FormField label="Message" required>
                <FormTextarea
                  required
                  rows={5}
                  value={form.message}
                  onChange={e => setForm({ ...form, message: e.target.value })}
                  placeholder="D\u00E9crivez votre demande..."
                />
              </FormField>

              <button
                type="submit"
                disabled={loading}
                className="group w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 px-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Envoyer le message
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
