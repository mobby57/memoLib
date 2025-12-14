import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  StopCircle,
  Volume2,
  Download,
  Copy,
  Trash2,
  Settings,
  CheckCircle,
  Loader,
  AlertCircle
} from 'lucide-react';
import io from 'socket.io-client';

export default function VoiceTranscription() {
  const [isRecording, setIsRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [realtimeText, setRealtimeText] = useState([]);
  const [audioDevices, setAudioDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [audioFile, setAudioFile] = useState(null);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(null);
  
  const socketRef = useRef(null);
  const transcriptEndRef = useRef(null);
  const startTimeRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    // Connexion WebSocket
    socketRef.current = io(window.location.origin, {
      transports: ['websocket', 'polling']
    });

    socketRef.current.on('connect', () => {
      setIsConnected(true);
      loadAudioDevices();
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
    });

    socketRef.current.on('transcription_update', (data) => {
      setRealtimeText(prev => [...prev, {
        text: data.text,
        timestamp: data.timestamp,
        id: Date.now()
      }]);
      setTranscript(prev => prev + ' ' + data.text);
    });

    socketRef.current.on('transcription_complete', (data) => {
      setTranscript(data.transcript);
      setAudioFile(data.audio_file);
      setDuration(data.duration);
      stopTimer();
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      stopTimer();
    };
  }, []);

  useEffect(() => {
    // Auto-scroll vers le bas
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [realtimeText, transcript]);

  const loadAudioDevices = async () => {
    try {
      const response = await fetch('/api/voice/devices', {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setAudioDevices(data.devices);
        if (data.devices.length > 0 && !selectedDevice) {
          setSelectedDevice(data.devices[0].index);
        }
      }
    } catch (error) {
      console.error('Erreur chargement périphériques:', error);
    }
  };

  const startRecording = async () => {
    try {
      setError(null);
      setTranscript('');
      setRealtimeText([]);
      setAudioFile(null);
      setDuration(0);

      const response = await fetch('/api/voice/start', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          device_index: selectedDevice 
        })
      });

      const data = await response.json();

      if (data.success) {
        setIsRecording(true);
        startTimer();
      } else {
        setError(data.error || 'Erreur démarrage enregistrement');
      }
    } catch (error) {
      console.error('Erreur démarrage:', error);
      setError('Impossible de démarrer l\'enregistrement. Vérifiez les permissions du microphone.');
    }
  };

  const stopRecording = async () => {
    try {
      const response = await fetch('/api/voice/stop', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (data.success) {
        setIsRecording(false);
        stopTimer();
      } else {
        setError(data.error || 'Erreur arrêt enregistrement');
      }
    } catch (error) {
      console.error('Erreur arrêt:', error);
      setError('Impossible d\'arrêter l\'enregistrement');
    }
  };

  const startTimer = () => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setDuration(elapsed);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const copyTranscript = () => {
    navigator.clipboard.writeText(transcript);
    alert('Texte copié dans le presse-papiers');
  };

  const clearTranscript = () => {
    if (confirm('Effacer la transcription ?')) {
      setTranscript('');
      setRealtimeText([]);
      setAudioFile(null);
      setDuration(0);
    }
  };

  const downloadAudio = () => {
    if (audioFile) {
      window.location.href = `/api/voice/download/${audioFile}`;
    }
  };

  const useInEmail = () => {
    if (transcript) {
      // Rediriger vers page d'envoi avec le texte
      const encodedText = encodeURIComponent(transcript);
      window.location.href = `/send?body=${encodedText}`;
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl">
            <Mic className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Transcription Vocale en Temps Réel</h1>
            <p className="text-gray-600">Parlez et voyez le texte apparaître instantanément</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Statut connexion */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
            isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            } ${isConnected ? 'animate-pulse' : ''}`} />
            <span className="text-sm font-medium">
              {isConnected ? 'Connecté' : 'Déconnecté'}
            </span>
          </div>

          {/* Bouton paramètres */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <Settings className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Message d'erreur avec aide */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 mb-1">Erreur d'accès au microphone</h3>
              <p className="text-red-700 text-sm mb-3">{error}</p>
              
              <div className="bg-white rounded-lg p-3 text-sm space-y-2">
                <p className="font-medium text-gray-900">🔧 Solutions rapides:</p>
                <ul className="space-y-1 text-gray-700 ml-4">
                  <li>✓ Vérifiez les permissions Windows (Paramètres → Confidentialité → Microphone)</li>
                  <li>✓ Autorisez l'accès au microphone dans votre navigateur</li>
                  <li>✓ Fermez les applications utilisant le micro (Discord, Teams, etc.)</li>
                  <li>✓ Vérifiez que votre microphone est branché et activé</li>
                </ul>
                <a 
                  href="/GUIDE_MICROPHONE.md" 
                  target="_blank"
                  className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1 mt-2"
                >
                  📖 Guide complet de dépannage →
                </a>
              </div>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600"
            >
              ✕
            </button>
          </div>
        </motion.div>
      )}

      {/* Paramètres */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-white rounded-lg border border-gray-200 p-4 mb-6"
          >
            <h3 className="font-semibold text-gray-900 mb-3">Périphérique Audio</h3>
            <select
              value={selectedDevice || ''}
              onChange={(e) => setSelectedDevice(parseInt(e.target.value))}
              disabled={isRecording}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
            >
              {audioDevices.map(device => (
                <option key={device.index} value={device.index}>
                  {device.name} ({device.channels} canaux, {device.sample_rate} Hz)
                </option>
              ))}
            </select>
            {audioDevices.length === 0 && (
              <p className="text-sm text-gray-500 mt-2">Aucun microphone détecté</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Erreur */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-800 font-medium">Erreur</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-600"
          >
            ✕
          </button>
        </motion.div>
      )}

      {/* Contrôles principaux */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex flex-col items-center gap-6">
          {/* Bouton Micro */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={!isConnected || audioDevices.length === 0}
            className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all shadow-lg ${
              isRecording 
                ? 'bg-gradient-to-br from-red-500 to-pink-600' 
                : 'bg-gradient-to-br from-blue-500 to-purple-600'
            } ${!isConnected || audioDevices.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isRecording ? (
              <>
                <StopCircle className="w-16 h-16 text-white" />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="absolute inset-0 rounded-full border-4 border-red-300"
                />
              </>
            ) : (
              <Mic className="w-16 h-16 text-white" />
            )}
          </motion.button>

          {/* Statut */}
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 mb-1">
              {isRecording ? 'Enregistrement en cours...' : 'Prêt à enregistrer'}
            </p>
            <p className="text-gray-600 flex items-center justify-center gap-2">
              <Volume2 className="w-4 h-4" />
              Durée: {formatDuration(duration)}
            </p>
          </div>

          {/* Actions */}
          {!isRecording && transcript && (
            <div className="flex gap-3">
              <button
                onClick={copyTranscript}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Copy className="w-4 h-4" />
                Copier
              </button>

              {audioFile && (
                <button
                  onClick={downloadAudio}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Download className="w-4 h-4" />
                  Télécharger Audio
                </button>
              )}

              <button
                onClick={useInEmail}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <CheckCircle className="w-4 h-4" />
                Utiliser dans Email
              </button>

              <button
                onClick={clearTranscript}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4" />
                Effacer
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Zone de transcription en temps réel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transcription complète */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-blue-600" />
            Transcription Complète
          </h3>
          
          <div className="bg-gray-50 rounded-lg p-4 min-h-[400px] max-h-[600px] overflow-y-auto">
            {transcript ? (
              <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                {transcript}
              </p>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  {isRecording ? (
                    <>
                      <Loader className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
                      <p className="text-gray-500">En attente de parole...</p>
                    </>
                  ) : (
                    <>
                      <MicOff className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500">Cliquez sur le micro pour commencer</p>
                    </>
                  )}
                </div>
              </div>
            )}
            <div ref={transcriptEndRef} />
          </div>

          {/* Statistiques */}
          {transcript && (
            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {transcript.split(' ').filter(w => w.length > 0).length}
                </p>
                <p className="text-xs text-gray-600">Mots</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {transcript.length}
                </p>
                <p className="text-xs text-gray-600">Caractères</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatDuration(duration)}
                </p>
                <p className="text-xs text-gray-600">Durée</p>
              </div>
            </div>
          )}
        </div>

        {/* Flux en temps réel */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Loader className={`w-5 h-5 ${isRecording ? 'text-red-600 animate-spin' : 'text-gray-400'}`} />
            Flux en Temps Réel
          </h3>
          
          <div className="space-y-2 min-h-[400px] max-h-[600px] overflow-y-auto">
            <AnimatePresence>
              {realtimeText.length === 0 && !isRecording && (
                <div className="h-full flex items-center justify-center">
                  <p className="text-gray-500 text-center">
                    Les phrases apparaîtront ici<br />au fur et à mesure
                  </p>
                </div>
              )}

              {realtimeText.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 border border-blue-200"
                >
                  <p className="text-gray-800">{item.text}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(item.timestamp).toLocaleTimeString('fr-FR')}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isRecording && realtimeText.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    <Mic className="w-12 h-12 text-red-600 mx-auto mb-3" />
                  </motion.div>
                  <p className="text-gray-600">En écoute...</p>
                  <p className="text-sm text-gray-500 mt-1">Commencez à parler</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Guide d'utilisation */}
      <div className="mt-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">💡 Comment utiliser</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="font-medium text-gray-900 mb-1">1. Cliquez sur le micro</p>
            <p className="text-gray-600">L'enregistrement démarre instantanément</p>
          </div>
          <div>
            <p className="font-medium text-gray-900 mb-1">2. Parlez normalement</p>
            <p className="text-gray-600">Le texte apparaît en temps réel (délai ~2s)</p>
          </div>
          <div>
            <p className="font-medium text-gray-900 mb-1">3. Cliquez sur stop</p>
            <p className="text-gray-600">Copiez, téléchargez ou utilisez dans un email</p>
          </div>
        </div>
      </div>
    </div>
  );
}
