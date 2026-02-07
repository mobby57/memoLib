'use client';

// Force dynamic to prevent prerendering errors with React hooks
export const dynamic = 'force-dynamic';

import { useState } from 'react';

export default function AdvancedFeaturesPage() {
  const [activeTab, setActiveTab] = useState('analytics');

  const tabs = [
    { id: 'analytics', label: ' Analytics', icon: '' },
    { id: 'predictions', label: ' Predictions', icon: '' },
    { id: 'chat', label: ' Assistant IA', icon: '' },
    { id: 'security', label: ' Securite', icon: '' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
             Fonctionnalites Avancees IA
          </h1>
          <p className="text-gray-600">
            Innovations qui transforment votre pratique juridique
          </p>
        </div>

        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="space-y-6">
          {activeTab === 'analytics' && (
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-xl font-semibold mb-4"> Analytics Temps Reel</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">95%</div>
                  <div className="text-sm text-green-700">Taux de succes IA</div>
                  <div className="text-xs text-green-600 mt-1">? +5% ce mois</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">87%</div>
                  <div className="text-sm text-blue-700">Confiance moyenne</div>
                  <div className="text-xs text-blue-600 mt-1">? Stable</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">342</div>
                  <div className="text-sm text-purple-700">Actions apprises</div>
                  <div className="text-xs text-purple-600 mt-1"> +23 cette semaine</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'predictions' && (
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-xl font-semibold mb-4"> Predictions IA</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">? Delais Estimes</h3>
                  <div className="text-lg font-semibold">45 jours</div>
                  <div className="text-sm text-gray-500">Confiance: 85%</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">?? Chance de Succes</h3>
                  <div className="text-lg font-semibold text-green-600">72%</div>
                  <div className="text-sm text-gray-500">Base sur 127 cas similaires</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-xl font-semibold mb-4"> Assistant IA</h2>
              <div className="bg-gray-50 p-4 rounded-lg h-64 flex items-center justify-center">
                <p className="text-gray-500">Interface de chat IA sera integree ici</p>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-xl font-semibold mb-4"> Securite Avancee</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h3 className="font-semibold text-green-800 mb-2"> Chiffrement</h3>
                  <div className="text-sm text-green-700">
                     100% des documents chiffres<br/>
                     Cles rotees automatiquement<br/>
                     Zero-knowledge architecture
                  </div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-800 mb-2">? Blockchain</h3>
                  <div className="text-sm text-blue-700">
                     1,247 actions auditees<br/>
                     Hash: 0x4a7b...c9e2<br/>
                     Integrite verifiee
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-2"> memoLib v2.0</h3>
            <p className="text-blue-100">
              Le systeme devient plus intelligent chaque jour, sans intervention manuelle.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
