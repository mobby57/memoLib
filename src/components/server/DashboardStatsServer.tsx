// Server Component pour les statistiques du dashboard
// https://nextjs.org/docs/app/getting-started/server-and-client-components
// Ce composant s'exécute côté serveur = 0 JS envoyé au client

import { FileText, Users, DollarSign, Calendar } from 'lucide-react';

interface DashboardStats {
  totalDossiers: number;
  totalClients: number;
  chiffreAffaires: number;
  rdvAujourdhui: number;
}

async function getStats(): Promise<DashboardStats> {
  // En production, récupérer depuis la base de données
  // const stats = await prisma.dashboard.getStats();
  
  // Données de démonstration
  return {
    totalDossiers: 156,
    totalClients: 89,
    chiffreAffaires: 45600,
    rdvAujourdhui: 5,
  };
}

export async function DashboardStatsServer() {
  const stats = await getStats();

  const statsCards = [
    {
      title: 'Dossiers actifs',
      value: stats.totalDossiers,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      title: 'Clients',
      value: stats.totalClients,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
    },
    {
      title: "Chiffre d'affaires",
      value: `${stats.chiffreAffaires.toLocaleString('fr-FR')} €`,
      icon: DollarSign,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    },
    {
      title: "RDV aujourd'hui",
      value: stats.rdvAujourdhui,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsCards.map((stat) => (
        <div
          key={stat.title}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{stat.title}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stat.value}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
