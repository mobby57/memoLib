'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, ArrowRight, Shield, Zap, Mail, Loader2 } from 'lucide-react';

interface SignupFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  cabinetName: string;
  plan: 'SOLO' | 'CABINET' | 'ENTERPRISE';
  billingPeriod: 'monthly' | 'yearly';
  acceptCGU: boolean;
}

const PLANS = [
  {
    id: 'SOLO' as const,
    name: 'Solo',
    price: 29,
    priceYearly: 23,
    description: 'Avocat indépendant',
    features: ['50 dossiers', 'IA intégrée', 'Email automatique', '5 Go stockage'],
    popular: true,
  },
  {
    id: 'CABINET' as const,
    name: 'Cabinet',
    price: 79,
    priceYearly: 63,
    description: 'Cabinet 2-10 avocats',
    features: ['500 dossiers', 'Multi-utilisateurs', 'Brouillon IA', '50 Go stockage', 'Comptabilité'],
    popular: false,
  },
  {
    id: 'ENTERPRISE' as const,
    name: 'Enterprise',
    price: 199,
    priceYearly: 159,
    description: 'Grand cabinet',
    features: ['Dossiers illimités', '50 utilisateurs', 'API', '200 Go stockage', 'Support prioritaire'],
    popular: false,
  },
];

export function SaasSignupForm({ defaultPlan, defaultCabinet, source }: { defaultPlan?: 'SOLO' | 'CABINET' | 'ENTERPRISE'; defaultCabinet?: string; source?: string }) {
  const router = useRouter();
  const hasPreselectedPlan = defaultPlan && ['SOLO', 'CABINET', 'ENTERPRISE'].includes(defaultPlan);
  const [step, setStep] = useState(hasPreselectedPlan ? 2 : 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<SignupFormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    cabinetName: defaultCabinet || '',
    plan: (defaultPlan as 'SOLO' | 'CABINET' | 'ENTERPRISE') || 'SOLO',
    billingPeriod: 'monthly',
    acceptCGU: false,
  });

  const updateForm = (field: keyof SignupFormData, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async () => {
    if (!form.acceptCGU) {
      setError('Veuillez accepter les conditions générales.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/saas/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Une erreur est survenue.');
        setLoading(false);
        return;
      }

      // Si Stripe Checkout URL disponible → rediriger vers paiement
      if (data.stripeCheckoutUrl) {
        window.location.href = data.stripeCheckoutUrl;
      } else {
        // Si vient d'une démo → aller vers connexion email directement
        if (source === 'demo') {
          router.push('/fr/dashboard?welcome=true&connect-email=true');
        } else {
          router.push('/fr/dashboard?welcome=true');
        }
      }
    } catch {
      setError('Erreur de connexion. Veuillez réessayer.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="flex items-center justify-center mb-8 gap-2">
        {[1, 2, 3].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              s < step ? 'bg-green-500 text-white' :
              s === step ? 'bg-blue-600 text-white' :
              'bg-gray-200 text-gray-500'
            }`}>
              {s < step ? <CheckCircle className="w-5 h-5" /> : s}
            </div>
            {s < 3 && <div className={`w-12 h-0.5 ${s < step ? 'bg-green-500' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Plan */}
      {step === 1 && (
        <div>
          <h2 className="text-2xl font-bold text-center mb-2">Choisissez votre plan</h2>
          <p className="text-gray-500 text-center mb-8">14 jours d&apos;essai gratuit, sans engagement</p>
          
          {/* Toggle billing period */}
          <div className="flex justify-center mb-6">
            <div className="bg-gray-100 rounded-lg p-1 flex">
              <button
                onClick={() => updateForm('billingPeriod', 'monthly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                  form.billingPeriod === 'monthly' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
                }`}
              >
                Mensuel
              </button>
              <button
                onClick={() => updateForm('billingPeriod', 'yearly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                  form.billingPeriod === 'yearly' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
                }`}
              >
                Annuel <span className="text-green-600 ml-1">-20%</span>
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {PLANS.map(plan => (
              <button
                key={plan.id}
                onClick={() => { updateForm('plan', plan.id); setStep(2); }}
                className={`relative p-6 rounded-xl border-2 text-left transition hover:shadow-lg ${
                  form.plan === plan.id 
                    ? 'border-blue-600 bg-blue-50' 
                    : 'border-gray-200 hover:border-blue-300'
                } ${plan.popular ? 'ring-2 ring-blue-600 ring-offset-2' : ''}`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs px-3 py-1 rounded-full">
                    Recommandé
                  </span>
                )}
                <h3 className="font-bold text-lg">{plan.name}</h3>
                <p className="text-gray-500 text-sm mb-3">{plan.description}</p>
                <p className="text-3xl font-bold">
                  {form.billingPeriod === 'yearly' ? plan.priceYearly : plan.price}€
                  <span className="text-base font-normal text-gray-500">/mois</span>
                </p>
                <ul className="mt-4 space-y-2">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Info personnelles */}
      {step === 2 && (
        <div>
          <h2 className="text-2xl font-bold text-center mb-2">Créez votre compte</h2>
          <p className="text-gray-500 text-center mb-8">Prêt en 2 minutes, aucune installation</p>
          
          <div className="space-y-4 max-w-md mx-auto">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={e => updateForm('firstName', e.target.value)}
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Jean"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={e => updateForm('lastName', e.target.value)}
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Dupont"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email professionnel</label>
              <input
                type="email"
                value={form.email}
                onChange={e => updateForm('email', e.target.value)}
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="jean.dupont@avocat.fr"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom du cabinet</label>
              <input
                type="text"
                value={form.cabinetName}
                onChange={e => updateForm('cabinetName', e.target.value)}
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Cabinet Dupont"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
              <input
                type="password"
                value={form.password}
                onChange={e => updateForm('password', e.target.value)}
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Minimum 8 caractères"
              />
            </div>

            <button
              onClick={() => {
                if (!form.firstName || !form.lastName || !form.email || !form.password || !form.cabinetName) {
                  setError('Veuillez remplir tous les champs.');
                  return;
                }
                if (form.password.length < 8) {
                  setError('Le mot de passe doit contenir au moins 8 caractères.');
                  return;
                }
                setStep(3);
              }}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"
            >
              Continuer <ArrowRight className="w-4 h-4" />
            </button>
            
            <button onClick={() => setStep(1)} className="w-full text-gray-500 text-sm hover:text-gray-700">
              ← Retour aux plans
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Confirmation */}
      {step === 3 && (
        <div>
          <h2 className="text-2xl font-bold text-center mb-2">Confirmez votre inscription</h2>
          <p className="text-gray-500 text-center mb-8">Dernière étape avant d&apos;accéder à votre cabinet</p>
          
          <div className="max-w-md mx-auto space-y-6">
            {/* Résumé */}
            <div className="bg-gray-50 rounded-xl p-6 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Plan</span>
                <span className="font-medium">{PLANS.find(p => p.id === form.plan)?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Cabinet</span>
                <span className="font-medium">{form.cabinetName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email</span>
                <span className="font-medium">{form.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Facturation</span>
                <span className="font-medium">{form.billingPeriod === 'yearly' ? 'Annuelle' : 'Mensuelle'}</span>
              </div>
              <hr />
              <div className="flex justify-between font-bold">
                <span>Aujourd&apos;hui</span>
                <span className="text-green-600">0€ (14 jours gratuits)</span>
              </div>
            </div>

            {/* Garanties */}
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Shield className="w-5 h-5 text-green-500" />
                <span>Données hébergées en France (RGPD)</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Zap className="w-5 h-5 text-blue-500" />
                <span>IA intégrée, aucune installation</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Mail className="w-5 h-5 text-purple-500" />
                <span>Connexion email en 1 clic</span>
              </div>
            </div>

            {/* CGU */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.acceptCGU}
                onChange={e => updateForm('acceptCGU', e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">
                J&apos;accepte les{' '}
                <a href="/fr/legal/avocat" className="text-blue-600 underline">conditions générales</a>
                {' '}et la{' '}
                <a href="/fr/privacy" className="text-blue-600 underline">politique de confidentialité</a>.
              </span>
            </label>

            {error && (
              <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3.5 rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Création en cours...
                </>
              ) : (
                <>
                  Démarrer mon essai gratuit <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
            
            <button onClick={() => setStep(2)} className="w-full text-gray-500 text-sm hover:text-gray-700">
              ← Modifier mes informations
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
