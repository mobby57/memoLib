import React, { useState, useEffect } from 'react';
import { 
  Settings, Shield, Brain, Zap, Globe, Palette, Server, Bell,
  Key, Lock, Eye, EyeOff, Monitor, Smartphone, Cpu, Database,
  Cloud, Activity, BarChart3, TrendingUp, AlertTriangle, CheckCircle,
  Sparkles, Rocket, Crown, Gem, Award, Target, Users, Mail,
  Download, Upload, RefreshCw, Save, X, Plus, Minus, Copy,
  Sliders, Gauge, Timer, Volume2, Mic, Camera, Wifi, Bluetooth
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdvancedSettings() {
  const [settings, setSettings] = useState({
    // Configuration IA Avancée
    ai: {
      model: 'gpt-4o',
      temperature: 0.7,
      maxTokens: 2000,
      topP: 1.0,
      frequencyPenalty: 0.0,
      presencePenalty: 0.0,
      systemPrompt: 'Tu es un assistant IA expert en rédaction d\'emails professionnels.',
      customInstructions: '',
      fallbackModel: 'gpt-4o-mini',
      maxRetries: 3,
      timeout: 30,
      streaming: true,
      caching: true,
      optimization: 'balanced'
    },
    // Sécurité Enterprise
    security: {
      twoFactor: false,
      biometric: false,
      sessionTimeout: 30,
      maxSessions: 3,
      ipWhitelist: [],
      encryption: 'AES-256',
      auditLog: true,
      passwordPolicy: 'strong',
      ssoEnabled: false,
      apiKeyRotation: 90,
      webhookSecurity: true,
      rateLimiting: true
    },
    // Performance & Monitoring
    performance: {
      cacheSize: 100,
      preloadData: true,
      lazyLoading: true,
      compression: true,
      cdn: true,
      analytics: true,
      errorTracking: true,
      performanceMonitoring: true,
      realTimeSync: true,
      offlineMode: true,
      backgroundSync: true,
      memoryOptimization: true
    },
    // Interface Avancée
    interface: {
      theme: 'auto',
      accentColor: '#6366f1',
      fontSize: 'medium',
      density: 'comfortable',
      animations: true,
      transitions: 'smooth',
      accessibility: {
        highContrast: false,
        reducedMotion: false,
        screenReader: false,
        keyboardNavigation: true,
        focusIndicators: true
      },
      layout: 'default',
      sidebar: 'expanded',
      toolbar: 'full'
    },
    // Email Avancé
    email: {
      defaultSender: '',
      signature: '',
      templates: {
        autoSave: true,
        versioning: true,
        sharing: false
      },
      scheduling: {
        timezone: 'Europe/Paris',
        businessHours: { start: '09:00', end: '18:00' },
        weekends: false
      },
      tracking: {
        opens: true,
        clicks: true,
        replies: true,
        bounces: true
      },
      deliverability: {
        spamCheck: true,
        dkimSigning: true,
        spfValidation: true,
        dmarcPolicy: 'quarantine'
      }
    },
    // Intégrations
    integrations: {
      googleWorkspace: { enabled: false, apiKey: '' },
      microsoftOffice: { enabled: false, apiKey: '' },
      slack: { enabled: false, webhook: '' },
      zapier: { enabled: false, apiKey: '' },
      webhooks: [],
      apiAccess: {
        enabled: true,
        rateLimit: 1000,
        allowedOrigins: ['*']
      }
    },
    // Notifications Avancées
    notifications: {
      channels: {
        inApp: true,
        email: true,
        push: false,
        sms: false,
        slack: false
      },
      types: {
        emailSent: true,
        emailFailed: true,
        aiGenerated: true,
        systemUpdates: true,
        securityAlerts: true,
        performanceIssues: false
      },
      schedule: {
        quiet: { enabled: true, start: '22:00', end: '08:00' },
        weekends: false
      }
    }
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('ai');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [systemInfo, setSystemInfo] = useState(null);
  const [performanceMetrics, setPerformanceMetrics] = useState(null);

  const tabs = [
    { id: 'ai', name: 'IA Avancée', icon: Brain, color: 'purple' },
    { id: 'security', name: 'Sécurité Enterprise', icon: Shield, color: 'red' },
    { id: 'performance', name: 'Performance', icon: Zap, color: 'yellow' },
    { id: 'interface', name: 'Interface Pro', icon: Palette, color: 'blue' },
    { id: 'email', name: 'Email Expert', icon: Mail, color: 'green' },
    { id: 'integrations', name: 'Intégrations', icon: Globe, color: 'indigo' },
    { id: 'notifications', name: 'Notifications', icon: Bell, color: 'orange' },
    { id: 'system', name: 'Système', icon: Server, color: 'gray' }
  ];

  useEffect(() => {
    loadSettings();
    loadSystemInfo();
    loadPerformanceMetrics();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Simulation de chargement des paramètres
    } catch (error) {
      console.warn('Erreur chargement paramètres:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSystemInfo = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      setSystemInfo({
        version: '3.0.0-beta',
        build: '2024.01.15.1',
        uptime: '7 jours, 14h 32m',
        memory: { used: 245, total: 512 },
        cpu: 23,
        storage: { used: 1.2, total: 10 },
        connections: 1247,
        requests: 45892,
        errors: 12,
        lastBackup: '2024-01-15 03:00:00'
      });
    } catch (error) {
      console.warn('Erreur système:', error);
    }
  };

  const loadPerformanceMetrics = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1200));
      setPerformanceMetrics({
        responseTime: 145,
        throughput: 2847,
        errorRate: 0.03,
        availability: 99.97,
        cacheHitRate: 94.2,
        dbConnections: 12,
        activeUsers: 156,
        emailsProcessed: 8934
      });
    } catch (error) {
      console.warn('Erreur métriques:', error);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('🚀 Paramètres sauvegardés avec succès !');
    } catch (error) {
      toast.error('Erreur sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const updateNestedSetting = (category, subCategory, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [subCategory]: {
          ...prev[category][subCategory],
          [key]: value
        }
      }
    }));
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'iapostemanager-settings.json';
    link.click();
    toast.success('Paramètres exportés !');
  };

  const resetToDefaults = () => {
    if (confirm('Réinitialiser tous les paramètres ?')) {
      window.location.reload();
      toast.success('Paramètres réinitialisés');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-12 bg-gradient-to-r from-purple-200 to-pink-200 rounded-2xl"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded-2xl"></div>
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
              <Settings className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Paramètres Expert IA</h1>
              <p className="opacity-90">Configuration avancée et monitoring en temps réel</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-all"
            >
              <Sliders className="w-4 h-4" />
              Mode Expert
            </button>
            
            <button
              onClick={exportSettings}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-all"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Métriques système en temps réel */}
      {systemInfo && performanceMetrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-lg border-l-4 border-green-500">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-green-600" />
              <span className="text-xs font-medium text-gray-600">CPU</span>
            </div>
            <p className="text-xl font-bold text-green-600">{systemInfo.cpu}%</p>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-lg border-l-4 border-blue-500">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-medium text-gray-600">RAM</span>
            </div>
            <p className="text-xl font-bold text-blue-600">{systemInfo.memory.used}MB</p>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-lg border-l-4 border-purple-500">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-medium text-gray-600">Réponse</span>
            </div>
            <p className="text-xl font-bold text-purple-600">{performanceMetrics.responseTime}ms</p>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-lg border-l-4 border-orange-500">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-orange-600" />
              <span className="text-xs font-medium text-gray-600">Actifs</span>
            </div>
            <p className="text-xl font-bold text-orange-600">{performanceMetrics.activeUsers}</p>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-lg border-l-4 border-red-500">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-xs font-medium text-gray-600">Erreurs</span>
            </div>
            <p className="text-xl font-bold text-red-600">{systemInfo.errors}</p>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-lg border-l-4 border-indigo-500">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-medium text-gray-600">Débit</span>
            </div>
            <p className="text-xl font-bold text-indigo-600">{performanceMetrics.throughput}</p>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-lg border-l-4 border-teal-500">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-teal-600" />
              <span className="text-xs font-medium text-gray-600">Uptime</span>
            </div>
            <p className="text-xl font-bold text-teal-600">{performanceMetrics.availability}%</p>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-lg border-l-4 border-pink-500">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-pink-600" />
              <span className="text-xs font-medium text-gray-600">Emails</span>
            </div>
            <p className="text-xl font-bold text-pink-600">{performanceMetrics.emailsProcessed}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation avancée */}
        <div className="bg-white shadow-2xl rounded-2xl p-6">
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher un paramètre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <Settings className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>
          
          <nav className="space-y-2">
            {tabs.map(tab => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                    activeTab === tab.id
                      ? `bg-${tab.color}-100 text-${tab.color}-700 border-2 border-${tab.color}-200`
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <IconComponent className="w-5 h-5" />
                  <span className="font-medium">{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Contenu des paramètres */}
        <div className="lg:col-span-3 bg-white shadow-2xl rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4 border-b">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              {tabs.find(t => t.id === activeTab)?.icon && 
                React.createElement(tabs.find(t => t.id === activeTab).icon, { className: "w-6 h-6" })
              }
              {tabs.find(t => t.id === activeTab)?.name}
            </h2>
          </div>

          <div className="p-6 max-h-[600px] overflow-y-auto">
            {/* Configuration IA Avancée */}
            {activeTab === 'ai' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">🤖 Modèle IA</label>
                    <select
                      value={settings.ai.model}
                      onChange={(e) => updateSetting('ai', 'model', e.target.value)}
                      className="w-full border-2 border-gray-300 rounded-xl py-3 px-4 focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="gpt-4o">GPT-4o (Recommandé)</option>
                      <option value="gpt-4o-mini">GPT-4o Mini (Rapide)</option>
                      <option value="gpt-4-turbo">GPT-4 Turbo (Précis)</option>
                      <option value="claude-3-opus">Claude 3 Opus (Créatif)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">⚡ Optimisation</label>
                    <select
                      value={settings.ai.optimization}
                      onChange={(e) => updateSetting('ai', 'optimization', e.target.value)}
                      className="w-full border-2 border-gray-300 rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="speed">Vitesse</option>
                      <option value="balanced">Équilibré</option>
                      <option value="quality">Qualité</option>
                      <option value="cost">Économique</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    🎨 Créativité: {settings.ai.temperature}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={settings.ai.temperature}
                    onChange={(e) => updateSetting('ai', 'temperature', parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Conservateur</span>
                    <span>Créatif</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">📝 Prompt Système</label>
                  <textarea
                    rows={4}
                    value={settings.ai.systemPrompt}
                    onChange={(e) => updateSetting('ai', 'systemPrompt', e.target.value)}
                    className="w-full border-2 border-gray-300 rounded-xl py-3 px-4 focus:ring-2 focus:ring-purple-500"
                    placeholder="Instructions pour l'IA..."
                  />
                </div>

                {showAdvanced && (
                  <div className="bg-purple-50 rounded-xl p-4 border-2 border-purple-200">
                    <h4 className="font-bold text-purple-900 mb-4">⚙️ Paramètres Avancés</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Top P</label>
                        <input
                          type="number"
                          min="0"
                          max="1"
                          step="0.1"
                          value={settings.ai.topP}
                          onChange={(e) => updateSetting('ai', 'topP', parseFloat(e.target.value))}
                          className="w-full border border-gray-300 rounded-lg py-2 px-3"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Max Tokens</label>
                        <input
                          type="number"
                          min="100"
                          max="4000"
                          value={settings.ai.maxTokens}
                          onChange={(e) => updateSetting('ai', 'maxTokens', parseInt(e.target.value))}
                          className="w-full border border-gray-300 rounded-lg py-2 px-3"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Sécurité Enterprise */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="bg-red-50 rounded-xl p-4 border-2 border-red-200">
                  <h4 className="font-bold text-red-900 mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Authentification
                  </h4>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={settings.security.twoFactor}
                        onChange={(e) => updateSetting('security', 'twoFactor', e.target.checked)}
                        className="w-4 h-4 text-red-600 rounded"
                      />
                      <span className="text-sm font-medium">Authentification à 2 facteurs</span>
                    </label>
                    
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={settings.security.biometric}
                        onChange={(e) => updateSetting('security', 'biometric', e.target.checked)}
                        className="w-4 h-4 text-red-600 rounded"
                      />
                      <span className="text-sm font-medium">Authentification biométrique</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">🔐 Chiffrement</label>
                  <select
                    value={settings.security.encryption}
                    onChange={(e) => updateSetting('security', 'encryption', e.target.value)}
                    className="w-full border-2 border-gray-300 rounded-xl py-3 px-4 focus:ring-2 focus:ring-red-500"
                  >
                    <option value="AES-256">AES-256 (Recommandé)</option>
                    <option value="AES-128">AES-128 (Rapide)</option>
                    <option value="ChaCha20">ChaCha20 (Mobile)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">⏱️ Timeout Session (min)</label>
                  <input
                    type="number"
                    min="5"
                    max="480"
                    value={settings.security.sessionTimeout}
                    onChange={(e) => updateSetting('security', 'sessionTimeout', parseInt(e.target.value))}
                    className="w-full border-2 border-gray-300 rounded-xl py-3 px-4 focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
            )}

            {/* Performance */}
            {activeTab === 'performance' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-yellow-50 rounded-xl p-4 border-2 border-yellow-200">
                    <h4 className="font-bold text-yellow-900 mb-2">⚡ Cache</h4>
                    <p className="text-2xl font-bold text-yellow-600">{performanceMetrics?.cacheHitRate}%</p>
                    <p className="text-xs text-yellow-700">Taux de succès</p>
                  </div>
                  
                  <div className="bg-green-50 rounded-xl p-4 border-2 border-green-200">
                    <h4 className="font-bold text-green-900 mb-2">📊 Débit</h4>
                    <p className="text-2xl font-bold text-green-600">{performanceMetrics?.throughput}</p>
                    <p className="text-xs text-green-700">req/min</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={settings.performance.caching}
                      onChange={(e) => updateSetting('performance', 'caching', e.target.checked)}
                      className="w-4 h-4 text-yellow-600 rounded"
                    />
                    <span className="text-sm font-medium">Cache intelligent</span>
                  </label>
                  
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={settings.performance.compression}
                      onChange={(e) => updateSetting('performance', 'compression', e.target.checked)}
                      className="w-4 h-4 text-yellow-600 rounded"
                    />
                    <span className="text-sm font-medium">Compression automatique</span>
                  </label>
                  
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={settings.performance.lazyLoading}
                      onChange={(e) => updateSetting('performance', 'lazyLoading', e.target.checked)}
                      className="w-4 h-4 text-yellow-600 rounded"
                    />
                    <span className="text-sm font-medium">Chargement différé</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-t">
            <div className="flex gap-3">
              <button
                onClick={resetToDefaults}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-red-600 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Réinitialiser
              </button>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all font-medium"
              >
                Annuler
              </button>
              
              <button
                onClick={saveSettings}
                disabled={saving}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 transition-all font-bold flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Sauvegarder
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}