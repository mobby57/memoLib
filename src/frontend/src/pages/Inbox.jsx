import { useState, useEffect, useRef } from 'react';
import { 
  Mail, Inbox as InboxIcon, Search, Filter, Clock, AlertCircle, CheckCircle, 
  Tag, User, RefreshCw, Paperclip, Star, Eye, MessageSquare, BarChart3,
  Bot, Sparkles, Zap, TrendingUp, Shield, Archive, Trash2, Forward,
  Volume2, Play, Pause, Mic, Brain, Target, Users, Globe
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Inbox() {
  const [emails, setEmails] = useState([]);
  const [filteredEmails, setFilteredEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [smartSort, setSmartSort] = useState('priority');
  const [autoResponding, setAutoResponding] = useState(false);
  
  const [filters, setFilters] = useState({
    search: '',
    showUnreadOnly: false,
    category: 'all',
    priority: 'all',
    sentiment: 'all'
  });

  const recognitionRef = useRef(null);

  // Enhanced mock data with AI features
  const mockEmails = [
    {
      message_id: '1',
      from: 'marie.dupont@mairie-paris.fr',
      subject: '🚨 URGENT: Demande de subvention - Délai 48h',
      body: 'Bonjour, nous avons besoin de votre dossier de subvention complet avant vendredi. Cette demande est critique pour notre budget 2024...',
      date: new Date().toISOString(),
      is_read: false,
      is_replied: false,
      is_important: true,
      has_attachments: true,
      type: 'urgent',
      domain: 'mairie-paris.fr',
      ai_category: 'administrative',
      ai_priority: 'critical',
      ai_sentiment: 'urgent',
      ai_confidence: 0.95,
      ai_summary: 'Demande urgente de subvention avec délai de 48h',
      ai_suggested_response: 'Réponse rapide recommandée avec documents requis',
      ai_tags: ['subvention', 'urgent', 'administration', 'délai'],
      estimated_response_time: 30,
      sender_importance: 'high',
      thread_count: 1
    },
    {
      message_id: '2',
      from: 'contact@startup-innovante.com',
      subject: '💡 Partenariat IA - Opportunité €500K',
      body: 'Nous développons une solution IA révolutionnaire et cherchons des partenaires stratégiques. Budget disponible: 500K€...',
      date: new Date(Date.now() - 3600000).toISOString(),
      is_read: false,
      is_replied: false,
      is_important: true,
      has_attachments: false,
      type: 'business',
      domain: 'startup-innovante.com',
      ai_category: 'business_opportunity',
      ai_priority: 'high',
      ai_sentiment: 'positive',
      ai_confidence: 0.88,
      ai_summary: 'Opportunité de partenariat IA avec budget significatif',
      ai_suggested_response: 'Planifier un appel de découverte',
      ai_tags: ['partenariat', 'IA', 'opportunité', 'financement'],
      estimated_response_time: 120,
      sender_importance: 'medium',
      thread_count: 1
    },
    {
      message_id: '3',
      from: 'support@client-vip.fr',
      subject: '😤 Problème technique - Service interrompu',
      body: 'Notre service est en panne depuis 2h. Nos clients sont mécontents. Nous avons besoin d\'une solution immédiate...',
      date: new Date(Date.now() - 7200000).toISOString(),
      is_read: true,
      is_replied: false,
      is_important: true,
      has_attachments: false,
      type: 'support',
      domain: 'client-vip.fr',
      ai_category: 'technical_support',
      ai_priority: 'high',
      ai_sentiment: 'negative',
      ai_confidence: 0.92,
      ai_summary: 'Problème technique urgent nécessitant intervention immédiate',
      ai_suggested_response: 'Escalader vers l\'équipe technique',
      ai_tags: ['support', 'technique', 'urgent', 'panne'],
      estimated_response_time: 15,
      sender_importance: 'high',
      thread_count: 3
    },
    {
      message_id: '4',
      from: 'newsletter@techcrunch.com',
      subject: '📰 IA: Les dernières innovations',
      body: 'Découvrez les dernières avancées en intelligence artificielle...',
      date: new Date(Date.now() - 86400000).toISOString(),
      is_read: false,
      is_replied: false,
      is_important: false,
      has_attachments: false,
      type: 'newsletter',
      domain: 'techcrunch.com',
      ai_category: 'newsletter',
      ai_priority: 'low',
      ai_sentiment: 'neutral',
      ai_confidence: 0.99,
      ai_summary: 'Newsletter technologique sur l\'IA',
      ai_suggested_response: 'Lecture optionnelle',
      ai_tags: ['newsletter', 'technologie', 'IA'],
      estimated_response_time: 0,
      sender_importance: 'low',
      thread_count: 1
    }
  ];

  const mockStats = {
    total_emails: 47,
    unread: 12,
    unreplied: 18,
    important: 8,
    overdue: 3,
    total_threads: 28,
    avg_response_time: 2.3,
    ai_processed: 45,
    auto_categorized: 42,
    sentiment_positive: 15,
    sentiment_negative: 8,
    sentiment_neutral: 24
  };

  const mockAiInsights = {
    priority_emails: 8,
    response_needed: 12,
    auto_responses_sent: 3,
    time_saved: 45,
    productivity_score: 87,
    top_senders: ['mairie-paris.fr', 'client-vip.fr', 'startup-innovante.com'],
    trending_topics: ['IA', 'subvention', 'partenariat', 'support'],
    response_suggestions: 5,
    sentiment_trend: 'improving'
  };

  useEffect(() => {
    loadInbox();
    loadStatistics();
    loadAiInsights();
    initializeVoiceRecognition();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [emails, filters, smartSort]);

  const initializeVoiceRecognition = () => {
    if ('webkitSpeechRecognition' in window) {
      recognitionRef.current = new webkitSpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'fr-FR';
      
      recognitionRef.current.onresult = (event) => {
        const command = event.results[event.results.length - 1][0].transcript.toLowerCase();
        handleVoiceCommand(command);
      };
    }
  };

  const handleVoiceCommand = (command) => {
    if (command.includes('emails urgents')) {
      setFilters(prev => ({ ...prev, priority: 'critical' }));
      speak('Affichage des emails urgents');
    } else if (command.includes('non lus')) {
      setFilters(prev => ({ ...prev, showUnreadOnly: true }));
      speak('Affichage des emails non lus');
    } else if (command.includes('répondre automatiquement')) {
      handleAutoResponse();
    } else if (command.includes('analyser')) {
      analyzeWithAI();
    }
  };

  const toggleVoiceMode = () => {
    if (!recognitionRef.current) {
      toast.error('Reconnaissance vocale non supportée');
      return;
    }

    if (voiceMode) {
      recognitionRef.current.stop();
      setVoiceMode(false);
      toast.success('Mode vocal désactivé');
    } else {
      recognitionRef.current.start();
      setVoiceMode(true);
      toast.success('Mode vocal activé - Dites "emails urgents" ou "non lus"');
    }
  };

  const speak = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fr-FR';
      utterance.rate = 0.9;
      speechSynthesis.speak(utterance);
    }
  };

  const loadInbox = async () => {
    setLoading(true);
    try {
      // Simulation d'appel API
      await new Promise(resolve => setTimeout(resolve, 1000));
      setEmails(mockEmails);
    } catch (error) {
      console.error('Erreur chargement inbox:', error);
      setEmails(mockEmails);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setStatistics(mockStats);
    } catch (error) {
      console.error('Erreur chargement statistiques:', error);
      setStatistics(mockStats);
    }
  };

  const loadAiInsights = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      setAiInsights(mockAiInsights);
    } catch (error) {
      console.error('Erreur chargement insights IA:', error);
      setAiInsights(mockAiInsights);
    }
  };

  const analyzeWithAI = async () => {
    setAiAnalyzing(true);
    toast.loading('IA en cours d\'analyse...', { id: 'ai-analysis' });
    
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Simulation d'analyse IA
      const insights = [
        '8 emails nécessitent une réponse urgente',
        '3 opportunités commerciales détectées',
        '2 emails de support critique identifiés',
        '5 réponses automatiques suggérées'
      ];
      
      toast.success(`IA: ${insights.length} insights générés`, { id: 'ai-analysis' });
      
      // Mise à jour des emails avec analyse IA
      setEmails(prev => prev.map(email => ({
        ...email,
        ai_analyzed: true,
        ai_confidence: Math.min(email.ai_confidence + 0.05, 1)
      })));
      
    } catch (error) {
      toast.error('Erreur analyse IA', { id: 'ai-analysis' });
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleAutoResponse = async () => {
    setAutoResponding(true);
    toast.loading('Génération de réponses automatiques...', { id: 'auto-response' });
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const autoResponses = emails.filter(e => 
        !e.is_replied && 
        e.ai_category === 'newsletter' || 
        e.ai_priority === 'low'
      ).length;
      
      toast.success(`${autoResponses} réponses automatiques envoyées`, { id: 'auto-response' });
      
      setEmails(prev => prev.map(email => 
        (email.ai_category === 'newsletter' || email.ai_priority === 'low') && !email.is_replied
          ? { ...email, is_replied: true, auto_replied: true }
          : email
      ));
      
    } catch (error) {
      toast.error('Erreur réponses automatiques', { id: 'auto-response' });
    } finally {
      setAutoResponding(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...emails];

    // Filtres
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(e => 
        e.subject.toLowerCase().includes(search) ||
        e.from.toLowerCase().includes(search) ||
        e.body.toLowerCase().includes(search) ||
        e.ai_tags?.some(tag => tag.toLowerCase().includes(search))
      );
    }

    if (filters.showUnreadOnly) {
      filtered = filtered.filter(e => !e.is_read);
    }

    if (filters.category !== 'all') {
      filtered = filtered.filter(e => e.ai_category === filters.category);
    }

    if (filters.priority !== 'all') {
      filtered = filtered.filter(e => e.ai_priority === filters.priority);
    }

    if (filters.sentiment !== 'all') {
      filtered = filtered.filter(e => e.ai_sentiment === filters.sentiment);
    }

    // Tri intelligent
    filtered.sort((a, b) => {
      switch (smartSort) {
        case 'priority':
          const priorityOrder = { critical: 3, high: 2, medium: 1, low: 0 };
          return (priorityOrder[b.ai_priority] || 0) - (priorityOrder[a.ai_priority] || 0);
        case 'ai_confidence':
          return b.ai_confidence - a.ai_confidence;
        case 'response_time':
          return a.estimated_response_time - b.estimated_response_time;
        case 'date':
          return new Date(b.date) - new Date(a.date);
        default:
          return new Date(b.date) - new Date(a.date);
      }
    });

    setFilteredEmails(filtered);
  };

  const getPriorityColor = (priority) => {
    const colors = {
      critical: 'bg-red-100 text-red-700 border-red-200',
      high: 'bg-orange-100 text-orange-700 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      low: 'bg-gray-100 text-gray-700 border-gray-200'
    };
    return colors[priority] || colors.medium;
  };

  const getSentimentIcon = (sentiment) => {
    switch (sentiment) {
      case 'positive': return '😊';
      case 'negative': return '😤';
      case 'urgent': return '🚨';
      default: return '😐';
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'À l\'instant';
    if (hours < 24) return `Il y a ${hours}h`;
    if (hours < 48) return 'Hier';
    
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const EmailCard = ({ email }) => (
    <div
      className={`bg-white rounded-xl border-2 transition-all cursor-pointer hover:shadow-lg transform hover:-translate-y-1 ${
        !email.is_read 
          ? 'border-blue-300 bg-gradient-to-r from-blue-50 to-purple-50' 
          : 'border-gray-200 hover:border-gray-300'
      } p-6`}
      onClick={() => {
        setSelectedEmail(email);
        if (!email.is_read) markAsRead(email.message_id);
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* En-tête avec IA */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              <span className={`text-sm ${!email.is_read ? 'font-bold' : 'font-medium'} truncate`}>
                {email.from}
              </span>
              <span className="text-xs text-gray-400">{email.domain}</span>
            </div>
            
            {email.ai_confidence > 0.9 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                <Bot className="w-3 h-3" />
                IA {Math.round(email.ai_confidence * 100)}%
              </div>
            )}
          </div>

          {/* Sujet avec emoji sentiment */}
          <h3 className={`text-lg mb-2 flex items-center gap-2 ${
            !email.is_read ? 'font-bold text-gray-900' : 'font-medium text-gray-700'
          }`}>
            <span>{getSentimentIcon(email.ai_sentiment)}</span>
            <span className="truncate">{email.subject}</span>
          </h3>

          {/* Résumé IA */}
          <div className="mb-3">
            <p className="text-sm text-gray-600 line-clamp-1 mb-1">{email.preview || email.body}</p>
            {email.ai_summary && (
              <p className="text-xs text-purple-600 bg-purple-50 rounded px-2 py-1 inline-block">
                <Sparkles className="w-3 h-3 inline mr-1" />
                IA: {email.ai_summary}
              </p>
            )}
          </div>

          {/* Tags et badges */}
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(email.ai_priority)}`}>
              {email.ai_priority === 'critical' ? '🚨 Critique' : 
               email.ai_priority === 'high' ? '⚡ Haute' :
               email.ai_priority === 'medium' ? '📋 Moyenne' : '📝 Basse'}
            </span>
            
            {email.estimated_response_time > 0 && (
              <span className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                <Clock className="w-3 h-3" />
                {email.estimated_response_time}min
              </span>
            )}
            
            {email.thread_count > 1 && (
              <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                <MessageSquare className="w-3 h-3" />
                {email.thread_count}
              </span>
            )}
            
            {email.has_attachments && (
              <span className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                <Paperclip className="w-3 h-3" />
                PJ
              </span>
            )}
            
            {email.auto_replied && (
              <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                <Bot className="w-3 h-3" />
                Auto-répondu
              </span>
            )}
          </div>

          {/* Tags IA */}
          {email.ai_tags && (
            <div className="flex gap-1 flex-wrap">
              {email.ai_tags.slice(0, 3).map((tag, index) => (
                <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Actions et date */}
        <div className="flex flex-col items-end gap-2">
          <span className="text-xs text-gray-500">{email.formatted_date || formatDate(email.date)}</span>
          
          <div className="flex gap-1">
            {email.ai_suggested_response && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toast.success('Réponse IA suggérée copiée');
                }}
                className="p-1 hover:bg-purple-100 rounded"
                title="Réponse IA suggérée"
              >
                <Sparkles className="w-4 h-4 text-purple-600" />
              </button>
            )}
            
            {!email.is_read && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  markAsRead(email.message_id);
                }}
                className="p-1 hover:bg-blue-100 rounded"
                title="Marquer comme lu"
              >
                <Eye className="w-4 h-4 text-blue-600" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const markAsRead = async (messageId) => {
    setEmails(prev => prev.map(e => 
      e.message_id === messageId ? { ...e, is_read: true } : e
    ));
    toast.success('Marqué comme lu');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header avec IA */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <InboxIcon className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Inbox IA Révolutionnaire</h1>
              <p className="opacity-90">Gestion intelligente alimentée par l'IA</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={toggleVoiceMode}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                voiceMode ? 'bg-red-500 hover:bg-red-600' : 'bg-white/20 hover:bg-white/30'
              }`}
            >
              <Mic className="w-4 h-4" />
              {voiceMode ? 'Arrêter vocal' : 'Mode vocal'}
            </button>
            
            <button
              onClick={analyzeWithAI}
              disabled={aiAnalyzing}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-all disabled:opacity-50"
            >
              {aiAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white"></div>
                  Analyse IA...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4" />
                  Analyser IA
                </>
              )}
            </button>
            
            <button
              onClick={handleAutoResponse}
              disabled={autoResponding}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-all disabled:opacity-50"
            >
              {autoResponding ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white"></div>
                  Auto-réponse...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Auto-répondre
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Insights IA */}
      {aiInsights && (
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-bold text-gray-900">Insights IA</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="bg-white rounded-lg p-4 text-center">
              <Target className="w-6 h-6 text-red-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-red-600">{aiInsights.priority_emails}</p>
              <p className="text-xs text-gray-600">Prioritaires</p>
            </div>
            
            <div className="bg-white rounded-lg p-4 text-center">
              <MessageSquare className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-600">{aiInsights.response_needed}</p>
              <p className="text-xs text-gray-600">À répondre</p>
            </div>
            
            <div className="bg-white rounded-lg p-4 text-center">
              <Bot className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">{aiInsights.auto_responses_sent}</p>
              <p className="text-xs text-gray-600">Auto-réponses</p>
            </div>
            
            <div className="bg-white rounded-lg p-4 text-center">
              <Clock className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-600">{aiInsights.time_saved}min</p>
              <p className="text-xs text-gray-600">Temps gagné</p>
            </div>
            
            <div className="bg-white rounded-lg p-4 text-center">
              <TrendingUp className="w-6 h-6 text-orange-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-orange-600">{aiInsights.productivity_score}%</p>
              <p className="text-xs text-gray-600">Productivité</p>
            </div>
            
            <div className="bg-white rounded-lg p-4 text-center">
              <Sparkles className="w-6 h-6 text-pink-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-pink-600">{aiInsights.response_suggestions}</p>
              <p className="text-xs text-gray-600">Suggestions</p>
            </div>
          </div>
        </div>
      )}

      {/* Statistiques améliorées */}
      {statistics && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-gray-600">Total</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{statistics.total_emails}</p>
          </div>

          <div className="bg-white rounded-lg p-4 border-l-4 border-red-500">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-xs text-gray-600">Non lus</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{statistics.unread}</p>
          </div>

          <div className="bg-white rounded-lg p-4 border-l-4 border-orange-500">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-orange-600" />
              <span className="text-xs text-gray-600">Sans réponse</span>
            </div>
            <p className="text-2xl font-bold text-orange-600">{statistics.unreplied}</p>
          </div>

          <div className="bg-white rounded-lg p-4 border-l-4 border-purple-500">
            <div className="flex items-center gap-2 mb-2">
              <Bot className="w-4 h-4 text-purple-600" />
              <span className="text-xs text-gray-600">IA traités</span>
            </div>
            <p className="text-2xl font-bold text-purple-600">{statistics.ai_processed}</p>
          </div>

          <div className="bg-white rounded-lg p-4 border-l-4 border-green-500">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-green-600">😊</span>
              <span className="text-xs text-gray-600">Positifs</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{statistics.sentiment_positive}</p>
          </div>

          <div className="bg-white rounded-lg p-4 border-l-4 border-red-500">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-red-600">😤</span>
              <span className="text-xs text-gray-600">Négatifs</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{statistics.sentiment_negative}</p>
          </div>

          <div className="bg-white rounded-lg p-4 border-l-4 border-gray-500">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-gray-600" />
              <span className="text-xs text-gray-600">Temps moy.</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{statistics.avg_response_time}h</p>
          </div>

          <div className="bg-white rounded-lg p-4 border-l-4 border-indigo-500">
            <div className="flex items-center gap-2 mb-2">
              <Tag className="w-4 h-4 text-indigo-600" />
              <span className="text-xs text-gray-600">Auto-catég.</span>
            </div>
            <p className="text-2xl font-bold text-indigo-600">{statistics.auto_categorized}</p>
          </div>
        </div>
      )}

      {/* Filtres avancés */}
      <div className="bg-white rounded-xl p-6 mb-6 shadow-lg">
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex-1 min-w-64 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher avec IA (tags, sentiment, contenu)..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <select
            value={smartSort}
            onChange={(e) => setSmartSort(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="priority">Tri par priorité IA</option>
            <option value="ai_confidence">Tri par confiance IA</option>
            <option value="response_time">Tri par temps de réponse</option>
            <option value="date">Tri par date</option>
          </select>
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filters.showUnreadOnly}
              onChange={(e) => setFilters(prev => ({ ...prev, showUnreadOnly: e.target.checked }))}
              className="w-4 h-4 text-purple-600"
            />
            <span className="text-sm text-gray-700">Non lus uniquement</span>
          </label>

          <select
            value={filters.priority}
            onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
            className="px-3 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="all">Toutes priorités</option>
            <option value="critical">🚨 Critique</option>
            <option value="high">⚡ Haute</option>
            <option value="medium">📋 Moyenne</option>
            <option value="low">📝 Basse</option>
          </select>

          <select
            value={filters.sentiment}
            onChange={(e) => setFilters(prev => ({ ...prev, sentiment: e.target.value }))}
            className="px-3 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="all">Tous sentiments</option>
            <option value="positive">😊 Positif</option>
            <option value="negative">😤 Négatif</option>
            <option value="urgent">🚨 Urgent</option>
            <option value="neutral">😐 Neutre</option>
          </select>
        </div>
      </div>

      {/* Liste des emails */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement intelligent des emails...</p>
          </div>
        ) : filteredEmails.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <Bot className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Aucun email trouvé avec ces filtres</p>
          </div>
        ) : (
          filteredEmails.map(email => (
            <EmailCard key={email.message_id} email={email} />
          ))
        )}
      </div>

      {/* Modal détails email amélioré */}
      {selectedEmail && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedEmail(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* En-tête avec IA */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{getSentimentIcon(selectedEmail.ai_sentiment)}</span>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedEmail.subject}</h2>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <span>De: {selectedEmail.from}</span>
                    <span>•</span>
                    <span>{new Date(selectedEmail.date).toLocaleString('fr-FR')}</span>
                    <span>•</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(selectedEmail.ai_priority)}`}>
                      {selectedEmail.ai_priority}
                    </span>
                  </div>

                  {/* Analyse IA */}
                  {selectedEmail.ai_summary && (
                    <div className="bg-purple-50 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        <span className="font-medium text-purple-900">Analyse IA</span>
                        <span className="text-xs text-purple-600">
                          Confiance: {Math.round(selectedEmail.ai_confidence * 100)}%
                        </span>
                      </div>
                      <p className="text-purple-800">{selectedEmail.ai_summary}</p>
                      {selectedEmail.ai_suggested_response && (
                        <p className="text-sm text-purple-600 mt-2">
                          <strong>Suggestion:</strong> {selectedEmail.ai_suggested_response}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => setSelectedEmail(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>

              {/* Contenu avec formatage amélioré */}
              <div className="prose max-w-none mb-6">
                <div className="whitespace-pre-wrap text-gray-700 bg-gray-50 rounded-lg p-4 leading-relaxed">
                  {selectedEmail.body}
                </div>
                
                {/* Informations supplémentaires */}
                <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">Date de réception:</span>
                    <span>{selectedEmail.formatted_date || new Date(selectedEmail.date).toLocaleString('fr-FR')}</span>
                  </div>
                  
                  {selectedEmail.has_attachments && (
                    <div className="flex items-center gap-2">
                      <Paperclip className="w-4 h-4" />
                      <span>Cet email contient des pièces jointes</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Tags IA */}
              {selectedEmail.ai_tags && (
                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-2">Tags IA:</h3>
                  <div className="flex gap-2 flex-wrap">
                    {selectedEmail.ai_tags.map((tag, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-6 border-t">
                <button
                  onClick={() => {
                    window.location.href = `/compose?reply_to=${selectedEmail.message_id}`;
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
                >
                  <MessageSquare className="w-4 h-4" />
                  Répondre
                </button>
                
                <button
                  onClick={() => {
                    speak(selectedEmail.body);
                  }}
                  className="flex items-center gap-2 px-4 py-3 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-all"
                >
                  <Volume2 className="w-4 h-4" />
                  Écouter
                </button>
                
                <button
                  onClick={() => {
                    toast.success('Réponse IA générée et copiée');
                  }}
                  className="flex items-center gap-2 px-4 py-3 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-all"
                >
                  <Bot className="w-4 h-4" />
                  Réponse IA
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}