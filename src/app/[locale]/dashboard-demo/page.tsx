'use client';

export const dynamic = 'force-dynamic';

import { Calendar, CheckCircle, DollarSign, FileText, Users } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LawyerDemoDashboard() {
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">📋 Dashboard Avocat</h1>
          <p className="text-slate-600">Gestion de votre cabinet et de vos dossiers</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard
            icon={<FileText className="w-8 h-8" />}
            title="Dossiers Actifs"
            value="24"
            status="18 en cours"
            color="blue"
          />
          <KPICard
            icon={<Users className="w-8 h-8" />}
            title="Clients"
            value="45"
            status="8 nouveaux ce mois"
            color="green"
          />
          <KPICard
            icon={<DollarSign className="w-8 h-8" />}
            title="Facturation"
            value="€12,500"
            status="5 en attente de paiement"
            color="purple"
          />
          <KPICard
            icon={<Calendar className="w-8 h-8" />}
            title="Rendez-vous"
            value="8"
            status="Cette semaine"
            color="orange"
          />
        </div>

        {/* Dossiers Importants */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Dossiers */}
          <div className="bg-white rounded-lg shadow-lg p-8 border-l-4 border-blue-500">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-500" />
              Dossiers Récents
            </h2>
            <div className="space-y-4">
              <DossierItem
                title="Contrat commercial - Dupont SA"
                status="En cours"
                client="Dupont SA"
              />
              <DossierItem
                title="Litige commercial - Tech Solutions"
                status="Urgent"
                client="Tech Solutions SARL"
              />
              <DossierItem
                title="Succession - Famille Martin"
                status="En cours"
                client="Famille Martin"
              />
            </div>
          </div>

          {/* Rendez-vous */}
          <div className="bg-white rounded-lg shadow-lg p-8 border-l-4 border-orange-500">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-orange-500" />
              Rendez-vous à Venir
            </h2>
            <div className="space-y-4">
              <RendezVousItem
                time="10:00"
                client="Dupont SA"
                description="Réunion de suivi contrat"
              />
              <RendezVousItem
                time="14:30"
                client="Tech Solutions"
                description="Consultation juridique"
              />
              <RendezVousItem
                time="16:00"
                client="Famille Martin"
                description="Succession - Révision testamentaire"
              />
            </div>
          </div>
        </div>

        {/* Facturation */}
        <div className="bg-white rounded-lg shadow-lg p-8 border-l-4 border-purple-500">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-purple-500" />
            Facturation
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FactureCard label="Factures Payées" amount="€7,850" count="12" color="green" />
            <FactureCard label="En Attente" amount="€3,200" count="5" color="yellow" />
            <FactureCard label="En Retard" amount="€1,450" count="2" color="red" />
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({ icon, title, value, status, color }: any) {
  const colors: Record<string, string> = {
    blue: 'border-blue-500 bg-blue-50',
    green: 'border-green-500 bg-green-50',
    purple: 'border-purple-500 bg-purple-50',
    orange: 'border-orange-500 bg-orange-50',
  };

  const textColors: Record<string, string> = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600',
  };

  return (
    <div className={`${colors[color]} border-l-4 rounded-lg p-6 shadow-md`}>
      <div className={`${textColors[color]} mb-4`}>{icon}</div>
      <p className="text-slate-600 text-sm mb-2">{title}</p>
      <p className="text-3xl font-bold text-slate-900 mb-2">{value}</p>
      <p className="text-slate-500 text-sm">{status}</p>
    </div>
  );
}

function DossierItem({ title, status, client }: any) {
  const statusColors: Record<string, string> = {
    'En cours': 'bg-blue-100 text-blue-800',
    Urgent: 'bg-red-100 text-red-800',
    Fermé: 'bg-green-100 text-green-800',
  };

  return (
    <div className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition">
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-slate-900">{title}</h3>
        <span className={`text-xs font-bold px-2 py-1 rounded ${statusColors[status]}`}>
          {status}
        </span>
      </div>
      <p className="text-sm text-slate-600">📍 {client}</p>
    </div>
  );
}

function RendezVousItem({ time, client, description }: any) {
  return (
    <div className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition">
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-slate-900">{time}</h3>
        <CheckCircle className="w-5 h-5 text-green-600" />
      </div>
      <p className="text-slate-900 font-medium">{client}</p>
      <p className="text-sm text-slate-600">{description}</p>
    </div>
  );
}

function FactureCard({ label, amount, count, color }: any) {
  const colors: Record<string, string> = {
    green: 'bg-green-50 border-green-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    red: 'bg-red-50 border-red-200',
  };

  const textColors: Record<string, string> = {
    green: 'text-green-700',
    yellow: 'text-yellow-700',
    red: 'text-red-700',
  };

  return (
    <div className={`${colors[color]} border rounded-lg p-6 text-center`}>
      <p className={`text-sm font-semibold ${textColors[color]} mb-2`}>{label}</p>
      <p className="text-3xl font-bold text-slate-900 mb-2">{amount}</p>
      <p className="text-xs text-slate-600">{count} factures</p>
    </div>
  );
}
