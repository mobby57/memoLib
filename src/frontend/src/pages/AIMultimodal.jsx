import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  FileText, 
  Mic, 
  Image as ImageIcon,
  Upload,
  Wand2,
  Copy,
  Download,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
  Play,
  Square
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { aiAPI } from '../services/api';

function AIMultimodal() {
  const [activeTab, setActiveTab] = useState('text');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Text generation state
  const [textPrompt, setTextPrompt] = useState('');
  const [generatedText, setGeneratedText] = useState('');
  
  // Document analysis state
  const [documentFile, setDocumentFile] = useState(null);
  const [documentAnalysis, setDocumentAnalysis] = useState('');
  
  // Voice transcription state
  const [isRecording, setIsRecording] = useState(false);
  const [audioFile, setAudioFile] = useState(null);
  const [transcription, setTranscription] = useState('');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  
  // Image analysis state
  const [imageFile, setImageFile] = useState(null);
  const [imageAnalysis, setImageAnalysis] = useState('');

  const tabs = [
    {
      id: 'text',
      name: 'Texte',
      icon: MessageSquare,
      description: 'Génération de contenu',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'document',
      name: 'Document',
      icon: FileText,
      description: 'Analyse de fichiers',
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'voice',
      name: 'Audio',
      icon: Mic,
      description: 'Transcription vocale',
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: 'image',
      name: 'Image',
      icon: ImageIcon,
      description: 'Analyse visuelle',
      color: 'from-orange-500 to-amber-500'
    }
  ];

  // Text Generation Functions
  const handleGenerateText = async () => {
    if (!textPrompt.trim()) {
      toast.error('Veuillez entrer un prompt');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await aiAPI.generateContent(textPrompt);
      // L'API retourne { success: true, subject: '...', body: '...', source: 'openai' }
      if (response.success) {
        const content = `Sujet: ${response.subject}\n\n${response.body}`;
        setGeneratedText(content);
        toast.success('Contenu généré avec succès');
      } else {
        throw new Error(response.error || 'Erreur de génération');
      }
    } catch (error) {
      console.error('Erreur lors de la génération:', error);
      toast.error(error.message || 'Erreur lors de la génération du contenu');
    } finally {
      setIsProcessing(false);
    }
  };

  // Document Analysis Functions
  const handleDocumentUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Le fichier est trop volumineux (max 10MB)');
        return;
      }
      setDocumentFile(file);
      toast.success(`Document "${file.name}" chargé`);
    }
  };

  const handleAnalyzeDocument = async () => {
    if (!documentFile) {
      toast.error('Veuillez sélectionner un document');
      return;
    }

    setIsProcessing(true);
    const formData = new FormData();
    formData.append('file', documentFile);

    try {
      const response = await emailAPI.analyzeDocument(formData);
      setDocumentAnalysis(response.data.analysis);
      toast.success('Document analysé avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'analyse:', error);
      toast.error('Erreur lors de l\'analyse du document');
    } finally {
      setIsProcessing(false);
    }
  };

  // Voice Recording Functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });
        setAudioFile(audioFile);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.success('Enregistrement démarré');
    } catch (error) {
      console.error('Erreur lors du démarrage de l\'enregistrement:', error);
      toast.error('Impossible d\'accéder au microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.success('Enregistrement arrêté');
    }
  };

  const handleAudioUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 25 * 1024 * 1024) {
        toast.error('Le fichier audio est trop volumineux (max 25MB)');
        return;
      }
      setAudioFile(file);
      toast.success(`Audio "${file.name}" chargé`);
    }
  };

  const handleTranscribeAudio = async () => {
    if (!audioFile) {
      toast.error('Veuillez enregistrer ou charger un fichier audio');
      return;
    }

    setIsProcessing(true);
    const formData = new FormData();
    formData.append('audio', audioFile);

    try {
      const response = await emailAPI.transcribeAudio(formData);
      setTranscription(response.data.transcription);
      toast.success('Audio transcrit avec succès');
    } catch (error) {
      console.error('Erreur lors de la transcription:', error);
      toast.error('Erreur lors de la transcription');
    } finally {
      setIsProcessing(false);
    }
  };

  // Image Analysis Functions
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('L\'image est trop volumineuse (max 10MB)');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Veuillez sélectionner une image valide');
        return;
      }
      setImageFile(file);
      toast.success(`Image "${file.name}" chargée`);
    }
  };

  const handleAnalyzeImage = async () => {
    if (!imageFile) {
      toast.error('Veuillez sélectionner une image');
      return;
    }

    setIsProcessing(true);
    const formData = new FormData();
    formData.append('images', imageFile);
    formData.append('type', 'general'); // Options: general, ocr, email_context, generate_email

    try {
      const response = await emailAPI.analyzeImage(formData);
      if (response.data.success && response.data.analyses) {
        const analysis = response.data.analyses[0].analysis;
        setImageAnalysis(analysis);
        toast.success('Image analysée avec succès');
      } else {
        toast.error('Erreur lors de l\'analyse de l\'image');
      }
    } catch (error) {
      console.error('Erreur lors de l\'analyse:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de l\'analyse de l\'image');
    } finally {
      setIsProcessing(false);
    }
  };

  // Utility Functions
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copié dans le presse-papier');
  };

  const downloadAsText = (text, filename) => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Fichier téléchargé');
  };

  const clearCurrentTab = () => {
    switch (activeTab) {
      case 'text':
        setTextPrompt('');
        setGeneratedText('');
        break;
      case 'document':
        setDocumentFile(null);
        setDocumentAnalysis('');
        break;
      case 'voice':
        setAudioFile(null);
        setTranscription('');
        if (isRecording) stopRecording();
        break;
      case 'image':
        setImageFile(null);
        setImageAnalysis('');
        break;
    }
    toast.success('Réinitialisé');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white">
        <div className="flex items-center space-x-4">
          <div className="p-4 bg-white/20 rounded-xl backdrop-blur-sm">
            <Wand2 className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Assistant IA Multimodal</h1>
            <p className="text-purple-100 mt-2">
              Analysez du texte, des documents, des images et de l'audio avec l'intelligence artificielle
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative p-6 rounded-xl border-2 transition-all ${
                isActive
                  ? 'border-primary-500 bg-primary-50 shadow-lg'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex flex-col items-center space-y-2">
                <div className={`p-3 rounded-lg bg-gradient-to-br ${tab.color}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-center">
                  <h3 className={`font-semibold ${isActive ? 'text-primary-600' : 'text-gray-700'}`}>
                    {tab.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">{tab.description}</p>
                </div>
              </div>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-b-xl"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="card p-6"
        >
          {/* Text Generation Tab */}
          {activeTab === 'text' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4">Génération de Contenu</h2>
                <p className="text-gray-600 mb-6">
                  Décrivez ce que vous souhaitez générer et l'IA créera du contenu pour vous.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Votre prompt
                </label>
                <textarea
                  value={textPrompt}
                  onChange={(e) => setTextPrompt(e.target.value)}
                  placeholder="Ex: Écris un email de remerciement professionnel pour une entrevue d'embauche..."
                  className="input min-h-[150px] resize-none"
                  disabled={isProcessing}
                />
              </div>

              <div className="flex justify-between">
                <button
                  onClick={clearCurrentTab}
                  className="btn btn-secondary"
                  disabled={isProcessing || (!textPrompt && !generatedText)}
                >
                  <X className="w-4 h-4 mr-2" />
                  Effacer
                </button>
                <button
                  onClick={handleGenerateText}
                  className="btn btn-primary"
                  disabled={isProcessing || !textPrompt.trim()}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Génération...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      Générer
                    </>
                  )}
                </button>
              </div>

              {generatedText && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border-2 border-blue-100"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold text-blue-900">Contenu généré</h3>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => copyToClipboard(generatedText)}
                        className="p-2 bg-white rounded-lg hover:bg-blue-100 transition-colors"
                        title="Copier"
                      >
                        <Copy className="w-4 h-4 text-blue-600" />
                      </button>
                      <button
                        onClick={() => downloadAsText(generatedText, 'generated-content.txt')}
                        className="p-2 bg-white rounded-lg hover:bg-blue-100 transition-colors"
                        title="Télécharger"
                      >
                        <Download className="w-4 h-4 text-blue-600" />
                      </button>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-gray-800 whitespace-pre-wrap">{generatedText}</p>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* Document Analysis Tab */}
          {activeTab === 'document' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4">Analyse de Document</h2>
                <p className="text-gray-600 mb-6">
                  Téléchargez un document (PDF, DOCX, TXT) pour en extraire le contenu et l'analyser.
                </p>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-purple-400 transition-colors">
                <input
                  type="file"
                  id="document-upload"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleDocumentUpload}
                  className="hidden"
                  disabled={isProcessing}
                />
                <label
                  htmlFor="document-upload"
                  className="cursor-pointer flex flex-col items-center space-y-3"
                >
                  <div className="p-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full">
                    <Upload className="w-8 h-8 text-purple-600" />
                  </div>
                  {documentFile ? (
                    <div className="space-y-2">
                      <p className="font-semibold text-gray-800">{documentFile.name}</p>
                      <p className="text-sm text-gray-500">
                        {(documentFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="font-medium text-gray-700">Cliquez pour sélectionner un document</p>
                      <p className="text-sm text-gray-500">PDF, DOCX, TXT (max 10MB)</p>
                    </div>
                  )}
                </label>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={clearCurrentTab}
                  className="btn btn-secondary"
                  disabled={isProcessing || (!documentFile && !documentAnalysis)}
                >
                  <X className="w-4 h-4 mr-2" />
                  Effacer
                </button>
                <button
                  onClick={handleAnalyzeDocument}
                  className="btn btn-primary"
                  disabled={isProcessing || !documentFile}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyse...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      Analyser
                    </>
                  )}
                </button>
              </div>

              {documentAnalysis && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-100"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-purple-600" />
                      <h3 className="font-semibold text-purple-900">Analyse du document</h3>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => copyToClipboard(documentAnalysis)}
                        className="p-2 bg-white rounded-lg hover:bg-purple-100 transition-colors"
                        title="Copier"
                      >
                        <Copy className="w-4 h-4 text-purple-600" />
                      </button>
                      <button
                        onClick={() => downloadAsText(documentAnalysis, 'document-analysis.txt')}
                        className="p-2 bg-white rounded-lg hover:bg-purple-100 transition-colors"
                        title="Télécharger"
                      >
                        <Download className="w-4 h-4 text-purple-600" />
                      </button>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-gray-800 whitespace-pre-wrap">{documentAnalysis}</p>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* Voice Transcription Tab */}
          {activeTab === 'voice' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4">Transcription Audio</h2>
                <p className="text-gray-600 mb-6">
                  Enregistrez votre voix ou téléchargez un fichier audio pour le transcrire en texte.
                </p>
              </div>

              {/* Recording Controls */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-100">
                <div className="flex flex-col items-center space-y-4">
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                      isRecording
                        ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                        : 'bg-gradient-to-br from-green-500 to-emerald-500 hover:shadow-lg'
                    }`}
                    disabled={isProcessing}
                  >
                    {isRecording ? (
                      <Square className="w-8 h-8 text-white" />
                    ) : (
                      <Play className="w-8 h-8 text-white ml-1" />
                    )}
                  </button>
                  <p className="font-medium text-gray-700">
                    {isRecording ? 'Cliquez pour arrêter' : 'Cliquez pour enregistrer'}
                  </p>
                  {audioFile && !isRecording && (
                    <p className="text-sm text-green-600 flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4" />
                      <span>Audio enregistré: {audioFile.name}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Or Upload */}
              <div className="text-center">
                <span className="text-gray-400 font-medium">OU</span>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-green-400 transition-colors">
                <input
                  type="file"
                  id="audio-upload"
                  accept="audio/*"
                  onChange={handleAudioUpload}
                  className="hidden"
                  disabled={isProcessing || isRecording}
                />
                <label
                  htmlFor="audio-upload"
                  className="cursor-pointer flex flex-col items-center space-y-3"
                >
                  <div className="p-4 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full">
                    <Upload className="w-8 h-8 text-green-600" />
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium text-gray-700">Télécharger un fichier audio</p>
                    <p className="text-sm text-gray-500">MP3, WAV, M4A (max 25MB)</p>
                  </div>
                </label>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={clearCurrentTab}
                  className="btn btn-secondary"
                  disabled={isProcessing || isRecording || (!audioFile && !transcription)}
                >
                  <X className="w-4 h-4 mr-2" />
                  Effacer
                </button>
                <button
                  onClick={handleTranscribeAudio}
                  className="btn btn-primary"
                  disabled={isProcessing || isRecording || !audioFile}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Transcription...
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 mr-2" />
                      Transcrire
                    </>
                  )}
                </button>
              </div>

              {transcription && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-100"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <h3 className="font-semibold text-green-900">Transcription</h3>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => copyToClipboard(transcription)}
                        className="p-2 bg-white rounded-lg hover:bg-green-100 transition-colors"
                        title="Copier"
                      >
                        <Copy className="w-4 h-4 text-green-600" />
                      </button>
                      <button
                        onClick={() => downloadAsText(transcription, 'transcription.txt')}
                        className="p-2 bg-white rounded-lg hover:bg-green-100 transition-colors"
                        title="Télécharger"
                      >
                        <Download className="w-4 h-4 text-green-600" />
                      </button>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-gray-800 whitespace-pre-wrap">{transcription}</p>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* Image Analysis Tab */}
          {activeTab === 'image' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4">Analyse d'Image</h2>
                <p className="text-gray-600 mb-6">
                  Téléchargez une image pour en extraire des informations et obtenir une description.
                </p>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-orange-400 transition-colors">
                <input
                  type="file"
                  id="image-upload"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={isProcessing}
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer flex flex-col items-center space-y-3"
                >
                  {imageFile ? (
                    <div className="space-y-4">
                      <img
                        src={URL.createObjectURL(imageFile)}
                        alt="Preview"
                        className="max-h-48 rounded-lg shadow-lg"
                      />
                      <p className="font-semibold text-gray-800">{imageFile.name}</p>
                      <p className="text-sm text-gray-500">
                        {(imageFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="p-4 bg-gradient-to-br from-orange-100 to-amber-100 rounded-full">
                        <Upload className="w-8 h-8 text-orange-600" />
                      </div>
                      <div className="space-y-2">
                        <p className="font-medium text-gray-700">Cliquez pour sélectionner une image</p>
                        <p className="text-sm text-gray-500">JPG, PNG, GIF (max 10MB)</p>
                      </div>
                    </>
                  )}
                </label>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={clearCurrentTab}
                  className="btn btn-secondary"
                  disabled={isProcessing || (!imageFile && !imageAnalysis)}
                >
                  <X className="w-4 h-4 mr-2" />
                  Effacer
                </button>
                <button
                  onClick={handleAnalyzeImage}
                  className="btn btn-primary"
                  disabled={isProcessing || !imageFile}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyse...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Analyser
                    </>
                  )}
                </button>
              </div>

              {imageAnalysis && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 border-2 border-orange-100"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-orange-600" />
                      <h3 className="font-semibold text-orange-900">Analyse de l'image</h3>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => copyToClipboard(imageAnalysis)}
                        className="p-2 bg-white rounded-lg hover:bg-orange-100 transition-colors"
                        title="Copier"
                      >
                        <Copy className="w-4 h-4 text-orange-600" />
                      </button>
                      <button
                        onClick={() => downloadAsText(imageAnalysis, 'image-analysis.txt')}
                        className="p-2 bg-white rounded-lg hover:bg-orange-100 transition-colors"
                        title="Télécharger"
                      >
                        <Download className="w-4 h-4 text-orange-600" />
                      </button>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-gray-800 whitespace-pre-wrap">{imageAnalysis}</p>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default AIMultimodal;
