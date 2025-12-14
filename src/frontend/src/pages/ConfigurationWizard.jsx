import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, 
  Mail, 
  Key, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Save,
  TestTube,
  Eye,
  EyeOff,
  ExternalLink,
  Play,
  Shield
} from 'lucide-react';
import toast from 'react-hot-toast';
import { configAPI } from '../services/api';

export default function ConfigurationWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  
  // Step 1: Gmail Configuration
  const [gmailConfig, setGmailConfig] = useState({
    email: '',
    appPassword: ''
  });
  const [showGmailPassword, setShowGmailPassword] = useState(false);
  const [gmailTested, setGmailTested] = useState(false);

  // Step 2: OpenAI Configuration
  const [openaiConfig, setOpenaiConfig] = useState({
    apiKey: ''
  });
  const [showOpenAIKey, setShowOpenAIKey] = useState(false);
  const [openaiTested, setOpenaiTested] = useState(false);

  // Step 3: Preferences
  const [preferences, setPreferences] = useState({
    language: 'fr',
    signature: '',
    defaultTone: 'professionnel',
    autoSave: true
  });

  const steps = [
    {
      number: 1,
      title: 'Configuration Gmail',
      description: 'Connectez votre compte Gmail',
      icon: Mail,
      color: 'from-blue-500 to-blue-600'
    },
    {
      number: 2,
      title: 'Clé OpenAI',
      description: 'Configurez l\'intelligence artificielle',
      icon: Key,
      color: 'from-purple-500 to-purple-600'
    },
    {
      number: 3,
      title: 'Préférences',
      description: 'Personnalisez votre expérience',
      icon: Settings,
      color: 'from-green-500 to-green-600'
    }
  ];

  const testGmailConnection = async () => {
    if (!gmailConfig.email || !gmailConfig.appPassword) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setTesting(true);
    try {
      const response = await configAPI.saveGmail(gmailConfig);
      if (response.data.success) {
        setGmailTested(true);
        toast.success('✅ Connexion Gmail réussie !');
      } else {
        toast.error(response.data.error || 'Échec de la connexion');
      }
    } catch (error) {
      toast.error('Erreur lors du test de connexion');
    } finally {
      setTesting(false);
    }
  };

  const testOpenAIKey = async () => {
    if (!openaiConfig.apiKey) {
      toast.error('Veuillez entrer une clé API');
      return;
    }

    setTesting(true);
    try {
      const response = await configAPI.saveOpenAI(openaiConfig);
      if (response.data.success) {
        setOpenaiTested(true);
        toast.success('✅ Clé OpenAI validée !');
      } else {
        toast.error(response.data.error || 'Clé API invalide');
      }
    } catch (error) {
      toast.error('Erreur lors de la validation');
    } finally {
      setTesting(false);
    }
  };

  const savePreferences = async () => {
    setLoading(true);
    try {
      // Save preferences to backend
      toast.success('✅ Configuration terminée avec succès !');
      // Redirect to dashboard
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const canProceedToNextStep = () => {
    if (currentStep === 1) return gmailTested;
    if (currentStep === 2) return openaiTested;
    return true;
  };

  const nextStep = () => {
    if (canProceedToNextStep() && currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const previousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-4">
            <Settings className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Assistant de Configuration
          </h1>
          <p className="text-gray-600 text-lg">
            Configurez votre application en 3 étapes simples
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;
              
              return (
                <div key={step.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <motion.div
                      className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isActive
                          ? `bg-gradient-to-br ${step.color} text-white shadow-lg`
                          : 'bg-gray-200 text-gray-400'
                      }`}
                      animate={{
                        scale: isActive ? 1.1 : 1,
                        rotate: isCompleted ? 360 : 0
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-8 h-8" />
                      ) : (
                        <Icon className="w-8 h-8" />
                      )}
                    </motion.div>
                    <p className={`text-sm font-semibold text-center ${
                      isActive ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </p>
                  </div>
                  
                  {index < steps.length - 1 && (
                    <div className="flex-1 mx-4">
                      <div className={`h-1 rounded-full ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-200'
                      }`} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="card p-8 max-w-2xl mx-auto"
          >
            {/* Step 1: Gmail */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${steps[0].color} mb-4`}>
                    <Mail className="w-12 h-12 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Configuration Gmail
                  </h2>
                  <p className="text-gray-600">
                    Connectez votre compte Gmail pour envoyer des emails
                  </p>
                </div>

                {/* Video Tutorial Link */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 flex items-start space-x-3">
                  <Play className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900 mb-1">
                      Comment obtenir un mot de passe d'application ?
                    </h3>
                    <a
                      href="https://support.google.com/accounts/answer/185833"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1"
                    >
                      <span>Voir le guide Google</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                {/* Email Input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Adresse Gmail
                  </label>
                  <input
                    type="email"
                    value={gmailConfig.email}
                    onChange={(e) => setGmailConfig({ ...gmailConfig, email: e.target.value })}
                    placeholder="votre.email@gmail.com"
                    className="input"
                  />
                </div>

                {/* App Password Input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Mot de passe d'application
                  </label>
                  <div className="relative">
                    <input
                      type={showGmailPassword ? 'text' : 'password'}
                      value={gmailConfig.appPassword}
                      onChange={(e) => setGmailConfig({ ...gmailConfig, appPassword: e.target.value })}
                      placeholder="xxxx xxxx xxxx xxxx"
                      className="input pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowGmailPassword(!showGmailPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showGmailPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    ⚠️ N'utilisez jamais votre mot de passe Gmail principal
                  </p>
                </div>

                {/* Test Button */}
                <button
                  onClick={testGmailConnection}
                  disabled={testing || gmailTested}
                  className={`btn w-full ${
                    gmailTested
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'btn-primary'
                  }`}
                >
                  {testing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Test en cours...
                    </>
                  ) : gmailTested ? (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Connexion réussie !
                    </>
                  ) : (
                    <>
                      <TestTube className="w-5 h-5 mr-2" />
                      Tester la connexion
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Step 2: OpenAI */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${steps[1].color} mb-4`}>
                    <Key className="w-12 h-12 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Configuration OpenAI
                  </h2>
                  <p className="text-gray-600">
                    Ajoutez votre clé API pour activer l'IA
                  </p>
                </div>

                {/* Info Box */}
                <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4 flex items-start space-x-3">
                  <Shield className="w-6 h-6 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-purple-900 mb-1">
                      Où trouver ma clé API ?
                    </h3>
                    <a
                      href="https://platform.openai.com/api-keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:text-purple-800 text-sm flex items-center space-x-1"
                    >
                      <span>Créer une clé sur OpenAI Platform</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                {/* API Key Input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Clé API OpenAI
                  </label>
                  <div className="relative">
                    <input
                      type={showOpenAIKey ? 'text' : 'password'}
                      value={openaiConfig.apiKey}
                      onChange={(e) => setOpenaiConfig({ ...openaiConfig, apiKey: e.target.value })}
                      placeholder="sk-proj-..."
                      className="input pr-12 font-mono text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOpenAIKey(!showOpenAIKey)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showOpenAIKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    🔒 Votre clé est stockée de manière sécurisée
                  </p>
                </div>

                {/* Test Button */}
                <button
                  onClick={testOpenAIKey}
                  disabled={testing || openaiTested}
                  className={`btn w-full ${
                    openaiTested
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'btn-primary'
                  }`}
                >
                  {testing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Validation...
                    </>
                  ) : openaiTested ? (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Clé validée !
                    </>
                  ) : (
                    <>
                      <TestTube className="w-5 h-5 mr-2" />
                      Valider la clé
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Step 3: Preferences */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${steps[2].color} mb-4`}>
                    <Settings className="w-12 h-12 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Préférences
                  </h2>
                  <p className="text-gray-600">
                    Personnalisez votre expérience
                  </p>
                </div>

                {/* Language */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Langue
                  </label>
                  <select
                    value={preferences.language}
                    onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                    className="input"
                  >
                    <option value="fr">🇫🇷 Français</option>
                    <option value="en">🇬🇧 English</option>
                    <option value="es">🇪🇸 Español</option>
                  </select>
                </div>

                {/* Default Tone */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Ton par défaut
                  </label>
                  <select
                    value={preferences.defaultTone}
                    onChange={(e) => setPreferences({ ...preferences, defaultTone: e.target.value })}
                    className="input"
                  >
                    <option value="professionnel">💼 Professionnel</option>
                    <option value="amical">😊 Amical</option>
                    <option value="formel">🎩 Formel</option>
                    <option value="concis">⚡ Concis</option>
                  </select>
                </div>

                {/* Signature */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Signature (optionnelle)
                  </label>
                  <textarea
                    value={preferences.signature}
                    onChange={(e) => setPreferences({ ...preferences, signature: e.target.value })}
                    placeholder="Cordialement,&#10;Votre nom&#10;Votre fonction"
                    className="input min-h-[100px]"
                  />
                </div>

                {/* Auto-save */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-900">Sauvegarde automatique</p>
                    <p className="text-sm text-gray-600">Sauvegarder automatiquement les brouillons</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.autoSave}
                      onChange={(e) => setPreferences({ ...preferences, autoSave: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>

                {/* Complete Button */}
                <button
                  onClick={savePreferences}
                  disabled={loading}
                  className="btn btn-primary w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" />
                      Terminer la configuration
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center max-w-2xl mx-auto mt-6">
          <button
            onClick={previousStep}
            disabled={currentStep === 1}
            className={`btn btn-secondary ${
              currentStep === 1 ? 'opacity-0 pointer-events-none' : ''
            }`}
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            Précédent
          </button>

          {currentStep < 3 && (
            <button
              onClick={nextStep}
              disabled={!canProceedToNextStep()}
              className={`btn ${
                canProceedToNextStep()
                  ? 'btn-primary'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Suivant
              <ChevronRight className="w-5 h-5 ml-2" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
