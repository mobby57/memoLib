import { Metadata } from 'next';
import SearchAnalytics from '@/components/SearchAnalytics';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Analytics Recherche | iaPostemanage',
  description: 'Statistiques et analyses des recherches',
};

export default async function SearchAnalyticsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Verifier que l'utilisateur est admin ou super admin
  if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
    redirect('/dashboard');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          [Chart] Analytics de Recherche
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Analysez les tendances et l'utilisation du systeme de recherche
        </p>
      </div>

      <SearchAnalytics />
    </div>
  );
}
