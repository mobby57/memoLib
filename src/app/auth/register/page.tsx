'use client';

// Force dynamic to prevent prerendering errors with React hooks
export const dynamic = 'force-dynamic';

/**
 * Page d'inscription Avocat
 * Permet aux avocats de créer un compte et un cabinet
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Scale, User, Mail, Lock, Building, Phone, 
  CheckCircle, AlertCircle, ArrowRight, Shield
} from 'lucide-react'
import { Button } from '@/components/forms/Button'

interface FormData {
  // Informations personnelles
  prenom: string
  nom: string
  email: string
  password: string
  confirmPassword: string
  telephone: string
  
  // Informations cabinet
  cabinetNom: string
  numeroBarreau: string
  adresse: string
  ville: string
  codePostal: string
  
  // Choix du plan
  plan: 'SOLO' | 'CABINET' | 'ENTERPRISE'
  
  // Acceptations
  cgu: boolean
  charteIA: boolean
}

const PLANS = [
  {
    id: 'SOLO',
    name: 'Solo',
    price: 49,
    description: 'Avocat indépendant',
    features: ['20 clients', '50 dossiers', '1 utilisateur', '5 GB stockage'],
    recommended: false,
  },
  {
    id: 'CABINET',
    name: 'Cabinet',
    price: 349,
    description: 'Petit à moyen cabinet',
    features: ['100 clients', '300 dossiers', '5 utilisateurs', '50 GB stockage', 'IA avancée'],
    recommended: true,
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    price: 599,
    description: 'Grand cabinet',
    features: ['Clients illimités', 'Dossiers illimités', 'Utilisateurs illimités', '500 GB stockage', 'API PISTE', 'Support dédié'],
    recommended: false,
  },
]

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  const [formData, setFormData] = useState<FormData>({
    prenom: '',
    nom: '',
    email: '',
    password: '',
    confirmPassword: '',
    telephone: '',
    cabinetNom: '',
    numeroBarreau: '',
    adresse: '',
    ville: '',
    codePostal: '',
    plan: 'CABINET',
    cgu: false,
    charteIA: false,
  })

  const updateField = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  const validateStep1 = () => {
    if (!formData.prenom || !formData.nom || !formData.email) {
      setError('Veuillez remplir tous les champs obligatoires')
      return false
    }
    if (!formData.email.includes('@')) {
      setError('Email invalide')
      return false
    }
    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return false
    }
    return true
  }

  const validateStep2 = () => {
    if (!formData.cabinetNom || !formData.numeroBarreau) {
      setError('Veuillez remplir les informations du cabinet')
      return false
    }
    return true
  }

  const validateStep3 = () => {
    if (!formData.cgu || !formData.charteIA) {
      setError('Veuillez accepter les conditions')
      return false
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validateStep3()) return

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          role: 'AVOCAT',
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de l\'inscription')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/auth/login?registered=true')
      }, 2000)

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => {
    if (step === 1 && !validateStep1()) return
    if (step === 2 && !validateStep2()) return
    setStep(prev => prev + 1)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md text-center">
          <CheckCircle className="mx-auto text-green-500 mb-4" size={64} />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Inscription réussie !</h2>
          <p className="text-gray-600 mb-4">
            Votre compte a été créé. Vous allez être redirigé vers la page de connexion...
          </p>
          <div className="animate-pulse text-blue-600">Redirection en cours...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Scale size={32} />
            <h1 className="text-2xl font-bold">memoLib</h1>
          </div>
          <p className="text-blue-100">Inscription Avocat - Étape {step}/3</p>
          
          {/* Progress bar */}
          <div className="mt-4 flex gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 flex-1 rounded-full ${
                  s <= step ? 'bg-white' : 'bg-blue-400/50'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          {/* Étape 1: Informations personnelles */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <User className="text-blue-600" size={24} />
                Informations personnelles
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    value={formData.prenom}
                    onChange={(e) => updateField('prenom', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Jean"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom *
                  </label>
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => updateField('nom', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Dupont"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Mail className="inline mr-2" size={16} />
                  Email professionnel *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="jean.dupont@avocat.fr"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Phone className="inline mr-2" size={16} />
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={formData.telephone}
                  onChange={(e) => updateField('telephone', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="06 12 34 56 78"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Lock className="inline mr-2" size={16} />
                    Mot de passe *
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Min. 8 caractères"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmer *
                  </label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => updateField('confirmPassword', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Confirmer le mot de passe"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Étape 2: Cabinet et Plan */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Building className="text-blue-600" size={24} />
                Votre Cabinet
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du cabinet *
                  </label>
                  <input
                    type="text"
                    value={formData.cabinetNom}
                    onChange={(e) => updateField('cabinetNom', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Cabinet Dupont & Associés"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    N° Barreau *
                  </label>
                  <input
                    type="text"
                    value={formData.numeroBarreau}
                    onChange={(e) => updateField('numeroBarreau', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="P123456"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ville
                  </label>
                  <input
                    type="text"
                    value={formData.ville}
                    onChange={(e) => updateField('ville', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Paris"
                  />
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Choisissez votre plan</h3>
                <div className="grid grid-cols-3 gap-4">
                  {PLANS.map((plan) => (
                    <div
                      key={plan.id}
                      onClick={() => updateField('plan', plan.id as 'SOLO' | 'CABINET' | 'ENTERPRISE')}
                      className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        formData.plan === plan.id
                          ? 'border-blue-600 bg-blue-50 shadow-lg'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      {plan.recommended && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                            Recommandé
                          </span>
                        </div>
                      )}
                      <h4 className="font-bold text-gray-900">{plan.name}</h4>
                      <div className="text-2xl font-bold text-blue-600 my-2">
                        {plan.price}€<span className="text-sm text-gray-500">/mois</span>
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
            </div>
          )}

          {/* Étape 3: Confirmation */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Shield className="text-blue-600" size={24} />
                Confirmation
              </h2>

              <div className="bg-gray-50 p-6 rounded-xl space-y-4">
                <h3 className="font-semibold text-gray-900">Récapitulatif</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Avocat:</span>
                    <p className="font-medium">{formData.prenom} {formData.nom}</p>
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
                      {PLANS.find(p => p.id === formData.plan)?.name} - 
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
                    onChange={(e) => updateField('cgu', e.target.checked)}
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
                    onChange={(e) => updateField('charteIA', e.target.checked)}
                    className="mt-1 h-5 w-5 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-600">
                    J&apos;ai lu et j&apos;accepte la{' '}
                    <a href="/charte-ia" className="text-blue-600 underline">
                      Charte IA
                    </a>
                    {' '}qui définit les règles d&apos;utilisation de l&apos;IA et garantit que les décisions critiques restent sous contrôle humain.
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex justify-between">
            {step > 1 ? (
              <Button
                onClick={() => setStep(prev => prev - 1)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700"
              >
                Retour
              </Button>
            ) : (
              <Link
                href="/auth/login"
                className="text-blue-600 hover:underline flex items-center"
              >
                Déjà inscrit ? Se connecter
              </Link>
            )}

            {step < 3 ? (
              <Button
                onClick={nextStep}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
              >
                Continuer
                <ArrowRight size={16} />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
              >
                {loading ? 'Inscription...' : 'Finaliser l\'inscription'}
                <CheckCircle size={16} />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
