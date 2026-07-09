'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Euro,
  TrendingUp,
  FileText,
  Download,
  AlertCircle,
  CheckCircle,
  Clock,
  PieChart,
  ArrowRight,
} from 'lucide-react';

/**
 * Vue Comptable — Dashboard orienté finance
 * Focus: factures, paiements, CARPA, TVA, exports FEC
 */
export default function ComptableDashboard() {
  const { user } = useAuth();
  const pathname = usePathname() ?? '';
  const locale = pathname.split('/')[1] || 'fr';
  const lhref = (path: string) => `/${locale}${path}`;

  const [stats, setStats] = useState({
    facturesEnAttente: 3,
    montantTotal: 12450,
    montantEncaisse: 8200,
    montantImpayes: 4250,
    carpaSolde: 35000,
    tvaADeclarer: 2100,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Comptabilité — {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
        </h1>
        <p className="text-gray-500 mt-1">
          {stats.facturesEnAttente} factures en attente • {stats.montantImpayes.toLocaleString('fr-FR')}€ impayés
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Euro className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.montantTotal.toLocaleString('fr-FR')}€</p>
              <p className="text-xs text-gray-500">CA du mois</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">{stats.montantEncaisse.toLocaleString('fr-FR')}€</p>
              <p className="text-xs text-gray-500">Encaissé</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-700">{stats.montantImpayes.toLocaleString('fr-FR')}€</p>
              <p className="text-xs text-gray-500">Impayés</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <PieChart className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-700">{stats.carpaSolde.toLocaleString('fr-FR')}€</p>
              <p className="text-xs text-gray-500">Solde CARPA</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Factures en attente */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Factures en attente
            </h2>
            <Link href={lhref('/factures')} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              Toutes les factures <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-red-50 border border-red-100">
              <div>
                <p className="text-sm font-medium text-gray-900">F-2026-0042 — M. Diallo</p>
                <p className="text-xs text-gray-500">Échue depuis 15 jours • Convention honoraires OQTF</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-red-600">1 500€</p>
                <button className="text-xs text-red-600 hover:underline">Relancer</button>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-orange-50 border border-orange-100">
              <div>
                <p className="text-sm font-medium text-gray-900">F-2026-0045 — Mme Traoré</p>
                <p className="text-xs text-gray-500">Échéance dans 5 jours • Titre de séjour</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-orange-600">2 200€</p>
                <span className="text-xs text-orange-600">Bientôt due</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-900">F-2026-0048 — M. Ba</p>
                <p className="text-xs text-gray-500">Créée hier • Régularisation</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-700">550€</p>
                <span className="text-xs text-gray-500">En attente</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions rapides comptable */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
            <div className="space-y-2">
              <Link href={lhref('/factures')} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <FileText className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-medium">Créer facture</span>
              </Link>
              <Link href={lhref('/admin/comptabilite')} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium">Grand livre</span>
              </Link>
              <button
                onClick={() => window.open('/api/exports/fec', '_blank')}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors w-full text-left"
              >
                <Download className="w-5 h-5 text-purple-500" />
                <span className="text-sm font-medium">Export FEC</span>
              </button>
              <Link href={lhref('/admin/comptabilite')} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <Euro className="w-5 h-5 text-orange-500" />
                <span className="text-sm font-medium">Déclaration TVA</span>
              </Link>
            </div>
          </div>

          {/* TVA à déclarer */}
          <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-6 text-white">
            <Clock className="w-6 h-6 mb-2 opacity-80" />
            <p className="text-sm opacity-80">TVA à déclarer</p>
            <p className="text-2xl font-bold">{stats.tvaADeclarer.toLocaleString('fr-FR')}€</p>
            <p className="text-xs opacity-70 mt-1">Échéance: 20 du mois</p>
          </div>
        </div>
      </div>
    </div>
  );
}
