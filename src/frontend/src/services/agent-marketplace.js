class AgentMarketplace {
  constructor() {
    this.agents = this.initializeAgents();
    this.categories = ['Sales', 'Support', 'Marketing', 'HR', 'Legal', 'Custom'];
    this.revenueShare = { creators: 70, platform: 30 };
  }

  initializeAgents() {
    return [
      {
        id: 'sales-closer',
        name: 'Sales Closer Pro',
        category: 'Sales',
        description: 'Agent IA spécialisé dans la conversion +340%',
        price: 49,
        rating: 4.9,
        downloads: 12500,
        creator: 'IAPosteManager',
        features: ['Conversion +340%', 'Lead scoring', 'A/B testing auto'],
        revenue: 612500,
        certified: true
      },
      {
        id: 'support-ninja',
        name: 'Support Ninja',
        category: 'Support',
        description: 'Résolution automatique 89% des tickets',
        price: 29,
        rating: 4.8,
        downloads: 8900,
        creator: 'TechSupport AI',
        features: ['89% automatisation', 'Multi-langues', '24/7'],
        revenue: 258100,
        certified: true
      },
      {
        id: 'hr-recruiter',
        name: 'HR Recruiter AI',
        category: 'HR',
        description: 'Recrutement et onboarding automatisés',
        price: 39,
        rating: 4.7,
        downloads: 5600,
        creator: 'HRTech Solutions',
        features: ['CV screening', 'Interview auto', 'Onboarding'],
        revenue: 218400,
        certified: true
      },
      {
        id: 'legal-advisor',
        name: 'Legal Advisor Pro',
        category: 'Legal',
        description: 'Conformité RGPD et juridique automatique',
        price: 79,
        rating: 4.9,
        downloads: 3200,
        creator: 'LegalTech AI',
        features: ['RGPD compliance', 'Contract review', 'Risk analysis'],
        revenue: 252800,
        certified: true
      },
      {
        id: 'marketing-genius',
        name: 'Marketing Genius',
        category: 'Marketing',
        description: 'Campagnes personnalisées à l\'échelle',
        price: 59,
        rating: 4.8,
        downloads: 7800,
        creator: 'MarketingAI Corp',
        features: ['Segmentation auto', 'Content generation', 'ROI tracking'],
        revenue: 460200,
        certified: true
      }
    ];
  }

  getAgents(filters = {}) {
    let filtered = [...this.agents];

    if (filters.category) {
      filtered = filtered.filter(agent => agent.category === filters.category);
    }

    if (filters.priceRange) {
      filtered = filtered.filter(agent => 
        agent.price >= filters.priceRange.min && 
        agent.price <= filters.priceRange.max
      );
    }

    if (filters.rating) {
      filtered = filtered.filter(agent => agent.rating >= filters.rating);
    }

    if (filters.certified) {
      filtered = filtered.filter(agent => agent.certified);
    }

    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(agent =>
        agent.name.toLowerCase().includes(search) ||
        agent.description.toLowerCase().includes(search) ||
        agent.features.some(feature => feature.toLowerCase().includes(search))
      );
    }

    // Tri
    if (filters.sortBy) {
      filtered.sort((a, b) => {
        switch (filters.sortBy) {
          case 'price-asc': return a.price - b.price;
          case 'price-desc': return b.price - a.price;
          case 'rating': return b.rating - a.rating;
          case 'downloads': return b.downloads - a.downloads;
          case 'revenue': return b.revenue - a.revenue;
          default: return 0;
        }
      });
    }

    return filtered;
  }

  getAgentById(id) {
    return this.agents.find(agent => agent.id === id);
  }

  purchaseAgent(agentId, userId) {
    const agent = this.getAgentById(agentId);
    if (!agent) throw new Error('Agent non trouvé');

    // Simulation d'achat
    const purchase = {
      id: `purchase_${Date.now()}`,
      agentId,
      userId,
      price: agent.price,
      date: new Date(),
      status: 'completed'
    };

    // Mise à jour des statistiques
    agent.downloads += 1;
    agent.revenue += agent.price;

    return {
      purchase,
      agent,
      message: `Agent ${agent.name} acheté avec succès !`
    };
  }

  getMarketplaceStats() {
    const totalAgents = this.agents.length;
    const totalDownloads = this.agents.reduce((sum, agent) => sum + agent.downloads, 0);
    const totalRevenue = this.agents.reduce((sum, agent) => sum + agent.revenue, 0);
    const avgRating = this.agents.reduce((sum, agent) => sum + agent.rating, 0) / totalAgents;
    const platformRevenue = totalRevenue * (this.revenueShare.platform / 100);
    const creatorRevenue = totalRevenue * (this.revenueShare.creators / 100);

    return {
      totalAgents,
      totalDownloads,
      totalRevenue,
      avgRating: avgRating.toFixed(1),
      platformRevenue,
      creatorRevenue,
      categories: this.categories.length,
      certifiedAgents: this.agents.filter(a => a.certified).length
    };
  }

  getTopAgents(limit = 5) {
    return [...this.agents]
      .sort((a, b) => b.downloads - a.downloads)
      .slice(0, limit);
  }

  getRevenueProjection(months = 12) {
    const currentMonthlyRevenue = this.getMarketplaceStats().totalRevenue / 6; // 6 mois simulés
    const growthRate = 1.15; // 15% croissance mensuelle

    const projection = [];
    let revenue = currentMonthlyRevenue;

    for (let i = 1; i <= months; i++) {
      revenue *= growthRate;
      projection.push({
        month: i,
        revenue: Math.round(revenue),
        platformShare: Math.round(revenue * 0.3),
        creatorShare: Math.round(revenue * 0.7)
      });
    }

    return projection;
  }

  createAgent(agentData, creatorId) {
    const newAgent = {
      id: `agent_${Date.now()}`,
      ...agentData,
      creator: creatorId,
      downloads: 0,
      revenue: 0,
      rating: 0,
      certified: false,
      createdAt: new Date()
    };

    this.agents.push(newAgent);
    return newAgent;
  }

  submitForCertification(agentId) {
    const agent = this.getAgentById(agentId);
    if (!agent) throw new Error('Agent non trouvé');

    // Simulation du processus de certification
    const certificationProcess = {
      agentId,
      status: 'pending',
      submittedAt: new Date(),
      estimatedCompletion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
      requirements: [
        'Tests de performance',
        'Audit de sécurité',
        'Validation qualité',
        'Documentation complète'
      ]
    };

    return certificationProcess;
  }
}

// Hook React pour la marketplace
export const useAgentMarketplace = () => {
  const [marketplace] = useState(() => new AgentMarketplace());
  const [agents, setAgents] = useState([]);
  const [filters, setFilters] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const loadAgents = (newFilters = {}) => {
    setIsLoading(true);
    setFilters(newFilters);
    
    setTimeout(() => {
      const filteredAgents = marketplace.getAgents(newFilters);
      setAgents(filteredAgents);
      setIsLoading(false);
    }, 500);
  };

  const purchaseAgent = async (agentId, userId) => {
    try {
      const result = marketplace.purchaseAgent(agentId, userId);
      loadAgents(filters); // Refresh pour mettre à jour les stats
      return result;
    } catch (error) {
      throw error;
    }
  };

  const getStats = () => marketplace.getMarketplaceStats();
  const getTopAgents = (limit) => marketplace.getTopAgents(limit);
  const getProjection = (months) => marketplace.getRevenueProjection(months);

  useEffect(() => {
    loadAgents();
  }, []);

  return {
    agents,
    filters,
    isLoading,
    loadAgents,
    purchaseAgent,
    getStats,
    getTopAgents,
    getProjection,
    marketplace
  };
};

export default AgentMarketplace;