import { useState } from 'react';
import { Upload, FileText, Send, AlertCircle, CheckCircle, Clock, DollarSign, Building2, AlertTriangle, HelpCircle, Save, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function OfficialDocuments() {
  const [step, setStep] = useState(1); // 1: input, 2: analysis, 3: questions, 4: response
  const [documentText, setDocumentText] = useState('');
  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [userResponses, setUserResponses] = useState({});
  const [generatedResponse, setGeneratedResponse] = useState(null);
  const [responseType, setResponseType] = useState('demande'); // demande|contestation|information
  const [loading, setLoading] = useState(false);

  // Exemples de documents pour démonstration
  const exemples = {
    amende: `AVIS DE CONTRAVENTION

Ministère de l'Intérieur - Direction de la Sécurité Routière

Référence: 2024-FR-75-123456789
Date d'infraction: 15/12/2024
Lieu: Avenue des Champs-Élysées, Paris 75008

INFRACTION CONSTATÉE:
Excès de vitesse de 15 km/h en agglomération
Vitesse enregistrée: 65 km/h
Vitesse autorisée: 50 km/h

MONTANT DE L'AMENDE:
- Amende forfaitaire: 135 €
- Amende minorée (paiement sous 15 jours): 90 €
- Amende majorée (après 45 jours): 375 €

DATE LIMITE DE PAIEMENT: 31/12/2024`,
    
    impots: `DIRECTION GÉNÉRALE DES FINANCES PUBLIQUES
Centre des Finances Publiques de Paris 15ème

Référence fiscale: 2024-IMP-1234567
Numéro fiscal: 1 234 567 890 123

Objet: Demande de régularisation - Revenus 2023

Madame, Monsieur,

Suite à l'examen de votre déclaration de revenus 2023, nous avons constaté une discordance 
concernant vos revenus fonciers déclarés.

Montant déclaré: 12 000 €
Montant constaté (sources tierces): 18 500 €
Différence: 6 500 €

RECTIFICATION PROPOSÉE:
Impôt supplémentaire dû: 2 275 €
Pénalités de retard (10%): 227,50 €
TOTAL À RÉGLER: 2 502,50 €

Date limite de réponse: 20/01/2025`
  };

  const handleAnalyze = async () => {
    if (!documentText.trim()) {
      toast.error('Veuillez saisir ou coller le texte du document');
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('/api/documents/analyze-official', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_text: documentText })
      });

      const data = await response.json();
      
      if (data.success) {
        setAnalysis(data.analysis);
        setStep(2);
        toast.success('✅ Document analysé!');
      } else {
        toast.error(data.error || 'Erreur d\'analyse');
      }
    } catch (error) {
      toast.error('Erreur lors de l\'analyse');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateResponse = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/documents/generate-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis: analysis,
          user_responses: userResponses,
          response_type: responseType
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setGeneratedResponse(data.response);
        setStep(4);
        toast.success('✉️ Réponse générée!');
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error('Erreur lors de la génération');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveResponse = async () => {
    try {
      const response = await fetch('/api/documents/save-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          response: generatedResponse,
          analysis: analysis
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(`💾 Sauvegardé: ${data.filename}`);
      }
    } catch (error) {
      toast.error('Erreur de sauvegarde');
    }
  };

  const handleQuestionResponse = (questionId, value) => {
    setUserResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const getUrgencyColor = (urgence) => {
    const colors = {
      'faible': 'bg-green-100 text-green-800',
      'moyenne': 'bg-yellow-100 text-yellow-800',
      'haute': 'bg-orange-100 text-orange-800',
      'critique': 'bg-red-100 text-red-800'
    };
    return colors[urgence] || colors['moyenne'];
  };

  const getUrgencyIcon = (urgence) => {
    if (urgence === 'critique' || urgence === 'haute') return AlertTriangle;
    if (urgence === 'moyenne') return Clock;
    return CheckCircle;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Assistant Courriers Officiels
          </h1>
          <p className="text-gray-600">
            Amendes • Impôts • Factures • Courriers administratifs
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8 flex justify-center items-center space-x-4">
          {[
            { num: 1, label: 'Document', icon: FileText },
            { num: 2, label: 'Analyse', icon: AlertCircle },
            { num: 3, label: 'Questions', icon: HelpCircle },
            { num: 4, label: 'Réponse', icon: Send }
          ].map(({ num, label, icon: Icon }) => (
            <div key={num} className="flex items-center">
              <div className={`
                flex items-center justify-center w-10 h-10 rounded-full
                ${step >= num ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}
                transition-all duration-300
              `}>
                {step > num ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
              </div>
              <span className={`ml-2 text-sm ${step >= num ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                {label}
              </span>
              {num < 4 && <div className="w-12 h-0.5 bg-gray-300 mx-2" />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* STEP 1: Document Input */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-4 flex items-center">
                  <FileText className="w-6 h-6 mr-2 text-blue-600" />
                  Saisissez votre document
                </h2>

                {/* Exemples rapides */}
                <div className="mb-4 flex gap-2">
                  <button
                    onClick={() => setDocumentText(exemples.amende)}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                  >
                    📄 Exemple: Amende
                  </button>
                  <button
                    onClick={() => setDocumentText(exemples.impots)}
                    className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm"
                  >
                    📊 Exemple: Impôts
                  </button>
                </div>

                <textarea
                  value={documentText}
                  onChange={(e) => setDocumentText(e.target.value)}
                  placeholder="Collez ici le texte de votre document officiel (amende, impôts, facture, etc.)..."
                  className="w-full h-64 p-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all font-mono text-sm"
                />

                <div className="mt-4 flex justify-between items-center">
                  <p className="text-sm text-gray-500">
                    💡 Vous pouvez coller le texte d'un document scanné (OCR) ou reçu par email
                  </p>
                  <button
                    onClick={handleAnalyze}
                    disabled={loading || !documentText.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg
                      hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed
                      transition-all duration-300 flex items-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                        <span>Analyse...</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-5 h-5" />
                        <span>Analyser</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Analysis Results */}
          {step === 2 && analysis && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <AlertCircle className="w-6 h-6 mr-2 text-blue-600" />
                  Analyse du document
                </h2>

                {/* Grid d'informations */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Type de document</div>
                    <div className="font-bold text-blue-900">{analysis.type_document || 'N/A'}</div>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1 flex items-center">
                      <Building2 className="w-4 h-4 mr-1" />
                      Émetteur
                    </div>
                    <div className="font-bold text-purple-900">{analysis.emetteur || 'N/A'}</div>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Référence</div>
                    <div className="font-bold text-green-900 font-mono text-sm">{analysis.reference || 'N/A'}</div>
                  </div>

                  {analysis.montant && (
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1 flex items-center">
                        <DollarSign className="w-4 h-4 mr-1" />
                        Montant
                      </div>
                      <div className="font-bold text-orange-900 text-xl">{analysis.montant}</div>
                    </div>
                  )}

                  {analysis.date_limite && (
                    <div className="p-4 bg-red-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1 flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        Date limite
                      </div>
                      <div className="font-bold text-red-900">{analysis.date_limite}</div>
                    </div>
                  )}

                  <div className="p-4 rounded-lg border-2" style={{
                    borderColor: analysis.urgence === 'critique' ? '#ef4444' : 
                                 analysis.urgence === 'haute' ? '#f97316' :
                                 analysis.urgence === 'moyenne' ? '#eab308' : '#22c55e'
                  }}>
                    <div className="text-sm text-gray-600 mb-1">Urgence</div>
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${getUrgencyColor(analysis.urgence)}`}>
                      {React.createElement(getUrgencyIcon(analysis.urgence), { className: "w-4 h-4 mr-1" })}
                      {analysis.urgence?.toUpperCase()}
                    </div>
                  </div>
                </div>

                {/* Objet et Action requise */}
                <div className="space-y-4 mb-6">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium text-gray-600 mb-2">📋 Objet:</div>
                    <div className="text-gray-900">{analysis.objet}</div>
                  </div>

                  <div className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                    <div className="text-sm font-medium text-gray-600 mb-2">🎯 Action requise:</div>
                    <div className="text-gray-900 font-medium">{analysis.action_requise}</div>
                  </div>
                </div>

                {/* Conseils */}
                {analysis.conseils && analysis.conseils.length > 0 && (
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                    <div className="text-sm font-medium text-blue-900 mb-2 flex items-center">
                      <HelpCircle className="w-4 h-4 mr-1" />
                      Conseils:
                    </div>
                    <ul className="space-y-2">
                      {analysis.conseils.map((conseil, idx) => (
                        <li key={idx} className="text-blue-800 flex items-start">
                          <span className="mr-2">•</span>
                          <span>{conseil}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex justify-between">
                  <button
                    onClick={() => setStep(1)}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    ← Retour
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg
                      hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center space-x-2"
                  >
                    <span>Continuer</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Questions */}
          {step === 3 && analysis && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <HelpCircle className="w-6 h-6 mr-2 text-blue-600" />
                  Informations complémentaires
                </h2>

                {/* Type de réponse */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type de réponse souhaitée:
                  </label>
                  <div className="flex gap-3">
                    {[
                      { value: 'demande', label: '📝 Demande (échéancier, délai)' },
                      { value: 'contestation', label: '⚖️ Contestation' },
                      { value: 'information', label: '❓ Demande d\'information' }
                    ].map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() => setResponseType(value)}
                        className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                          responseType === value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Questions dynamiques */}
                {analysis.questions_collecte && analysis.questions_collecte.length > 0 ? (
                  <div className="space-y-4 mb-6">
                    {analysis.questions_collecte.map((q, idx) => (
                      <div key={q.id} className="p-4 bg-gray-50 rounded-lg">
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                          {idx + 1}. {q.question}
                          {q.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        
                        {q.aide && (
                          <p className="text-sm text-gray-600 mb-3 flex items-start">
                            <HelpCircle className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
                            <span>{q.aide}</span>
                          </p>
                        )}

                        {q.type === 'yesno' ? (
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleQuestionResponse(q.id, true)}
                              className={`flex-1 px-4 py-2 rounded-lg border-2 ${
                                userResponses[q.id] === true
                                  ? 'border-green-500 bg-green-50 text-green-700'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              Oui
                            </button>
                            <button
                              onClick={() => handleQuestionResponse(q.id, false)}
                              className={`flex-1 px-4 py-2 rounded-lg border-2 ${
                                userResponses[q.id] === false
                                  ? 'border-red-500 bg-red-50 text-red-700'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              Non
                            </button>
                          </div>
                        ) : q.type === 'choice' && q.options ? (
                          <select
                            value={userResponses[q.id] || ''}
                            onChange={(e) => handleQuestionResponse(q.id, e.target.value)}
                            className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                          >
                            <option value="">-- Sélectionnez --</option>
                            {q.options.map((opt, i) => (
                              <option key={i} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={q.type === 'number' ? 'number' : q.type === 'date' ? 'date' : 'text'}
                            value={userResponses[q.id] || ''}
                            onChange={(e) => handleQuestionResponse(q.id, e.target.value)}
                            className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            placeholder={q.type === 'number' ? 'Entrez un nombre' : 'Votre réponse...'}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-blue-50 rounded-lg mb-6 text-blue-800">
                    ℹ️ Aucune information supplémentaire nécessaire
                  </div>
                )}

                <div className="flex justify-between">
                  <button
                    onClick={() => setStep(2)}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    ← Retour
                  </button>
                  <button
                    onClick={handleGenerateResponse}
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg
                      hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-all duration-300 flex items-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                        <span>Génération...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span>Générer la réponse</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 4: Generated Response */}
          {step === 4 && generatedResponse && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <CheckCircle className="w-6 h-6 mr-2 text-green-600" />
                  Votre réponse est prête
                </h2>

                {/* Objet */}
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-600 mb-2">Objet:</div>
                  <div className="font-bold text-gray-900">{generatedResponse.objet}</div>
                </div>

                {/* Corps */}
                <div className="mb-6 p-6 bg-gray-50 rounded-lg border-2 border-gray-200">
                  <div className="whitespace-pre-wrap font-serif text-gray-900 leading-relaxed">
                    {generatedResponse.corps}
                  </div>
                </div>

                {/* Informations complémentaires */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {generatedResponse.pieces_jointes && generatedResponse.pieces_jointes.length > 0 && (
                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <div className="text-sm font-medium text-gray-700 mb-2">📎 Pièces à joindre:</div>
                      <ul className="text-sm text-gray-800 space-y-1">
                        {generatedResponse.pieces_jointes.map((piece, idx) => (
                          <li key={idx}>• {piece}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="text-sm font-medium text-gray-700 mb-2">📮 Mode d'envoi:</div>
                    <div className="font-bold text-purple-900">{generatedResponse.mode_envoi || 'Recommandé'}</div>
                  </div>

                  {generatedResponse.delai_envoi && (
                    <div className="p-4 bg-red-50 rounded-lg">
                      <div className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        À envoyer avant le:
                      </div>
                      <div className="font-bold text-red-900">{generatedResponse.delai_envoi}</div>
                    </div>
                  )}
                </div>

                {/* Conseils d'envoi */}
                {generatedResponse.conseils_envoi && generatedResponse.conseils_envoi.length > 0 && (
                  <div className="mb-6 p-4 bg-green-50 rounded-lg">
                    <div className="text-sm font-medium text-green-900 mb-2 flex items-center">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Conseils d'envoi:
                    </div>
                    <ul className="space-y-2">
                      {generatedResponse.conseils_envoi.map((conseil, idx) => (
                        <li key={idx} className="text-green-800 flex items-start">
                          <span className="mr-2">•</span>
                          <span>{conseil}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-between">
                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep(3)}
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      ← Modifier
                    </button>
                    <button
                      onClick={handleSaveResponse}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                    >
                      <Save className="w-5 h-5" />
                      <span>Sauvegarder</span>
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      // Copier dans le presse-papiers
                      const fullText = `OBJET: ${generatedResponse.objet}\n\n${generatedResponse.corps}`;
                      navigator.clipboard.writeText(fullText);
                      toast.success('📋 Copié dans le presse-papiers!');
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg
                      hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center space-x-2"
                  >
                    <Download className="w-5 h-5" />
                    <span>Copier le courrier</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
