'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Scale,
  User,
  Mail,
  Lock,
  Building,
  Phone,
  CheckCircle,
  ArrowRight,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/forms/Button';
import { FormField, FormInput } from '@/components/forms/FormField';
import {
  FormPageLayout,
  FormCard,
  FormHeader,
  FormError,
  FormSuccessPage,
  StepProgress,
  FormSection,
} from '@/components/forms/FormLayout';

interface FormData {
  prenom: string;
  nom: string;
  email: string;
  password: string;
  confirmPassword: string;
  téléphone: string;
  cabinetNom: string;
  numeroBarreau: string;
  adresse: string;
  ville: string;
  codePostal: string;
  plan: 'SOLO' | 'CABINET' | 'ENTERPRISE';
  cgu: boolean;
  charteIA: boolean;
}

const PLANS = [
  {
    id: 'SOLO',
    name: 'Essentiel',
    price: 89,
    description: 'Avocat independant',
    features: ['50 dossiers', '1 boite email', 'Delais CESEDA auto', 'Resume IA'],
    recommended: false,
  },
  {
    id: 'CABINET',
    name: 'Cabinet',
    price: 69,
    description: '3-10 avocats (par utilisateur)',
    features: ['200 dossiers', '5 boites email', 'Workflows', 'Jurisprudence'],
    recommended: true,
  },
  {
    id: 'ENTERPRISE',
    name: 'Premium',
    price: 149,
    description: '5-20 avocats (par utilisateur)',
    features: [
      'Dossiers illimites',
      'Stats tribunal',
      'Templates communautaires',
      'API + integrations',
      'Support ddi',
    ],
    recommended: false,
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const params = useParams<{ locale?: string }>();
  const locale = params?.locale || 'fr';
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    prenom: '',
    nom: '',
    email: '',
    password: '',
    confirmPassword: '',
    téléphone: '',
    cabinetNom: '',
    numeroBarreau: '',
    adresse: '',
    ville: '',
    codePostal: '',
    plan: 'CABINET',
    cgu: false,
    charteIA: false,
  });

  const updateField = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const validateStep1 = () => {
    if (!formData.prenom || !formData.nom || !formData.email) {
      setError('Veuillez remplir tous les champs obligatoires');
      return false;
    }
    if (!formData.email.includes('@')) {
      setError('Email invalide');
      return false;
    }
    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractres');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.cabinetNom || !formData.numeroBarreau) {
      setError('Veuillez remplir les informations du cabinet');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!formData.cgu || !formData.charteIA) {
      setError('Veuillez accepter les conditions');
      return false;
    }
    return true;
  };

  const readResponseDataSafe = (raw: string) => {
    if (!raw || !raw.trim()) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!validateStep3()) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/${locale}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, role: 'AVOCAT' }),
      });

      const raw = await res.text();
      const data = readResponseDataSafe(raw);

      if (!res.ok) {
        throw new Error(data?.error || "Erreur lors de l'inscription");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/${locale}/auth/login?registered=true`);
      }, 2000);
    } catch (err: unknown) {
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Service d’inscription indisponible. Réessayez dans quelques instants.');
      } else if (err instanceof Error) {
        if (
          err.message.includes('Unexpected end of JSON input') ||
          err.message.includes('Unexpected token')
        ) {
          setError('Réponse serveur invalide. Réessayez dans quelques instants.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Erreur lors de l’inscription');
      }
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep(prev => prev + 1);
  };

  if (success) {
    return (
      <FormSuccessPage
        title="Inscription réussie !"
        message="Votre compte a été créé. Vous allez être redirigé vers la page de connexion..."
        redirectMessage="Redirection en cours..."
      />
    );
  }

  return (
    <FormPageLayout>
      <FormCard>
        <FormHeader
          icon={<Scale size={32} />}
          title="MemoLib"
          subtitle={`Inscription Avocat - Étape ${step}/3`}
        >
          <StepProgress currentStep={step} totalSteps={3} />
        </FormHeader>

        <div className="p-8">
          <FormError message={error} />

          {step === 1 && (
            <FormSection
              icon={<User className="text-blue-600" size={24} />}
              title="Informations personnelles"
            >
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Prénom" required>
                  <FormInput
                    value={formData.prenom}
                    onChange={e => updateField('prenom', e.target.value)}
                    placeholder="Jean"
                  />
                </FormField>
                <FormField label="Nom" required>
                  <FormInput
                    value={formData.nom}
                    onChange={e => updateField('nom', e.target.value)}
                    placeholder="Dupont"
                  />
                </FormField>
              </div>

              <FormField label="Email professionnel" required icon={Mail}>
                <FormInput
                  type="email"
                  icon={Mail}
                  value={formData.email}
                  onChange={e => updateField('email', e.target.value)}
                  placeholder="jean.dupont@avocat.fr"
                />
              </FormField>

              <FormField label="Téléphone" icon={Phone}>
                <FormInput
                  type="tel"
                  icon={Phone}
                  value={formData.téléphone}
                  onChange={e => updateField('téléphone', e.target.value)}
                  placeholder="06 12 34 56 78"
                />
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Mot de passe" required icon={Lock}>
                  <FormInput
                    type="password"
                    icon={Lock}
                    value={formData.password}
                    onChange={e => updateField('password', e.target.value)}
                    placeholder="Min. 8 caractères"
                  />
                </FormField>
                <FormField label="Confirmer" required>
                  <FormInput
                    type="password"
                    value={formData.confirmPassword}
                    onChange={e => updateField('confirmPassword', e.target.value)}
                    placeholder="Confirmer le mot de passe"
                  />
                </FormField>
              </div>
            </FormSection>
          )}

          {step === 2 && (
            <FormSection
              icon={<Building className="text-blue-600" size={24} />}
              title="Votre Cabinet"
            >
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Nom du cabinet" required className="col-span-2">
                  <FormInput
                    value={formData.cabinetNom}
                    onChange={e => updateField('cabinetNom', e.target.value)}
                    placeholder="Cabinet Dupont & Associés"
                  />
                </FormField>
                <FormField label="N° Barreau" required>
                  <FormInput
                    value={formData.numeroBarreau}
                    onChange={e => updateField('numeroBarreau', e.target.value)}
                    placeholder="P123456"
                  />
                </FormField>
                <FormField label="Ville">
                  <FormInput
                    value={formData.ville}
                    onChange={e => updateField('ville', e.target.value)}
                    placeholder="Paris"
                  />
                </FormField>
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Choisissez votre plan</h3>
                <div className="grid grid-cols-3 gap-4">
                  {PLANS.map(plan => (
                    <div
                      key={plan.id}
                      onClick={() =>
                        updateField('plan', plan.id as 'SOLO' | 'CABINET' | 'ENTERPRISE')
                      }
                      className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        formData.plan === plan.id
                          ? 'border-blue-600 bg-blue-50 shadow-lg'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      {plan.recommended && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                            Recommandé
                          </span>
                        </div>
                      )}
                      <h4 className="font-bold text-gray-900">{plan.name}</h4>
                      <div className="text-2xl font-bold text-blue-600 my-2">
                        {plan.price}
                        <span className="text-sm text-gray-500">€/mois</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{plan.description}</p>
                      <ul className="text-xs text-gray-500 space-y-1">
                        {plan.features.map((f, i) => (
                          <li key={i} className="flex items-center gap-1">
                            <CheckCircle size={12} className="text-green-500" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </FormSection>
          )}

          {step === 3 && (
            <FormSection icon={<Shield className="text-blue-600" size={24} />} title="Confirmation">
              <div className="bg-gray-50 p-6 rounded-xl space-y-4">
                <h3 className="font-semibold text-gray-900">Récapitulatif</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Avocat:</span>
                    <p className="font-medium">
                      {formData.prenom} {formData.nom}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Email:</span>
                    <p className="font-medium">{formData.email}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Cabinet:</span>
                    <p className="font-medium">{formData.cabinetNom}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Plan choisi:</span>
                    <p className="font-medium text-blue-600">
                      {PLANS.find(p => p.id === formData.plan)?.name} -{' '}
                      {PLANS.find(p => p.id === formData.plan)?.price}€/mois
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.cgu}
                    onChange={e => updateField('cgu', e.target.checked)}
                    className="mt-1 h-5 w-5 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-600">
                    J&apos;accepte les{' '}
                    <a href="/cgu" className="text-blue-600 underline">
                      Conditions Générales d&apos;Utilisation
                    </a>{' '}
                    et la{' '}
                    <a href="/privacy" className="text-blue-600 underline">
                      Politique de Confidentialité
                    </a>
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.charteIA}
                    onChange={e => updateField('charteIA', e.target.checked)}
                    className="mt-1 h-5 w-5 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-600">
                    J&apos;ai lu et j&apos;accepte la{' '}
                    <a href="/charte-ia" className="text-blue-600 underline">
                      Charte IA
                    </a>{' '}
                    qui définit les règles d&apos;utilisation de l&apos;IA et garantit que
                    les décisions critiques restent sous contrôle humain.
                  </span>
                </label>
              </div>
            </FormSection>
          )}

          <div className="mt-8 flex justify-between">
            {step > 1 ? (
              <Button onClick={() => setStep(prev => prev - 1)} variant="outline">
                Retour
              </Button>
            ) : (
              <Link href="/auth/login" className="text-blue-600 hover:underline flex items-center">
                Déjà inscrit ? Se connecter
              </Link>
            )}

            {step < 3 ? (
              <button
                onClick={nextStep}
                className="group bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-xl hover:from-blue-700 hover:to-indigo-700 font-semibold transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                Continuer
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="group bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-6 rounded-xl hover:from-green-700 hover:to-emerald-700 font-semibold transition-all shadow-lg hover:shadow-xl flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Inscription...' : "Finaliser l'inscription"}
                <CheckCircle size={16} />
              </button>
            )}
          </div>
        </div>
      </FormCard>
    </FormPageLayout>
  );
}
