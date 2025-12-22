import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Square, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';

export default function MicTestPage() {
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [message, setMessage] = useState('');
  const [micStatus, setMicStatus] = useState('unknown'); // 'unknown', 'working', 'blocked', 'error'
  
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);

  const testMicrophone = async () => {
    try {
      setMessage('🔍 Test du microphone...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      
      microphone.connect(analyser);
      analyser.fftSize = 256;
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      
      setIsRecording(true);
      setMicStatus('working');
      setMessage('✅ Microphone détecté ! Parlez pour voir le niveau audio.');
      
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
      
    } catch (error) {
      console.error('Erreur microphone:', error);
      setMicStatus('error');
      
      if (error.name === 'NotAllowedError') {
        setMessage('❌ Permission refusée - Autorisez l\'accès au microphone dans votre navigateur');
      } else if (error.name === 'NotFoundError') {
        setMessage('❌ Aucun microphone détecté - Vérifiez qu\'un micro est branché');
      } else {
        setMessage('❌ Erreur: ' + error.message);
      }
    }
  };

  const stopTest = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    
    setIsRecording(false);
    setAudioLevel(0);
    setMessage('Test arrêté');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate('/voice')}
            className="mr-4 p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">🎤 Test Microphone</h1>
            <p className="text-gray-300">Vérifiez si votre micro fonctionne</p>
          </div>
        </div>

        {/* Message d'état */}
        {message && (
          <div className="mb-6 p-4 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20">
            <p className="text-white text-center">{message}</p>
          </div>
        )}

        {/* Test du microphone */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 mb-6">
          <div className="text-center">
            {!isRecording ? (
              <button
                onClick={testMicrophone}
                className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-4 rounded-xl hover:scale-105 transition-transform flex items-center gap-3 mx-auto"
              >
                <Mic className="w-8 h-8" />
                <span className="text-xl font-semibold">Tester le Microphone</span>
              </button>
            ) : (
              <div>
                <div className="w-24 h-24 bg-green-500 rounded-full animate-pulse mb-4 mx-auto flex items-center justify-center">
                  <Mic className="w-12 h-12 text-white" />
                </div>
                
                {/* Indicateur de niveau audio */}
                <div className="mb-6">
                  <div className="text-white mb-2 text-lg">
                    Niveau audio: {audioLevel}/128
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-6 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-green-400 to-blue-500 h-full transition-all duration-100"
                      style={{ width: `${Math.min(audioLevel * 2, 100)}%` }}
                    ></div>
                  </div>
                  
                  <div className="mt-4 text-center">
                    {audioLevel > 20 ? (
                      <div className="text-green-400 text-lg">
                        🔊 Excellent signal ! Votre micro fonctionne parfaitement.
                      </div>
                    ) : audioLevel > 5 ? (
                      <div className="text-yellow-400 text-lg">
                        🔉 Signal correct - Parlez plus fort pour un meilleur résultat.
                      </div>
                    ) : (
                      <div className="text-red-400 text-lg">
                        🔇 Signal faible - Parlez plus fort ou rapprochez-vous du micro.
                      </div>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={stopTest}
                  className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-3 rounded-xl hover:scale-105 transition-transform flex items-center gap-2 mx-auto"
                >
                  <Square className="w-6 h-6" />
                  Arrêter le test
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Résultat du test */}
        {micStatus !== 'unknown' && (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">Résultat du test</h3>
            
            {micStatus === 'working' ? (
              <div className="flex items-center gap-3 text-green-400 mb-4">
                <CheckCircle className="w-6 h-6" />
                <span className="text-lg">Microphone fonctionnel !</span>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-red-400 mb-4">
                <XCircle className="w-6 h-6" />
                <span className="text-lg">Problème détecté</span>
              </div>
            )}

            <div className="space-y-2 text-gray-300 mb-6">
              <p>• Navigateur: {navigator.userAgent.includes('Chrome') ? 'Chrome ✅' : navigator.userAgent.includes('Edge') ? 'Edge ✅' : 'Autre (peut causer des problèmes)'}</p>
              <p>• Web Speech API: {window.SpeechRecognition || window.webkitSpeechRecognition ? 'Disponible ✅' : 'Non disponible ❌'}</p>
              <p>• MediaDevices: {navigator.mediaDevices ? 'Disponible ✅' : 'Non disponible ❌'}</p>
            </div>

            {micStatus === 'working' ? (
              <button
                onClick={() => navigate('/voice')}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-3 rounded-xl hover:scale-105 transition-transform"
              >
                Utiliser l'Assistant Vocal
              </button>
            ) : (
              <button
                onClick={() => navigate('/voice')}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-3 rounded-xl hover:scale-105 transition-transform"
              >
                Utiliser le Mode Texte
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}