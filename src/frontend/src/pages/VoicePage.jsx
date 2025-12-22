import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Square, Play, Send, Wand2, ArrowLeft, Check, X, Edit2, Keyboard } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import { useTheme } from '../contexts/ThemeContext';

export default function VoicePage() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [transcription, setTranscription] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState('');
  const [generatedEmail, setGeneratedEmail] = useState(null);
  const [recipient, setRecipient] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [manualMode, setManualMode] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);

  // Initialiser l'enregistrement audio avec transcription en temps réel
  const startRecording = async () => {
    try {
      setMessage('🔍 Demande d\'accès au microphone...');
      
      // Test de compatibilité
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('MediaDevices non supporté');
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      setMessage('✅ Microphone autorisé ! Initialisation...');
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Créer un analyseur audio pour détecter le niveau sonore
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      microphone.connect(analyser);
      analyser.fftSize = 256;
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // Surveiller le niveau audio
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const checkAudioLevel = () => {
        if (!isRecording) return;
        
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / bufferLength;
        setAudioLevel(Math.round(average));
        
        requestAnimationFrame(checkAudioLevel);
      };
      checkAudioLevel();

      // Initialiser Web Speech API pour transcription en temps réel
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'fr-FR';
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
        
        let finalTranscript = '';
        let interimTranscript = '';
        
        recognition.onstart = () => {
          setIsListening(true);
          setMessage('🎤 Écoute active - Parlez maintenant !');
        };
        
        recognition.onresult = (event) => {
          interimTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
              setMessage('✅ Transcription: "' + transcript + '"');
            } else {
              interimTranscript += transcript;
            }
          }
          
          // Afficher la transcription en temps réel
          const fullText = finalTranscript + interimTranscript;
          if (fullText.trim()) {
            setTranscription(fullText.trim());
            setEditedText(fullText.trim());
          }
        };

        recognition.onend = () => {
          setIsListening(false);
          if (finalTranscript.trim()) {
            setTranscription(finalTranscript.trim());
            setEditedText(finalTranscript.trim());
            setMessage('✅ Transcription terminée: ' + finalTranscript.trim().length + ' caractères');
          } else {
            setMessage('⚠️ Aucune parole détectée - Essayez le Mode Texte');
          }
        };

        recognition.onerror = (event) => {
          console.error('Erreur reconnaissance vocale:', event.error);
          setIsListening(false);
          
          if (event.error === 'not-allowed' || event.error === 'permission-denied') {
            setMessage('❌ Microphone bloqué - Utilisez le Mode Texte');
          } else if (event.error === 'no-speech') {
            setMessage('⚠️ Aucune parole détectée - Parlez plus fort');
          } else if (event.error === 'audio-capture') {
            setMessage('❌ Erreur microphone - Vérifiez les permissions');
          } else {
            setMessage('⚠️ Erreur: ' + event.error + ' - Essayez le Mode Texte');
          }
        };

        try {
          recognition.start();
          recognitionRef.current = recognition;
        } catch (error) {
          console.error('Erreur démarrage reconnaissance:', error);
          setMessage('❌ Erreur démarrage reconnaissance vocale');
        }
      } else {
        setMessage('❌ Web Speech API non disponible - Utilisez le Mode Texte');
      }

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        
        // Arrêter le stream
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setMessage('🎤 Enregistrement démarré - Parlez maintenant...');
    } catch (error) {
      console.error('Erreur enregistrement:', error);
      if (error.name === 'NotAllowedError') {
        setMessage('❌ Permission refusée - Cliquez sur 🔒 dans la barre d\'adresse → Autoriser → F5');
      } else if (error.name === 'NotFoundError') {
        setMessage('❌ Aucun microphone détecté - Utilisez le Mode Texte');
      } else if (error.message === 'MediaDevices non supporté') {
        setMessage('❌ Navigateur non compatible - Utilisez Chrome ou Edge');
      } else {
        setMessage('❌ Erreur microphone - Utilisez le Mode Texte');
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      
      // Arrêter la reconnaissance vocale
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.error('Erreur arrêt reconnaissance:', error);
        }
      }
      
      // Arrêter l'analyseur audio
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      
      setIsRecording(false);
      setIsListening(false);
      setAudioLevel(0);
      setMessage('🔄 Finalisation de la transcription...');
    }
  };

  // Valider le texte
  const validateText = () => {
    setTranscription(editedText);
    setIsEditing(false);
    setMessage('✅ Texte validé');
  };

  // Annuler les modifications
  const cancelEdit = () => {
    setEditedText(transcription);
    setIsEditing(false);
  };

  // Générer l'email avec l'IA
  const generateEmail = async () => {
    if (!transcription) {
      setMessage('❌ Veuillez d\'abord enregistrer et transcrire votre message');
      return;
    }

    setIsGenerating(true);
    setMessage('🤖 Génération de l\'email avec Llama 3.2...');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/ia/generate-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          context: transcription,
          tone: 'professionnel'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setGeneratedEmail({
          subject: data.subject,
          body: data.body
        });
        setMessage('✅ Email généré avec succès');
      } else {
        setMessage('❌ Erreur: ' + (data.error || 'Échec de la génération'));
      }
    } catch (error) {
      console.error('Erreur génération:', error);
      setMessage('❌ Erreur de connexion au serveur');
    } finally {
      setIsGenerating(false);
    }
  };

  // Envoyer l'email
  const sendEmail = async () => {
    if (!generatedEmail || !recipient) {
      setMessage('❌ Veuillez générer un email et saisir un destinataire');
      return;
    }

    setIsSending(true);
    setMessage('📧 Envoi de l\'email...');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          to: recipient,
          subject: generatedEmail.subject,
          text: generatedEmail.body
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage('✅ Email envoyé avec succès !');
        setTimeout(() => {
          navigate('/history');
        }, 2000);
      } else {
        setMessage('❌ Erreur: ' + (data.error || 'Échec de l\'envoi'));
      }
    } catch (error) {
      console.error('Erreur envoi:', error);
      setMessage('❌ Erreur de connexion au serveur');
    } finally {
      setIsSending(false);
    }
  };

  // Réinitialiser tout
  const reset = () => {
    setAudioURL(null);
    setTranscription('');
    setEditedText('');
    setGeneratedEmail(null);
    setRecipient('');
    setMessage('');
    setIsEditing(false);
  };

  return (
    <div className={`min-h-screen p-8 transition-colors ${
      isDark 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-black' 
        : 'bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900'
    }`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/')}
              className="mr-4 p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                {manualMode ? '⌨️ Saisie Manuelle' : '🎤 Assistant Vocal'}
              </h1>
              <p className="text-gray-300">
                {manualMode ? 'Tapez → IA → Email' : 'Parlez → Transcription → IA → Email'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {/* Bouton bascule mode */}
            <button
              onClick={() => {
                setManualMode(!manualMode);
                reset();
              }}
              className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              {manualMode ? (
                <>
                  <Mic className="w-5 h-5" />
                  <span>Mode Vocal</span>
                </>
              ) : (
                <>
                  <Keyboard className="w-5 h-5" />
                  <span>Mode Texte</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Message d'état */}
        {message && (
          <div className="mb-6 p-4 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20">
            <p className="text-white text-center">{message}</p>
          </div>
        )}

        {/* Étape 1: Enregistrement OU Saisie manuelle */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 mb-6">
          <h2 className="text-2xl font-bold text-white mb-4">
            1️⃣ {manualMode ? 'Saisie de texte' : 'Enregistrement Vocal'}
          </h2>
          
          {manualMode ? (
            /* MODE MANUEL: Saisie de texte directe */
            <div className="space-y-4">
              <div className="bg-blue-500/20 border border-blue-400/50 rounded-lg p-4 mb-4">
                <p className="text-blue-200 text-sm">
                  💡 <strong>Microphone non disponible?</strong> Pas de problème! Tapez votre message ci-dessous.
                </p>
              </div>
              <textarea
                value={transcription}
                onChange={(e) => setTranscription(e.target.value)}
                className="w-full p-4 rounded-lg bg-white/10 text-white border border-white/20 focus:border-blue-400 focus:outline-none"
                rows="8"
                placeholder="Tapez votre message ici...\n\nExemple: Je dois confirmer la réunion de demain à 14h avec l'équipe marketing pour discuter du nouveau projet."
              />
              {transcription && (
                <div className="flex gap-3">
                  <button
                    onClick={() => setTranscription('')}
                    className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-2 rounded-lg hover:scale-105 transition-transform flex items-center gap-2"
                  >
                    <X className="w-5 h-5" />
                    Effacer
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* MODE VOCAL: Enregistrement audio */
            <div className="flex flex-col items-center gap-4">
              {!isRecording && !audioURL && (
                <>
                  <button
                    onClick={startRecording}
                    className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-8 py-4 rounded-xl hover:scale-105 transition-transform flex items-center gap-3"
                  >
                    <Mic className="w-8 h-8" />
                    <span className="text-xl font-semibold">Commencer l'enregistrement</span>
                  </button>
                  <div className="bg-red-500/20 border border-red-400/50 rounded-lg p-4 mt-4">
                    <p className="text-red-200 text-sm text-center mb-3">
                      🔒 <strong>Microphone bloqué?</strong>
                    </p>
                    <div className="text-red-200 text-xs space-y-1 mb-3">
                      <p>1. Cliquez sur l'icône 🔒 dans la barre d'adresse</p>
                      <p>2. Sélectionnez "Autoriser" pour le microphone</p>
                      <p>3. Rechargez la page (F5)</p>
                    </div>
                    <div className="text-center">
                      <button
                        onClick={() => window.location.reload()}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm mr-2"
                      >
                        🔄 Recharger
                      </button>
                      <button
                        onClick={() => navigate('/mic-test')}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                      >
                        🔍 Test Micro
                      </button>
                    </div>
                  </div>
                </>
              )}

            {isRecording && (
              <div className="text-center w-full">
                <div className="w-24 h-24 bg-red-500 rounded-full animate-pulse mb-4 mx-auto flex items-center justify-center">
                  <Mic className="w-12 h-12 text-white" />
                </div>
                
                {/* Indicateur de niveau audio */}
                <div className="mb-4">
                  <div className="text-white mb-2">
                    {isListening ? '🎤 Écoute en cours...' : '⏳ Initialisation...'}
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-green-400 to-blue-500 h-full transition-all duration-100"
                      style={{ width: `${Math.min(audioLevel * 2, 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-gray-300 text-sm mt-1">
                    Niveau: {audioLevel > 10 ? '🔊' : '🔉'} {audioLevel}/128
                  </div>
                  {audioLevel < 5 && (
                    <div className="text-yellow-400 text-sm mt-2">
                      ⚠️ Signal faible - Parlez plus fort ou rapprochez-vous du micro
                    </div>
                  )}
                </div>
                
                <button
                  onClick={stopRecording}
                  className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-8 py-3 rounded-xl hover:scale-105 transition-transform flex items-center gap-2 mx-auto"
                >
                  <Square className="w-6 h-6" />
                  Arrêter l'enregistrement
                </button>
              </div>
            )}

            {audioURL && (
              <div className="w-full">
                <audio src={audioURL} controls className="w-full mb-4" />
                <button
                  onClick={reset}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-2 rounded-lg hover:scale-105 transition-transform"
                >
                  Nouvel enregistrement
                </button>
              </div>
            )}
            </div>
          )}
        </div>

        {/* Étape 2: Transcription et édition */}
        {transcription && (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 mb-6">
            <h2 className="text-2xl font-bold text-white mb-4">
              2️⃣ Transcription
            </h2>
            
            {!isEditing ? (
              <div>
                <div className="bg-white/5 p-4 rounded-lg mb-4">
                  <p className="text-white text-lg">{transcription}</p>
                </div>
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-2 rounded-lg hover:scale-105 transition-transform flex items-center gap-2"
                >
                  <Edit2 className="w-5 h-5" />
                  Modifier le texte
                </button>
              </div>
            ) : (
              <div>
                <textarea
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  className="w-full p-4 rounded-lg bg-white/10 text-white border border-white/20 focus:border-blue-400 focus:outline-none mb-4"
                  rows="6"
                  placeholder="Modifiez votre texte ici..."
                />
                <div className="flex gap-3">
                  <button
                    onClick={validateText}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-2 rounded-lg hover:scale-105 transition-transform flex items-center gap-2"
                  >
                    <Check className="w-5 h-5" />
                    Valider
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-2 rounded-lg hover:scale-105 transition-transform flex items-center gap-2"
                  >
                    <X className="w-5 h-5" />
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Étape 3: Génération IA */}
        {transcription && !isEditing && (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 mb-6">
            <h2 className="text-2xl font-bold text-white mb-4">
              3️⃣ Génération Email (IA)
            </h2>
            
            {!generatedEmail ? (
              <button
                onClick={generateEmail}
                disabled={isGenerating}
                className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-8 py-3 rounded-xl hover:scale-105 transition-transform flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Wand2 className="w-6 h-6" />
                {isGenerating ? 'Génération en cours... (~8s)' : 'Générer l\'email avec Llama 3.2'}
              </button>
            ) : (
              <div className="space-y-4">
                <div className="bg-white/5 p-4 rounded-lg">
                  <p className="text-gray-300 text-sm mb-2">Sujet:</p>
                  <p className="text-white font-semibold mb-4">{generatedEmail.subject}</p>
                  
                  <p className="text-gray-300 text-sm mb-2">Corps de l'email:</p>
                  <p className="text-white whitespace-pre-wrap">{generatedEmail.body}</p>
                </div>
                <button
                  onClick={generateEmail}
                  disabled={isGenerating}
                  className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-6 py-2 rounded-lg hover:scale-105 transition-transform flex items-center gap-2"
                >
                  <Wand2 className="w-5 h-5" />
                  Régénérer
                </button>
              </div>
            )}
          </div>
        )}

        {/* Étape 4: Envoi */}
        {generatedEmail && (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">
              4️⃣ Envoi de l'Email
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-2">Destinataire:</label>
                <input
                  type="email"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="exemple@email.com"
                  className="w-full p-3 rounded-lg bg-white/10 text-white border border-white/20 focus:border-blue-400 focus:outline-none"
                />
              </div>
              
              <button
                onClick={sendEmail}
                disabled={isSending || !recipient}
                className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-3 rounded-xl hover:scale-105 transition-transform flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-6 h-6" />
                {isSending ? 'Envoi en cours...' : 'Envoyer l\'email'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
