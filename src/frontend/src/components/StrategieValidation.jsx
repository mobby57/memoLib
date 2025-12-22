import React, { useState, useEffect } from 'react';
import { Building, Users, Euro, TrendingUp, CheckCircle, AlertTriangle, Target } from 'lucide-react';

const StrategieValidation = () => {
  const [currentPhase, setCurrentPhase] = useState(1);
  const [metrics, setMetrics] = useState({
    communes: 0,
    departments: 0,
    mrr: 0,
    arr: 0,
    valuation: 0
  });

  const phases = [
    {
      id: 1,
      title: "Phase 1: Proof of Concept",
      duration: "Mois 1-6",
      objective: "5 communes pilotes",
      targets: {
        communes: 5,
        departments: 0,
        mrr: 5000,
        arr: 60000,
        valuation: 2000000
      },
      actions: [
        "Cibler communes 5K-15K habitants",
        "Développer module 'Accueil Mairie'",
        "Compliance RGPD native",
        "Validation humaine obligatoire"
      ],
      risks: [
        { level: "medium", text: "Cycles de vente longs" },
        { level: "low", text: "Résistance au changement" }
      ]
    },
    {
      id: 2,
      title: "Phase 2: Traction B2G",
      duration: "Mois 7-12",
      objective: "50 collectivités + 1 département",
      targets: {
        communes: 50,
        departments: 1,
        mrr: 85000,
        arr: 1020000,
        valuation: 15000000
      },
      actions: [
        "Études ROI communes pilotes",
        "Partenariats intégrateurs publics",
        "Certification ANSSI",
        "Produit enterprise multi-sites"
      ],
      risks: [
        { level: "medium", text: "Concurrence éditeurs établis" },
        { level: "low", text: "Changements réglementaires" }
      ]
    },
    {
      id: 3,
      title: "Phase 3: Scale National",
      duration: "Mois 13-18",
      objective: "500 collectivités + 10 départements",
      targets: {
        communes: 500,
        departments: 10,
        mrr: 1150000,
        arr: 13800000,
        valuation: 100000000
      },
      actions: [
        "Équipe commerciale dédiée (10 personnes)",
        "Marketing institutionnel",
        "R&D IA prédictive budgets",
        "Intégrations ERP publics"
      ],
      risks: [
        { level: "high", text: "Scaling équipe commercial" },
        { level: "medium", text: "Complexité technique croissante" }
      ]
    },
    {
      id: 4,
      title: "Phase 4: Licorne",
      duration: "Mois 19-24",
      objective: "€100M ARR",
      targets: {
        communes: 2000,
        departments: 50,
        mrr: 8500000,
        arr: 102000000,
        valuation: 1000000000
      },
      actions: [
        "Expansion Canada/Belgique/Suisse",
        "Verticales hôpitaux/universités",
        "Marketplace B2G modules tiers",
        "Écosystème partenaires"
      ],
      risks: [
        { level: "high", text: "Expansion internationale" },
        { level: "medium", text: "Gestion croissance rapide" }
      ]
    }
  ];

  const competitiveAdvantages = [
    {
      title: "Barrières Réglementaires",
      description: "Compliance RGPD/accessibilité complexe",
      strength: 9
    },
    {
      title: "Switching Costs Élevés",
      description: "Intégration SI + formation agents",
      strength: 8
    },
    {
      title: "Effets de Réseau",
      description: "Plus d'utilisateurs = IA plus précise",
      strength: 7
    },
    {
      title: "First Mover Advantage",
      description: "Seule solution IA accessibilité B2G",
      strength: 9
    }
  ];

  const fundingRounds = [
    {
      round: "Seed",
      amount: 1500000,
      timing: "Mois 3",
      valuation: 10000000,
      investors: "Fonds secteur public, Business angels ex-élus"
    },
    {
      round: "Series A",
      amount: 10000000,
      timing: "Mois 12",
      valuation: 50000000,
      investors: "Fonds généralistes français, Corporate VC"
    },
    {
      round: "Series B",
      amount: 30000000,
      timing: "Mois 18",
      valuation: 200000000,
      investors: "Fonds européens, expansion internationale"
    }
  ];

  const formatNumber = (num) => {
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  useEffect(() => {
    const currentPhaseData = phases[currentPhase - 1];
    if (currentPhaseData) {
      const animateMetrics = () => {
        setMetrics(prev => ({
          communes: Math.min(prev.communes + Math.ceil(currentPhaseData.targets.communes / 50), currentPhaseData.targets.communes),
          departments: Math.min(prev.departments + Math.ceil(currentPhaseData.targets.departments / 10), currentPhaseData.targets.departments),
          mrr: Math.min(prev.mrr + Math.ceil(currentPhaseData.targets.mrr / 50), currentPhaseData.targets.mrr),
          arr: Math.min(prev.arr + Math.ceil(currentPhaseData.targets.arr / 50), currentPhaseData.targets.arr),
          valuation: Math.min(prev.valuation + Math.ceil(currentPhaseData.targets.valuation / 50), currentPhaseData.targets.valuation)
        }));
      };

      const interval = setInterval(animateMetrics, 100);
      setTimeout(() => clearInterval(interval), 5000);
      
      return () => clearInterval(interval);
    }
  }, [currentPhase]);

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          🎯 Stratégie Licorne la Plus Fiable
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          Administrations françaises : 80% de chances de succès
        </p>
        
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl p-6 inline-block">
          <div className="text-3xl font-bold">€500M+ TAM</div>
          <div className="text-green-100">50,000+ entités publiques obligées</div>
        </div>
      </div>

      {/* Sélecteur de phase */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {phases.map((phase) => (
          <button
            key={phase.id}
            onClick={() => setCurrentPhase(phase.id)}
            className={`p-6 rounded-xl text-left transition-all transform hover:scale-105 ${
              currentPhase === phase.id
                ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-xl'
                : 'bg-white text-gray-700 shadow-lg hover:shadow-xl'
            }`}
          >
            <div className="text-2xl font-bold mb-2">{phase.title}</div>
            <div className={`text-sm mb-2 ${currentPhase === phase.id ? 'text-blue-100' : 'text-gray-500'}`}>
              {phase.duration}
            </div>
            <div className={`text-sm font-medium ${currentPhase === phase.id ? 'text-white' : 'text-gray-600'}`}>
              {phase.objective}
            </div>
          </button>
        ))}
      </div>

      {/* Métriques actuelles */}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          📊 Métriques Phase {currentPhase}
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          <div className="text-center">
            <Building className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-3xl font-bold text-blue-600">{metrics.communes}</div>
            <div className="text-gray-600">Communes</div>
          </div>
          
          <div className="text-center">
            <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-3xl font-bold text-green-600">{metrics.departments}</div>
            <div className="text-gray-600">Départements</div>
          </div>
          
          <div className="text-center">
            <Euro className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <div className="text-3xl font-bold text-purple-600">€{formatNumber(metrics.mrr)}</div>
            <div className="text-gray-600">MRR</div>
          </div>
          
          <div className="text-center">
            <TrendingUp className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <div className="text-3xl font-bold text-orange-600">€{formatNumber(metrics.arr)}</div>
            <div className="text-gray-600">ARR</div>
          </div>
          
          <div className="text-center">
            <Target className="w-8 h-8 text-pink-600 mx-auto mb-2" />
            <div className="text-3xl font-bold text-pink-600">€{formatNumber(metrics.valuation)}</div>
            <div className="text-gray-600">Valorisation</div>
          </div>
        </div>
      </div>

      {/* Détails phase actuelle */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Actions */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
            Actions Clés
          </h3>
          <div className="space-y-3">
            {phases[currentPhase - 1].actions.map((action, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-gray-700">{action}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Risques */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <AlertTriangle className="w-6 h-6 text-yellow-600 mr-2" />
            Risques Identifiés
          </h3>
          <div className="space-y-3">
            {phases[currentPhase - 1].risks.map((risk, index) => (
              <div key={index} className="flex items-center space-x-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(risk.level)}`}>
                  {risk.level.toUpperCase()}
                </span>
                <span className="text-gray-700">{risk.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Avantages concurrentiels */}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">🛡️ Avantages Concurrentiels</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {competitiveAdvantages.map((advantage, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-gray-900">{advantage.title}</h3>
                <div className="text-sm font-bold text-blue-600">{advantage.strength}/10</div>
              </div>
              <p className="text-gray-600 text-sm mb-3">{advantage.description}</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${advantage.strength * 10}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Financement */}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">💰 Roadmap Financement</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {fundingRounds.map((round, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-6">
              <div className="text-center mb-4">
                <div className="text-2xl font-bold text-gray-900">{round.round}</div>
                <div className="text-sm text-gray-600">{round.timing}</div>
              </div>
              
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">€{formatNumber(round.amount)}</div>
                  <div className="text-sm text-gray-600">Montant levé</div>
                </div>
                
                <div className="text-center">
                  <div className="text-xl font-bold text-blue-600">€{formatNumber(round.valuation)}</div>
                  <div className="text-sm text-gray-600">Valorisation</div>
                </div>
                
                <div className="text-xs text-gray-500 text-center">
                  {round.investors}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Call to action */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white p-8 text-center">
        <h3 className="text-3xl font-bold mb-4">🚀 Actions Immédiates</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white/20 rounded-lg p-4">
            <h4 className="font-bold mb-2">Cette Semaine</h4>
            <ul className="text-sm space-y-1">
              <li>• Identifier 20 communes cibles</li>
              <li>• Créer pitch deck B2G</li>
              <li>• Contacter 3 maires</li>
            </ul>
          </div>
          
          <div className="bg-white/20 rounded-lg p-4">
            <h4 className="font-bold mb-2">Ce Mois</h4>
            <ul className="text-sm space-y-1">
              <li>• Développer démo "Accueil Mairie"</li>
              <li>• Dossier compliance RGPD</li>
              <li>• Rencontrer intégrateur public</li>
            </ul>
          </div>
          
          <div className="bg-white/20 rounded-lg p-4">
            <h4 className="font-bold mb-2">Dans 3 Mois</h4>
            <ul className="text-sm space-y-1">
              <li>• Signer première commune</li>
              <li>• Lever seed €1.5M</li>
              <li>• Recruter commercial B2G</li>
            </ul>
          </div>
        </div>
        
        <div className="text-xl font-bold">
          🦄 80% de chances de créer une licorne en 24 mois
        </div>
      </div>
    </div>
  );
};

export default StrategieValidation;