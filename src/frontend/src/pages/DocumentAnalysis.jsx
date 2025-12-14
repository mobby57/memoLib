import { useState } from 'react';
import { Upload, FileText, Search, Mail, Sparkles, Users, Building2, AlertCircle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function DocumentAnalysis() {
  const [step, setStep] = useState(1); // 1: upload, 2: analysis, 3: recipients, 4: email
  const [file, setFile] = useState(null);
  const [context, setContext] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [recipients, setRecipients] = useState([]);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [generatedEmail, setGeneratedEmail] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      toast.success(`📄 Fichier chargé: ${uploadedFile.name}`);
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      toast.error('Veuillez sélectionner un fichier');
      return;
    }

    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('context', context);

      const response = await fetch('/api/analyze-document', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (data.success) {
        setAnalysis(data.analysis);
        setRecipients(data.suggested_recipients || []);
        setStep(2);
        toast.success('✅ Document analysé avec succès!');
      } else {
        toast.error(data.error || 'Erreur lors de l\'analyse');
      }
    } catch (error) {
      toast.error('Erreur lors de l\'analyse du document');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRecipient = async (recipient) => {
    setSelectedRecipient(recipient);
    setLoading(true);

    try {
      const response = await fetch('/api/generate-email-from-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis: analysis,
          recipient: recipient
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setGeneratedEmail(data.email);
        setStep(4);
        toast.success('✉️ Email généré!');
      }
    } catch (error) {
      toast.error('Erreur lors de la génération');
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    // Redirection vers page d'envoi avec données pré-remplies
    const params = new URLSearchParams({
      recipient: selectedRecipient.email || '',
      subject: generatedEmail.sujet || '',
      body: generatedEmail.corps || ''
    });
    window.location.href = `/send?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">📄 Analyse de Documents</h1>
        <p className="text-gray-600 mt-2">
          Uploadez un document (PDF, image, texte) et l'IA analysera et proposera un email adapté
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between max-w-3xl mx-auto">
        {[
          { num: 1, label: 'Upload', icon: Upload },
          { num: 2, label: 'Analyse', icon: Sparkles },
          { num: 3, label: 'Destinataire', icon: Users },
          { num: 4, label: 'Email', icon: Mail }
        ].map((s, idx) => (
          <div key={s.num} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                step >= s.num 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-gray-200 text-gray-400'
              }`}>
                <s.icon className="w-6 h-6" />
              </div>
              <span className="text-xs mt-2 font-medium">{s.label}</span>
            </div>
            {idx < 3 && (
              <div className={`flex-1 h-1 mx-2 ${
                step > s.num ? 'bg-primary-600' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Upload */}
        {step === 1 && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="card max-w-3xl mx-auto"
          >
            <h2 className="text-xl font-bold mb-4">1️⃣ Téléchargez votre document</h2>
            
            <div className="space-y-4">
              {/* File Upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-primary-500 transition-colors cursor-pointer">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept=".pdf,.docx,.txt,.png,.jpg,.jpeg"
                  onChange={handleFileUpload}
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-700">
                    Cliquez pour sélectionner un fichier
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    PDF, DOCX, TXT, PNG, JPG (max 10MB)
                  </p>
                  {file && (
                    <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                      <FileText className="w-5 h-5 text-green-600" />
                      <span className="text-green-800 font-medium">{file.name}</span>
                    </div>
                  )}
                </label>
              </div>

              {/* Context Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contexte additionnel (optionnel)
                </label>
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  className="input min-h-[100px]"
                  placeholder="Ex: C'est une facture non payée, je veux contester le montant..."
                />
              </div>

              <button
                onClick={handleAnalyze}
                disabled={!file || loading}
                className="btn btn-primary w-full"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Analyse en cours...
                  </span>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Analyser avec l'IA
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 2 & 3: Analysis Results & Recipients */}
        {(step === 2 || step === 3) && analysis && (
          <motion.div
            key="analysis"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Analysis Results */}
            <div className="card">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-primary-600" />
                2️⃣ Résultats de l'analyse
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium">Type de document</p>
                  <p className="text-lg font-bold text-blue-900">{analysis.type_document}</p>
                </div>
                
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-600 font-medium">Urgence</p>
                  <p className="text-lg font-bold text-purple-900">{analysis.urgence || 'Moyenne'}</p>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg md:col-span-2">
                  <p className="text-sm text-green-600 font-medium mb-2">Sujet principal</p>
                  <p className="text-gray-800">{analysis.sujet_principal}</p>
                </div>
                
                {analysis.action_requise && (
                  <div className="p-4 bg-orange-50 rounded-lg md:col-span-2">
                    <p className="text-sm text-orange-600 font-medium mb-2">Action recommandée</p>
                    <p className="text-gray-800">{analysis.action_requise}</p>
                  </div>
                )}
              </div>

              <button
                onClick={() => setStep(3)}
                className="btn btn-primary w-full mt-4"
              >
                Continuer → Choisir le destinataire
              </button>
            </div>

            {/* Recipients Suggestions */}
            {step === 3 && (
              <div className="card">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Users className="w-6 h-6 text-primary-600" />
                  3️⃣ Destinataires suggérés
                </h2>
                
                {recipients.length > 0 ? (
                  <div className="space-y-3">
                    {recipients.map((recipient, idx) => (
                      <motion.button
                        key={idx}
                        onClick={() => handleSelectRecipient(recipient)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl text-left hover:border-blue-400 transition-all"
                      >
                        <div className="flex items-start gap-3">
                          <Building2 className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900">{recipient.name}</h3>
                            {recipient.email && (
                              <p className="text-sm text-gray-600">{recipient.email}</p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                                {recipient.category}
                              </span>
                              <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                                Ton: {recipient.tone_recommende}
                              </span>
                            </div>
                          </div>
                          <CheckCircle className="w-6 h-6 text-blue-600" />
                        </div>
                      </motion.button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>Aucun destinataire suggéré</p>
                    <p className="text-sm mt-2">Vous pourrez saisir manuellement l'adresse</p>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t">
                  <button className="btn btn-secondary w-full">
                    <Search className="w-5 h-5 mr-2" />
                    Rechercher un autre destinataire
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Step 4: Generated Email */}
        {step === 4 && generatedEmail && (
          <motion.div
            key="email"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="card max-w-3xl mx-auto"
          >
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Mail className="w-6 h-6 text-primary-600" />
              4️⃣ Email généré par l'IA
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Destinataire</label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium">{selectedRecipient?.name}</p>
                  {selectedRecipient?.email && (
                    <p className="text-sm text-gray-600">{selectedRecipient.email}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sujet</label>
                <input
                  type="text"
                  value={generatedEmail.sujet}
                  className="input"
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Corps de l'email</label>
                <textarea
                  value={generatedEmail.corps}
                  className="input min-h-[300px]"
                  readOnly
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSendEmail}
                  className="btn btn-primary flex-1"
                >
                  <Mail className="w-5 h-5 mr-2" />
                  Envoyer cet email
                </button>
                <button
                  onClick={() => {
                    setStep(1);
                    setFile(null);
                    setAnalysis(null);
                    setRecipients([]);
                    setGeneratedEmail(null);
                  }}
                  className="btn btn-secondary"
                >
                  Nouveau document
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
