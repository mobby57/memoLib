import React, { useState, useEffect } from 'react';
import { Search, Filter, Star, Download, ShoppingCart, TrendingUp, Award, Users } from 'lucide-react';
import { useAgentMarketplace } from '../services/agent-marketplace';

const AgentMarketplaceComponent = () => {
  const {
    agents,
    filters,
    isLoading,
    loadAgents,
    purchaseAgent,
    getStats,
    getTopAgents,
    getProjection
  } = useAgentMarketplace();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100 });
  const [sortBy, setSortBy] = useState('downloads');
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState({});
  const [selectedAgent, setSelectedAgent] = useState(null);

  const categories = ['Tous', 'Sales', 'Support', 'Marketing', 'HR', 'Legal', 'Custom'];

  useEffect(() => {
    const newFilters = {
      search: searchTerm,
      category: selectedCategory || undefined,
      priceRange: priceRange.min > 0 || priceRange.max < 100 ? priceRange : undefined,
      sortBy,
      certified: true
    };
    loadAgents(newFilters);
  }, [searchTerm, selectedCategory, priceRange, sortBy]);

  useEffect(() => {
    setStats(getStats());
  }, [agents]);

  const handlePurchase = async (agentId) => {
    try {
      const result = await purchaseAgent(agentId, 'user_123');
      alert(result.message);
    } catch (error) {
      alert('Erreur lors de l\'achat: ' + error.message);
    }
  };

  const formatPrice = (price) => `${price}€/mois`;
  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getCategoryIcon = (category) => {
    const icons = {
      Sales: '💰',
      Support: '🎧',
      Marketing: '📈',
      HR: '👥',
      Legal: '⚖️',
      Custom: '🔧'
    };
    return icons[category] || '🤖';
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          🤖 Marketplace d'Agents IA
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          Découvrez et achetez des agents IA spécialisés créés par la communauté
        </p>
        
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => setShowStats(!showStats)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            📊 Statistiques
          </button>
          <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg">
            Revenue Share: 70% Créateurs / 30% Plateforme
          </div>
        </div>
      </div>

      {/* Statistiques */}
      {showStats && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">📈 Statistiques Marketplace</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.totalAgents}</div>
              <div className="text-gray-600">Agents Disponibles</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {formatNumber(stats.totalDownloads)}
              </div>
              <div className="text-gray-600">Téléchargements</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {formatNumber(stats.totalRevenue)}€
              </div>
              <div className="text-gray-600">Chiffre d'Affaires</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">{stats.avgRating}</div>
              <div className="text-gray-600">Note Moyenne</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Revenue Plateforme</h3>
              <div className="text-2xl font-bold text-blue-600">
                {formatNumber(stats.platformRevenue)}€
              </div>
              <div className="text-sm text-blue-700">30% du total</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2">Revenue Créateurs</h3>
              <div className="text-2xl font-bold text-green-600">
                {formatNumber(stats.creatorRevenue)}€
              </div>
              <div className="text-sm text-green-700">70% du total</div>
            </div>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un agent..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Catégorie */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {categories.map(category => (
              <option key={category} value={category === 'Tous' ? '' : category}>
                {category}
              </option>
            ))}
          </select>

          {/* Prix */}
          <div className="flex space-x-2">
            <input
              type="number"
              placeholder="Min €"
              value={priceRange.min}
              onChange={(e) => setPriceRange({...priceRange, min: parseInt(e.target.value) || 0})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="number"
              placeholder="Max €"
              value={priceRange.max}
              onChange={(e) => setPriceRange({...priceRange, max: parseInt(e.target.value) || 100})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Tri */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="downloads">Plus téléchargés</option>
            <option value="rating">Mieux notés</option>
            <option value="price-asc">Prix croissant</option>
            <option value="price-desc">Prix décroissant</option>
            <option value="revenue">Plus rentables</option>
          </select>
        </div>
      </div>

      {/* Liste des agents */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des agents...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map(agent => (
            <div key={agent.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              {/* Header */}
              <div className="p-6 pb-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl">{getCategoryIcon(agent.category)}</div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{agent.name}</h3>
                      <p className="text-sm text-gray-600">{agent.category}</p>
                    </div>
                  </div>
                  {agent.certified && (
                    <Award className="h-6 w-6 text-yellow-500" title="Agent Certifié" />
                  )}
                </div>

                <p className="text-gray-700 mb-4">{agent.description}</p>

                {/* Features */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {agent.features.slice(0, 3).map((feature, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                      {feature}
                    </span>
                  ))}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                  <div>
                    <div className="flex items-center justify-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="font-semibold">{agent.rating}</span>
                    </div>
                    <div className="text-xs text-gray-600">Note</div>
                  </div>
                  <div>
                    <div className="flex items-center justify-center space-x-1">
                      <Download className="h-4 w-4 text-green-500" />
                      <span className="font-semibold">{formatNumber(agent.downloads)}</span>
                    </div>
                    <div className="text-xs text-gray-600">Téléchargements</div>
                  </div>
                  <div>
                    <div className="flex items-center justify-center space-x-1">
                      <TrendingUp className="h-4 w-4 text-purple-500" />
                      <span className="font-semibold">{formatNumber(agent.revenue)}€</span>
                    </div>
                    <div className="text-xs text-gray-600">Revenue</div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {formatPrice(agent.price)}
                    </div>
                    <div className="text-sm text-gray-600">par {agent.creator}</div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSelectedAgent(agent)}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg text-sm"
                    >
                      Détails
                    </button>
                    <button
                      onClick={() => handlePurchase(agent.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm flex items-center space-x-1"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      <span>Acheter</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal détails agent */}
      {selectedAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="text-4xl">{getCategoryIcon(selectedAgent.category)}</div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedAgent.name}</h2>
                    <p className="text-gray-600">{selectedAgent.category} • par {selectedAgent.creator}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAgent(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                <p className="text-gray-700">{selectedAgent.description}</p>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Fonctionnalités</h3>
                <div className="grid grid-cols-1 gap-2">
                  {selectedAgent.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Statistiques</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Note:</span>
                      <span className="font-semibold">{selectedAgent.rating}/5</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Téléchargements:</span>
                      <span className="font-semibold">{formatNumber(selectedAgent.downloads)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Revenue généré:</span>
                      <span className="font-semibold">{formatNumber(selectedAgent.revenue)}€</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Tarification</h4>
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {formatPrice(selectedAgent.price)}
                  </div>
                  <div className="text-sm text-blue-700">
                    • Essai gratuit 7 jours<br/>
                    • Support inclus<br/>
                    • Mises à jour automatiques
                  </div>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => handlePurchase(selectedAgent.id)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center space-x-2"
                >
                  <ShoppingCart className="h-5 w-5" />
                  <span>Acheter Maintenant</span>
                </button>
                <button
                  onClick={() => setSelectedAgent(null)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Call to action créateurs */}
      <div className="mt-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white p-8 text-center">
        <h3 className="text-2xl font-bold mb-4">🚀 Devenez Créateur d'Agents IA</h3>
        <p className="text-lg mb-6 opacity-90">
          Créez et vendez vos propres agents IA. Gardez 70% des revenus !
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <div className="text-3xl font-bold">70%</div>
            <div className="opacity-90">Revenue Share</div>
          </div>
          <div>
            <div className="text-3xl font-bold">$2B+</div>
            <div className="opacity-90">Marché Potentiel</div>
          </div>
          <div>
            <div className="text-3xl font-bold">24/7</div>
            <div className="opacity-90">Support Technique</div>
          </div>
        </div>
        <button className="bg-white text-purple-600 px-8 py-3 rounded-lg font-bold hover:bg-gray-100">
          Commencer à Créer
        </button>
      </div>
    </div>
  );
};

export default AgentMarketplaceComponent;