import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Hook personnalisé pour la dictée vocale avec transcription en temps réel
 * Supporte Web Speech API avec fallback vers reconnaissance serveur
 */
export function useVoiceInput(options = {}) {
  const {
    language = 'fr-FR',
    continuous = true,
    interimResults = true,
    onTranscript = null,
    onError = null
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState(null);
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Vérifier le support de Web Speech API
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);

    if (SpeechRecognition && !recognitionRef.current) {
      const recognition = new SpeechRecognition();
      recognition.lang = language;
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPart = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            final += transcriptPart + ' ';
          } else {
            interim += transcriptPart;
          }
        }

        if (final) {
          setTranscript(prev => {
            const newTranscript = prev + final;
            if (onTranscript) onTranscript(newTranscript);
            return newTranscript;
          });
          setInterimTranscript('');
        }

        if (interim) {
          setInterimTranscript(interim);
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        const errorMsg = getErrorMessage(event.error);
        setError(errorMsg);
        if (onError) onError(errorMsg);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [language, continuous, interimResults, onTranscript, onError]);

  // Démarrer l'enregistrement
  const startListening = useCallback(async () => {
    if (!isSupported) {
      const errorMsg = 'La reconnaissance vocale n\'est pas supportée par votre navigateur';
      setError(errorMsg);
      if (onError) onError(errorMsg);
      return;
    }

    try {
      setError(null);
      
      // Demander permission microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Démarrer reconnaissance vocale
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }

      // Optionnel: Enregistrer audio pour backup
      if (typeof window !== 'undefined' && window.MediaRecorder) {
        const mediaRecorder = new window.MediaRecorder(stream);
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.start(1000); // Chunk toutes les secondes
        mediaRecorderRef.current = mediaRecorder;
      }
    } catch (err) {
      console.error('Error starting voice input:', err);
      const errorMsg = err.name === 'NotAllowedError' 
        ? 'Permission microphone refusée. Veuillez autoriser l\'accès dans les paramètres.' 
        : 'Erreur lors du démarrage du microphone';
      setError(errorMsg);
      if (onError) onError(errorMsg);
    }
  }, [isSupported, onError]);

  // Arrêter l'enregistrement
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      
      // Arrêter les tracks audio
      const stream = mediaRecorderRef.current.stream;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    }

    setIsListening(false);
    setInterimTranscript('');
  }, []);

  // Réinitialiser
  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setError(null);
  }, []);

  // Obtenir l'audio enregistré (pour envoi serveur si besoin)
  const getAudioBlob = useCallback(() => {
    if (audioChunksRef.current.length === 0) return null;
    return new Blob(audioChunksRef.current, { type: 'audio/webm' });
  }, []);

  return {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    error,
    startListening,
    stopListening,
    resetTranscript,
    getAudioBlob,
    // Utilitaires
    hasTranscript: transcript.length > 0,
    fullTranscript: transcript + (interimTranscript ? ' ' + interimTranscript : '')
  };
}

// Messages d'erreur utilisateur
function getErrorMessage(errorCode) {
  const messages = {
    'no-speech': 'Aucune voix détectée. Parlez plus fort ou vérifiez votre microphone.',
    'audio-capture': 'Impossible d\'accéder au microphone. Vérifiez les permissions.',
    'not-allowed': 'Permission microphone refusée. Autorisez l\'accès dans les paramètres.',
    'network': 'Erreur réseau. Vérifiez votre connexion internet.',
    'aborted': 'Reconnaissance vocale interrompue.',
    'language-not-supported': 'Langue non supportée par le navigateur.'
  };

  return messages[errorCode] || 'Erreur de reconnaissance vocale. Réessayez.';
}

export default useVoiceInput;
