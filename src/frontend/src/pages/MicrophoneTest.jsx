import { useState, useRef, useEffect } from 'react';
import { Mic, Volume2, AlertCircle, CheckCircle } from 'lucide-react';

export default function MicrophoneTest() {
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [logs, setLogs] = useState([]);
  const [micPermission, setMicPermission] = useState(null);
  
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    checkPermissions();
    listDevices();
  }, []);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { time: timestamp, message, type }]);
  };

  const checkPermissions = async () => {
    try {
      const result = await navigator.permissions.query({ name: 'microphone' });
      setMicPermission(result.state);
      addLog(`Permission micro: ${result.state}`, result.state === 'granted' ? 'success' : 'warning');
      
      result.onchange = () => {
        setMicPermission(result.state);
        addLog(`Permission changée: ${result.state}`, result.state === 'granted' ? 'success' : 'warning');
      };
    } catch (error) {
      addLog('Impossible de vérifier les permissions', 'error');
    }
  };

  const listDevices = async () => {
    try {
      const deviceList = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = deviceList.filter(device => device.kind === 'audioinput');
      setDevices(audioInputs);
      
      if (audioInputs.length > 0) {
        addLog(`${audioInputs.length} microphone(s) détecté(s)`, 'success');
        audioInputs.forEach((device, index) => {
          addLog(`  ${index + 1}. ${device.label || 'Microphone ' + (index + 1)} (${device.deviceId.substring(0, 8)}...)`, 'info');
        });
      } else {
        addLog('Aucun microphone détecté', 'error');
      }
    } catch (error) {
      addLog('Erreur énumération périphériques: ' + error.message, 'error');
    }
  };

  const startTest = async () => {
    try {
      addLog('Démarrage du test...', 'info');
      
      const constraints = {
        audio: selectedDevice ? { deviceId: { exact: selectedDevice } } : true
      };
      
      addLog('Demande d\'accès au microphone...', 'info');
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      addLog('✅ Accès au microphone autorisé', 'success');
      
      // Créer un contexte audio
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      addLog('Création de l\'analyseur audio...', 'info');
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      
      const microphone = audioContext.createMediaStreamSource(stream);
      microphone.connect(analyser);
      analyserRef.current = analyser;
      
      addLog('✅ Analyseur prêt - Parlez maintenant !', 'success');
      
      // Surveiller le niveau audio
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      let maxLevel = 0;
      let samplesCount = 0;
      
      const checkAudioLevel = () => {
        if (!isTestRunning) return;
        
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / bufferLength;
        const level = Math.round(average);
        
        setAudioLevel(level);
        
        if (level > maxLevel) {
          maxLevel = level;
        }
        
        samplesCount++;
        
        if (samplesCount % 50 === 0) {
          if (maxLevel > 20) {
            addLog(`Signal détecté! Niveau max: ${maxLevel}`, 'success');
          } else if (maxLevel > 0) {
            addLog(`Signal faible détecté: ${maxLevel}`, 'warning');
          } else {
            addLog('Aucun signal - Vérifiez que le micro n\'est pas muet', 'error');
          }
          maxLevel = 0;
        }
        
        requestAnimationFrame(checkAudioLevel);
      };
      
      setIsTestRunning(true);
      checkAudioLevel();
      
    } catch (error) {
      addLog('❌ ERREUR: ' + error.message, 'error');
      
      if (error.name === 'NotAllowedError') {
        addLog('Permission refusée - Cliquez sur l\'icône cadenas dans la barre d\'adresse', 'error');
      } else if (error.name === 'NotFoundError') {
        addLog('Aucun microphone trouvé - Branchez un micro', 'error');
      } else if (error.name === 'NotReadableError') {
        addLog('Microphone déjà utilisé par une autre application', 'error');
      }
    }
  };

  const stopTest = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      addLog('Test arrêté', 'info');
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setIsTestRunning(false);
    setAudioLevel(0);
  };

  const getLogColor = (type) => {
    switch (type) {
      case 'success': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">
          🔬 Diagnostic Microphone
        </h1>

        {/* État des permissions */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">État du système</h2>
          <div className="flex items-center gap-3 mb-3">
            {micPermission === 'granted' ? (
              <>
                <CheckCircle className="w-6 h-6 text-green-400" />
                <span className="text-green-400">Permission microphone accordée</span>
              </>
            ) : micPermission === 'denied' ? (
              <>
                <AlertCircle className="w-6 h-6 text-red-400" />
                <span className="text-red-400 font-bold">❌ Permission microphone REFUSÉE</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-6 h-6 text-yellow-400" />
                <span className="text-yellow-400">Permission microphone non définie</span>
              </>
            )}
          </div>
          <div className="text-gray-300 mb-3">
            {devices.length} microphone(s) détecté(s)
          </div>
          
          {/* Instructions si permission refusée */}
          {micPermission === 'denied' && (
            <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
              <h3 className="text-red-400 font-bold mb-3 text-lg">🔒 Comment autoriser le microphone :</h3>
              <ol className="text-white space-y-2 list-decimal list-inside">
                <li>Cliquez sur l'icône <strong>🔒 cadenas</strong> ou <strong>ⓘ info</strong> dans la barre d'adresse (à gauche de l'URL)</li>
                <li>Cherchez "Microphone" dans le menu</li>
                <li>Changez "Bloquer" en <strong>"Autoriser"</strong></li>
                <li>Rechargez la page (F5)</li>
              </ol>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors"
              >
                🔄 Recharger la page
              </button>
            </div>
          )}
        </div>

        {/* Sélection du microphone */}
        {devices.length > 0 && (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 mb-6">
            <h2 className="text-xl font-bold text-white mb-4">Sélectionner un microphone</h2>
            <select
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className="w-full p-3 rounded-lg bg-white/10 text-white border border-white/20 focus:border-blue-400 focus:outline-none"
            >
              <option value="">Microphone par défaut</option>
              {devices.map((device, index) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Microphone ${index + 1}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Contrôles de test */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Test audio</h2>
          
          {!isTestRunning ? (
            <button
              onClick={startTest}
              className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-4 rounded-xl hover:scale-105 transition-transform flex items-center gap-3 mx-auto"
            >
              <Mic className="w-6 h-6" />
              Démarrer le test
            </button>
          ) : (
            <>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white">Niveau audio:</span>
                  <span className="text-white font-mono">{audioLevel} / 128</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-8 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-100 ${
                      audioLevel > 30 ? 'bg-gradient-to-r from-green-400 to-blue-500' :
                      audioLevel > 10 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                      'bg-gradient-to-r from-red-400 to-pink-500'
                    }`}
                    style={{ width: `${Math.min(audioLevel * 2, 100)}%` }}
                  ></div>
                </div>
                <div className="text-center mt-3">
                  {audioLevel > 30 && <span className="text-green-400">✅ Signal excellent</span>}
                  {audioLevel > 10 && audioLevel <= 30 && <span className="text-yellow-400">⚠️ Signal faible - Parlez plus fort</span>}
                  {audioLevel <= 10 && <span className="text-red-400">❌ Aucun signal - Vérifiez le micro</span>}
                </div>
              </div>
              
              <button
                onClick={stopTest}
                className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-8 py-4 rounded-xl hover:scale-105 transition-transform flex items-center gap-3 mx-auto"
              >
                <Volume2 className="w-6 h-6" />
                Arrêter le test
              </button>
            </>
          )}
        </div>

        {/* Logs */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <h2 className="text-xl font-bold text-white mb-4">Journal de diagnostic</h2>
          <div className="bg-black/30 rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm">
            {logs.map((log, index) => (
              <div key={index} className={`mb-1 ${getLogColor(log.type)}`}>
                <span className="text-gray-500">[{log.time}]</span> {log.message}
              </div>
            ))}
            {logs.length === 0 && (
              <div className="text-gray-500 text-center mt-20">
                Aucun log pour le moment
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
