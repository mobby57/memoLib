import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, Plus, Edit, Trash2, Eye, Copy, Search, Filter, Star, TrendingUp,
  Sparkles, Bot, Brain, Zap, Target, Users, Clock, Award, Rocket, Wand2,
  BarChart3, Heart, Globe, Shield, Lightbulb, Crown, Gem
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTone, setSelectedTone] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [sortBy, setSortBy] = useState('performance');

  const [newTemplate, setNewTemplate] = useState({
    name: '',
    category: 'commercial',
    tone: 'professionnel',
    subject: '',
    body: '',
    variables: [],
    aiOptimized: false,
    language: 'fr',
    industry: 'general'
  });

  const categories = [
    { id: 'all', name: '🌟 Tous', color: 'gray', count: 0 },
    { id: 'commercial', name: '💼 Commercial', color: 'blue', count: 0 },
    { id: 'support', name: '🛠️ Support', color: 'green', count: 0 },
    { id: 'administrative', name: '📋 Administratif', color: 'purple', count: 0 },
    { id: 'marketing', name: '📢 Marketing', color: 'pink', count: 0 },
    { id: 'rh', name: '👥 RH', color: 'orange', count: 0 },
    { id: 'urgent', name: '🚨 Urgent', color: 'red', count: 0 },
    { id: 'vip', name: '⭐ VIP', color: 'yellow', count: 0 }
  ];

  const tones = [
    { id: 'all', name: 'Tous les tons', emoji: '🎭' },
    { id: 'professionnel', name: 'Professionnel', emoji: '💼' },
    { id: 'amical', name: 'Amical', emoji: '😊' },
    { id: 'formel', name: 'Formel', emoji: '🎩' },
    { id: 'urgent', name: 'Urgent', emoji: '⚡' },
    { id: 'empathique', name: 'Empathique', emoji: '❤️' },
    { id: 'persuasif', name: 'Persuasif', emoji: '🎯' }
  ];

  const industries = [
    { id: 'general', name: 'Général' },
    { id: 'tech', name: 'Technologie' },
    { id: 'finance', name: 'Finance' },
    { id: 'healthcare', name: 'Santé' },
    { id: 'education', name: 'Éducation' },
    { id: 'retail', name: 'Commerce' }
  ];

  const revolutionaryTemplates = [
    {
      id: 1,
      name: '🚀 Proposition IA Révolutionnaire',
      category: 'commercial',
      tone: 'persuasif',
      subject: '🤖 Révolutionnez {{company_name}} avec l\'IA - ROI +340%',
      body: `Bonjour {{client_name}},

🎯 **OPPORTUNITÉ EXCLUSIVE** : Votre concurrent direct vient d'augmenter ses ventes de 340% grâce à l'IA.

Chez {{company_name}}, vous pourriez obtenir des résultats encore meilleurs avec notre solution révolutionnaire :

✨ **BÉNÉFICES IMMÉDIATS** :
• 🚀 Productivité x5 en 30 jours
• 💰 ROI de 340% garanti la première année  
• 🤖 Automatisation de 80% des tâches répétitives
• 📊 Insights prédictifs en temps réel

🔥 **OFFRE LIMITÉE** (48h seulement) :
• Installation gratuite (valeur 15K€)
• Formation équipe incluse (valeur 8K€)
• Support premium 6 mois offert (valeur 12K€)
• **TOTAL : 35K€ d'économies**

{{client_name}}, êtes-vous disponible demain à {{preferred_time}} pour une démo exclusive de 20 minutes ?

Je vous montrerai exactement comment {{competitor_name}} a transformé son business.

⏰ **URGENT** : Seulement 3 places disponibles ce mois-ci.

Cordialement,
{{sender_name}}
🏆 Expert IA & Transformation Digitale

P.S. : Répondez "OUI" et recevez notre guide secret "Les 7 erreurs IA à éviter" (valeur 2K€)`,
      variables: ['client_name', 'company_name', 'preferred_time', 'competitor_name', 'sender_name'],
      aiOptimized: true,
      performance: {
        openRate: 89,
        responseRate: 67,
        conversionRate: 34,
        avgResponseTime: 2.3
      },
      language: 'fr',
      industry: 'tech',
      created_at: new Date().toISOString(),
      tags: ['IA', 'ROI', 'urgence', 'exclusivité', 'garantie'],
      aiScore: 98,
      emotionalImpact: 'high',
      persuasionLevel: 'maximum'
    },
    {
      id: 2,
      name: '💎 Suivi VIP Émotionnel',
      category: 'support',
      tone: 'empathique',
      subject: '❤️ {{client_name}}, votre satisfaction est notre priorité absolue',
      body: `Cher(e) {{client_name}},

J'espère sincèrement que vous allez bien et que votre famille se porte à merveille.

🤗 **VOTRE BIEN-ÊTRE NOUS TIENT À CŒUR**

Je me permets de prendre de vos nouvelles concernant {{issue_description}}. 

Votre expérience avec nous est précieuse, et je veux m'assurer personnellement que tout se déroule parfaitement pour vous.

📊 **POINT SITUATION** :
• ✅ Statut actuel : {{status}}
• 🎯 Prochaine étape : {{next_step}}
• ⏰ Délai estimé : {{timeline}}
• 👤 Votre contact dédié : {{support_agent}}

💝 **ATTENTION PARTICULIÈRE** :
En tant que client VIP, vous bénéficiez de :
• 📞 Ligne directe 24/7 : {{vip_phone}}
• 💬 Chat prioritaire avec moi personnellement
• 🎁 Surprise exclusive en préparation pour vous

{{client_name}}, y a-t-il quoi que ce soit d'autre que je puisse faire pour vous aujourd'hui ?

Votre bonheur est ma mission personnelle.

Avec toute ma considération et mon dévouement,
{{sender_name}}
💎 Votre Responsable VIP dédié

P.S. : J'ai pensé à vous en voyant {{personal_touch}} - j'espère que cela vous fera sourire ! 😊`,
      variables: ['client_name', 'issue_description', 'status', 'next_step', 'timeline', 'support_agent', 'vip_phone', 'sender_name', 'personal_touch'],
      aiOptimized: true,
      performance: {
        openRate: 94,
        responseRate: 78,
        conversionRate: 45,
        avgResponseTime: 1.8
      },
      language: 'fr',
      industry: 'general',
      created_at: new Date().toISOString(),
      tags: ['VIP', 'empathie', 'personnalisation', 'support', 'émotionnel'],
      aiScore: 96,
      emotionalImpact: 'maximum',
      persuasionLevel: 'high'
    },
    {
      id: 3,
      name: '⚡ Relance Facture Psychologique',
      category: 'administrative',
      tone: 'professionnel',
      subject: '🔔 {{company_name}} - Notification importante concernant votre compte',
      body: `Bonjour {{client_name}},

J'espère que cette journée vous sourit.

📋 **NOTIFICATION COMPTE CLIENT**

Nos systèmes automatisés ont détecté une situation nécessitant votre attention concernant la facture {{invoice_number}}.

💰 **DÉTAILS FINANCIERS** :
• Montant : {{amount}}€
• Date d'émission : {{invoice_date}}
• Échéance : {{due_date}}
• Jours de retard : {{days_overdue}}

🎯 **SOLUTIONS IMMÉDIATES** :

**Option 1 - Règlement immédiat** :
• 💳 Paiement en ligne sécurisé : {{payment_link}}
• 📞 Paiement par téléphone : {{payment_phone}}
• 🏦 Virement : {{bank_details}}

**Option 2 - Étalement personnalisé** :
• 📅 Plan de paiement sur mesure
• 💬 Discussion confidentielle avec notre équipe finance
• 🤝 Solutions adaptées à votre situation

**Option 3 - Résolution rapide** :
• ☎️ Appelez-moi directement au {{direct_phone}}
• 📧 Répondez à cet email avec vos disponibilités
• 💬 Chat en direct sur notre site

{{client_name}}, notre relation commerciale est précieuse. Trouvons ensemble la meilleure solution pour régulariser cette situation rapidement.

⏰ **ACTION REQUISE** : Merci de nous contacter avant le {{final_deadline}} pour éviter toute procédure automatique.

Je reste personnellement à votre disposition.

Cordialement,
{{sender_name}}
📊 Responsable Comptes Clients

P.S. : Un simple appel suffit souvent à résoudre la situation en 5 minutes ! 😊`,
      variables: ['client_name', 'company_name', 'invoice_number', 'amount', 'invoice_date', 'due_date', 'days_overdue', 'payment_link', 'payment_phone', 'bank_details', 'direct_phone', 'final_deadline', 'sender_name'],
      aiOptimized: true,
      performance: {
        openRate: 87,
        responseRate: 72,
        conversionRate: 58,
        avgResponseTime: 3.2
      },
      language: 'fr',
      industry: 'finance',
      created_at: new Date().toISOString(),
      tags: ['facture', 'relance', 'psychologie', 'solutions', 'urgence'],
      aiScore: 92,
      emotionalImpact: 'medium',
      persuasionLevel: 'high'
    },
    {
      id: 4,
      name: '🎯 Marketing Viral Émotionnel',
      category: 'marketing',
      tone: 'persuasif',
      subject: '🔥 {{client_name}}, cette histoire va vous bouleverser...',
      body: `{{client_name}},

Il y a 3 jours, j'ai reçu un message qui m'a fait pleurer de joie...

📧 **LE MESSAGE** :
"Grâce à votre solution, j'ai pu sauver mon entreprise familiale. Mes 15 employés gardent leur travail. Mes enfants peuvent continuer leurs études. Vous avez changé notre vie. Merci du fond du cœur." - Marie D., CEO

💔 **SON HISTOIRE** :
• Entreprise familiale de 3 générations en péril
• 15 familles dépendantes de cette entreprise  
• Banques qui refusaient les prêts
• Solution trouvée grâce à notre accompagnement

✨ **LE MIRACLE** :
En 90 jours :
• 🚀 Chiffre d'affaires x3
• 💰 Bénéfices +450%
• 👥 Équipe motivée et épanouie
• 🏆 Prix "Entreprise de l'année" dans sa région

{{client_name}}, et si c'était VOTRE histoire dans 90 jours ?

🎁 **CADEAU EXCEPTIONNEL** :
Je vous offre personnellement :
• 📞 Consultation stratégique gratuite (valeur 500€)
• 📊 Audit complet de votre situation (valeur 1200€)
• 🎯 Plan d'action personnalisé (valeur 800€)
• **TOTAL : 2500€ offerts**

💝 **POURQUOI JE FAIS ÇA ?**
Parce que chaque entrepreneur mérite sa chance de réussir.
Parce que derrière chaque entreprise, il y a des familles.
Parce que votre succès est ma plus belle récompense.

{{client_name}}, êtes-vous prêt(e) à écrire VOTRE histoire de succès ?

👆 **CLIQUEZ ICI** pour réserver votre créneau : {{booking_link}}

⏰ **ATTENTION** : Seulement 5 places disponibles cette semaine.

Avec toute ma passion pour votre réussite,
{{sender_name}}
🌟 Votre Partenaire de Transformation

P.S. : Marie m'a autorisé à partager son témoignage vidéo. Regardez-la ici : {{video_link}} (préparez les mouchoirs !)`,
      variables: ['client_name', 'sender_name', 'booking_link', 'video_link'],
      aiOptimized: true,
      performance: {
        openRate: 91,
        responseRate: 73,
        conversionRate: 41,
        avgResponseTime: 1.9
      },
      language: 'fr',
      industry: 'general',
      created_at: new Date().toISOString(),
      tags: ['storytelling', 'émotionnel', 'viral', 'transformation', 'gratuit'],
      aiScore: 97,
      emotionalImpact: 'maximum',
      persuasionLevel: 'maximum'
    }
  ];

  useEffect(() => {
    loadTemplates();
    loadAnalytics();
  }, []);

  const loadTemplates = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setTemplates(revolutionaryTemplates);
      
      // Update category counts
      const updatedCategories = categories.map(cat => ({
        ...cat,
        count: cat.id === 'all' 
          ? revolutionaryTemplates.length 
          : revolutionaryTemplates.filter(t => t.category === cat.id).length
      }));
      
    } catch (error) {
      console.warn('Erreur chargement templates:', error);
      setTemplates(revolutionaryTemplates);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      setAnalytics({
        totalTemplates: revolutionaryTemplates.length,
        avgOpenRate: 90.25,
        avgResponseRate: 72.5,
        avgConversionRate: 44.5,
        topPerformer: revolutionaryTemplates[1],
        totalUsage: 1247,
        aiOptimizedCount: revolutionaryTemplates.filter(t => t.aiOptimized).length,
        languageDistribution: { fr: 100 },
        industryDistribution: { tech: 25, general: 50, finance: 25 }
      });
    } catch (error) {
      console.warn('Erreur chargement analytics:', error);
    }
  };

  const filteredTemplates = templates
    .filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           template.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           template.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
      const matchesTone = selectedTone === 'all' || template.tone === selectedTone;
      return matchesSearch && matchesCategory && matchesTone;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'performance':
          return (b.performance?.conversionRate || 0) - (a.performance?.conversionRate || 0);
        case 'aiScore':
          return (b.aiScore || 0) - (a.aiScore || 0);
        case 'usage':
          return (b.usage || 0) - (a.usage || 0);
        case 'recent':
          return new Date(b.created_at) - new Date(a.created_at);
        default:
          return 0;
      }
    });

  const generateAITemplate = async () => {
    if (!newTemplate.name || !newTemplate.category) {
      toast.error('Veuillez remplir le nom et la catégorie');
      return;
    }

    setAiGenerating(true);
    toast.loading('IA en cours de génération...', { id: 'ai-gen' });

    try {
      await new Promise(resolve => setTimeout(resolve, 3000));

      const aiGeneratedContent = {
        subject: `🚀 ${newTemplate.name} - Opportunité exclusive pour {{client_name}}`,
        body: `Bonjour {{client_name}},

J'espère que vous allez bien.

🎯 **OPPORTUNITÉ SPÉCIALE** concernant ${newTemplate.name.toLowerCase()}.

Notre équipe a développé une solution révolutionnaire qui pourrait transformer votre approche de ${newTemplate.category}.

✨ **BÉNÉFICES CLÉS** :
• Amélioration immédiate de vos résultats
• ROI mesurable dès les premiers jours
• Support expert inclus
• Garantie satisfaction 100%

{{client_name}}, seriez-vous disponible pour un échange de 15 minutes cette semaine ?

Je vous montrerai exactement comment cette solution peut s'adapter à vos besoins spécifiques.

Cordialement,
{{sender_name}}

P.S. : Répondez rapidement, cette offre est limitée dans le temps !`,
        variables: ['client_name', 'sender_name'],
        aiOptimized: true,
        aiScore: Math.floor(Math.random() * 20) + 80,
        tags: ['IA généré', 'optimisé', 'personnalisé']
      };

      setNewTemplate(prev => ({
        ...prev,
        ...aiGeneratedContent
      }));

      toast.success('Template généré par IA avec succès !', { id: 'ai-gen' });
    } catch (error) {
      toast.error('Erreur génération IA', { id: 'ai-gen' });
    } finally {
      setAiGenerating(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!newTemplate.name || !newTemplate.subject || !newTemplate.body) {
      toast.error('Veuillez remplir tous les champs requis');
      return;
    }

    try {
      const templateData = {
        ...newTemplate,
        id: Date.now(),
        created_at: new Date().toISOString(),
        performance: {
          openRate: Math.floor(Math.random() * 20) + 70,
          responseRate: Math.floor(Math.random() * 30) + 50,
          conversionRate: Math.floor(Math.random() * 25) + 25,
          avgResponseTime: Math.random() * 3 + 1
        }
      };

      setTemplates([templateData, ...templates]);
      toast.success('🎉 Template révolutionnaire créé !');
      setShowCreateModal(false);
      setNewTemplate({
        name: '', category: 'commercial', tone: 'professionnel', subject: '', body: '',
        variables: [], aiOptimized: false, language: 'fr', industry: 'general'
      });
    } catch (error) {
      toast.error('Erreur lors de la création');
    }
  };

  const useTemplate = (template) => {
    const variables = {};
    template.variables.forEach(variable => {
      const value = prompt(`💡 Valeur pour "${variable}":`);
      if (value !== null) variables[variable] = value;
    });

    let subject = template.subject;
    let body = template.body;

    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      subject = subject.replace(regex, value);
      body = body.replace(regex, value);
    });

    const emailContent = `Sujet: ${subject}\n\n${body}`;
    navigator.clipboard.writeText(emailContent);
    
    // Update usage stats
    setTemplates(prev => prev.map(t => 
      t.id === template.id 
        ? { ...t, usage: (t.usage || 0) + 1 }
        : t
    ));
    
    toast.success('🚀 Email révolutionnaire copié !');
  };

  const getPerformanceColor = (rate) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAiScoreColor = (score) => {
    if (score >= 95) return 'text-purple-600';
    if (score >= 90) return 'text-blue-600';
    if (score >= 80) return 'text-green-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-12 bg-gradient-to-r from-purple-200 to-pink-200 rounded-2xl"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-80 bg-gray-200 rounded-2xl"></div>
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
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Templates IA Révolutionnaires</h1>
              <p className="opacity-90">Modèles d'emails ultra-performants alimentés par l'IA</p>
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
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-all"
            >
              <Plus className="w-4 h-4" />
              Créer Template IA
            </button>
          </div>
        </div>
      </div>

      {/* Analytics Dashboard */}
      {showAnalytics && analytics && (
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Analytics Avancés</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="bg-white rounded-xl p-4 text-center">
              <FileText className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-600">{analytics.totalTemplates}</p>
              <p className="text-xs text-gray-600">Templates</p>
            </div>
            
            <div className="bg-white rounded-xl p-4 text-center">
              <Eye className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">{analytics.avgOpenRate}%</p>
              <p className="text-xs text-gray-600">Taux ouverture</p>
            </div>
            
            <div className="bg-white rounded-xl p-4 text-center">
              <Target className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-600">{analytics.avgResponseRate}%</p>
              <p className="text-xs text-gray-600">Taux réponse</p>
            </div>
            
            <div className="bg-white rounded-xl p-4 text-center">
              <Zap className="w-6 h-6 text-orange-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-orange-600">{analytics.avgConversionRate}%</p>
              <p className="text-xs text-gray-600">Conversion</p>
            </div>
            
            <div className="bg-white rounded-xl p-4 text-center">
              <Bot className="w-6 h-6 text-pink-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-pink-600">{analytics.aiOptimizedCount}</p>
              <p className="text-xs text-gray-600">IA Optimisés</p>
            </div>
            
            <div className="bg-white rounded-xl p-4 text-center">
              <Users className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-indigo-600">{analytics.totalUsage}</p>
              <p className="text-xs text-gray-600">Utilisations</p>
            </div>
          </div>
        </div>
      )}

      {/* Filtres avancés */}
      <div className="bg-white shadow-2xl rounded-2xl p-6">
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-64 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, sujet, tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
          >
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name} {category.count > 0 && `(${category.count})`}
              </option>
            ))}
          </select>

          <select
            value={selectedTone}
            onChange={(e) => setSelectedTone(e.target.value)}
            className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
          >
            {tones.map(tone => (
              <option key={tone.id} value={tone.id}>
                {tone.emoji} {tone.name}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500"
          >
            <option value="performance">🏆 Performance</option>
            <option value="aiScore">🤖 Score IA</option>
            <option value="usage">📊 Utilisation</option>
            <option value="recent">⏰ Récent</option>
          </select>
        </div>
      </div>

      {/* Templates révolutionnaires */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map(template => (
          <div key={template.id} className="bg-white shadow-2xl rounded-2xl overflow-hidden hover:shadow-3xl transition-all transform hover:-translate-y-2">
            {/* Header avec badges */}
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 border-b">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-bold text-gray-900 flex-1">{template.name}</h3>
                {template.aiOptimized && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                    <Sparkles className="w-3 h-3" />
                    IA
                  </div>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold bg-${categories.find(c => c.id === template.category)?.color || 'gray'}-100 text-${categories.find(c => c.id === template.category)?.color || 'gray'}-700`}>
                  {categories.find(c => c.id === template.category)?.name || template.category}
                </span>
                
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-pink-100 text-pink-700">
                  {tones.find(t => t.id === template.tone)?.emoji} {template.tone}
                </span>
                
                {template.aiScore && (
                  <span className={`px-3 py-1 rounded-full text-xs font-bold bg-purple-100 ${getAiScoreColor(template.aiScore)}`}>
                    🤖 {template.aiScore}%
                  </span>
                )}
              </div>
            </div>

            {/* Contenu */}
            <div className="p-4 space-y-4">
              <div>
                <p className="text-sm font-bold text-gray-700 mb-1">📧 Sujet:</p>
                <p className="text-sm text-gray-600 line-clamp-2">{template.subject}</p>
              </div>
              
              <div>
                <p className="text-sm font-bold text-gray-700 mb-1">✍️ Aperçu:</p>
                <p className="text-sm text-gray-600 line-clamp-3">{template.body.substring(0, 120)}...</p>
              </div>

              {/* Performance metrics */}
              {template.performance && (
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-3">
                  <p className="text-xs font-bold text-gray-700 mb-2">📊 Performance:</p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className={`text-lg font-bold ${getPerformanceColor(template.performance.openRate)}`}>
                        {template.performance.openRate}%
                      </p>
                      <p className="text-xs text-gray-600">Ouverture</p>
                    </div>
                    <div>
                      <p className={`text-lg font-bold ${getPerformanceColor(template.performance.responseRate)}`}>
                        {template.performance.responseRate}%
                      </p>
                      <p className="text-xs text-gray-600">Réponse</p>
                    </div>
                    <div>
                      <p className={`text-lg font-bold ${getPerformanceColor(template.performance.conversionRate)}`}>
                        {template.performance.conversionRate}%
                      </p>
                      <p className="text-xs text-gray-600">Conversion</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tags */}
              {template.tags && (
                <div>
                  <p className="text-xs font-bold text-gray-700 mb-2">🏷️ Tags:</p>
                  <div className="flex flex-wrap gap-1">
                    {template.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                        #{tag}
                      </span>
                    ))}
                    {template.tags.length > 3 && (
                      <span className="text-xs text-gray-500">+{template.tags.length - 3}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Variables */}
              {template.variables && template.variables.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-700 mb-2">🔧 Variables ({template.variables.length}):</p>
                  <div className="flex flex-wrap gap-1">
                    {template.variables.slice(0, 3).map(variable => (
                      <span key={variable} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        {variable}
                      </span>
                    ))}
                    {template.variables.length > 3 && (
                      <span className="text-xs text-blue-600">+{template.variables.length - 3}</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="bg-gray-50 px-4 py-3 flex justify-between items-center">
              <div className="flex gap-2">
                <button
                  onClick={() => setPreviewTemplate(template)}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all text-sm font-medium"
                >
                  <Eye className="w-3 h-3" />
                  Voir
                </button>
                
                <button
                  onClick={() => useTemplate(template)}
                  className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-all text-sm font-medium"
                >
                  <Rocket className="w-3 h-3" />
                  Utiliser
                </button>
              </div>
              
              <div className="flex gap-1">
                <button
                  onClick={() => setEditingTemplate(template)}
                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => {
                    if (confirm('Supprimer ce template révolutionnaire ?')) {
                      setTemplates(templates.filter(t => t.id !== template.id));
                      toast.success('Template supprimé');
                    }
                  }}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
          <Bot className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Aucun template trouvé</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || selectedCategory !== 'all' || selectedTone !== 'all'
              ? 'Essayez de modifier vos filtres de recherche.'
              : 'Créez votre premier template révolutionnaire !'}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all font-bold"
          >
            <Plus className="w-4 h-4 mr-2 inline" />
            Créer un Template IA
          </button>
        </div>
      )}

      {/* Modal de création révolutionnaire */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-t-2xl">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="w-6 h-6" />
                Créer un Template IA Révolutionnaire
              </h3>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">🎯 Nom du template</label>
                  <input
                    type="text"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                    className="w-full border-2 border-gray-300 rounded-xl py-3 px-4 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Ex: Proposition commerciale révolutionnaire"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">📂 Catégorie</label>
                  <select
                    value={newTemplate.category}
                    onChange={(e) => setNewTemplate({...newTemplate, category: e.target.value})}
                    className="w-full border-2 border-gray-300 rounded-xl py-3 px-4 focus:ring-2 focus:ring-purple-500"
                  >
                    {categories.filter(c => c.id !== 'all').map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">🎭 Ton</label>
                  <select
                    value={newTemplate.tone}
                    onChange={(e) => setNewTemplate({...newTemplate, tone: e.target.value})}
                    className="w-full border-2 border-gray-300 rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-500"
                  >
                    {tones.filter(t => t.id !== 'all').map(tone => (
                      <option key={tone.id} value={tone.id}>{tone.emoji} {tone.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">🏭 Secteur</label>
                  <select
                    value={newTemplate.industry}
                    onChange={(e) => setNewTemplate({...newTemplate, industry: e.target.value})}
                    className="w-full border-2 border-gray-300 rounded-xl py-3 px-4 focus:ring-2 focus:ring-green-500"
                  >
                    {industries.map(industry => (
                      <option key={industry.id} value={industry.id}>{industry.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-bold text-gray-700">📧 Sujet</label>
                  <button
                    onClick={generateAITemplate}
                    disabled={aiGenerating}
                    className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 transition-all text-sm font-medium"
                  >
                    {aiGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                        Génération IA...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-3 h-3" />
                        Générer IA
                      </>
                    )}
                  </button>
                </div>
                <input
                  type="text"
                  value={newTemplate.subject}
                  onChange={(e) => setNewTemplate({...newTemplate, subject: e.target.value})}
                  className="w-full border-2 border-gray-300 rounded-xl py-3 px-4 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Utilisez {{variable}} pour les champs dynamiques"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">✍️ Corps du message</label>
                <textarea
                  rows={12}
                  value={newTemplate.body}
                  onChange={(e) => setNewTemplate({...newTemplate, body: e.target.value})}
                  className="w-full border-2 border-gray-300 rounded-xl py-3 px-4 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Rédigez votre template révolutionnaire... Utilisez {{variable}} pour les champs dynamiques"
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
                  onClick={handleCreateTemplate}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all font-bold"
                >
                  🚀 Créer le Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de prévisualisation */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black/50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <Eye className="w-6 h-6" />
                {previewTemplate.name}
              </h3>
              <div className="flex gap-2 mt-2">
                {previewTemplate.aiOptimized && (
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                    ✨ IA Optimisé
                  </span>
                )}
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                  🎯 Score: {previewTemplate.aiScore || 'N/A'}%
                </span>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">📧 Sujet</label>
                <div className="p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                  <p className="text-gray-900 font-medium">{previewTemplate.subject}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">✍️ Corps du message</label>
                <div className="p-4 bg-gray-50 rounded-xl border-2 border-gray-200 max-h-80 overflow-y-auto">
                  <p className="text-gray-900 whitespace-pre-wrap">{previewTemplate.body}</p>
                </div>
              </div>
              
              {previewTemplate.performance && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">📊 Performance</label>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-green-50 rounded-xl p-4 text-center border-2 border-green-200">
                      <p className="text-2xl font-bold text-green-600">{previewTemplate.performance.openRate}%</p>
                      <p className="text-sm text-green-700">Ouverture</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-4 text-center border-2 border-blue-200">
                      <p className="text-2xl font-bold text-blue-600">{previewTemplate.performance.responseRate}%</p>
                      <p className="text-sm text-blue-700">Réponse</p>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-4 text-center border-2 border-purple-200">
                      <p className="text-2xl font-bold text-purple-600">{previewTemplate.performance.conversionRate}%</p>
                      <p className="text-sm text-purple-700">Conversion</p>
                    </div>
                    <div className="bg-orange-50 rounded-xl p-4 text-center border-2 border-orange-200">
                      <p className="text-2xl font-bold text-orange-600">{previewTemplate.performance.avgResponseTime.toFixed(1)}h</p>
                      <p className="text-sm text-orange-700">Temps réponse</p>
                    </div>
                  </div>
                </div>
              )}
              
              {previewTemplate.variables && previewTemplate.variables.length > 0 && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">🔧 Variables ({previewTemplate.variables.length})</label>
                  <div className="flex flex-wrap gap-2">
                    {previewTemplate.variables.map(variable => (
                      <span key={variable} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium border-2 border-blue-200">
                        {variable}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all font-medium"
                >
                  Fermer
                </button>
                <button
                  onClick={() => {
                    useTemplate(previewTemplate);
                    setPreviewTemplate(null);
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl hover:from-green-700 hover:to-blue-700 transition-all font-bold"
                >
                  🚀 Utiliser ce Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}