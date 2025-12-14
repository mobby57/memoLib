import { useState, useEffect } from 'react';

export default function VoiceTranscription() {
  const [isRecording, setIsRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    // Simuler la connexion
    setIsConnected(true);
  }, []);

  const startRecording = async () => {
    try {
      const response = await fetch('/api/voice/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (data.success) {
        setIsRecording(true);
      }
    } catch (error) {
      console.error('Erreur démarrage:', error);
    }
  };

  const stopRecording = async () => {
    try {
      const response = await fetch('/api/voice/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (data.success) {
        setIsRecording(false);
      }
    } catch (error) {
      console.error('Erreur arrêt:', error);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
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
        </div>
      </div>

      {/* Contrôles principaux */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex flex-col items-center gap-6">
          {/* Bouton Micro */}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={!isConnected}
            className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all shadow-lg ${
              isRecording 
                ? 'bg-gradient-to-br from-red-500 to-pink-600' 
                : 'bg-gradient-to-br from-blue-500 to-purple-600'
            } ${!isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isRecording ? (
              <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
              </svg>
            )}
          </button>

          {/* Statut */}
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 mb-1">
              {isRecording ? 'Enregistrement en cours...' : 'Prêt à enregistrer'}
            </p>
            <p className="text-gray-600 flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 0A9.972 9.972 0 0119 12a9.972 9.972 0 01-1.929 5.657 1 1 0 11-1.414-1.414A7.971 7.971 0 0017 12c0-2.21-.895-4.21-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 12a5.984 5.984 0 01-.757 2.828 1 1 0 11-1.415-1.414A3.984 3.984 0 0013 12a3.983 3.983 0 00-.172-1.414 1 1 0 010-1.415z" clipRule="evenodd" />
              </svg>
              Durée: {formatDuration(duration)}
            </p>
          </div>
        </div>
      </div>

      {/* Zone de transcription */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transcription complète */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217z" clipRule="evenodd" />
            </svg>
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
                      <svg className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <p className="text-gray-500">En attente de parole...</p>
                    </>
                  ) : (
                    <>
                      <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                      </svg>
                      <p className="text-gray-500">Cliquez sur le micro pour commencer</p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Flux en temps réel */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className={`w-5 h-5 ${isRecording ? 'text-red-600 animate-spin' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Flux en Temps Réel
          </h3>
          
          <div className="space-y-2 min-h-[400px] max-h-[600px] overflow-y-auto">
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-500 text-center">
                Les phrases apparaîtront ici<br />au fur et à mesure
              </p>
            </div>
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