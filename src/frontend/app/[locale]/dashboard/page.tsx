'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Loader, Plus, TrendingUp, Users, FileText, DollarSign } from 'lucide-react';

interface DashboardStats {
  totalDossiers: number;
  totalClients: number;
  totalFactures: number;
  revenueMonth: number;
  recentDossiers: any[];
  upcomingDeadlines: any[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  async function fetchDashboard() {
    setLoading(true);
    try {
      // Pour la démo, on crée des données statiques
      // En production, ce serait un endpoint /api/v1/dashboard
      setStats({
        totalDossiers: 24,
        totalClients: 18,
        totalFactures: 42,
        revenueMonth: 12500,
        recentDossiers: [],
        upcomingDeadlines: [],
      });
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Bienvenue</h1>
          <p className="text-slate-600 mt-1">Voici un résumé de votre activité</p>
        </div>
        <Link href="/dossiers/new">
          <Button size="lg">
            <Plus size={20} className="mr-2" />
            Nouveau Dossier
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Total Dossiers */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Dossiers Actifs</p>
              <p className="text-3xl font-bold text-slate-900">{stats?.totalDossiers || 0}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="text-blue-600" size={24} />
            </div>
          </div>
          <p className="text-xs text-slate-600 mt-4 flex items-center gap-1">
            <TrendingUp size={14} className="text-green-600" />
            +5 ce mois
          </p>
        </div>

        {/* Total Clients */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Clients</p>
              <p className="text-3xl font-bold text-slate-900">{stats?.totalClients || 0}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Users className="text-green-600" size={24} />
            </div>
          </div>
          <p className="text-xs text-slate-600 mt-4 flex items-center gap-1">
            <TrendingUp size={14} className="text-green-600" />
            +2 ce mois
          </p>
        </div>

        {/* Total Factures */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Factures</p>
              <p className="text-3xl font-bold text-slate-900">{stats?.totalFactures || 0}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <FileText className="text-orange-600" size={24} />
            </div>
          </div>
          <p className="text-xs text-slate-600 mt-4 flex items-center gap-1">
            <TrendingUp size={14} className="text-green-600" />
            +8 ce mois
          </p>
        </div>

        {/* Revenue */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Revenu (30j)</p>
              <p className="text-3xl font-bold text-slate-900">
                {(stats?.revenueMonth || 0).toLocaleString('fr-FR')} €
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <DollarSign className="text-purple-600" size={24} />
            </div>
          </div>
          <p className="text-xs text-slate-600 mt-4 flex items-center gap-1">
            <TrendingUp size={14} className="text-green-600" />
            +12% vs mois passé
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Actions rapides</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link href="/dossiers/new">
            <Button variant="outline" className="w-full">Nouveau Dossier</Button>
          </Link>
          <Link href="/clients/new">
            <Button variant="outline" className="w-full">Nouveau Client</Button>
          </Link>
          <Link href="/factures/new">
            <Button variant="outline" className="w-full">Nouvelle Facture</Button>
          </Link>
          <Link href="/documents">
            <Button variant="outline" className="w-full">Documents</Button>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Cases */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Dossiers récents</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <p className="font-medium text-slate-900">Affaire Martin c/ Dupont</p>
                <p className="text-sm text-slate-600">Créé il y a 2 jours</p>
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                Actif
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <p className="font-medium text-slate-900">Contrat de société</p>
                <p className="text-sm text-slate-600">Créé il y a 5 jours</p>
              </div>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                En attente
              </span>
            </div>
          </div>
          <Link href="/dossiers">
            <Button variant="outline" className="w-full mt-4">Voir tous les dossiers</Button>
          </Link>
        </div>

        {/* Upcoming Deadlines */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Délais à venir</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
              <div>
                <p className="font-medium text-slate-900">Recours gracieux</p>
                <p className="text-sm text-slate-600">Échéance: 7 février</p>
              </div>
              <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                Urgent
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div>
                <p className="font-medium text-slate-900">Appel</p>
                <p className="text-sm text-slate-600">Échéance: 14 février</p>
              </div>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                Attention
              </span>
            </div>
          </div>
          <Link href="/calendar">
            <Button variant="outline" className="w-full mt-4">Voir l'agenda</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
