import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

const BusinessPlanGenerator = () => {
  const [inputs, setInputs] = useState({
    targetMarket: 'communes',
    pricing: 1500,
    timeline: 24,
    teamSize: 15,
    fundingNeeded: 2000000
  });
  
  const [projections, setProjections] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);

  const marketSegments = {
    communes: {
      name: 'Communes francaises',
      totalMarket: 36000,
      avgPricing: 1500,
      conversionRate: 0.02,
      churnRate: 0.05,
      description: 'Communes de 2000 a 20000 habitants'
    },
    departments: {
      name: 'Departements',
      totalMarket: 101,
      avgPricing: 15000,
      conversionRate: 0.15,
      churnRate: 0.03,
      description: 'Conseils departementaux'
    },
    regions: {
      name: 'Regions',
      totalMarket: 18,
      avgPricing: 25000,
      conversionRate: 0.25,
      churnRate: 0.02,
      description: 'Conseils regionaux'
    },
    hopitaux: {
      name: 'Hopitaux publics',
      totalMarket: 3000,
      avgPricing: 5000,
      conversionRate: 0.08,
      churnRate: 0.04,
      description: 'Etablissements de sante publics'
    }
  };

  const calculateProjections = () => {
    const segment = marketSegments[inputs.targetMarket];
    const months = inputs.timeline;
    
    const projections = [];
    let customers = 0;
    let mrr = 0;
    let totalRevenue = 0;
    let costs = 0;
    
    for (let month = 1; month <= months; month++) {
      const growthRate = Math.min(0.15, 0.02 + (month / months) * 0.13);
      const newCustomers = Math.floor(customers * growthRate + (month <= 6 ? 1 : 2));
      const churnedCustomers = Math.floor(customers * segment.churnRate / 12);
      
      customers = Math.min(customers + newCustomers - churnedCustomers, segment.totalMarket * 0.1);
      mrr = customers * inputs.pricing;
      
      const teamCost = inputs.teamSize * 8000;
      const infraCost = Math.max(5000, customers * 10);
      const marketingCost = Math.min(50000, mrr * 0.3);
      const totalMonthlyCost = teamCost + infraCost + marketingCost;
      
      costs += totalMonthlyCost;
      totalRevenue += mrr;
      
      if (month % 6 === 0 || month === months) {
        projections.push({
          month,
          customers,
          mrr,
          arr: mrr * 12,
          totalRevenue,
          totalCosts: costs,
          profit: totalRevenue - costs,
          valuation: mrr * 12 * 8,
          marketPenetration: (customers / segment.totalMarket * 100).toFixed(2)
        });
      }
    }
    
    return projections;
  };

  const generateBusinessPlan = () => {
    setIsGenerating(true);
    
    setTimeout(() => {
      const newProjections = calculateProjections();
      setProjections({
        timeline: newProjections,
        summary: generateSummary(newProjections),
        risks: generateRisks(),
        milestones: generateMilestones(newProjections)
      });
      setIsGenerating(false);
    }, 1000);
  };

  const generateSummary = (timeline) => {
    const final = timeline[timeline.length - 1];
    
    return {
      finalARR: final.arr,
      finalValuation: final.valuation,
      totalCustomers: final.customers,
      marketPenetration: final.marketPenetration,
      profitability: final.profit > 0,
      breakEvenMonth: timeline.find(p => p.profit > 0)?.month || 'Non atteint',
      roi: ((final.valuation - inputs.fundingNeeded) / inputs.fundingNeeded * 100).toFixed(0)
    };
  };

  const generateRisks = () => [
    {
      risk: 'Cycles de vente longs',
      probability: 'Elevee',
      impact: 'Moyen',
      mitigation: 'Commencer par petites communes, references solides'
    },
    {
      risk: 'Concurrence editeurs etablis',
      probability: 'Moyenne',
      impact: 'Eleve',
      mitigation: 'Differenciation IA + accessibilite, partenariats'
    },
    {
      risk: 'Changements reglementaires',
      probability: 'Faible',
      impact: 'Eleve',
      mitigation: 'Veille juridique, adaptabilite produit'
    },
    {
      risk: 'Difficultes recrutement',
      probability: 'Moyenne',
      impact: 'Moyen',
      mitigation: 'Equity attractive, remote work, formation'
    }
  ];

  const generateMilestones = (timeline) => [
    {
      milestone: 'Premiere commune pilote',
      month: 3,
      description: 'Validation product-market fit'
    },
    {
      milestone: 'Seed funding 1.5M euros',
      month: 6,
      description: 'Financement croissance equipe'
    },
    {
      milestone: '50 communes clientes',
      month: 12,
      description: 'Traction commerciale prouvee'
    },
    {
      milestone: 'Series A 10M euros',
      month: 18,
      description: 'Expansion nationale'
    },
    {
      milestone: '10M euros ARR',
      month: timeline.find(p => p.arr >= 10000000)?.month || 24,
      description: 'Scale-up confirme'
    }
  ];

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M euros`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K euros`;
    return `${num} euros`;
  };

  const exportBusinessPlan = () => {
    const plan = {
      inputs,
      projections,
      generatedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(plan, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'iapostemanager-business-plan.json';
    a.click();
  };

  useEffect(() => {
    generateBusinessPlan();
  }, [inputs]);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Generateur Business Plan IA
        </h1>
        <p className="text-lg text-gray-600">
          Projections financieres automatiques pour IAPosteManager
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Parametres</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Marche cible
            </label>
            <select
              value={inputs.targetMarket}
              onChange={(e) => setInputs({...inputs, targetMarket: e.target.value, pricing: marketSegments[e.target.value].avgPricing})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(marketSegments).map(([key, segment]) => (
                <option key={key} value={key}>{segment.name}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {marketSegments[inputs.targetMarket].description}
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prix mensuel (euros)
            </label>
            <input
              type="number"
              value={inputs.pricing}
              onChange={(e) => setInputs({...inputs, pricing: parseInt(e.target.value)})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Timeline (mois)
            </label>
            <input
              type="number"
              value={inputs.timeline}
              onChange={(e) => setInputs({...inputs, timeline: parseInt(e.target.value)})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Taille equipe
            </label>
            <input
              type="number"
              value={inputs.teamSize}
              onChange={(e) => setInputs({...inputs, teamSize: parseInt(e.target.value)})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Financement (euros)
            </label>
            <input
              type="number"
              value={inputs.fundingNeeded}
              onChange={(e) => setInputs({...inputs, fundingNeeded: parseInt(e.target.value)})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={generateBusinessPlan}
              disabled={isGenerating}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-semibold disabled:opacity-50"
            >
              {isGenerating ? 'Generation...' : 'Recalculer'}
            </button>
          </div>
        </div>
      </div>

      {projections.summary && (
        <>
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6">Resume Executif</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold">{formatNumber(projections.summary.finalARR)}</div>
                <div className="text-green-100">ARR Final</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{formatNumber(projections.summary.finalValuation)}</div>
                <div className="text-green-100">Valorisation</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{projections.summary.totalCustomers}</div>
                <div className="text-green-100">Clients</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{projections.summary.roi}%</div>
                <div className="text-green-100">ROI</div>
              </div>
            </div>
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/20 rounded-lg p-4">
                <div className="font-semibold">Penetration marche</div>
                <div className="text-2xl font-bold">{projections.summary.marketPenetration}%</div>
              </div>
              <div className="bg-white/20 rounded-lg p-4">
                <div className="font-semibold">Break-even</div>
                <div className="text-2xl font-bold">Mois {projections.summary.breakEvenMonth}</div>
              </div>
              <div className="bg-white/20 rounded-lg p-4">
                <div className="font-semibold">Rentabilite</div>
                <div className="text-2xl font-bold">{projections.summary.profitability ? 'OUI' : 'NON'}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Projections Timeline</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Mois</th>
                    <th className="text-left py-3 px-4">Clients</th>
                    <th className="text-left py-3 px-4">MRR</th>
                    <th className="text-left py-3 px-4">ARR</th>
                    <th className="text-left py-3 px-4">Profit</th>
                    <th className="text-left py-3 px-4">Valorisation</th>
                  </tr>
                </thead>
                <tbody>
                  {projections.timeline.map((period, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{period.month}</td>
                      <td className="py-3 px-4">{period.customers}</td>
                      <td className="py-3 px-4">{formatNumber(period.mrr)}</td>
                      <td className="py-3 px-4 font-semibold">{formatNumber(period.arr)}</td>
                      <td className={`py-3 px-4 font-semibold ${period.profit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatNumber(period.profit)}
                      </td>
                      <td className="py-3 px-4 font-bold text-purple-600">
                        {formatNumber(period.valuation)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Milestones Cles</h2>
            
            <div className="space-y-4">
              {projections.milestones.map((milestone, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg">
                  <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                    {milestone.month}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-blue-900">{milestone.milestone}</div>
                    <div className="text-sm text-blue-700">{milestone.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={exportBusinessPlan}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 rounded-lg font-bold flex items-center space-x-2 mx-auto"
            >
              <Download className="w-5 h-5" />
              <span>Exporter Business Plan</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default BusinessPlanGenerator;