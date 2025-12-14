import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Send,
  User,
  Target,
  MessageSquare,
  Sparkles,
  Eye,
  Edit3,
  Save,
  FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import { emailAPI } from '../services/api';

export default function SendEmailWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Données du questionnaire
  const [wizardData, setWizardData] = useState({
    to: '',
    subject: '',
    // Questions
    recipient: '', // Qui est le destinataire?
    context: '', // Pourquoi envoyez-vous cet email?
    tone: 'professionnel', // Quel ton?
    length: 'moyen', // Longueur souhaitée?
    // Email généré
    generatedBody: '',
    // Fichiers
    contextFiles: [], // Fichiers pour aider l'IA à comprendre le contexte
    attachment: null, // Fichier à joindre à l'email final
    // Programmation
    scheduledDate: '',
    scheduledTime: '',
    isScheduled: false
  });

  const tones = [
    { value: 'professionnel', label: 'Professionnel', description: 'Formel et courtois', icon: '💼' },
    { value: 'amical', label: 'Amical', description: 'Chaleureux et décontracté', icon: '😊' },
    { value: 'formel', label: 'Formel', description: 'Très structuré', icon: '🎩' },
    { value: 'concis', label: 'Concis', description: 'Direct et court', icon: '⚡' }
  ];

  const lengths = [
    { value: 'court', label: 'Court', description: '2-3 phrases', icon: '📝' },
    { value: 'moyen', label: 'Moyen', description: '1 paragraphe', icon: '📄' },
    { value: 'long', label: 'Long', description: 'Plusieurs paragraphes', icon: '📃' }
  ];

  // Charger template depuis localStorage si disponible
  useEffect(() => {
    const savedTemplate = localStorage.getItem('selectedTemplate');
    if (savedTemplate) {
      try {
        const template = JSON.parse(savedTemplate);
        setWizardData(prev => ({
          ...prev,
          subject: template.subject || '',
          context: template.body || '',
          generatedBody: template.body || ''
        }));
        toast.success('Template chargé !');
        localStorage.removeItem('selectedTemplate');
      } catch (e) {
        console.error('Erreur chargement template:', e);
      }
    }

    // Charger brouillon auto-sauvegardé
    const savedDraft = localStorage.getItem('emailDraft');
    if (savedDraft && !savedTemplate) {
      try {
        const draft = JSON.parse(savedDraft);
        if (draft.timestamp && Date.now() - draft.timestamp < 86400000) { // 24h
          setWizardData(draft.data);
          setStep(draft.step || 1);
          toast('Brouillon restauré', { icon: '📝' });
        }
      } catch (e) {
        console.error('Erreur chargement brouillon:', e);
      }
    }
  }, []);

  // Auto-save brouillon
  useEffect(() => {
    const timer = setTimeout(() => {
      if (wizardData.to || wizardData.context) {
        localStorage.setItem('emailDraft', JSON.stringify({
          data: wizardData,
          step: step,
          timestamp: Date.now()
        }));
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [wizardData, step]);

  const clearDraft = () => {
    localStorage.removeItem('emailDraft');
  };

  const handleGenerateEmail = async () => {
    setLoading(true);
    try {
      let contextInfo = wizardData.context;
      
      // Si des fichiers contextuels sont uploadés, les analyser d'abord
      if (wizardData.contextFiles.length > 0) {
        toast.info('Analyse des fichiers en cours...');
        const formData = new FormData();
        wizardData.contextFiles.forEach((file) => {
          formData.append('files', file);
        });
        
        try {
          const analysisResponse = await emailAPI.analyzeDocument(formData);
          if (analysisResponse.data.analysis) {
            contextInfo += `\n\nInformations des documents fournis:\n${analysisResponse.data.analysis}`;
          }
        } catch (err) {
          console.error('Erreur analyse fichiers:', err);
          toast.warning('Impossible d\'analyser certains fichiers, génération sans analyse');
        }
      }

      const prompt = `Destinataire: ${wizardData.recipient}
Contexte: ${contextInfo}
Ton: ${wizardData.tone}
Longueur: ${wizardData.length}

Génère un email ${wizardData.tone} ${wizardData.length === 'court' ? 'court et direct' : wizardData.length === 'moyen' ? 'de longueur moyenne' : 'détaillé'}.`;

      const response = await emailAPI.generateContent({
        context: prompt,
        tone: wizardData.tone,
        type: 'general',
        recipient_email: wizardData.to
      });

      // L'API retourne { success: true, subject: '...', body: '...' }
      if (response.success) {
        setWizardData(prev => ({
          ...prev,
          generatedBody: response.body,
          subject: response.subject || wizardData.subject
        }));
        setStep(4); // Aller à la prévisualisation
        toast.success('Email généré avec succès !');
      } else {
        throw new Error(response.error || 'Erreur de génération');
      }
    } catch (error) {
      toast.error('Erreur lors de la génération');
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('to', wizardData.to);
      formData.append('subject', wizardData.subject);
      formData.append('body', wizardData.generatedBody);
      if (wizardData.attachment) {
        formData.append('attachment', wizardData.attachment);
      }
      
      // Ajouter informations de programmation si activée
      if (wizardData.isScheduled && wizardData.scheduledDate && wizardData.scheduledTime) {
        const scheduledDateTime = new Date(`${wizardData.scheduledDate}T${wizardData.scheduledTime}`);
        formData.append('scheduled_at', scheduledDateTime.toISOString());
      }

      await emailAPI.send(formData);
      clearDraft(); // Supprimer brouillon après envoi
      
      if (wizardData.isScheduled) {
        toast.success('Email programmé avec succès !');
      } else {
        toast.success('Email envoyé avec succès !');
      }
      navigate('/history');
    } catch (error) {
      toast.error('Erreur lors de l\'envoi');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">À qui envoyez-vous cet email ?</h2>
              <p className="text-gray-500">Commençons par les informations de base</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse email du destinataire *
                </label>
                <input
                  type="email"
                  value={wizardData.to}
                  onChange={(e) => setWizardData({ ...wizardData, to: e.target.value })}
                  placeholder="exemple@email.com"
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Qui est cette personne ?
                </label>
                <input
                  type="text"
                  value={wizardData.recipient}
                  onChange={(e) => setWizardData({ ...wizardData, recipient: e.target.value })}
                  placeholder="Ex: Mon manager, Un client, Un collègue..."
                  className="input"
                />
                <p className="text-xs text-gray-500 mt-1">Cela aide l'IA à adapter le ton</p>
              </div>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Pourquoi envoyez-vous cet email ?</h2>
              <p className="text-gray-500">Expliquez le contexte et l'objectif</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sujet de l'email *
                </label>
                <input
                  type="text"
                  value={wizardData.subject}
                  onChange={(e) => setWizardData({ ...wizardData, subject: e.target.value })}
                  placeholder="Objet de votre email"
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contexte et objectif *
                </label>
                <textarea
                  value={wizardData.context}
                  onChange={(e) => setWizardData({ ...wizardData, context: e.target.value })}
                  placeholder="Ex: Je veux demander une réunion pour discuter du nouveau projet. Il s'agit d'un projet important qui nécessite une collaboration étroite..."
                  className="input min-h-[120px]"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Plus vous donnez de détails, meilleur sera le résultat</p>
              </div>

              <div className="bg-blue-50 border-2 border-blue-200 border-dashed rounded-xl p-6">
                <label className="block text-sm font-medium text-blue-900 mb-3">
                  📎 Fichiers contextuels (optionnel)
                </label>
                <p className="text-xs text-blue-700 mb-3">
                  Uploadez des documents pour aider l'IA à mieux comprendre le contexte (contrats, rapports, etc.)
                </p>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const files = Array.from(e.target.files);
                    setWizardData({ ...wizardData, contextFiles: files });
                    toast.success(`${files.length} fichier(s) ajouté(s)`);
                  }}
                  className="input bg-white"
                />
                {wizardData.contextFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {wizardData.contextFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white rounded-lg p-2 text-sm">
                        <span className="text-gray-700 truncate">📄 {file.name}</span>
                        <button
                          onClick={() => {
                            const newFiles = wizardData.contextFiles.filter((_, i) => i !== idx);
                            setWizardData({ ...wizardData, contextFiles: newFiles });
                          }}
                          className="text-red-600 hover:text-red-800 text-xs px-2"
                        >
                          Supprimer
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Comment voulez-vous le dire ?</h2>
              <p className="text-gray-500">Choisissez le ton et la longueur</p>
            </div>

            <div className="space-y-6">
              {/* Ton */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Ton de l'email *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {tones.map((tone) => (
                    <button
                      key={tone.value}
                      onClick={() => setWizardData({ ...wizardData, tone: tone.value })}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        wizardData.tone === tone.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{tone.icon}</span>
                        <div>
                          <div className="font-semibold text-gray-800">{tone.label}</div>
                          <div className="text-xs text-gray-500">{tone.description}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Longueur */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Longueur souhaitée *
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {lengths.map((length) => (
                    <button
                      key={length.value}
                      onClick={() => setWizardData({ ...wizardData, length: length.value })}
                      className={`p-4 rounded-xl border-2 text-center transition-all ${
                        wizardData.length === length.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-2">{length.icon}</div>
                      <div className="font-semibold text-gray-800 text-sm">{length.label}</div>
                      <div className="text-xs text-gray-500 mt-1">{length.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Eye className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">✅ Validez votre email</h2>
              <p className="text-gray-500">Relisez attentivement avant d'envoyer</p>
            </div>

            {/* Email Preview Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200 overflow-hidden">
              {/* Email Header */}
              <div className="bg-white border-b-2 border-blue-200 p-6">
                <div className="space-y-3">
                  <div className="flex items-start">
                    <span className="text-xs font-semibold text-gray-500 w-20">De:</span>
                    <span className="text-sm text-gray-800 font-medium">Vous</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-xs font-semibold text-gray-500 w-20">À:</span>
                    <span className="text-sm text-gray-800 font-medium">{wizardData.to}</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-xs font-semibold text-gray-500 w-20">Sujet:</span>
                    <input
                      type="text"
                      value={wizardData.subject}
                      onChange={(e) => setWizardData({ ...wizardData, subject: e.target.value })}
                      className="flex-1 text-sm font-semibold text-gray-900 bg-transparent border-b border-dashed border-gray-300 focus:border-blue-500 outline-none px-2 py-1"
                      placeholder="Sujet de l'email"
                    />
                  </div>
                </div>
              </div>

              {/* Email Body */}
              <div className="p-6">
                <label className="block text-xs font-semibold text-blue-900 mb-3">
                  📝 Contenu du message (modifiable)
                </label>
                <div className="bg-white rounded-xl border-2 border-blue-200 p-4">
                  <textarea
                    value={wizardData.generatedBody}
                    onChange={(e) => setWizardData({ ...wizardData, generatedBody: e.target.value })}
                    className="w-full min-h-[300px] text-gray-800 bg-transparent outline-none resize-none font-sans leading-relaxed"
                    placeholder="Le contenu de votre email apparaîtra ici..."
                  />
                </div>

                {/* Character Count */}
                <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                  <span>Vous pouvez modifier le texte directement</span>
                  <span>{wizardData.generatedBody.length} caractères</span>
                </div>
              </div>

              {/* Attachment Section */}
              <div className="p-6 pt-0">
                <label className="block text-xs font-semibold text-blue-900 mb-3">
                  📎 Pièce jointe (optionnel)
                </label>
                <input
                  type="file"
                  onChange={(e) => {
                    setWizardData({ ...wizardData, attachment: e.target.files[0] });
                    toast.success('Fichier joint ajouté');
                  }}
                  className="input bg-white"
                />
                {wizardData.attachment && (
                  <div className="mt-3 bg-white rounded-lg p-3 flex items-center justify-between border border-green-200">
                    <span className="text-sm text-gray-700">📎 {wizardData.attachment.name}</span>
                    <button
                      onClick={() => setWizardData({ ...wizardData, attachment: null })}
                      className="text-red-600 hover:text-red-800 text-xs"
                    >
                      Supprimer
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start space-x-3">
              <div className="text-amber-600 mt-0.5">⚠️</div>
              <div className="flex-1 text-sm text-amber-800">
                <p className="font-semibold mb-1">Vérifiez avant d'envoyer:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>L'adresse email du destinataire est correcte</li>
                  <li>Le sujet est clair et pertinent</li>
                  <li>Le contenu est adapté et sans erreurs</li>
                  <li>La pièce jointe est bien celle souhaitée</li>
                </ul>
              </div>
            </div>

            {/* Programmation Email */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={wizardData.isScheduled}
                    onChange={(e) => setWizardData({ ...wizardData, isScheduled: e.target.checked })}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm font-semibold text-purple-900">⏰ Programmer l'envoi</span>
                </label>
              </div>
              
              {wizardData.isScheduled && (
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-xs text-purple-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={wizardData.scheduledDate}
                      onChange={(e) => setWizardData({ ...wizardData, scheduledDate: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      className="input text-sm w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-purple-700 mb-1">Heure</label>
                    <input
                      type="time"
                      value={wizardData.scheduledTime}
                      onChange={(e) => setWizardData({ ...wizardData, scheduledTime: e.target.value })}
                      className="input text-sm w-full"
                    />
                  </div>
                </div>
              )}
              
              {wizardData.isScheduled && wizardData.scheduledDate && wizardData.scheduledTime && (
                <div className="mt-3 text-xs text-purple-700 bg-white rounded-lg p-2 border border-purple-200">
                  📅 Envoi programmé le {new Date(wizardData.scheduledDate).toLocaleDateString('fr-FR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })} à {wizardData.scheduledTime}
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setStep(3)}
                className="flex-1 btn btn-secondary flex items-center justify-center space-x-2"
              >
                <Edit3 className="w-4 h-4" />
                <span>Régénérer</span>
              </button>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch(step) {
      case 1:
        return wizardData.to && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(wizardData.to);
      case 2:
        return wizardData.subject && wizardData.context;
      case 3:
        return true;
      case 4:
        return wizardData.generatedBody;
      default:
        return false;
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Draft indicator */}
      {localStorage.getItem('emailDraft') && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-100 border border-amber-300 rounded-lg p-3 mb-4 flex items-center justify-between"
        >
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-amber-600" />
            <span className="text-sm text-amber-800">Brouillon en cours (auto-sauvegardé)</span>
          </div>
          <button
            onClick={() => {
              clearDraft();
              window.location.reload();
            }}
            className="text-sm text-amber-600 hover:text-amber-800 underline"
          >
            Nouveau départ
          </button>
        </motion.div>
      )}

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">Étape {step} sur 4</span>
          <span className="text-sm font-medium text-primary-600">{Math.round((step / 4) * 100)}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary-500 to-secondary-500"
            initial={{ width: 0 }}
            animate={{ width: `${(step / 4) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Step Content */}
      <div className="card">
        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : navigate('/dashboard')}
            className="btn btn-secondary flex items-center space-x-2"
            disabled={loading}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{step > 1 ? 'Précédent' : 'Annuler'}</span>
          </button>

          {step < 4 ? (
            <button
              onClick={() => {
                if (step === 3) {
                  handleGenerateEmail();
                } else {
                  setStep(step + 1);
                }
              }}
              disabled={!canProceed() || loading}
              className="btn btn-primary flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Génération...</span>
                </>
              ) : step === 3 ? (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Générer l'email</span>
                </>
              ) : (
                <>
                  <span>Suivant</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleSendEmail}
              disabled={!canProceed() || loading}
              className="btn btn-primary flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Envoi...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Envoyer l'email</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
