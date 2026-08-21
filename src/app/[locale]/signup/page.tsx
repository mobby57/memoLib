import { Metadata } from 'next';
import { SaasSignupForm } from '@/components/saas/SaasSignupForm';

export const metadata: Metadata = {
  title: 'Inscription — MemoLib | Gestion de cabinet d\'avocat par IA',
  description: 'Créez votre espace cabinet en 2 minutes. IA juridique intégrée, gestion des dossiers, emails automatiques. 14 jours d\'essai gratuit.',
};

interface Props {
  searchParams: Promise<{ plan?: string; cabinet?: string; source?: string }>;
}

export default async function SignupPage({ searchParams }: Props) {
  const params = await searchParams;
  const preselectedPlan = params.plan || 'SOLO';
  const cabinetName = params.cabinet || '';
  const source = params.source || '';

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-blue-50 py-12 px-4">
      {/* Header */}
      <div className="text-center mb-12">
        <a href="/" className="inline-flex items-center gap-2 mb-8">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">M</span>
          </div>
          <span className="text-xl font-bold text-gray-900">MemoLib</span>
        </a>
      </div>

      {/* Signup Form */}
      <SaasSignupForm defaultPlan={preselectedPlan as 'SOLO' | 'CABINET' | 'ENTERPRISE'} defaultCabinet={cabinetName} source={source} />

      {/* Footer trust */}
      <div className="text-center mt-12 text-sm text-gray-500">
        <p>Déjà un compte ?{' '}
          <a href="/fr/auth/login" className="text-blue-600 font-medium hover:underline">Se connecter</a>
        </p>
        <p className="mt-4">
          🔒 Chiffrement AES-256 • 🇫🇷 Hébergement France • 📋 Conforme RGPD
        </p>
      </div>
    </main>
  );
}
