'use client';

// Force dynamic to prevent prerendering errors with React hooks
export const dynamic = 'force-dynamic';

import SmartFormBuilder from '@/components/forms/SmartFormBuilder';
import { formConfigs } from '@/lib/forms/formConfigs';
import { useState } from 'react';

/**
 *  Page: Formulaires Interactifs Intelligents
 *
 * Interface pour acceder aux formulaires adaptatifs qui
 * responsabilisent les utilisateurs et impactent l'organisation
 */

export default function FormsPage() {
  const [selectedForm, setSelectedForm] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleFormComplete = (result: any) => {
    console.log('Formulaire complete:', result);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setSelectedForm(null);
    }, 3000);
  };

  if (selectedForm) {
    const config = formConfigs[selectedForm as keyof typeof formConfigs];

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <button
            onClick={() => setSelectedForm(null)}
            className="mb-4 text-blue-600 hover:text-blue-700 flex items-center"
          >
            [Back] Retour aux formulaires
          </button>

          {showSuccess && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <span className="text-green-600 mr-2">[Check]</span>
                <p className="text-green-800 font-medium">
                  Formulaire soumis avec succes ! Un email a ete envoye aux approbateurs.
                </p>
              </div>
            </div>
          )}

          <SmartFormBuilder
            config={config}
            onComplete={handleFormComplete}
            showImpactAnalysis={true}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* En-tete */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Formulaires Intelligents</h1>
          <p className="text-lg text-gray-600">
            Formulaires adaptatifs avec analyse d'impact et suggestions IA pour responsabiliser les
            decisions
          </p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Formulaires actifs</div>
            <div className="text-2xl font-bold text-blue-600">3</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Demandes en attente</div>
            <div className="text-2xl font-bold text-yellow-600">7</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Approuvees ce mois</div>
            <div className="text-2xl font-bold text-green-600">12</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Impact moyen</div>
            <div className="text-2xl font-bold text-purple-600">6.8/10</div>
          </div>
        </div>

        {/* Liste des formulaires */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Demande de ressources */}
          <div
            onClick={() => setSelectedForm('resourceRequest')}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl"></span>
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                RESOURCE
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Demande de Ressources</h3>
            <p className="text-sm text-gray-600 mb-4">
              Demander des ressources humaines, materielles ou budgetaires avec analyse d'impact
            </p>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span> IA activee</span>
              <span>️ Approbation requise</span>
            </div>
          </div>

          {/* Decision strategique */}
          <div
            onClick={() => setSelectedForm('strategicDecision')}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🎯</span>
              </div>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                STRATEGY
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Decision Strategique</h3>
            <p className="text-sm text-gray-600 mb-4">
              Documenter et valider les decisions strategiques importantes avec analyse de risques
            </p>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span> IA activee</span>
              <span>️ Approbation requise</span>
            </div>
          </div>

          {/* evaluation des risques */}
          <div
            onClick={() => setSelectedForm('riskAssessment')}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">️</span>
              </div>
              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
                RISK
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">evaluation des Risques</h3>
            <p className="text-sm text-gray-600 mb-4">
              Analyse systematique des risques avec calcul de probabilite et severite
            </p>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span> IA activee</span>
              <span>[Check] Soumission directe</span>
            </div>
          </div>
        </div>

        {/* Fonctionnalites cles */}
        <div className="mt-12 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Fonctionnalites Intelligentes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start">
              <span className="text-2xl mr-3"></span>
              <div>
                <h3 className="font-medium text-gray-900">Suggestions IA en temps reel</h3>
                <p className="text-sm text-gray-600">
                  Le système analyse vos réponses et propose des suggestions contextuelles
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-2xl mr-3"></span>
              <div>
                <h3 className="font-medium text-gray-900">Analyse d'impact automatique</h3>
                <p className="text-sm text-gray-600">
                  Calcul en temps reel de l'impact organisationnel de vos choix
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-2xl mr-3"></span>
              <div>
                <h3 className="font-medium text-gray-900">Workflow d'approbation</h3>
                <p className="text-sm text-gray-600">
                  Routing automatique vers les approbateurs concernes
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-2xl mr-3"></span>
              <div>
                <h3 className="font-medium text-gray-900">Tableaux de bord decisionnels</h3>
                <p className="text-sm text-gray-600">
                  Visualisation de l'impact cumule des decisions sur l'organisation
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
