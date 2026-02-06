'use client';

export const dynamic = 'force-dynamic';

import { Calendar, DollarSign, FileText, MessageSquare } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ClientDemoDashboard() {
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
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">👤 Mon Espace Client</h1>
          <p className="text-slate-600">Suivi de votre dossier juridique</p>
        </div>

        {/* Mon Dossier Principal */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8 border-l-4 border-blue-500">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-500" />
            Mon Dossier
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <div className="mb-6">
                <label className="text-slate-600 text-sm">Numéro de dossier</label>
                <p className="text-2xl font-bold text-slate-900">DOS-2026-045</p>
              </div>
              <div className="mb-6">
                <label className="text-slate-600 text-sm">Type</label>
                <p className="text-lg font-semibold text-slate-900">Contrat Commercial</p>
              </div>
              <div>
                <label className="text-slate-600 text-sm">Créé le</label>
                <p className="text-lg text-slate-700">15 janvier 2026</p>
              </div>
            </div>
            <div>
              <div className="mb-6">
                <label className="text-slate-600 text-sm">État du dossier</label>
                <div className="flex items-center gap-3 mt-2">
                  <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                  <span className="text-lg font-semibold text-blue-600">
                    En cours de traitement
                  </span>
                </div>
              </div>
              <div className="mb-6">
                <label className="text-slate-600 text-sm">Progression</label>
                <div className="w-full bg-slate-200 rounded-full h-3 mt-2">
                  <div className="bg-blue-500 h-3 rounded-full" style={{ width: '65%' }}></div>
                </div>
                <p className="text-sm text-slate-600 mt-2">65% complété</p>
              </div>
            </div>
          </div>
        </div>

        {/* Grille d'infos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <InfoCard
            icon={<Calendar className="w-6 h-6" />}
            title="Prochain Rendez-vous"
            content="Mercredi 5 février à 14:30"
            color="orange"
          />
          <InfoCard
            icon={<DollarSign className="w-6 h-6" />}
            title="Vos Factures"
            content="€1,200 - Prochaine échéance: 15 février"
            color="purple"
          />
          <InfoCard
            icon={<MessageSquare className="w-6 h-6" />}
            title="Messages"
            content="Dernier message: Aujourd'hui 10:30"
            color="green"
          />
        </div>

        {/* Documents */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8 border-l-4 border-green-500">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <FileText className="w-6 h-6 text-green-500" />
            Documents Partagés
          </h2>
          <div className="space-y-3">
            <DocumentItem name="Contrat_Initial_Signée.pdf" date="Ajouté le 15 janvier 2026" />
            <DocumentItem name="Amendements_V3.docx" date="Modifié le 28 janvier 2026" />
            <DocumentItem name="Correspondance_Client.pdf" date="Ajouté le 2 février 2026" />
          </div>
        </div>

        {/* Actions Rapides */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button className="bg-blue-600 text-white rounded-lg p-6 hover:bg-blue-700 transition text-center font-semibold">
            📧 Contacter mon avocat
          </button>
          <button className="bg-slate-200 text-slate-900 rounded-lg p-6 hover:bg-slate-300 transition text-center font-semibold">
            📄 Télécharger le dossier
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon, title, content, color }: any) {
  const colors: Record<string, string> = {
    blue: 'border-blue-500 bg-blue-50',
    orange: 'border-orange-500 bg-orange-50',
    purple: 'border-purple-500 bg-purple-50',
    green: 'border-green-500 bg-green-50',
  };

  const textColors: Record<string, string> = {
    blue: 'text-blue-600',
    orange: 'text-orange-600',
    purple: 'text-purple-600',
    green: 'text-green-600',
  };

  return (
    <div className={`${colors[color]} border-l-4 rounded-lg p-6`}>
      <div className={`${textColors[color]} mb-3`}>{icon}</div>
      <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-700 text-sm">{content}</p>
    </div>
  );
}

function DocumentItem({ name, date }: any) {
  return (
    <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition">
      <div className="flex items-center gap-3">
        <span className="text-2xl">📄</span>
        <div>
          <p className="font-semibold text-slate-900">{name}</p>
          <p className="text-sm text-slate-600">{date}</p>
        </div>
      </div>
      <button className="text-blue-600 hover:text-blue-800 font-semibold">↓ Télécharger</button>
    </div>
  );
}
