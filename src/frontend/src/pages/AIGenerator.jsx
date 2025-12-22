import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, Bot, Zap, Target, TrendingUp, Brain, 
  Copy, Send, Save, RefreshCw, Settings, Eye,
  FileText, Users, Clock, BarChart3, Lightbulb,
  Wand2, MessageSquare, CheckCircle, AlertCircle,
  Sliders, Palette, Globe, Mic, Image, Play
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AIGenerator() {
  const [config, setConfig] = useState({
    context: '',
    tone: 'professionnel',
    emailType: 'demande',
    language: 'fr',
    length: 'moyen',
    formality: 'standard',
    urgency: 'normal',
    audience: 'professionnel',
    industry: 'general',
    objective: 'informer'
  });

  const [results, setResults] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [selectedResult, setSelectedResult] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [aiModel, setAiModel] = useState('gpt-4');
  const [creativity, setCreativity] = useState(0.7);
  const [templates, setTemplates] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [previewMode, setPreviewMode] = useState('desktop');

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    if (results.length > 0) {
      analyzeEmail(results[selectedResult]);
    }
  }, [results, selectedResult]);

  const loadTemplates = () => {
    const expertTemplates = [
      {
        name: 'Négociation commerciale',
        context: 'Négocier les termes d\'un contrat avec un client stratégique, en mettant l\'accent sur la valeur ajoutée et les bénéfices mutuels',
        tone: 'professionnel',
        type: 'commercial',
        industry: 'business'
      },
      {
        name: 'Gestion de crise client',
        context: 'Répondre à un client mécontent suite à un problème de service, avec empathie et solutions concrètes',
        tone: 'empathique',
        type: 'support',
        industry: 'service'
      },
      {
        name: 'Proposition de partenariat',
        context: 'Proposer un partenariat stratégique à une entreprise complémentaire, en détaillant les synergies possibles',
        tone: 'persuasif',
        type: 'partenariat',
        industry: 'business'
      },
      {
        name: 'Relance diplomatique',
        context: 'Relancer poliment un prospect qui n\'a pas donné suite, en apportant de nouveaux éléments de valeur',
        tone: 'diplomatique',
        type: 'relance',
        industry: 'sales'
      },
      {
        name: 'Annonce de changement',
        context: 'Annoncer un changement organisationnel important aux équipes, en expliquant les bénéfices et la vision',
        tone: 'inspirant',
        type: 'interne',
        industry: 'management'
      },
      {
        name: 'Demande de financement',
        context: 'Solliciter un financement auprès d\'investisseurs, en présentant le projet et les opportunités de retour',
        tone: 'convaincant',
        type: 'financement',
        industry: 'startup'
      }
    ];
    setTemplates(expertTemplates);
  };

  const analyzeEmail = (email) => {
    if (!email) return;
    
    const words = email.split(' ').length;
    const sentences = email.split(/[.!?]+/).length - 1;
    const avgWordsPerSentence = Math.round(words / sentences);
    
    const analysis = {
      readability: words < 100 ? 'Excellent' : words < 200 ? 'Bon' : 'Moyen',
      tone_detected: detectTone(email),
      word_count: words,
      sentence_count: sentences,
      avg_sentence_length: avgWordsPerSentence,
      estimated_read_time: Math.ceil(words / 200),
      engagement_score: calculateEngagementScore(email),
      professionalism_score: calculateProfessionalismScore(email),
      clarity_score: calculateClarityScore(email)
    };
    
    setAnalysis(analysis);
  };

  const detectTone = (text) => {
    const formalWords = ['veuillez', 'cordialement', 'respectueusement', 'madame', 'monsieur'];
    const casualWords = ['salut', 'coucou', 'à bientôt', 'merci beaucoup'];
    const urgentWords = ['urgent', 'rapidement', 'immédiatement', 'asap'];
    
    const lowerText = text.toLowerCase();
    
    if (urgentWords.some(word => lowerText.includes(word))) return 'Urgent';
    if (formalWords.some(word => lowerText.includes(word))) return 'Formel';
    if (casualWords.some(word => lowerText.includes(word))) return 'Décontracté';
    return 'Professionnel';
  };

  const calculateEngagementScore = (text) => {
    let score = 70;
    if (text.includes('?')) score += 10;
    if (text.includes('!')) score += 5;
    if (text.length > 500) score -= 10;
    if (text.length < 100) score -= 15;
    return Math.max(0, Math.min(100, score));
  };

  const calculateProfessionalismScore = (text) => {
    let score = 80;
    const professionalWords = ['cordialement', 'respectueusement', 'veuillez', 'madame', 'monsieur'];
    const casualWords = ['salut', 'coucou', 'bisous'];
    
    professionalWords.forEach(word => {
      if (text.toLowerCase().includes(word)) score += 5;
    });
    
    casualWords.forEach(word => {
      if (text.toLowerCase().includes(word)) score -= 15;
    });
    
    return Math.max(0, Math.min(100, score));
  };

  const calculateClarityScore = (text) => {
    const sentences = text.split(/[.!?]+/).length - 1;
    const words = text.split(' ').length;
    const avgWordsPerSentence = words / sentences;
    
    let score = 85;
    if (avgWordsPerSentence > 25) score -= 20;
    if (avgWordsPerSentence > 35) score -= 20;
    if (sentences < 3) score -= 10;
    
    return Math.max(0, Math.min(100, score));
  };

  const handleGenerate = async () => {
    if (!config.context.trim()) {
      toast.error('Veuillez décrire le contexte de votre email');
      return;
    }

    setGenerating(true);
    try {
      // Générer 3 versions différentes
      const promises = [
        generateVersion('court'),
        generateVersion('standard'), 
        generateVersion('détaillé')
      ];

      const responses = await Promise.all(promises);
      setResults(responses);
      setSelectedResult(0);
      toast.success('3 versions générées avec succès !');
    } catch (error) {
      toast.error('Erreur génération: ' + error.message);
      // Fallback avec contenu simulé
      generateFallbackVersions();
    } finally {
      setGenerating(false);
    }
  };

  const generateVersion = async (length) => {
    const response = await fetch('/api/generate-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context: config.context,
        tone: config.tone,
        emailType: config.emailType,
        language: config.language,
        length: length,
        formality: config.formality,
        urgency: config.urgency,
        audience: config.audience,
        industry: config.industry,
        objective: config.objective,
        model: aiModel,
        creativity: creativity
      })
    });

    const data = await response.json();
    return data.body || data.content || data.generated_text || generateFallbackContent(length);
  };

  const generateFallbackVersions = () => {
    const versions = [
      generateFallbackContent('court'),
      generateFallbackContent('standard'),
      generateFallbackContent('détaillé')
    ];
    setResults(versions);
    setSelectedResult(0);
  };

  const generateFallbackContent = (length) => {
    const baseContent = {
      court: `Objet: ${config.context.substring(0, 50)}

Bonjour,

${config.context}

Cordialement`,
      
      standard: `Objet: ${config.context.substring(0, 50)}

Bonjour,

J'espère que vous allez bien.

${config.context}

Je reste à votre disposition pour tout complément d'information.

Cordialement`,
      
      détaillé: `Objet: ${config.context.substring(0, 50)}

Bonjour,

J'espère que ce message vous trouve en bonne santé.

${config.context}

Cette demande s'inscrit dans le cadre de nos activités et revêt une importance particulière pour nous. Je serais reconnaissant de pouvoir compter sur votre expertise et votre bienveillance pour traiter cette demande dans les meilleurs délais.

N'hésitez pas à me contacter si vous avez besoin de précisions supplémentaires ou de documents complémentaires.

Je vous remercie par avance pour votre attention et reste dans l'attente de votre retour.

Cordialement`
    };

    return baseContent[length] || baseContent.standard;
  };

  const applyTemplate = (template) => {
    setConfig(prev => ({
      ...prev,
      context: template.context,
      tone: template.tone,
      emailType: template.type,
      industry: template.industry
    }));
    toast.success(`Template "${template.name}" appliqué !`);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copié dans le presse-papiers !');
  };

  const sendToComposer = (text) => {
    localStorage.setItem('draft_email', JSON.stringify({
      subject: text.split('\n')[0].replace('Objet: ', ''),
      body: text.split('\n').slice(2).join('\n')
    }));
    toast.success('Email envoyé vers le compositeur !');
  };

  const toneOptions = [
    { value: 'professionnel', label: 'Professionnel', desc: 'Ton courtois et formel' },
    { value: 'amical', label: 'Amical', desc: 'Ton chaleureux et proche' },
    { value: 'formel', label: 'Formel', desc: 'Ton très officiel' },
    { value: 'persuasif', label: 'Persuasif', desc: 'Ton convaincant' },
    { value: 'empathique', label: 'Empathique', desc: 'Ton compréhensif' },
    { value: 'diplomatique', label: 'Diplomatique', desc: 'Ton nuancé et tactique' },
    { value: 'inspirant', label: 'Inspirant', desc: 'Ton motivant et visionnaire' },
    { value: 'urgent', label: 'Urgent', desc: 'Ton direct et pressant' }
  ];

  const emailTypes = [
    { value: 'demande', label: 'Demande', icon: MessageSquare },
    { value: 'commercial', label: 'Commercial', icon: Target },
    { value: 'support', label: 'Support', icon: Users },
    { value: 'relance', label: 'Relance', icon: RefreshCw },
    { value: 'partenariat', label: 'Partenariat', icon: Users },
    { value: 'financement', label: 'Financement', icon: TrendingUp },
    { value: 'interne', label: 'Interne', icon: Building }
  ];

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Brain className="h-8 w-8 mr-3 text-purple-600" />
            Générateur IA Expert
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Génération d'emails professionnels avec IA avancée - 3 versions automatiques
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <Settings className="h-4 w-4 mr-2" />
            {showAdvanced ? 'Masquer' : 'Avancé'}
          </button>
          <Link 
            to="/compose"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <Send className="h-4 w-4 mr-2" />
            Compositeur
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Configuration Panel */}
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-white shadow-lg rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Sliders className="h-5 w-5 mr-2 text-blue-600" />
              Configuration
            </h3>

            <div className="space-y-4">
              {/* Context */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contexte / Demande *
                </label>
                <textarea
                  value={config.context}
                  onChange={(e) => setConfig(prev => ({ ...prev, context: e.target.value }))}
                  rows={4}
                  className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Décrivez précisément votre demande, le contexte, les objectifs..."
                />
              </div>

              {/* Email Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type d'email
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {emailTypes.slice(0, 6).map(type => {
                    const IconComponent = type.icon;
                    return (
                      <button
                        key={type.value}
                        onClick={() => setConfig(prev => ({ ...prev, emailType: type.value }))}
                        className={`p-2 text-xs rounded-lg border-2 transition-colors ${
                          config.emailType === type.value
                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <IconComponent className="h-4 w-4 mx-auto mb-1" />
                        {type.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ton
                </label>
                <select
                  value={config.tone}
                  onChange={(e) => setConfig(prev => ({ ...prev, tone: e.target.value }))}
                  className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {toneOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label} - {option.desc}
                    </option>
                  ))}
                </select>
              </div>

              {/* Advanced Options */}
              {showAdvanced && (
                <div className="space-y-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Formalité
                      </label>
                      <select
                        value={config.formality}
                        onChange={(e) => setConfig(prev => ({ ...prev, formality: e.target.value }))}
                        className="w-full text-sm border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="casual">Décontracté</option>
                        <option value="standard">Standard</option>
                        <option value="formal">Formel</option>
                        <option value="very-formal">Très formel</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Urgence
                      </label>
                      <select
                        value={config.urgency}
                        onChange={(e) => setConfig(prev => ({ ...prev, urgency: e.target.value }))}
                        className="w-full text-sm border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="low">Faible</option>
                        <option value="normal">Normal</option>
                        <option value="high">Élevée</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Modèle IA
                    </label>
                    <select
                      value={aiModel}
                      onChange={(e) => setAiModel(e.target.value)}
                      className="w-full text-sm border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="gpt-4">GPT-4 (Recommandé)</option>
                      <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                      <option value="claude-3">Claude 3</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Créativité: {Math.round(creativity * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={creativity}
                      onChange={(e) => setCreativity(parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Conservateur</span>
                      <span>Créatif</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={generating || !config.context.trim()}
                className="w-full inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Générer 3 versions
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Templates */}
          <div className="bg-white shadow-lg rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Lightbulb className="h-5 w-5 mr-2 text-yellow-600" />
              Templates Expert
            </h3>
            <div className="space-y-2">
              {templates.slice(0, 4).map((template, idx) => (
                <button
                  key={idx}
                  onClick={() => applyTemplate(template)}
                  className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-blue-50 hover:border-blue-200 border border-gray-200 transition-colors"
                >
                  <div className="font-medium text-sm text-gray-900">{template.name}</div>
                  <div className="text-xs text-gray-500 mt-1 line-clamp-2">{template.context.substring(0, 80)}...</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="xl:col-span-2 space-y-6">
          {results.length > 0 ? (
            <div className="bg-white shadow-lg rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Wand2 className="h-5 w-5 mr-2 text-purple-600" />
                    Résultats générés
                  </h3>
                  <div className="flex items-center space-x-2">
                    {['Court', 'Standard', 'Détaillé'].map((label, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedResult(idx)}
                        className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                          selectedResult === idx
                            ? 'bg-purple-100 text-purple-700 font-medium'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6">
                {results[selectedResult] && (
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4 min-h-[400px]">
                      <div className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
                        {results[selectedResult]}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{results[selectedResult].split(' ').length} mots</span>
                        <span>{results[selectedResult].split(/[.!?]+/).length - 1} phrases</span>
                        <span>{Math.ceil(results[selectedResult].split(' ').length / 200)} min lecture</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => copyToClipboard(results[selectedResult])}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copier
                        </button>
                        <button
                          onClick={() => sendToComposer(results[selectedResult])}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Composer
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white shadow-lg rounded-lg p-12">
              <div className="text-center">
                <Bot className="mx-auto h-16 w-16 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">Prêt à générer</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Décrivez votre demande et cliquez sur "Générer 3 versions" pour commencer
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Analysis Panel */}
        <div className="xl:col-span-1 space-y-6">
          {analysis && (
            <div className="bg-white shadow-lg rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-green-600" />
                Analyse IA
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className={`p-3 rounded-lg ${getScoreBg(analysis.engagement_score)}`}>
                    <div className="text-xs text-gray-600">Engagement</div>
                    <div className={`text-lg font-bold ${getScoreColor(analysis.engagement_score)}`}>
                      {analysis.engagement_score}%
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg ${getScoreBg(analysis.professionalism_score)}`}>
                    <div className="text-xs text-gray-600">Professionnalisme</div>
                    <div className={`text-lg font-bold ${getScoreColor(analysis.professionalism_score)}`}>
                      {analysis.professionalism_score}%
                    </div>
                  </div>
                </div>

                <div className={`p-3 rounded-lg ${getScoreBg(analysis.clarity_score)}`}>
                  <div className="text-xs text-gray-600">Clarté</div>
                  <div className={`text-lg font-bold ${getScoreColor(analysis.clarity_score)}`}>
                    {analysis.clarity_score}%
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Lisibilité</span>
                    <span className="font-medium">{analysis.readability}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ton détecté</span>
                    <span className="font-medium">{analysis.tone_detected}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Temps lecture</span>
                    <span className="font-medium">{analysis.estimated_read_time} min</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="bg-white shadow-lg rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
              Statistiques
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Emails générés aujourd'hui</span>
                <span className="text-sm font-semibold text-blue-600">23</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Taux de satisfaction</span>
                <span className="text-sm font-semibold text-green-600">94%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Temps moyen</span>
                <span className="text-sm font-semibold text-purple-600">12s</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white shadow-lg rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h3>
            <div className="space-y-2">
              <Link
                to="/templates"
                className="flex items-center space-x-2 p-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                <FileText className="h-4 w-4" />
                <span>Gérer templates</span>
              </Link>
              <Link
                to="/history"
                className="flex items-center space-x-2 p-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                <Clock className="h-4 w-4" />
                <span>Historique IA</span>
              </Link>
              <Link
                to="/voice"
                className="flex items-center space-x-2 p-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                <Mic className="h-4 w-4" />
                <span>Dictée vocale</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}