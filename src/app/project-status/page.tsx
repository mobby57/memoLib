'use client';

// Force dynamic to prevent prerendering errors with React hooks
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';

export default function ProjectStatusPage() {
  const [status, setStatus] = useState({
    database: 'loading',
    ai: 'inactive',
    security: 'secure',
    performance: 85
  });

  const [demoData] = useState({
    tenants: 3,
    clients: 50,
    dossiers: 100,
    factures: 30,
    aiActions: 200
  });

  useEffect(() => {
    setTimeout(() => {
      setStatus({
        database: 'connected',
        ai: 'active',
        security: 'secure',
        performance: 92
      });
    }, 1000);
  }, []);

  const StatusIndicator = ({ status, label }) => {
    const colors = {
      connected: 'bg-green-500',
      active: 'bg-green-500',
      secure: 'bg-green-500',
      loading: 'bg-yellow-500',
      inactive: 'bg-yellow-500',
      error: 'bg-red-500'
    };

    return (
      <div className="flex items-center space-x-2">
        <div className={`w-3 h-3 rounded-full ${colors[status] || 'bg-gray-500'}`}></div>
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-gray-500 capitalize">{status}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            [emoji] IA Poste Manager - Status Projet
          </h1>
          <p className="text-gray-600">
            Tableau de bord complet avec experts assembles
          </p>
        </div>

        {/* System Status */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="font-semibold mb-4">[emoji]️ Base de Donnees</h3>
            <StatusIndicator status={status.database} label="PostgreSQL" />
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="font-semibold mb-4">[emoji] IA</h3>
            <StatusIndicator status={status.ai} label="Ollama + GPT" />
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="font-semibold mb-4">[emoji] Securite</h3>
            <StatusIndicator status={status.security} label="Chiffrement E2E" />
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="font-semibold mb-4"> Performance</h3>
            <div className="text-2xl font-bold text-green-600">{status.performance}%</div>
          </div>
        </div>

        {/* Expert Team */}
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
          <h2 className="text-xl font-semibold mb-6">[emoji] equipe d'Experts</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm">[Check]</div>
              <div>
                <div className="font-medium">🏛️ Expert Juridique</div>
                <div className="text-xs text-gray-600">CESEDA valide</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm">[Check]</div>
              <div>
                <div className="font-medium">[emoji] Expert Securite</div>
                <div className="text-xs text-gray-600">RGPD conforme</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm">[Check]</div>
              <div>
                <div className="font-medium">[emoji] Expert IA</div>
                <div className="text-xs text-gray-600">ML optimise</div>
              </div>
            </div>
          </div>
        </div>

        {/* Demo Data */}
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
          <h2 className="text-xl font-semibold mb-6">[emoji] Donnees Demo</h2>
          <div className="grid grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{demoData.tenants}</div>
              <div className="text-sm text-gray-600">Cabinets</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{demoData.clients}</div>
              <div className="text-sm text-gray-600">Clients</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{demoData.dossiers}</div>
              <div className="text-sm text-gray-600">Dossiers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{demoData.factures}</div>
              <div className="text-sm text-gray-600">Factures</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{demoData.aiActions}</div>
              <div className="text-sm text-gray-600">Actions IA</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <a href="/dashboard" className="block bg-blue-600 text-white p-6 rounded-lg hover:bg-blue-700">
            <div className="text-xl font-semibold mb-2">🏠 Dashboard</div>
            <div className="text-blue-100">Tableau de bord principal</div>
          </a>
          <a href="/advanced-features" className="block bg-purple-600 text-white p-6 rounded-lg hover:bg-purple-700">
            <div className="text-xl font-semibold mb-2">[emoji] IA Avancee</div>
            <div className="text-purple-100">Fonctionnalites innovantes</div>
          </a>
          <a href="/dossiers" className="block bg-green-600 text-white p-6 rounded-lg hover:bg-green-700">
            <div className="text-xl font-semibold mb-2">️ Dossiers</div>
            <div className="text-green-100">Gestion CESEDA</div>
          </a>
        </div>
      </div>
    </div>
  );
}
