import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Send, Sparkles, Mic, FileText, Users, Clock, Paperclip, Eye, Save, Calendar, AtSign, 
  Smile, Bold, Italic, Underline, List, AlignLeft, AlignCenter, Image, Link as LinkIcon,
  Zap, Target, TrendingUp, CheckCircle, Bot, Brain, Heart, Globe, Shield, Wand2,
  Volume2, Play, Pause, RotateCcw, Copy, Share2, MessageSquare, Star, AlertCircle,
  Palette, Type, Languages, Gauge, Award, Lightbulb, Rocket
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Compose() {
  const [email, setEmail] = useState({
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    body: '',
    tone: 'professionnel',
    priority: 'normal',
    scheduledAt: '',
    language: 'fr',
    personality: 'assistant',
    emotion: 'neutral'
  });

  const [sending, setSending] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [voiceTarget, setVoiceTarget] = useState('body'); // 'subject' ou 'body'
  const [voiceMode, setVoiceMode] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState(''); // Texte dicté
  const [showConfirmation, setShowConfirmation] = useState(false); // Confirmation avant génération
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(true);
  const [contacts, setContacts] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [showContacts, setShowContacts] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [wordCount, setWordCount] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  const [aiPersonalities, setAiPersonalities] = useState([]);
  const [emotionalTone, setEmotionalTone] = useState('neutral');
  const [autoSaving, setAutoSaving] = useState(false);

  const recognitionRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    loadContacts();
    loadTemplates();
    loadAiPersonalities();
    initializeVoiceRecognition();
    
    // Auto-save every 30 seconds
    const autoSaveInterval = setInterval(autoSave, 30000);
    return () => clearInterval(autoSaveInterval);
  }, []);

  useEffect(() => {
    const words = email.body.trim().split(/\s+/).filter(word => word.length > 0).length;
    setWordCount(words);
    setReadingTime(Math.ceil(words / 200));
    
    if (email.subject && email.body.length > 50) {
      generateAISuggestions();
      analyzeEmailWithAI();
    }
  }, [email.body, email.subject]);

  const initializeVoiceRecognition = () => {
    if ('webkitSpeechRecognition' in window) {
      recognitionRef.current = new webkitSpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'fr-FR';
      
      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        if (finalTranscript) {
          setVoiceTranscript(prev => (prev + ' ' + finalTranscript).trim());
          
          if (voiceTarget === 'subject') {
            setEmail(prev => ({ ...prev, subject: (prev.subject + ' ' + finalTranscript).trim() }));
          } else {
            setEmail(prev => ({ ...prev, body: prev.body + ' ' + finalTranscript }));
          }
        }
        
        // Log pour debug
        if (interimTranscript) {
          console.log('Transcription en cours:', interimTranscript);
        }
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Erreur reconnaissance vocale:', event.error);
        toast.error('Erreur reconnaissance: ' + event.error);
        setVoiceMode(false);
      };
      
      recognitionRef.current.onend = () => {
        console.log('Reconnaissance vocale terminée');
        if (voiceMode) {
          setVoiceMode(false);
        }
      };
    }
  };

  const toggleVoiceMode = (target = 'body') => {
    if (!recognitionRef.current) {
      toast.error('Reconnaissance vocale non supportée dans ce navigateur');
      return;
    }

    if (voiceMode) {
      recognitionRef.current.stop();
      setVoiceMode(false);
      
      // Afficher confirmation si on a du texte et c'est pour le sujet
      if (voiceTranscript && target === 'subject') {
        setShowConfirmation(true);
        toast.success('Sujet dicté ! Vérifiez avant génération IA');
      } else {
        toast.success('Dictée vocale arrêtée');
      }
    } else {
      setVoiceTarget(target);
      setVoiceTranscript(''); // Reset transcription
      
      try {
        recognitionRef.current.start();
        setVoiceMode(true);
        const message = target === 'subject' 
          ? 'Dictée du SUJET activée - Dites le sujet de votre email' 
          : 'Dictée du MESSAGE activée - Parlez maintenant';
        toast.success(message);
      } catch (error) {
        toast.error('Impossible de démarrer la reconnaissance vocale');
        console.error('Erreur démarrage reconnaissance:', error);
      }
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

  const confirmAndGenerate = async () => {
    setShowConfirmation(false);
    await handleGenerate();
  };

  const cancelGeneration = () => {
    setShowConfirmation(false);
    setVoiceTranscript('');
  };

  const replayVoice = () => {
    if (voiceTranscript) {
      speak(voiceTranscript);
    }
  };

  const loadContacts = async () => {
    try {
      // Simulation avec données enrichies
      setContacts([
        { 
          name: 'Marie Dupont', 
          email: 'marie.dupont@mairie-paris.fr', 
          company: 'Mairie de Paris',
          role: 'Directrice',
          lastContact: '2024-01-15',
          importance: 'high',
          avatar: '👩‍💼'
        },
        { 
          name: 'Jean Martin', 
          email: 'j.martin@startup-ai.com', 
          company: 'Startup IA',
          role: 'CEO',
          lastContact: '2024-01-10',
          importance: 'high',
          avatar: '👨‍💻'
        },
        { 
          name: 'Sophie Bernard', 
          email: 's.bernard@conseil.fr', 
          company: 'Cabinet Conseil',
          role: 'Consultante',
          lastContact: '2024-01-08',
          importance: 'medium',
          avatar: '👩‍🎓'
        }
      ]);
    } catch (error) {
      console.warn('Erreur chargement contacts:', error);
    }
  };

  const loadTemplates = async () => {
    try {
      setTemplates([
        { 
          id: 1, 
          name: '🚀 Proposition commerciale', 
          subject: 'Proposition de partenariat stratégique', 
          body: 'Bonjour,\n\nNous avons identifié une opportunité de collaboration qui pourrait bénéficier à nos deux organisations...\n\nCordialement',
          category: 'business',
          aiOptimized: true
        },
        { 
          id: 2, 
          name: '📋 Suivi de projet', 
          subject: 'Point d\'avancement - Projet [NOM]', 
          body: 'Bonjour,\n\nJe fais le point sur l\'avancement du projet :\n\n✅ Tâches terminées :\n- ...\n\n🔄 En cours :\n- ...\n\nCordialement',
          category: 'project',
          aiOptimized: true
        },
        { 
          id: 3, 
          name: '🎯 Demande urgente', 
          subject: 'URGENT - Votre intervention requise', 
          body: 'Bonjour,\n\nNous avons besoin de votre intervention urgente concernant...\n\nMerci de votre réactivité.\n\nCordialement',
          category: 'urgent',
          aiOptimized: true
        }
      ]);
    } catch (error) {
      console.warn('Erreur chargement templates:', error);
    }
  };

  const loadAiPersonalities = () => {
    setAiPersonalities([
      { 
        id: 'assistant', 
        name: '🤖 Assistant Pro', 
        description: 'Professionnel et efficace',
        traits: ['précis', 'courtois', 'structuré']
      },
      { 
        id: 'steve_jobs', 
        name: '🍎 Steve Jobs', 
        description: 'Visionnaire et inspirant',
        traits: ['innovant', 'passionné', 'direct']
      },
      { 
        id: 'oprah', 
        name: '❤️ Oprah Winfrey', 
        description: 'Empathique et motivant',
        traits: ['chaleureux', 'inspirant', 'bienveillant']
      },
      { 
        id: 'elon_musk', 
        name: '🚀 Elon Musk', 
        description: 'Disruptif et ambitieux',
        traits: ['audacieux', 'technique', 'futuriste']
      }
    ]);
  };

  const generateAISuggestions = async () => {
    try {
      const suggestions = [
        { 
          type: 'tone', 
          text: 'Rendre plus empathique', 
          icon: Heart, 
          color: 'text-pink-600',
          description: 'Ajouter de l\'émotion et de la connexion humaine'
        },
        { 
          type: 'structure', 
          text: 'Améliorer la structure', 
          icon: List, 
          color: 'text-blue-600',
          description: 'Organiser le contenu avec des puces et sections'
        },
        { 
          type: 'cta', 
          text: 'Renforcer l\'appel à l\'action', 
          icon: Target, 
          color: 'text-green-600',
          description: 'Ajouter un CTA clair et motivant'
        },
        { 
          type: 'personalization', 
          text: 'Personnaliser davantage', 
          icon: Users, 
          color: 'text-purple-600',
          description: 'Adapter le message au destinataire'
        },
        { 
          type: 'urgency', 
          text: 'Créer un sentiment d\'urgence', 
          icon: Clock, 
          color: 'text-orange-600',
          description: 'Motiver une action rapide'
        }
      ];
      setAiSuggestions(suggestions);
    } catch (error) {
      console.warn('Erreur suggestions IA:', error);
    }
  };

  const analyzeEmailWithAI = async () => {
    setAnalyzing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const analysis = {
        sentiment: Math.random() > 0.5 ? 'positive' : 'neutral',
        clarity: Math.floor(Math.random() * 30) + 70, // 70-100
        engagement: Math.floor(Math.random() * 25) + 75, // 75-100
        professionalism: Math.floor(Math.random() * 20) + 80, // 80-100
        readability: Math.floor(Math.random() * 15) + 85, // 85-100
        openRate: Math.floor(Math.random() * 20) + 70, // 70-90
        responseRate: Math.floor(Math.random() * 30) + 40, // 40-70
        suggestions: [
          'Excellent ton professionnel',
          'Structure claire et lisible',
          'Appel à l\'action bien défini'
        ],
        improvements: [
          'Ajouter une touche plus personnelle',
          'Raccourcir certaines phrases'
        ]
      };
      
      setAiAnalysis(analysis);
    } catch (error) {
      console.warn('Erreur analyse IA:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGenerate = async () => {
    if (!email.subject) {
      toast.error('Veuillez saisir un sujet pour générer le contenu');
      return;
    }

    setGenerating(true);
    toast.loading('IA en cours de génération...', { id: 'generate' });
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const generatedContent = `Bonjour,

J'espère que ce message vous trouve en bonne santé.

Concernant ${email.subject.toLowerCase()}, je souhaitais vous faire part de nos dernières avancées et explorer les possibilités de collaboration.

Notre équipe a développé une solution innovante qui pourrait répondre parfaitement à vos besoins actuels. Les bénéfices principaux incluent :

• Amélioration de l'efficacité opérationnelle
• Réduction des coûts de 30% en moyenne  
• Interface intuitive et formation rapide
• Support technique 24/7

Seriez-vous disponible pour un appel de 30 minutes cette semaine afin de discuter de cette opportunité ?

Je reste à votre disposition pour toute question.

Cordialement,
[Votre nom]`;

      setEmail(prev => ({ ...prev, body: generatedContent }));
      toast.success('Contenu généré avec succès !', { id: 'generate' });
      
    } catch (error) {
      toast.error('Erreur génération IA', { id: 'generate' });
    } finally {
      setGenerating(false);
    }
  };

  const handleSend = async () => {
    if (!email.to || !email.subject || !email.body) {
      toast.error('Veuillez remplir tous les champs requis');
      return;
    }

    setSending(true);
    toast.loading('Envoi en cours...', { id: 'send' });
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Email envoyé avec succès !', { id: 'send' });
      
      // Reset form
      setEmail({ 
        to: '', cc: '', bcc: '', subject: '', body: '', 
        tone: 'professionnel', priority: 'normal', scheduledAt: '',
        language: 'fr', personality: 'assistant', emotion: 'neutral'
      });
      
    } catch (error) {
      toast.error('Erreur lors de l\'envoi', { id: 'send' });
    } finally {
      setSending(false);
    }
  };

  const autoSave = async () => {
    if (email.body.length > 10) {
      setAutoSaving(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        toast.success('Brouillon sauvegardé automatiquement', { duration: 2000 });
      } catch (error) {
        console.warn('Erreur auto-save:', error);
      } finally {
        setAutoSaving(false);
      }
    }
  };

  const applySuggestion = async (suggestion) => {
    toast.loading(`Application de la suggestion...`, { id: 'suggestion' });
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulation d'amélioration du contenu
      let improvedBody = email.body;
      
      switch (suggestion.type) {
        case 'tone':
          improvedBody = email.body.replace(/\./g, ' 😊.');
          break;
        case 'structure':
          improvedBody = email.body.replace(/\n\n/g, '\n\n• ');
          break;
        case 'cta':
          improvedBody = email.body + '\n\n🎯 Action requise : Merci de me confirmer votre disponibilité avant vendredi.';
          break;
        default:
          improvedBody = email.body + '\n\n[Amélioration IA appliquée]';
      }
      
      setEmail(prev => ({ ...prev, body: improvedBody }));
      toast.success(`Suggestion "${suggestion.text}" appliquée !`, { id: 'suggestion' });
      
    } catch (error) {
      toast.error('Erreur application suggestion', { id: 'suggestion' });
    }
  };

  const selectContact = (contact) => {
    setEmail(prev => ({ ...prev, to: contact.email }));
    setShowContacts(false);
    toast.success(`Contact ${contact.name} sélectionné`);
  };

  const selectTemplate = (template) => {
    setEmail(prev => ({
      ...prev,
      subject: template.subject,
      body: template.body
    }));
    setShowTemplates(false);
    toast.success(`Modèle "${template.name}" appliqué !`);
  };

  const toneOptions = [
    { value: 'professionnel', label: '💼 Professionnel', desc: 'Ton formel et courtois' },
    { value: 'amical', label: '😊 Amical', desc: 'Ton chaleureux et décontracté' },
    { value: 'formel', label: '🎩 Formel', desc: 'Ton très officiel' },
    { value: 'urgent', label: '⚡ Urgent', desc: 'Ton direct et pressant' },
    { value: 'empathique', label: '❤️ Empathique', desc: 'Ton bienveillant et compréhensif' },
    { value: 'persuasif', label: '🎯 Persuasif', desc: 'Ton convaincant et motivant' }
  ];

  const priorityOptions = [
    { value: 'low', label: '📝 Faible', color: 'text-gray-600' },
    { value: 'normal', label: '📋 Normal', color: 'text-blue-600' },
    { value: 'high', label: '⚡ Élevée', color: 'text-orange-600' },
    { value: 'urgent', label: '🚨 Urgent', color: 'text-red-600' }
  ];

  const languageOptions = [
    { value: 'fr', label: '🇫🇷 Français', flag: '🇫🇷' },
    { value: 'en', label: '🇺🇸 English', flag: '🇺🇸' },
    { value: 'es', label: '🇪🇸 Español', flag: '🇪🇸' },
    { value: 'de', label: '🇩🇪 Deutsch', flag: '🇩🇪' },
    { value: 'it', label: '🇮🇹 Italiano', flag: '🇮🇹' }
  ];

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
              <h1 className="text-3xl font-bold">Composer avec IA Révolutionnaire</h1>
              <p className="opacity-90">Création d'emails intelligente avec assistance IA avancée</p>
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
              {voiceMode ? 'Arrêter dictée' : 'Dictée vocale'}
            </button>
            
            <button
              onClick={() => speak(email.body)}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-all"
            >
              <Volume2 className="w-4 h-4" />
              Écouter
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Zone de composition principale */}
        <div className="lg:col-span-3">
          <div className="bg-white shadow-2xl rounded-2xl overflow-hidden">
            {/* En-tête avec IA */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bot className="w-6 h-6 text-purple-600" />
                  <h3 className="text-lg font-bold text-gray-900">Nouveau message IA</h3>
                  {autoSaving && (
                    <div className="flex items-center gap-1 text-xs text-green-600">
                      <div className="animate-spin rounded-full h-3 w-3 border border-green-600 border-t-transparent"></div>
                      Sauvegarde auto...
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="text-sm text-purple-600 hover:text-purple-800 font-medium"
                  >
                    {showAdvanced ? 'Masquer avancé' : 'Options avancées'}
                  </button>
                  
                  <button
                    onClick={() => setShowAiPanel(!showAiPanel)}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {showAiPanel ? 'Masquer IA' : 'Panneau IA'}
                  </button>
                </div>
              </div>
            </div>

            <div className="px-6 py-6 space-y-6">
              {/* Destinataires avec IA */}
              <div className="space-y-4">
                <div className="relative">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    🎯 Destinataire principal *
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email.to}
                      onChange={(e) => setEmail(prev => ({ ...prev, to: e.target.value }))}
                      className="block w-full pr-10 border-2 border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent py-3 px-4"
                      placeholder="destinataire@exemple.com"
                    />
                    <button
                      onClick={() => setShowContacts(!showContacts)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      <Users className="h-5 w-5 text-gray-400 hover:text-purple-600 transition-colors" />
                    </button>
                  </div>
                  
                  {/* Contacts enrichis */}
                  {showContacts && (
                    <div className="absolute z-20 mt-2 w-full bg-white shadow-2xl max-h-80 rounded-xl border-2 border-purple-200 overflow-auto">
                      <div className="p-3 bg-purple-50 border-b">
                        <h4 className="font-bold text-purple-900">Contacts intelligents</h4>
                      </div>
                      {contacts.map((contact, idx) => (
                        <button
                          key={idx}
                          onClick={() => selectContact(contact)}
                          className="w-full text-left px-4 py-3 hover:bg-purple-50 flex items-center space-x-3 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="text-2xl">{contact.avatar}</div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-900">{contact.name}</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                contact.importance === 'high' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {contact.importance === 'high' ? '⭐ VIP' : '👤 Standard'}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600">{contact.email}</div>
                            <div className="text-xs text-purple-600">{contact.company} • {contact.role}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Champs avancés */}
                {showAdvanced && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">📧 CC</label>
                      <input
                        type="email"
                        value={email.cc}
                        onChange={(e) => setEmail(prev => ({ ...prev, cc: e.target.value }))}
                        className="block w-full border-2 border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent py-3 px-4"
                        placeholder="copie@exemple.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">🔒 BCC</label>
                      <input
                        type="email"
                        value={email.bcc}
                        onChange={(e) => setEmail(prev => ({ ...prev, bcc: e.target.value }))}
                        className="block w-full border-2 border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent py-3 px-4"
                        placeholder="copie.cachee@exemple.com"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Sujet avec IA */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-bold text-gray-700">
                    📝 Sujet de l'email *
                  </label>
                  <button
                    onClick={() => toggleVoiceMode('subject')}
                    className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                      voiceMode && voiceTarget === 'subject'
                        ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                        : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white'
                    }`}
                  >
                    <Mic className="w-3 h-3" />
                    {voiceMode && voiceTarget === 'subject' ? 'Arrêter' : 'Dicter sujet'}
                  </button>
                </div>
                
                {voiceMode && voiceTarget === 'subject' && (
                  <div className="mb-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <span className="font-bold text-blue-700">🎤 Dictez le sujet de votre email</span>
                    </div>
                    <div className="text-sm text-blue-600 mt-1">
                      L'IA générera automatiquement le contenu après
                    </div>
                  </div>
                )}
                
                <input
                  type="text"
                  value={email.subject}
                  onChange={(e) => setEmail(prev => ({ ...prev, subject: e.target.value }))}
                  className={`block w-full border-2 rounded-xl shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent py-3 px-4 text-lg ${
                    voiceMode && voiceTarget === 'subject' ? 'border-blue-300 bg-blue-50' : 'border-gray-300'
                  }`}
                  placeholder={voiceMode && voiceTarget === 'subject' 
                    ? "🎤 Dictez votre sujet..." 
                    : "Objet captivant de votre email..."
                  }
                />
              </div>

              {/* Paramètres IA avancés */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">🎭 Ton</label>
                  <select
                    value={email.tone}
                    onChange={(e) => setEmail(prev => ({ ...prev, tone: e.target.value }))}
                    className="block w-full border-2 border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-purple-500 py-3 px-4"
                  >
                    {toneOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">🚨 Priorité</label>
                  <select
                    value={email.priority}
                    onChange={(e) => setEmail(prev => ({ ...prev, priority: e.target.value }))}
                    className="block w-full border-2 border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-orange-500 py-3 px-4"
                  >
                    {priorityOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">🌍 Langue</label>
                  <select
                    value={email.language}
                    onChange={(e) => setEmail(prev => ({ ...prev, language: e.target.value }))}
                    className="block w-full border-2 border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 py-3 px-4"
                  >
                    {languageOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Personnalité IA */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">🤖 Personnalité IA</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {aiPersonalities.map(personality => (
                    <button
                      key={personality.id}
                      onClick={() => setEmail(prev => ({ ...prev, personality: personality.id }))}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        email.personality === personality.id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="font-bold text-sm">{personality.name}</div>
                      <div className="text-xs text-gray-600">{personality.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Confirmation de dictée vocale */}
              {showConfirmation && voiceTranscript && (
                <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300 rounded-2xl">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-bold text-blue-900 mb-2">
                      🎤 Vous avez dicté :
                    </h3>
                    <div className="p-4 bg-white rounded-xl border-2 border-blue-200 mb-4">
                      <p className="text-gray-800 text-lg font-medium">
                        "{voiceTranscript}"
                      </p>
                    </div>
                    
                    <div className="flex justify-center gap-3 mb-4">
                      <button
                        onClick={replayVoice}
                        className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-all"
                      >
                        <Volume2 className="w-4 h-4" />
                        🔊 Réécouter
                      </button>
                      
                      <button
                        onClick={() => toggleVoiceMode('subject')}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-all"
                      >
                        <Mic className="w-4 h-4" />
                        🎤 Redicter
                      </button>
                    </div>
                    
                    <div className="flex justify-center gap-4">
                      <button
                        onClick={cancelGeneration}
                        className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-medium"
                      >
                        ❌ Annuler
                      </button>
                      
                      <button
                        onClick={confirmAndGenerate}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-medium shadow-lg"
                      >
                        ✨ Générer le mail avec l'IA
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Corps du message avec IA */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-bold text-gray-700">
                    ✍️ Message *
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleVoiceMode('body')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                        voiceMode && voiceTarget === 'body'
                          ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                          : 'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white'
                      }`}
                    >
                      <Mic className="w-4 h-4" />
                      {voiceMode && voiceTarget === 'body' ? '🔴 Arrêter dictée' : '🎤 Dicter message'}
                    </button>
                    
                    <button
                      onClick={() => speak(email.body)}
                      disabled={!email.body}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 transition-all"
                    >
                      <Volume2 className="w-4 h-4" />
                      🔊 Écouter
                    </button>
                    
                    <button
                      onClick={handleGenerate}
                      disabled={generating}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 transition-all"
                    >
                      {generating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          Génération IA...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          Générer IA
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => setShowTemplates(!showTemplates)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all"
                    >
                      <FileText className="h-4 w-4" />
                      Modèles
                    </button>
                  </div>
                </div>
                
                {/* Indicateur vocal actif */}
                {voiceMode && voiceTarget === 'body' && (
                  <div className="mb-4 p-4 bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                          <span className="font-bold text-red-700">🎤 Dictée vocale active</span>
                        </div>
                        <div className="text-sm text-red-600">
                          Parlez maintenant, votre voix sera transcrite automatiquement
                        </div>
                      </div>
                      <button
                        onClick={() => toggleVoiceMode('body')}
                        className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all text-sm"
                      >
                        Arrêter
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Templates enrichis */}
                {showTemplates && (
                  <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200">
                    <h4 className="text-sm font-bold text-blue-900 mb-3">🎯 Modèles optimisés IA</h4>
                    <div className="grid grid-cols-1 gap-3">
                      {templates.map(template => (
                        <button
                          key={template.id}
                          onClick={() => selectTemplate(template)}
                          className="text-left p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-bold text-gray-900">{template.name}</div>
                            {template.aiOptimized && (
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                                ✨ IA Optimisé
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 truncate">{template.subject}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    rows={14}
                    value={email.body}
                    onChange={(e) => setEmail(prev => ({ ...prev, body: e.target.value }))}
                    className={`block w-full border-2 rounded-xl shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent py-4 px-4 text-base ${
                      voiceMode && voiceTarget === 'body'
                        ? 'border-red-300 bg-red-50' 
                        : 'border-gray-300'
                    }`}
                    placeholder={voiceMode && voiceTarget === 'body'
                      ? "🎤 Dictée vocale active - Parlez maintenant, votre texte apparaîtra ici automatiquement..." 
                      : "Rédigez votre message ici... Utilisez la dictée vocale ou la génération IA pour vous aider !"
                    }
                  />
                  
                  {/* Bouton vocal flottant */}
                  <button
                    onClick={() => toggleVoiceMode('body')}
                    className={`absolute bottom-4 right-4 p-3 rounded-full shadow-lg transition-all ${
                      voiceMode && voiceTarget === 'body'
                        ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                        : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white'
                    }`}
                    title={voiceMode && voiceTarget === 'body' ? 'Arrêter la dictée vocale' : 'Activer la dictée vocale'}
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                  
                  {/* Bouton lecture flottant */}
                  {email.body && (
                    <button
                      onClick={() => speak(email.body)}
                      className="absolute bottom-4 right-16 p-3 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white rounded-full shadow-lg transition-all"
                      title="Écouter le texte"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Programmation */}
              {showAdvanced && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    ⏰ Programmer l'envoi
                  </label>
                  <input
                    type="datetime-local"
                    value={email.scheduledAt}
                    onChange={(e) => setEmail(prev => ({ ...prev, scheduledAt: e.target.value }))}
                    className="block w-full border-2 border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent py-3 px-4"
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-blue-50 border-t">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-6 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Type className="w-4 h-4" />
                    {email.body.length} caractères
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    {wordCount} mots
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {readingTime} min lecture
                  </span>
                  {analyzing && (
                    <span className="flex items-center gap-1 text-purple-600">
                      <div className="animate-spin rounded-full h-4 w-4 border border-purple-600 border-t-transparent"></div>
                      Analyse IA...
                    </span>
                  )}
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={autoSave}
                    className="flex items-center gap-2 px-4 py-2 border-2 border-gray-300 rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-all"
                  >
                    <Save className="h-4 w-4" />
                    Brouillon
                  </button>
                  
                  <button
                    onClick={handleSend}
                    disabled={sending}
                    className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl hover:from-green-700 hover:to-blue-700 disabled:opacity-50 transition-all shadow-lg"
                  >
                    {sending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Envoi...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        {email.scheduledAt ? 'Programmer' : 'Envoyer'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Panneau IA révolutionnaire */}
        {showAiPanel && (
          <div className="lg:col-span-1 space-y-6">
            {/* Suggestions IA */}
            {aiSuggestions.length > 0 && (
              <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-3">
                  <h3 className="text-sm font-bold text-white flex items-center">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Suggestions IA Avancées
                  </h3>
                </div>
                <div className="p-4 space-y-3">
                  {aiSuggestions.map((suggestion, idx) => {
                    const IconComponent = suggestion.icon;
                    return (
                      <button
                        key={idx}
                        onClick={() => applySuggestion(suggestion)}
                        className="w-full text-left p-3 bg-gradient-to-r from-gray-50 to-purple-50 rounded-xl hover:from-purple-50 hover:to-pink-50 border-2 border-gray-200 hover:border-purple-300 transition-all"
                      >
                        <div className="flex items-start gap-3">
                          <IconComponent className={`h-5 w-5 ${suggestion.color} flex-shrink-0 mt-0.5`} />
                          <div>
                            <div className="font-bold text-gray-900 text-sm">{suggestion.text}</div>
                            <div className="text-xs text-gray-600 mt-1">{suggestion.description}</div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Analyse IA */}
            {aiAnalysis && (
              <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-3">
                  <h3 className="text-sm font-bold text-white flex items-center">
                    <Brain className="h-4 w-4 mr-2" />
                    Analyse IA Complète
                  </h3>
                </div>
                <div className="p-4 space-y-4">
                  {/* Scores */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-green-50 rounded-xl">
                      <div className="text-2xl font-bold text-green-600">{aiAnalysis.clarity}%</div>
                      <div className="text-xs text-green-700">Clarté</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-xl">
                      <div className="text-2xl font-bold text-blue-600">{aiAnalysis.engagement}%</div>
                      <div className="text-xs text-blue-700">Engagement</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-xl">
                      <div className="text-2xl font-bold text-purple-600">{aiAnalysis.openRate}%</div>
                      <div className="text-xs text-purple-700">Taux ouverture</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-xl">
                      <div className="text-2xl font-bold text-orange-600">{aiAnalysis.responseRate}%</div>
                      <div className="text-xs text-orange-700">Taux réponse</div>
                    </div>
                  </div>

                  {/* Points forts */}
                  <div>
                    <h4 className="font-bold text-green-800 text-sm mb-2 flex items-center">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Points forts
                    </h4>
                    <div className="space-y-1">
                      {aiAnalysis.suggestions.map((point, idx) => (
                        <div key={idx} className="text-xs text-green-700 bg-green-50 rounded px-2 py-1">
                          ✅ {point}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Améliorations */}
                  <div>
                    <h4 className="font-bold text-orange-800 text-sm mb-2 flex items-center">
                      <Lightbulb className="w-4 h-4 mr-1" />
                      Améliorations
                    </h4>
                    <div className="space-y-1">
                      {aiAnalysis.improvements.map((improvement, idx) => (
                        <div key={idx} className="text-xs text-orange-700 bg-orange-50 rounded px-2 py-1">
                          💡 {improvement}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Actions rapides */}
            <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-blue-500 px-4 py-3">
                <h3 className="text-sm font-bold text-white">⚡ Actions Rapides</h3>
              </div>
              <div className="p-4 space-y-2">
                <Link
                  to="/templates"
                  className="flex items-center gap-2 p-3 text-sm text-gray-700 hover:bg-blue-50 rounded-xl transition-all"
                >
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span>Gérer les modèles</span>
                </Link>
                <Link
                  to="/contacts"
                  className="flex items-center gap-2 p-3 text-sm text-gray-700 hover:bg-green-50 rounded-xl transition-all"
                >
                  <Users className="h-4 w-4 text-green-600" />
                  <span>Gérer les contacts</span>
                </Link>
                <Link
                  to="/history"
                  className="flex items-center gap-2 p-3 text-sm text-gray-700 hover:bg-purple-50 rounded-xl transition-all"
                >
                  <Clock className="h-4 w-4 text-purple-600" />
                  <span>Voir l'historique</span>
                </Link>
                <Link
                  to="/voice"
                  className="flex items-center gap-2 p-3 text-sm text-gray-700 hover:bg-pink-50 rounded-xl transition-all"
                >
                  <Mic className="h-4 w-4 text-pink-600" />
                  <span>Interface vocale</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}