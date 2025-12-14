import React, { useState, useRef } from 'react';
import { voiceService, emailService } from '../services/api';

export default function VoiceInterface() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [generatedEmail, setGeneratedEmail] = useState('');
  const [recipient, setRecipient] = useState('');
  const mediaRecorderRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      const chunks = [];
      mediaRecorderRef.current.ondataavailable = (e) => chunks.push(e.data);
      
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        await transcribeAudio(audioBlob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Erreur microphone:', error);
      alert('Microphone non accessible');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob) => {
    try {
      // Simulation - remplacer par vraie transcription
      const result = await voiceService.transcribe({ audio: 'base64data' });
      setTranscript(result.text);
      
      // Auto-génération email depuis transcription
      generateEmailFromTranscript(result.text);
    } catch (error) {
      console.error('Erreur transcription:', error);
    }
  };

  const generateEmailFromTranscript = (text) => {
    // Génération simple basée sur la transcription
    const email = `Bonjour,

${text}

Cordialement,`;
    setGeneratedEmail(email);
  };

  const speakText = async (text) => {
    try {
      await voiceService.speak(text);
    } catch (error) {
      // Fallback synthèse vocale navigateur
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fr-FR';
      speechSynthesis.speak(utterance);
    }
  };

  const sendVoiceEmail = async () => {
    if (!recipient || !generatedEmail) {
      await speakText('Veuillez indiquer un destinataire et enregistrer un message');
      return;
    }

    try {
      const result = await emailService.send({
        to: recipient,
        subject: 'Message vocal',
        body: generatedEmail
      });

      if (result.success) {
        await speakText('Email envoyé avec succès');
        setTranscript('');
        setGeneratedEmail('');
        setRecipient('');
      } else {
        await speakText('Erreur lors de l\'envoi');
      }
    } catch (error) {
      await speakText('Erreur technique');
    }
  };

  return (
    <div className="voice-interface">
      <h1>🎤 Interface Vocale</h1>

      {/* Contrôles d'enregistrement */}
      <div className="recording-controls">
        <button 
          className={`record-button ${isRecording ? 'recording' : ''}`}
          onClick={isRecording ? stopRecording : startRecording}
        >
          {isRecording ? '⏹️ Arrêter' : '🎤 Enregistrer'}
        </button>
        
        {isRecording && (
          <div className="recording-indicator">
            🔴 Enregistrement en cours...
          </div>
        )}
      </div>

      {/* Transcription */}
      {transcript && (
        <div className="transcript-section">
          <h3>📝 Transcription</h3>
          <div className="transcript-text">{transcript}</div>
          <button onClick={() => speakText(transcript)}>
            🔊 Réécouter
          </button>
        </div>
      )}

      {/* Email généré */}
      {generatedEmail && (
        <div className="generated-email">
          <h3>📧 Email généré</h3>
          <textarea 
            value={generatedEmail}
            onChange={(e) => setGeneratedEmail(e.target.value)}
            rows={8}
          />
          <button onClick={() => speakText(generatedEmail)}>
            🔊 Écouter l'email
          </button>
        </div>
      )}

      {/* Envoi */}
      <div className="send-section">
        <input
          type="email"
          placeholder="Destinataire"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
        />
        <button onClick={sendVoiceEmail}>
          📤 Envoyer par email
        </button>
      </div>

      {/* Instructions vocales */}
      <div className="voice-instructions">
        <button onClick={() => speakText('Interface vocale prête. Cliquez sur enregistrer pour commencer.')}>
          🔊 Instructions
        </button>
      </div>
    </div>
  );
}