'use client';

export const dynamic = 'force-dynamic';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { BarChart3, DollarSign, Users, TrendingUp } from 'lucide-react';

export default function SuperAdminDemoDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">Dashboard Super Admin</h1>
          <p className="text-slate-400">Vue globale de la plateforme memoLib</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard
            icon={<BarChart3 className="w-8 h-8" />}
            title="Tenants Actifs"
            value="10"
            change="+2"
            color="blue"
          />
          <KPICard
            icon={<Users className="w-8 h-8" />}
            title="Utilisateurs"
            value="245"
            change="+12"
            color="green"
          />
          <KPICard
            icon={<DollarSign className="w-8 h-8" />}
            title="MRR (Mensuel)"
            value="€8,500"
            change="+15%"
            color="purple"
          />
          <KPICard
            icon={<TrendingUp className="w-8 h-8" />}
            title="ARR (Annuel)"
            value="€102,000"
            change="+18%"
            color="orange"
          />
        </div>

        {/* Plans Stats */}
        <div className="bg-slate-700/50 backdrop-blur rounded-lg border border-slate-600 p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Statistiques par Plan</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <PlanCard name="Starter" subscriptions="5" mrr="€0" color="blue" />
            <PlanCard name="Pro" subscriptions="15" mrr="€1,485" color="green" />
            <PlanCard name="Enterprise" subscriptions="8" mrr="€7,015" color="purple" />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-slate-700/50 backdrop-blur rounded-lg border border-slate-600 p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Activité Récente</h2>
          <div className="space-y-4">
            <ActivityItem
              type="tenant"
              text="Nouveau tenant: Cabinet Juridique Dupont"
              time="Il y a 2 heures"
            />
            <ActivityItem
              type="user"
              text="25 nouveaux utilisateurs inscrits"
              time="Il y a 4 heures"
            />
            <ActivityItem
              type="upgrade"
              text="3 cabinets ont upgrade vers Enterprise"
              time="Aujourd'hui"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({ icon, title, value, change, color }: any) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-500/20 border-blue-500 text-blue-400',
    green: 'bg-green-500/20 border-green-500 text-green-400',
    purple: 'bg-purple-500/20 border-purple-500 text-purple-400',
    orange: 'bg-orange-500/20 border-orange-500 text-orange-400',
  };

  return (
    <div className={`${colors[color]} border rounded-lg p-6 backdrop-blur`}>
      <div className="flex items-start justify-between mb-4">
        <div
          className={`${color === 'blue' ? 'text-blue-400' : color === 'green' ? 'text-green-400' : color === 'purple' ? 'text-purple-400' : 'text-orange-400'}`}
        >
          {icon}
        </div>
        <span className="text-sm font-semibold text-green-400">↑ {change}</span>
      </div>
      <p className="text-slate-300 text-sm mb-2">{title}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  );
}

function PlanCard({ name, subscriptions, mrr, color }: any) {
  return (
    <div className="bg-slate-600/50 border border-slate-500 rounded-lg p-6">
      <h3 className="text-xl font-bold text-white mb-4">{name}</h3>
      <div className="space-y-3">
        <div>
          <p className="text-slate-400 text-sm">Abonnements actifs</p>
          <p className="text-2xl font-bold text-white">{subscriptions}</p>
        </div>
        <div>
          <p className="text-slate-400 text-sm">MRR</p>
          <p className="text-2xl font-bold text-white">{mrr}</p>
        </div>
      </div>
    </div>
  );
}

function ActivityItem({ type, text, time }: any) {
  const icons: Record<string, string> = {
    tenant: '🏢',
    user: '👤',
    upgrade: '⬆️',
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-slate-600/30 border border-slate-500 rounded-lg">
      <span className="text-2xl">{icons[type]}</span>
      <div className="flex-1">
        <p className="text-white text-sm">{text}</p>
        <p className="text-slate-400 text-xs mt-1">{time}</p>
      </div>
    </div>
  );
}
