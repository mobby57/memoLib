import React, { useState, useEffect } from 'react';
import { 
  Clock, Mail, CheckCircle, XCircle, Search, Eye, RotateCcw, Filter,
  TrendingUp, BarChart3, Calendar, Users, Target, Zap, Brain, Star,
  Download, Share2, Archive, Trash2, AlertCircle, Activity, Globe,
  Sparkles, Award, Heart, MessageSquare, Send, Copy, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function History() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [analytics, setAnalytics] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // list, grid, timeline
  const [sortBy, setSortBy] = useState('date');
  const [aiInsights, setAiInsights] = useState(null);
  const itemsPerPage = 12;

  const revolutionaryEmails = [
    {
      id: 1,
      to: 'marie.dupont@mairie-paris.fr',
      cc: '',
      bcc: '',
      subject: '🚀 Proposition IA Révolutionnaire - ROI +340% Garanti',
      status: 'delivered',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      body: 'Bonjour Marie,\n\n🎯 OPPORTUNITÉ EXCLUSIVE : Votre concurrent direct vient d\'augmenter ses ventes de 340% grâce à l\'IA...',
      size: '4.2 KB',
      read: true,
      openRate: 94,
      responseRate: 67,
      clickRate: 45,
      template: 'Proposition IA Révolutionnaire',
      aiScore: 98,
      sentiment: 'positive',
      priority: 'high',
      category: 'commercial',
      tags: ['IA', 'ROI', 'urgence', 'exclusivité'],
      recipient: {
        name: 'Marie Dupont',
        company: 'Mairie de Paris',
        avatar: '👩💼',
        vip: true
      },
      performance: {
        deliveryTime: 2.3,
        engagement: 'high',
        conversionProbability: 78
      }
    },
    {
      id: 2,
      to: 'j.martin@startup-ai.com',
      subject: '💎 Suivi VIP Émotionnel - Votre satisfaction priorité absolue',
      status: 'opened',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      body: 'Cher Jean,\n\nJ\'espère sincèrement que vous allez bien et que votre famille se porte à merveille...',
      size: '3.8 KB',
      read: true,
      openRate: 96,
      responseRate: 78,
      clickRate: 52,
      template: 'Suivi VIP Émotionnel',
      aiScore: 96,
      sentiment: 'empathetic',
      priority: 'high',
      category: 'support',
      tags: ['VIP', 'empathie', 'personnalisation'],
      recipient: {
        name: 'Jean Martin',
        company: 'Startup IA',
        avatar: '👨💻',
        vip: true
      },
      performance: {
        deliveryTime: 1.8,
        engagement: 'maximum',
        conversionProbability: 85
      }
    },
    {
      id: 3,
      to: 's.bernard@conseil.fr',
      subject: '⚡ Relance Facture Psychologique - Solutions immédiates',
      status: 'failed',
      timestamp: new Date(Date.now() - 10800000).toISOString(),
      body: 'Bonjour Sophie,\n\nJ\'espère que cette journée vous sourit...',
      size: '3.2 KB',
      read: false,
      error: 'Boîte mail pleine',
      template: 'Relance Facture Psychologique',
      aiScore: 92,
      sentiment: 'professional',
      priority: 'medium',
      category: 'administrative',
      tags: ['facture', 'relance', 'psychologie'],
      recipient: {
        name: 'Sophie Bernard',
        company: 'Cabinet Conseil',
        avatar: '👩🎓',
        vip: false
      },
      performance: {
        deliveryTime: 0,
        engagement: 'none',
        conversionProbability: 0
      }
    },
    {
      id: 4,
      to: 'marketing@entreprise.com',
      subject: '🔥 Marketing Viral Émotionnel - Cette histoire va vous bouleverser',
      status: 'sent',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      body: 'Bonjour,\n\nIl y a 3 jours, j\'ai reçu un message qui m\'a fait pleurer de joie...',
      size: '5.1 KB',
      read: true,
      openRate: 91,
      responseRate: 73,
      clickRate: 41,
      template: 'Marketing Viral Émotionnel',
      aiScore: 97,
      sentiment: 'emotional',
      priority: 'high',
      category: 'marketing',
      tags: ['storytelling', 'émotionnel', 'viral'],
      recipient: {
        name: 'Équipe Marketing',
        company: 'Entreprise Corp',
        avatar: '📢',
        vip: false
      },
      performance: {
        deliveryTime: 3.2,
        engagement: 'high',
        conversionProbability: 72
      }
    },
    {
      id: 5,
      to: 'rh@societe.fr',
      subject: '🎯 Candidature Révolutionnaire - Développeur IA Full Stack',
      status: 'pending',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      body: 'Madame, Monsieur,\n\nJe vous adresse ma candidature révolutionnaire...',
      size: '2.8 KB',
      read: false,
      template: 'Candidature Révolutionnaire',
      aiScore: 89,
      sentiment: 'confident',
      priority: 'medium',
      category: 'rh',
      tags: ['candidature', 'IA', 'innovation'],
      recipient: {
        name: 'Service RH',
        company: 'Société SARL',
        avatar: '👥',
        vip: false
      },
      performance: {
        deliveryTime: 0,
        engagement: 'pending',
        conversionProbability: 65
      }
    }
  ];

  useEffect(() => {
    loadEmailHistory();
    loadAnalytics();
    loadAiInsights();
  }, [currentPage]);

  const loadEmailHistory = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setEmails(revolutionaryEmails);
      setTotalPages(Math.ceil(revolutionaryEmails.length / itemsPerPage));
    } catch (error) {
      console.warn('Erreur chargement historique:', error);
      setEmails(revolutionaryEmails);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      setAnalytics({
        totalEmails: revolutionaryEmails.length,
        avgOpenRate: 92.8,
        avgResponseRate: 71.5,
        avgClickRate: 47.2,
        avgAiScore: 94.4,
        totalSent: revolutionaryEmails.filter(e => ['sent', 'delivered', 'opened'].includes(e.status)).length,
        totalFailed: revolutionaryEmails.filter(e => e.status === 'failed').length,
        totalPending: revolutionaryEmails.filter(e => e.status === 'pending').length,
        bestPerformer: revolutionaryEmails[0],
        topCategories: [
          { name: 'Commercial', count: 2, performance: 95 },
          { name: 'Support', count: 1, performance: 96 },
          { name: 'Marketing', count: 1, performance: 91 }
        ],
        timeDistribution: {
          morning: 40,
          afternoon: 35,
          evening: 25
        },
        deviceStats: {
          desktop: 65,
          mobile: 30,
          tablet: 5
        }
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
            type: 'optimization',
            title: 'Optimisation des horaires d\'envoi',
            description: 'Vos emails ont 23% plus de chances d\'être ouverts entre 9h et 11h',
            impact: 'high',
            icon: Clock
          },
          {
            type: 'content',
            title: 'Amélioration du contenu',
            description: 'Les emails avec émojis dans le sujet ont +34% d\'ouverture',
            impact: 'medium',
            icon: Sparkles
          },
          {
            type: 'targeting',
            title: 'Ciblage personnalisé',
            description: 'Les contacts VIP répondent 2.3x plus aux emails personnalisés',
            impact: 'high',
            icon: Target
          }
        ],
        trends: [
          { period: 'Cette semaine', metric: 'Taux d\'ouverture', value: '+12%', trend: 'up' },
          { period: 'Ce mois', metric: 'Taux de réponse', value: '+8%', trend: 'up' },
          { period: 'Trimestre', metric: 'Score IA moyen', value: '+15%', trend: 'up' }
        ],
        predictions: {
          nextWeek: {
            expectedEmails: 12,
            predictedOpenRate: 94.2,
            recommendedSendTime: '10:30'
          }
        }
      });
    } catch (error) {
      console.warn('Erreur AI insights:', error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'opened':
        return <Eye className="h-5 w-5 text-blue-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <Mail className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'sent': return 'Envoyé';
      case 'delivered': return 'Délivré';
      case 'opened': return 'Ouvert';
      case 'failed': return 'Échec';
      case 'pending': return 'En attente';
      default: return 'Inconnu';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'opened':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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
    if (score >= 95) return 'text-purple-600 bg-purple-100';
    if (score >= 90) return 'text-blue-600 bg-blue-100';
    if (score >= 80) return 'text-green-600 bg-green-100';
    return 'text-gray-600 bg-gray-100';
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Il y a quelques minutes';
    } else if (diffInHours < 24) {
      return `Il y a ${Math.floor(diffInHours)} heure${Math.floor(diffInHours) > 1 ? 's' : ''}`;
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const filteredEmails = emails
    .filter(email => {
      const matchesSearch = email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           email.to.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           email.recipient?.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || email.status === statusFilter;
      
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const emailDate = new Date(email.timestamp);
        const now = new Date();
        const diffInDays = (now - emailDate) / (1000 * 60 * 60 * 24);
        
        switch (dateFilter) {
          case 'today': matchesDate = diffInDays < 1; break;
          case 'week': matchesDate = diffInDays < 7; break;
          case 'month': matchesDate = diffInDays < 30; break;
        }
      }
      
      return matchesSearch && matchesStatus && matchesDate;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date': return new Date(b.timestamp) - new Date(a.timestamp);
        case 'aiScore': return (b.aiScore || 0) - (a.aiScore || 0);
        case 'openRate': return (b.openRate || 0) - (a.openRate || 0);
        case 'priority': 
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        default: return 0;
      }
    });

  const retryEmail = async (emailId) => {
    try {
      toast.loading('Remise en file d\'attente...', { id: 'retry' });
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setEmails(prev => prev.map(email => 
        email.id === emailId 
          ? { ...email, status: 'pending', error: null }
          : email
      ));
      
      toast.success('Email remis en file d\'attente !', { id: 'retry' });
    } catch (error) {
      toast.error('Erreur lors de la remise en file', { id: 'retry' });
    }
  };

  const exportData = () => {
    const csvContent = emails.map(email => 
      `"${email.timestamp}","${email.to}","${email.subject}","${email.status}","${email.aiScore || 'N/A'}"`
    ).join('\n');
    
    const blob = new Blob([`Date,Destinataire,Sujet,Statut,Score IA\n${csvContent}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'historique-emails.csv';
    a.click();
    
    toast.success('Export réalisé avec succès !');
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
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
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
              <Activity className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Historique IA Révolutionnaire</h1>
              <p className="opacity-90">Analytics avancés et insights IA pour vos emails</p>
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
              onClick={exportData}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-all"
            >
              <Download className="w-4 h-4" />
              Export
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
                <Mail className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-600">{analytics.totalEmails}</p>
                <p className="text-xs text-blue-700">Total emails</p>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center border-2 border-green-200">
                <Eye className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-600">{analytics.avgOpenRate}%</p>
                <p className="text-xs text-green-700">Taux ouverture</p>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 text-center border-2 border-purple-200">
                <MessageSquare className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-purple-600">{analytics.avgResponseRate}%</p>
                <p className="text-xs text-purple-700">Taux réponse</p>
              </div>
              
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 text-center border-2 border-orange-200">
                <Brain className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-orange-600">{analytics.avgAiScore}%</p>
                <p className="text-xs text-orange-700">Score IA moyen</p>
              </div>
            </div>

            {/* Statuts */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-50 rounded-xl p-4 border-2 border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-bold text-green-800">Succès</span>
                </div>
                <p className="text-2xl font-bold text-green-600">{analytics.totalSent}</p>
              </div>
              
              <div className="bg-red-50 rounded-xl p-4 border-2 border-red-200">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <span className="font-bold text-red-800">Échecs</span>
                </div>
                <p className="text-2xl font-bold text-red-600">{analytics.totalFailed}</p>
              </div>
              
              <div className="bg-yellow-50 rounded-xl p-4 border-2 border-yellow-200">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-yellow-600" />
                  <span className="font-bold text-yellow-800">En attente</span>
                </div>
                <p className="text-2xl font-bold text-yellow-600">{analytics.totalPending}</p>
              </div>
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
                          <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs font-medium ${
                            rec.impact === 'high' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            Impact {rec.impact === 'high' ? 'élevé' : 'moyen'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <h4 className="font-bold text-gray-900 text-sm mb-3">Tendances</h4>
                <div className="space-y-2">
                  {aiInsights.trends.map((trend, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">{trend.metric}</span>
                      <span className={`text-xs font-bold ${
                        trend.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {trend.value}
                      </span>
                    </div>
                  ))}
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
              placeholder="Rechercher par destinataire, sujet, nom..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">Tous les statuts</option>
            <option value="sent">Envoyé</option>
            <option value="delivered">Délivré</option>
            <option value="opened">Ouvert</option>
            <option value="failed">Échec</option>
            <option value="pending">En attente</option>
          </select>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Toutes les dates</option>
            <option value="today">Aujourd'hui</option>
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500"
          >
            <option value="date">📅 Date</option>
            <option value="aiScore">🤖 Score IA</option>
            <option value="openRate">👁️ Taux ouverture</option>
            <option value="priority">⚡ Priorité</option>
          </select>

          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`p-3 rounded-xl border-2 transition-all ${
                viewMode === 'list' ? 'border-purple-500 bg-purple-50' : 'border-gray-300'
              }`}
            >
              <Filter className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-3 rounded-xl border-2 transition-all ${
                viewMode === 'grid' ? 'border-purple-500 bg-purple-50' : 'border-gray-300'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Liste des emails révolutionnaires */}
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
        {filteredEmails.length > 0 ? (
          filteredEmails.map(email => (
            <div key={email.id} className="bg-white shadow-2xl rounded-2xl overflow-hidden hover:shadow-3xl transition-all transform hover:-translate-y-1">
              {/* Header avec statut et priorité */}
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 border-b">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(email.status)}
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${getStatusColor(email.status)}`}>
                      {getStatusText(email.status)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {email.recipient?.vip && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold border-2 border-yellow-200">
                        ⭐ VIP
                      </span>
                    )}
                    <span className={`text-xs font-bold ${getPriorityColor(email.priority)}`}>
                      {email.priority === 'high' ? '🔥' : email.priority === 'medium' ? '⚡' : '📝'}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{email.recipient?.avatar || '👤'}</div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900">{email.recipient?.name || email.to}</p>
                    <p className="text-sm text-gray-600">{email.recipient?.company || email.to}</p>
                  </div>
                </div>
              </div>

              {/* Contenu */}
              <div className="p-4 space-y-4">
                <div>
                  <h3 className="font-bold text-gray-900 line-clamp-2 mb-2">{email.subject}</h3>
                  <p className="text-sm text-gray-600 line-clamp-3">{email.body.substring(0, 120)}...</p>
                </div>

                {/* Métriques de performance */}
                {email.openRate && (
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-3 border-2 border-green-200">
                    <p className="text-xs font-bold text-gray-700 mb-2">📊 Performance:</p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-lg font-bold text-green-600">{email.openRate}%</p>
                        <p className="text-xs text-gray-600">Ouverture</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-blue-600">{email.responseRate}%</p>
                        <p className="text-xs text-gray-600">Réponse</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-purple-600">{email.clickRate}%</p>
                        <p className="text-xs text-gray-600">Clic</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Score IA et tags */}
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {email.tags?.slice(0, 2).map(tag => (
                      <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  
                  {email.aiScore && (
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getAiScoreColor(email.aiScore)}`}>
                      🤖 {email.aiScore}%
                    </span>
                  )}
                </div>

                <div className="text-xs text-gray-500 flex justify-between">
                  <span>{formatDate(email.timestamp)}</span>
                  <span>{email.size}</span>
                </div>

                {email.error && (
                  <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3">
                    <p className="text-sm text-red-600 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {email.error}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="bg-gray-50 px-4 py-3 flex justify-between items-center border-t">
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedEmail(email)}
                    className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all text-sm font-medium"
                  >
                    <Eye className="w-3 h-3" />
                    Voir
                  </button>
                  
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(email.subject + '\n\n' + email.body);
                      toast.success('Email copié !');
                    }}
                    className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-all text-sm font-medium"
                  >
                    <Copy className="w-3 h-3" />
                    Copier
                  </button>
                </div>
                
                <div className="flex gap-1">
                  {email.status === 'failed' && (
                    <button
                      onClick={() => retryEmail(email.id)}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Réessayer"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  )}
                  
                  <button
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
            <Mail className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Aucun email trouvé</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                ? 'Essayez de modifier vos filtres de recherche.'
                : 'Vous n\'avez pas encore envoyé d\'emails.'}
            </p>
          </div>
        )}
      </div>

      {/* Modal de détails révolutionnaire */}
      {selectedEmail && (
        <div className="fixed inset-0 bg-black/50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold flex items-center gap-2">
                    <Eye className="w-6 h-6" />
                    Détails de l'email
                  </h3>
                  <p className="opacity-90 mt-1">{selectedEmail.recipient?.name || selectedEmail.to}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  {getStatusIcon(selectedEmail.status)}
                  <span className={`px-3 py-1 rounded-full text-sm font-medium bg-white/20`}>
                    {getStatusText(selectedEmail.status)}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Informations principales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">📧 Destinataire</label>
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border-2 border-blue-200">
                      <div className="text-2xl">{selectedEmail.recipient?.avatar || '👤'}</div>
                      <div>
                        <p className="font-bold text-gray-900">{selectedEmail.recipient?.name || selectedEmail.to}</p>
                        <p className="text-sm text-gray-600">{selectedEmail.recipient?.company || selectedEmail.to}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">📅 Date d'envoi</label>
                    <p className="p-3 bg-gray-50 rounded-xl border-2 border-gray-200 text-gray-900">
                      {formatDate(selectedEmail.timestamp)}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">🎯 Catégorie & Priorité</label>
                    <div className="flex gap-2">
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                        {selectedEmail.category}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        selectedEmail.priority === 'high' ? 'bg-red-100 text-red-700' :
                        selectedEmail.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {selectedEmail.priority}
                      </span>
                    </div>
                  </div>
                  
                  {selectedEmail.aiScore && (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">🤖 Score IA</label>
                      <div className={`p-3 rounded-xl border-2 ${getAiScoreColor(selectedEmail.aiScore)}`}>
                        <p className="text-2xl font-bold">{selectedEmail.aiScore}%</p>
                        <p className="text-sm">Optimisation IA</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">📝 Sujet</label>
                <div className="p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                  <p className="text-gray-900 font-medium">{selectedEmail.subject}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">✍️ Contenu</label>
                <div className="p-4 bg-gray-50 rounded-xl border-2 border-gray-200 max-h-64 overflow-y-auto">
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedEmail.body}</p>
                </div>
              </div>
              
              {/* Performance détaillée */}
              {selectedEmail.openRate && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">📊 Performance détaillée</label>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-green-50 rounded-xl p-4 text-center border-2 border-green-200">
                      <Eye className="w-6 h-6 text-green-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-green-600">{selectedEmail.openRate}%</p>
                      <p className="text-sm text-green-700">Taux d'ouverture</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-4 text-center border-2 border-blue-200">
                      <MessageSquare className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-blue-600">{selectedEmail.responseRate}%</p>
                      <p className="text-sm text-blue-700">Taux de réponse</p>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-4 text-center border-2 border-purple-200">
                      <Target className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-purple-600">{selectedEmail.clickRate}%</p>
                      <p className="text-sm text-purple-700">Taux de clic</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Tags */}
              {selectedEmail.tags && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">🏷️ Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedEmail.tags.map(tag => (
                      <span key={tag} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium border-2 border-blue-200">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedEmail.error && (
                <div>
                  <label className="block text-sm font-bold text-red-700 mb-2">❌ Erreur</label>
                  <div className="p-4 bg-red-50 rounded-xl border-2 border-red-200">
                    <p className="text-red-600 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      {selectedEmail.error}
                    </p>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end gap-3">
                {selectedEmail.status === 'failed' && (
                  <button
                    onClick={() => {
                      retryEmail(selectedEmail.id);
                      setSelectedEmail(null);
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-bold"
                  >
                    🔄 Réessayer l'envoi
                  </button>
                )}
                <button
                  onClick={() => setSelectedEmail(null)}
                  className="px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all font-medium"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}