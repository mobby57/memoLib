import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Edit, Trash2, Search, Mail, Phone, Building, Star,
  TrendingUp, BarChart3, Calendar, Target, Zap, Brain, Sparkles,
  Download, Upload, Share2, Archive, AlertCircle, Activity, Globe,
  Award, Heart, MessageSquare, Send, Copy, RefreshCw, Eye, Filter,
  Crown, Gem, Shield, Rocket, Wand2, Bot, Clock, CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // grid, list, analytics
  const [sortBy, setSortBy] = useState('name');
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [showImportModal, setShowImportModal] = useState(false);

  const [newContact, setNewContact] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    group: 'clients',
    notes: '',
    tags: [],
    priority: 'medium',
    source: 'manual',
    socialLinks: {
      linkedin: '',
      twitter: '',
      website: ''
    }
  });

  const groups = [
    { id: 'all', name: '🌟 Tous', color: 'gray', count: 0 },
    { id: 'vip', name: '👑 VIP', color: 'yellow', count: 0 },
    { id: 'clients', name: '💼 Clients', color: 'blue', count: 0 },
    { id: 'prospects', name: '🎯 Prospects', color: 'green', count: 0 },
    { id: 'partenaires', name: '🤝 Partenaires', color: 'purple', count: 0 },
    { id: 'fournisseurs', name: '🏭 Fournisseurs', color: 'orange', count: 0 },
    { id: 'equipe', name: '👥 Équipe', color: 'pink', count: 0 },
    { id: 'influenceurs', name: '⭐ Influenceurs', color: 'red', count: 0 }
  ];

  const revolutionaryContacts = [
    {
      id: 1,
      name: 'Marie Dupont',
      email: 'marie.dupont@mairie-paris.fr',
      phone: '+33 1 42 76 40 40',
      company: 'Mairie de Paris',
      position: 'Directrice Innovation',
      group: 'vip',
      priority: 'high',
      notes: 'Contact clé pour les projets municipaux. Très intéressée par l\'IA.',
      tags: ['IA', 'Innovation', 'Public', 'Décideur'],
      avatar: '👩💼',
      lastContact: new Date(Date.now() - 86400000 * 3).toISOString(),
      emailsSent: 12,
      emailsOpened: 11,
      emailsReplied: 8,
      conversionRate: 67,
      aiScore: 94,
      engagement: 'high',
      source: 'linkedin',
      socialLinks: {
        linkedin: 'https://linkedin.com/in/marie-dupont',
        twitter: '@marie_dupont',
        website: 'https://paris.fr'
      },
      created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
      lastActivity: 'Ouvert email "Proposition IA" il y a 2 jours',
      interests: ['Intelligence Artificielle', 'Smart City', 'Innovation Publique'],
      companySize: '10000+',
      industry: 'Public',
      location: 'Paris, France'
    },
    {
      id: 2,
      name: 'Jean Martin',
      email: 'j.martin@startup-ai.com',
      phone: '+33 6 12 34 56 78',
      company: 'Startup IA',
      position: 'CEO & Founder',
      group: 'clients',
      priority: 'high',
      notes: 'Entrepreneur visionnaire. Client depuis 2023. Très satisfait de nos services.',
      tags: ['CEO', 'Startup', 'IA', 'Visionnaire'],
      avatar: '👨💻',
      lastContact: new Date(Date.now() - 86400000 * 1).toISOString(),
      emailsSent: 24,
      emailsOpened: 22,
      emailsReplied: 18,
      conversionRate: 75,
      aiScore: 96,
      engagement: 'maximum',
      source: 'referral',
      socialLinks: {
        linkedin: 'https://linkedin.com/in/jean-martin-ceo',
        twitter: '@jeanmartin_ai',
        website: 'https://startup-ai.com'
      },
      created_at: new Date(Date.now() - 86400000 * 180).toISOString(),
      lastActivity: 'Répondu à email "Nouvelle fonctionnalité" hier',
      interests: ['Machine Learning', 'Deep Learning', 'Computer Vision'],
      companySize: '10-50',
      industry: 'Technology',
      location: 'Lyon, France'
    },
    {
      id: 3,
      name: 'Sophie Bernard',
      email: 's.bernard@conseil.fr',
      phone: '+33 1 45 67 89 12',
      company: 'Cabinet Conseil Excellence',
      position: 'Consultante Senior',
      group: 'prospects',
      priority: 'medium',
      notes: 'Consultante experte en transformation digitale. Prospect chaud.',
      tags: ['Conseil', 'Transformation', 'Expert', 'Prospect'],
      avatar: '👩🎓',
      lastContact: new Date(Date.now() - 86400000 * 7).toISOString(),
      emailsSent: 8,
      emailsOpened: 6,
      emailsReplied: 3,
      conversionRate: 38,
      aiScore: 82,
      engagement: 'medium',
      source: 'website',
      socialLinks: {
        linkedin: 'https://linkedin.com/in/sophie-bernard',
        twitter: '',
        website: 'https://conseil.fr'
      },
      created_at: new Date(Date.now() - 86400000 * 45).toISOString(),
      lastActivity: 'Ouvert email "Cas d\'usage" il y a 1 semaine',
      interests: ['Transformation Digitale', 'Change Management', 'Strategy'],
      companySize: '50-200',
      industry: 'Consulting',
      location: 'Paris, France'
    },
    {
      id: 4,
      name: 'Alexandre Dubois',
      email: 'a.dubois@tech-corp.com',
      phone: '+33 4 56 78 90 12',
      company: 'TechCorp International',
      position: 'CTO',
      group: 'partenaires',
      priority: 'high',
      notes: 'Partenaire technique stratégique. Collaboration sur projets IA.',
      tags: ['CTO', 'Partenaire', 'Technique', 'IA'],
      avatar: '👨🔬',
      lastContact: new Date(Date.now() - 86400000 * 2).toISOString(),
      emailsSent: 18,
      emailsOpened: 17,
      emailsReplied: 14,
      conversionRate: 78,
      aiScore: 91,
      engagement: 'high',
      source: 'conference',
      socialLinks: {
        linkedin: 'https://linkedin.com/in/alexandre-dubois-cto',
        twitter: '@alex_dubois_tech',
        website: 'https://techcorp.com'
      },
      created_at: new Date(Date.now() - 86400000 * 120).toISOString(),
      lastActivity: 'Répondu à email "Partenariat technique" il y a 2 jours',
      interests: ['Cloud Computing', 'DevOps', 'AI Infrastructure'],
      companySize: '1000+',
      industry: 'Technology',
      location: 'Toulouse, France'
    },
    {
      id: 5,
      name: 'Camille Rousseau',
      email: 'c.rousseau@media-influence.fr',
      phone: '+33 6 98 76 54 32',
      company: 'Media Influence',
      position: 'Influenceuse Tech',
      group: 'influenceurs',
      priority: 'medium',
      notes: 'Influenceuse tech avec 50K followers. Excellente pour la visibilité.',
      tags: ['Influenceuse', 'Tech', 'Social Media', 'Visibilité'],
      avatar: '👩🎬',
      lastContact: new Date(Date.now() - 86400000 * 14).toISOString(),
      emailsSent: 6,
      emailsOpened: 5,
      emailsReplied: 2,
      conversionRate: 33,
      aiScore: 76,
      engagement: 'medium',
      source: 'social_media',
      socialLinks: {
        linkedin: 'https://linkedin.com/in/camille-rousseau',
        twitter: '@camille_tech',
        website: 'https://media-influence.fr'
      },
      created_at: new Date(Date.now() - 86400000 * 60).toISOString(),
      lastActivity: 'Ouvert email "Collaboration" il y a 2 semaines',
      interests: ['Tech Trends', 'Social Media', 'Content Creation'],
      companySize: '1-10',
      industry: 'Media',
      location: 'Nice, France'
    }
  ];

  useEffect(() => {
    loadContacts();
    loadAnalytics();
    loadAiInsights();
  }, []);

  const loadContacts = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setContacts(revolutionaryContacts);
      
      // Update group counts
      const updatedGroups = groups.map(group => ({
        ...group,
        count: group.id === 'all' 
          ? revolutionaryContacts.length 
          : revolutionaryContacts.filter(c => c.group === group.id).length
      }));
      
    } catch (error) {
      console.warn('Erreur chargement contacts:', error);
      setContacts(revolutionaryContacts);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      setAnalytics({
        totalContacts: revolutionaryContacts.length,
        avgEngagement: 78.4,
        avgConversionRate: 58.2,
        avgAiScore: 87.8,
        totalEmailsSent: revolutionaryContacts.reduce((sum, c) => sum + (c.emailsSent || 0), 0),
        totalEmailsOpened: revolutionaryContacts.reduce((sum, c) => sum + (c.emailsOpened || 0), 0),
        totalReplies: revolutionaryContacts.reduce((sum, c) => sum + (c.emailsReplied || 0), 0),
        topPerformer: revolutionaryContacts[1],
        groupDistribution: groups.filter(g => g.id !== 'all').map(group => ({
          name: group.name,
          count: revolutionaryContacts.filter(c => c.group === group.id).length,
          color: group.color
        })),
        engagementTrend: '+12%',
        newContactsThisMonth: 3,
        activeContacts: revolutionaryContacts.filter(c => c.engagement === 'high' || c.engagement === 'maximum').length
      });
    } catch (error) {
      console.warn('Erreur analytics:', error);
    }
  };

  const loadAiInsights = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1200));
      setAiInsights({
        recommendations: [
          {
            type: 'engagement',
            title: 'Réactiver les contacts inactifs',
            description: '3 contacts VIP n\'ont pas été contactés depuis 2 semaines',
            impact: 'high',
            icon: Target,
            action: 'Envoyer campagne de réactivation'
          },
          {
            type: 'segmentation',
            title: 'Optimiser la segmentation',
            description: 'Les prospects tech ont +45% de taux de conversion',
            impact: 'medium',
            icon: Brain,
            action: 'Créer segment "Tech Prospects"'
          },
          {
            type: 'timing',
            title: 'Meilleur timing d\'envoi',
            description: 'Vos contacts répondent 2x plus le mardi à 10h',
            impact: 'medium',
            icon: Clock,
            action: 'Programmer envois automatiques'
          }
        ],
        predictions: {
          nextWeekConversions: 3,
          bestProspects: ['Sophie Bernard', 'Camille Rousseau'],
          riskOfChurn: ['Alexandre Dubois'],
          recommendedActions: 5
        },
        trends: [
          { metric: 'Engagement', value: '+12%', trend: 'up' },
          { metric: 'Conversion', value: '+8%', trend: 'up' },
          { metric: 'Score IA moyen', value: '+15%', trend: 'up' }
        ]
      });
    } catch (error) {
      console.warn('Erreur AI insights:', error);
    }
  };

  const filteredContacts = contacts
    .filter(contact => {
      const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           contact.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           contact.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesGroup = selectedGroup === 'all' || contact.group === selectedGroup;
      return matchesSearch && matchesGroup;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'company': return a.company.localeCompare(b.company);
        case 'engagement': 
          const engagementOrder = { maximum: 4, high: 3, medium: 2, low: 1 };
          return (engagementOrder[b.engagement] || 0) - (engagementOrder[a.engagement] || 0);
        case 'aiScore': return (b.aiScore || 0) - (a.aiScore || 0);
        case 'lastContact': return new Date(b.lastContact) - new Date(a.lastContact);
        default: return 0;
      }
    });

  const handleCreateContact = async () => {
    if (!newContact.name || !newContact.email) {
      toast.error('Nom et email sont requis');
      return;
    }

    try {
      const contactData = {
        ...newContact,
        id: Date.now(),
        created_at: new Date().toISOString(),
        lastContact: new Date().toISOString(),
        emailsSent: 0,
        emailsOpened: 0,
        emailsReplied: 0,
        conversionRate: 0,
        aiScore: Math.floor(Math.random() * 20) + 70,
        engagement: 'new',
        avatar: getAvatarForContact(newContact.name, newContact.group)
      };

      setContacts([contactData, ...contacts]);
      toast.success('🎉 Contact révolutionnaire créé !');
      setShowCreateModal(false);
      setNewContact({
        name: '', email: '', phone: '', company: '', position: '', group: 'clients',
        notes: '', tags: [], priority: 'medium', source: 'manual', socialLinks: { linkedin: '', twitter: '', website: '' }
      });
    } catch (error) {
      toast.error('Erreur lors de la création');
    }
  };

  const getAvatarForContact = (name, group) => {
    const avatars = {
      vip: ['👑', '💎', '⭐', '🏆'],
      clients: ['👤', '👨💼', '👩💼', '🧑💼'],
      prospects: ['🎯', '👀', '🔍', '💡'],
      partenaires: ['🤝', '🔗', '🌟', '💫'],
      fournisseurs: ['🏭', '📦', '🚚', '⚙️'],
      equipe: ['👥', '🧑‍💻', '👩‍💻', '👨‍💻'],
      influenceurs: ['📱', '🎬', '📸', '🎭']
    };
    
    const groupAvatars = avatars[group] || avatars.clients;
    return groupAvatars[Math.floor(Math.random() * groupAvatars.length)];
  };

  const handleDeleteContact = async (id) => {
    if (!confirm('Supprimer ce contact révolutionnaire ?')) return;

    try {
      setContacts(contacts.filter(c => c.id !== id));
      toast.success('Contact supprimé');
    } catch (error) {
      toast.error('Erreur suppression');
    }
  };

  const sendEmail = (contact) => {
    const params = new URLSearchParams({
      to: contact.email,
      subject: `Email à ${contact.name}`,
      body: `Bonjour ${contact.name},\n\n`,
      source: 'contacts'
    });
    
    window.open(`/compose?${params.toString()}`, '_blank');
  };

  const exportContacts = () => {
    const csvContent = contacts.map(contact => 
      `"${contact.name}","${contact.email}","${contact.company}","${contact.group}","${contact.aiScore || 'N/A'}"`
    ).join('\n');
    
    const blob = new Blob([`Nom,Email,Entreprise,Groupe,Score IA\n${csvContent}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contacts-revolutionnaires.csv';
    a.click();
    
    toast.success('Export réalisé avec succès !');
  };

  const getEngagementColor = (engagement) => {
    switch (engagement) {
      case 'maximum': return 'text-purple-600 bg-purple-100';
      case 'high': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-red-600 bg-red-100';
      case 'new': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getAiScoreColor = (score) => {
    if (score >= 90) return 'text-purple-600 bg-purple-100';
    if (score >= 80) return 'text-blue-600 bg-blue-100';
    if (score >= 70) return 'text-green-600 bg-green-100';
    return 'text-gray-600 bg-gray-100';
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-12 bg-gradient-to-r from-purple-200 to-pink-200 rounded-2xl"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-80 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      {/* Header révolutionnaire */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Contacts IA Révolutionnaires</h1>
              <p className="opacity-90">Gestion intelligente de votre réseau professionnel</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-all"
            >
              <BarChart3 className="w-4 h-4" />
              Analytics
            </button>
            
            <button
              onClick={exportContacts}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-all"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-all"
            >
              <Plus className="w-4 h-4" />
              Nouveau Contact
            </button>
          </div>
        </div>
      </div>

      {/* Analytics Dashboard */}
      {showAnalytics && analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Métriques principales */}
          <div className="lg:col-span-2 bg-white shadow-2xl rounded-2xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              Performance Globale
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center border-2 border-blue-200">
                <Users className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-600">{analytics.totalContacts}</p>
                <p className="text-xs text-blue-700">Total contacts</p>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center border-2 border-green-200">
                <Activity className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-600">{analytics.avgEngagement}%</p>
                <p className="text-xs text-green-700">Engagement moyen</p>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 text-center border-2 border-purple-200">
                <Target className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-purple-600">{analytics.avgConversionRate}%</p>
                <p className="text-xs text-purple-700">Conversion moyenne</p>
              </div>
              
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 text-center border-2 border-orange-200">
                <Brain className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-orange-600">{analytics.avgAiScore}%</p>
                <p className="text-xs text-orange-700">Score IA moyen</p>
              </div>
            </div>

            {/* Distribution par groupe */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {analytics.groupDistribution.map(group => (
                <div key={group.name} className={`bg-${group.color}-50 rounded-xl p-3 border-2 border-${group.color}-200`}>
                  <p className="text-lg font-bold text-gray-900">{group.count}</p>
                  <p className="text-xs text-gray-600">{group.name}</p>
                </div>
              ))}
            </div>
          </div>

          {/* AI Insights */}
          {aiInsights && (
            <div className="bg-white shadow-2xl rounded-2xl p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-purple-600" />
                Insights IA
              </h2>
              
              <div className="space-y-4">
                {aiInsights.recommendations.map((rec, idx) => {
                  const IconComponent = rec.icon;
                  return (
                    <div key={idx} className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-200">
                      <div className="flex items-start gap-3">
                        <IconComponent className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm">{rec.title}</h4>
                          <p className="text-xs text-gray-600 mt-1">{rec.description}</p>
                          <button className="mt-2 px-3 py-1 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700 transition-colors">
                            {rec.action}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <h4 className="font-bold text-gray-900 text-sm mb-3">Prédictions IA</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Conversions prévues</span>
                    <span className="font-bold text-green-600">{aiInsights.predictions.nextWeekConversions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Meilleurs prospects</span>
                    <span className="font-bold text-blue-600">{aiInsights.predictions.bestProspects.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Actions recommandées</span>
                    <span className="font-bold text-purple-600">{aiInsights.predictions.recommendedActions}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filtres avancés */}
      <div className="bg-white shadow-2xl rounded-2xl p-6">
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex-1 min-w-64 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, email, entreprise, tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
          >
            {groups.map(group => (
              <option key={group.id} value={group.id}>
                {group.name} {group.count > 0 && `(${group.count})`}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
          >
            <option value="name">📝 Nom</option>
            <option value="company">🏢 Entreprise</option>
            <option value="engagement">📊 Engagement</option>
            <option value="aiScore">🤖 Score IA</option>
            <option value="lastContact">📅 Dernier contact</option>
          </select>

          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-3 rounded-xl border-2 transition-all ${
                viewMode === 'grid' ? 'border-purple-500 bg-purple-50' : 'border-gray-300'
              }`}
            >
              <Filter className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-3 rounded-xl border-2 transition-all ${
                viewMode === 'list' ? 'border-purple-500 bg-purple-50' : 'border-gray-300'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Contacts révolutionnaires */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredContacts.length > 0 ? (
          filteredContacts.map(contact => (
            <div key={contact.id} className="bg-white shadow-2xl rounded-2xl overflow-hidden hover:shadow-3xl transition-all transform hover:-translate-y-1">
              {/* Header avec avatar et statut */}
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 border-b">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{contact.avatar}</div>
                    <div>
                      <h3 className="font-bold text-gray-900">{contact.name}</h3>
                      <p className="text-sm text-gray-600">{contact.position}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1">
                    {contact.group === 'vip' && (
                      <Crown className="w-5 h-5 text-yellow-500" />
                    )}
                    <span className={`text-xs font-bold ${getPriorityColor(contact.priority)}`}>
                      {contact.priority === 'high' ? '🔥' : contact.priority === 'medium' ? '⚡' : '📝'}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${
                    groups.find(g => g.id === contact.group)?.color === 'yellow' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                    groups.find(g => g.id === contact.group)?.color === 'blue' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                    groups.find(g => g.id === contact.group)?.color === 'green' ? 'bg-green-100 text-green-700 border-green-200' :
                    groups.find(g => g.id === contact.group)?.color === 'purple' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                    groups.find(g => g.id === contact.group)?.color === 'orange' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                    groups.find(g => g.id === contact.group)?.color === 'pink' ? 'bg-pink-100 text-pink-700 border-pink-200' :
                    groups.find(g => g.id === contact.group)?.color === 'red' ? 'bg-red-100 text-red-700 border-red-200' :
                    'bg-gray-100 text-gray-700 border-gray-200'
                  }`}>
                    {groups.find(g => g.id === contact.group)?.name || contact.group}
                  </span>
                  
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${getEngagementColor(contact.engagement)}`}>
                    {contact.engagement}
                  </span>
                </div>
              </div>

              {/* Informations de contact */}
              <div className="p-4 space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700 truncate">{contact.email}</span>
                  </div>
                  
                  {contact.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">{contact.phone}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Building className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700 truncate">{contact.company}</span>
                  </div>
                </div>

                {/* Métriques de performance */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-3 border-2 border-green-200">
                  <p className="text-xs font-bold text-gray-700 mb-2">📊 Performance:</p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-sm font-bold text-green-600">{contact.emailsOpened || 0}</p>
                      <p className="text-xs text-gray-600">Ouvertures</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-blue-600">{contact.emailsReplied || 0}</p>
                      <p className="text-xs text-gray-600">Réponses</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-purple-600">{contact.conversionRate || 0}%</p>
                      <p className="text-xs text-gray-600">Conversion</p>
                    </div>
                  </div>
                </div>

                {/* Tags et Score IA */}
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {contact.tags?.slice(0, 2).map(tag => (
                      <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                        #{tag}
                      </span>
                    ))}
                    {contact.tags?.length > 2 && (
                      <span className="text-xs text-gray-500">+{contact.tags.length - 2}</span>
                    )}
                  </div>
                  
                  {contact.aiScore && (
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getAiScoreColor(contact.aiScore)}`}>
                      🤖 {contact.aiScore}%
                    </span>
                  )}
                </div>

                {/* Dernière activité */}
                {contact.lastActivity && (
                  <div className="bg-blue-50 rounded-xl p-3 border-2 border-blue-200">
                    <p className="text-xs text-blue-700">
                      <Activity className="w-3 h-3 inline mr-1" />
                      {contact.lastActivity}
                    </p>
                  </div>
                )}

                {/* Notes */}
                {contact.notes && (
                  <div>
                    <p className="text-sm text-gray-600 line-clamp-2">{contact.notes}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="bg-gray-50 px-4 py-3 flex justify-between items-center border-t">
                <div className="flex gap-2">
                  <button
                    onClick={() => sendEmail(contact)}
                    className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all text-sm font-medium"
                  >
                    <Mail className="w-3 h-3" />
                    Email
                  </button>
                  
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${contact.name}\n${contact.email}\n${contact.company}`);
                      toast.success('Contact copié !');
                    }}
                    className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-all text-sm font-medium"
                  >
                    <Copy className="w-3 h-3" />
                    Copier
                  </button>
                </div>
                
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditingContact(contact)}
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Modifier"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => handleDeleteContact(contact.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 bg-white rounded-2xl shadow-lg">
            <Users className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Aucun contact trouvé</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || selectedGroup !== 'all'
                ? 'Essayez de modifier vos filtres de recherche.'
                : 'Commencez par ajouter votre premier contact révolutionnaire.'}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all font-bold"
            >
              <Plus className="w-4 h-4 mr-2 inline" />
              Créer un Contact
            </button>
          </div>
        )}
      </div>

      {/* Modal de création révolutionnaire */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-t-2xl">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="w-6 h-6" />
                Créer un Contact Révolutionnaire
              </h3>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">👤 Nom complet *</label>
                  <input
                    type="text"
                    value={newContact.name}
                    onChange={(e) => setNewContact({...newContact, name: e.target.value})}
                    className="w-full border-2 border-gray-300 rounded-xl py-3 px-4 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Ex: Marie Dupont"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">📧 Email *</label>
                  <input
                    type="email"
                    value={newContact.email}
                    onChange={(e) => setNewContact({...newContact, email: e.target.value})}
                    className="w-full border-2 border-gray-300 rounded-xl py-3 px-4 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="marie.dupont@exemple.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">📞 Téléphone</label>
                  <input
                    type="tel"
                    value={newContact.phone}
                    onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
                    className="w-full border-2 border-gray-300 rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+33 1 23 45 67 89"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">🏢 Entreprise</label>
                  <input
                    type="text"
                    value={newContact.company}
                    onChange={(e) => setNewContact({...newContact, company: e.target.value})}
                    className="w-full border-2 border-gray-300 rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nom de l'entreprise"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">💼 Poste</label>
                  <input
                    type="text"
                    value={newContact.position}
                    onChange={(e) => setNewContact({...newContact, position: e.target.value})}
                    className="w-full border-2 border-gray-300 rounded-xl py-3 px-4 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Directeur, CEO, Manager..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">🎯 Groupe</label>
                  <select
                    value={newContact.group}
                    onChange={(e) => setNewContact({...newContact, group: e.target.value})}
                    className="w-full border-2 border-gray-300 rounded-xl py-3 px-4 focus:ring-2 focus:ring-purple-500"
                  >
                    {groups.filter(g => g.id !== 'all').map(group => (
                      <option key={group.id} value={group.id}>{group.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">⚡ Priorité</label>
                  <select
                    value={newContact.priority}
                    onChange={(e) => setNewContact({...newContact, priority: e.target.value})}
                    className="w-full border-2 border-gray-300 rounded-xl py-3 px-4 focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="low">📝 Faible</option>
                    <option value="medium">⚡ Moyenne</option>
                    <option value="high">🔥 Élevée</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">📍 Source</label>
                  <select
                    value={newContact.source}
                    onChange={(e) => setNewContact({...newContact, source: e.target.value})}
                    className="w-full border-2 border-gray-300 rounded-xl py-3 px-4 focus:ring-2 focus:ring-green-500"
                  >
                    <option value="manual">✋ Manuel</option>
                    <option value="linkedin">💼 LinkedIn</option>
                    <option value="website">🌐 Site web</option>
                    <option value="referral">🤝 Recommandation</option>
                    <option value="conference">🎤 Conférence</option>
                    <option value="social_media">📱 Réseaux sociaux</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">📝 Notes</label>
                <textarea
                  rows={4}
                  value={newContact.notes}
                  onChange={(e) => setNewContact({...newContact, notes: e.target.value})}
                  className="w-full border-2 border-gray-300 rounded-xl py-3 px-4 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Informations importantes sur ce contact..."
                />
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreateContact}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all font-bold"
                >
                  🚀 Créer le Contact
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}