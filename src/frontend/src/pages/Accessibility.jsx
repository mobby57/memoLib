import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '../components/Icons.jsx';
import toast from 'react-hot-toast';

export default function Accessibility() {
  const [settings, setSettings] = useState({
    vision: {
      highContrast: false,
      largeText: false,
      fontSize: 16,
      colorBlindMode: 'none',
      screenReader: false,
      focusIndicator: true,
      magnifier: false,
      cursorSize: 'normal'
    },
    hearing: {
      visualAlerts: false,
      subtitles: true,
      soundReduction: false,
      flashingReduction: true,
      signLanguage: false,
      hapticFeedback: false
    },
    motor: {
      stickyKeys: false,
      slowKeys: false,
      clickAssist: false,
      dragAssist: false,
      voiceControl: false,
      eyeTracking: false,
      switchControl: false
    },
    cognitive: {
      simplifiedInterface: false,
      reducedMotion: false,
      autoComplete: true,
      readingGuide: false,
      focusMode: false,
      memoryAids: false,
      aiAssistant: false
    },
    navigation: {
      keyboardOnly: false,
      tabNavigation: true,
      skipLinks: true,
      breadcrumbs: true,
      spatialNavigation: false
    },
    ai: {
      adaptiveInterface: false,
      emotionalSupport: false,
      contextualHelp: true,
      predictiveText: false,
      voiceCloning: false
    }
  });

  const [activeProfile, setActiveProfile] = useState('custom');
  const [loading, setLoading] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const recognitionRef = useRef(null);

  const profiles = [
    {
      id: 'custom',
      name: 'Personnalisé',
      description: 'Configuration sur mesure',
      icon: 'settings',
      color: 'blue'
    },
    {
      id: 'blind',
      name: 'Malvoyant/Aveugle',
      description: 'IA + lecteur d\'écran optimisé',
      icon: 'eye',
      color: 'purple',
      settings: {
        vision: { screenReader: true, highContrast: true, largeText: true, fontSize: 20 },
        hearing: { visualAlerts: true, subtitles: true, hapticFeedback: true },
        navigation: { keyboardOnly: true, skipLinks: true },
        ai: { adaptiveInterface: true, contextualHelp: true, voiceCloning: true }
      }
    },
    {
      id: 'deaf',
      name: 'Malentendant/Sourd',
      description: 'Alertes visuelles + IA gestuelle',
      icon: 'volume-off',
      color: 'green',
      settings: {
        hearing: { visualAlerts: true, subtitles: true, signLanguage: true, hapticFeedback: true },
        vision: { focusIndicator: true },
        ai: { emotionalSupport: true, contextualHelp: true }
      }
    },
    {
      id: 'motor',
      name: 'Difficultés motrices',
      description: 'Contrôle vocal + suivi oculaire',
      icon: 'accessibility',
      color: 'orange',
      settings: {
        motor: { clickAssist: true, dragAssist: true, voiceControl: true, eyeTracking: true },
        navigation: { tabNavigation: true, skipLinks: true, spatialNavigation: true },
        cognitive: { autoComplete: true },
        ai: { adaptiveInterface: true, predictiveText: true }
      }
    },
    {
      id: 'cognitive',
      name: 'Difficultés cognitives',
      description: 'IA empathique + interface adaptative',
      icon: 'search',
      color: 'pink',
      settings: {
        cognitive: { simplifiedInterface: true, reducedMotion: true, focusMode: true, memoryAids: true, aiAssistant: true },
        vision: { largeText: true, fontSize: 18 },
        ai: { adaptiveInterface: true, emotionalSupport: true, contextualHelp: true }
      }
    },
    {
      id: 'elderly',
      name: 'Seniors',
      description: 'Interface simplifiée + assistance vocale',
      icon: 'heart',
      color: 'indigo',
      settings: {
        vision: { largeText: true, fontSize: 20, highContrast: true },
        cognitive: { simplifiedInterface: true, memoryAids: true, aiAssistant: true },
        motor: { clickAssist: true, voiceControl: true },
        ai: { emotionalSupport: true, contextualHelp: true, voiceCloning: true }
      }
    }
  ];

  const aiFeatures = [
    {
      key: 'adaptiveInterface',
      name: 'Interface Adaptative IA',
      description: 'L\'interface s\'adapte automatiquement à vos besoins',
      icon: 'wand'
    },
    {
      key: 'emotionalSupport',
      name: 'Support Émotionnel IA',
      description: 'Détection d\'humeur et adaptation empathique',
      icon: 'heart'
    },
    {
      key: 'contextualHelp',
      name: 'Aide Contextuelle',
      description: 'Assistance intelligente selon le contexte',
      icon: 'info'
    },
    {
      key: 'predictiveText',
      name: 'Texte Prédictif IA',
      description: 'Suggestions intelligentes de texte',
      icon: 'type'
    },
    {
      key: 'voiceCloning',
      name: 'Clonage Vocal',
      description: 'Synthèse vocale avec votre propre voix',
      icon: 'mic'
    }
  ];

  useEffect(() => {
    loadSettings();
    initializeVoiceRecognition();
  }, []);

  const loadSettings = async () => {
    try {
      const saved = localStorage.getItem('accessibility-settings');
      if (saved) {
        const data = JSON.parse(saved);
        setSettings({ ...settings, ...data.settings });
        setActiveProfile(data.profile || 'custom');
      }
    } catch (error) {
      console.warn('Erreur chargement paramètres:', error);
    }
  };

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
    if (command.includes('contraste élevé')) {
      updateSetting('vision', 'highContrast', true);
      speak('Contraste élevé activé');
    } else if (command.includes('texte large')) {
      updateSetting('vision', 'largeText', true);
      speak('Texte large activé');
    } else if (command.includes('mode focus')) {
      updateSetting('cognitive', 'focusMode', true);
      speak('Mode focus activé');
    } else if (command.includes('aide')) {
      speak('Je peux vous aider à configurer l\'accessibilité. Dites "contraste élevé", "texte large" ou "mode focus"');
    }
  };

  const toggleVoiceControl = () => {
    if (!recognitionRef.current) {
      toast.error('Reconnaissance vocale non supportée');
      return;
    }

    if (voiceActive) {
      recognitionRef.current.stop();
      setVoiceActive(false);
      toast.success('Contrôle vocal désactivé');
    } else {
      recognitionRef.current.start();
      setVoiceActive(true);
      toast.success('Contrôle vocal activé - Dites "aide" pour commencer');
    }
  };

  const analyzeWithAI = async () => {
    setAiAnalyzing(true);
    
    // Simulation d'analyse IA
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const recommendations = [
      'Augmentation de la taille de police recommandée',
      'Contraste élevé suggéré pour votre environnement',
      'Mode focus activé pour améliorer la concentration'
    ];
    
    // Application automatique des recommandations
    setSettings(prev => ({
      ...prev,
      vision: { ...prev.vision, fontSize: 18, highContrast: true },
      cognitive: { ...prev.cognitive, focusMode: true }
    }));
    
    setAiAnalyzing(false);
    toast.success(`IA: ${recommendations.length} améliorations appliquées`);
  };

  const speak = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fr-FR';
      utterance.rate = 0.9;
      speechSynthesis.speak(utterance);
    }
  };

  const saveSettings = async () => {
    try {
      const data = { settings, profile: activeProfile };
      localStorage.setItem('accessibility-settings', JSON.stringify(data));
      applySettings();
      toast.success('Paramètres sauvegardés et appliqués');
    } catch (error) {
      toast.error('Erreur sauvegarde');
    }
  };

  const applySettings = () => {
    const root = document.documentElement;
    
    // Application des styles CSS
    root.style.fontSize = `${settings.vision.fontSize}px`;
    root.classList.toggle('high-contrast', settings.vision.highContrast);
    root.classList.toggle('large-text', settings.vision.largeText);
    root.classList.toggle('reduced-motion', settings.cognitive.reducedMotion);
    root.classList.toggle('focus-mode', settings.cognitive.focusMode);
    root.classList.toggle('simplified-ui', settings.cognitive.simplifiedInterface);
    
    // Curseur personnalisé
    if (settings.vision.cursorSize !== 'normal') {
      root.style.cursor = settings.vision.cursorSize === 'large' ? 'url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTggOEwyNCAyNE04IDI0TDI0IDgiIHN0cm9rZT0iYmxhY2siIHN0cm9rZS13aWR0aD0iNCIvPgo8L3N2Zz4K) 16 16, auto' : 'auto';
    }
  };

  const applyProfile = (profileId) => {
    const profile = profiles.find(p => p.id === profileId);
    if (profile?.settings) {
      setSettings(prevSettings => {
        const newSettings = { ...prevSettings };
        Object.keys(profile.settings).forEach(category => {
          newSettings[category] = { ...newSettings[category], ...profile.settings[category] };
        });
        return newSettings;
      });
    }
    setActiveProfile(profileId);
    toast.success(`Profil "${profile.name}" appliqué`);
  };

  const updateSetting = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: { ...prev[category], [key]: value }
    }));
    setActiveProfile('custom');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      {/* En-tête avec IA */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Accessibilité IA</h1>
            <p className="mt-2 opacity-90">Interface adaptative alimentée par l'intelligence artificielle</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={toggleVoiceControl}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                voiceActive ? 'bg-red-500 hover:bg-red-600' : 'bg-white/20 hover:bg-white/30'
              }`}
            >
              <Icon name="mic" size={20} className="mr-2" />
              {voiceActive ? 'Arrêter' : 'Contrôle vocal'}
            </button>
            <button
              onClick={analyzeWithAI}
              disabled={aiAnalyzing}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {aiAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white mr-2 inline-block"></div>
                  Analyse IA...
                </>
              ) : (
                <>
                  <Icon name="sparkles" size={20} className="mr-2" />
                  Optimiser avec IA
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Profils améliorés */}
      <div className="bg-white shadow-xl rounded-xl p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Profils d'accessibilité intelligents</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map(profile => (
            <button
              key={profile.id}
              onClick={() => applyProfile(profile.id)}
              className={`p-4 border-2 rounded-xl text-left transition-all transform hover:scale-105 ${
                activeProfile === profile.id
                  ? `border-${profile.color}-500 bg-${profile.color}-50 shadow-lg`
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
              }`}
            >
              <div className="flex items-center mb-3">
                <div className={`p-2 rounded-lg bg-${profile.color}-100 mr-3`}>
                  <Icon name={profile.icon} size={24} className={`text-${profile.color}-600`} />
                </div>
                <h3 className="font-semibold text-gray-900">{profile.name}</h3>
              </div>
              <p className="text-sm text-gray-600">{profile.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Fonctionnalités IA */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <Icon name="sparkles" size={24} className="text-purple-600 mr-2" />
          Fonctionnalités IA Avancées
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {aiFeatures.map(feature => (
            <div key={feature.key} className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Icon name={feature.icon} size={20} className="text-purple-600 mr-3" />
                  <div>
                    <h3 className="font-medium text-gray-900">{feature.name}</h3>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.ai[feature.key]}
                    onChange={(e) => updateSetting('ai', feature.key, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Paramètres détaillés en grille compacte */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Vision */}
        <div className="bg-white shadow-lg rounded-xl p-6">
          <div className="flex items-center mb-4">
            <Icon name="eye" size={24} className="text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Vision</h2>
          </div>
          <div className="space-y-3">
            {[
              { key: 'highContrast', label: 'Contraste élevé' },
              { key: 'largeText', label: 'Texte large' },
              { key: 'screenReader', label: 'Lecteur d\'écran' },
              { key: 'magnifier', label: 'Loupe intégrée' }
            ].map(item => (
              <label key={item.key} className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.vision[item.key]}
                  onChange={(e) => updateSetting('vision', item.key, e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-900">{item.label}</span>
              </label>
            ))}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Taille police: {settings.vision.fontSize}px
              </label>
              <input
                type="range"
                min="12"
                max="28"
                value={settings.vision.fontSize}
                onChange={(e) => updateSetting('vision', 'fontSize', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Motricité */}
        <div className="bg-white shadow-lg rounded-xl p-6">
          <div className="flex items-center mb-4">
            <Icon name="accessibility" size={24} className="text-green-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Motricité</h2>
          </div>
          <div className="space-y-3">
            {[
              { key: 'clickAssist', label: 'Assistance clic' },
              { key: 'voiceControl', label: 'Contrôle vocal' },
              { key: 'eyeTracking', label: 'Suivi oculaire' },
              { key: 'switchControl', label: 'Contrôle contacteur' }
            ].map(item => (
              <label key={item.key} className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.motor[item.key]}
                  onChange={(e) => updateSetting('motor', item.key, e.target.checked)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-900">{item.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Cognitif */}
        <div className="bg-white shadow-lg rounded-xl p-6">
          <div className="flex items-center mb-4">
            <Icon name="search" size={24} className="text-purple-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Cognitif</h2>
          </div>
          <div className="space-y-3">
            {[
              { key: 'simplifiedInterface', label: 'Interface simplifiée' },
              { key: 'focusMode', label: 'Mode focus' },
              { key: 'memoryAids', label: 'Aides mémoire' },
              { key: 'aiAssistant', label: 'Assistant IA' }
            ].map(item => (
              <label key={item.key} className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.cognitive[item.key]}
                  onChange={(e) => updateSetting('cognitive', item.key, e.target.checked)}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-900">{item.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center bg-white rounded-xl p-6 shadow-lg">
        <div className="flex space-x-3">
          <button
            onClick={() => speak('Test de synthèse vocale. Votre configuration d\'accessibilité est optimisée.')}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          >
            <Icon name="volume" size={16} className="mr-2" />
            Test vocal
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Réinitialiser
          </button>
        </div>
        <button
          onClick={saveSettings}
          className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
        >
          <Icon name="check" size={16} className="mr-2" />
          Sauvegarder
        </button>
      </div>
    </div>
  );
}