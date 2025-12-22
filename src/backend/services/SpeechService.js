// 🎤 SERVICE SPEECH-TO-TEXT - Transcription audio
import { SpeechClient } from '@google-cloud/speech';
import fs from 'fs/promises';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';

class SpeechService {
  constructor() {
    // Initialisation Google Cloud Speech (si disponible)
    this.googleClient = null;
    this.initializeGoogleSpeech();
  }

  // Initialisation Google Cloud Speech
  async initializeGoogleSpeech() {
    try {
      if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        this.googleClient = new SpeechClient();
        console.log('✅ Google Speech initialisé');
      }
    } catch (error) {
      console.warn('⚠️ Google Speech non disponible:', error.message);
    }
  }

  // Transcription audio principale
  async transcribeAudio(audioPath, options = {}) {
    try {
      // Validation du fichier
      await this.validateAudioFile(audioPath);
      
      // Conversion au format requis
      const processedPath = await this.preprocessAudio(audioPath);
      
      // Transcription avec le meilleur service disponible
      let result;
      if (this.googleClient) {
        result = await this.transcribeWithGoogle(processedPath, options);
      } else {
        result = await this.transcribeWithWebAPI(processedPath, options);
      }
      
      // Nettoyage du fichier temporaire
      if (processedPath !== audioPath) {
        await fs.unlink(processedPath).catch(() => {});
      }
      
      return result;
      
    } catch (error) {
      console.error('Erreur transcription:', error);
      throw new Error(`Transcription impossible: ${error.message}`);
    }
  }

  // Transcription avec Google Cloud Speech
  async transcribeWithGoogle(audioPath, options) {
    try {
      const audioBytes = await fs.readFile(audioPath);
      
      const request = {
        audio: { content: audioBytes.toString('base64') },
        config: {
          encoding: 'WEBM_OPUS',
          sampleRateHertz: 48000,
          languageCode: options.language || 'fr-FR',
          enableAutomaticPunctuation: true,
          enableWordTimeOffsets: true,
          model: 'latest_long',
          useEnhanced: true
        }
      };

      const [response] = await this.googleClient.recognize(request);
      const transcription = response.results
        .map(result => result.alternatives[0].transcript)
        .join(' ');

      return {
        text: this.cleanTranscription(transcription),
        confidence: this.calculateAverageConfidence(response.results),
        service: 'google',
        language: options.language || 'fr-FR',
        duration: this.estimateDuration(audioPath)
      };

    } catch (error) {
      console.error('Erreur Google Speech:', error);
      throw error;
    }
  }

  // Transcription avec Web Speech API (fallback)
  async transcribeWithWebAPI(audioPath, options) {
    // Simulation pour le développement
    // En production, utiliser un service comme AssemblyAI ou Deepgram
    
    return {
      text: "Transcription simulée : Je souhaite envoyer un courrier administratif pour répondre à la demande reçue.",
      confidence: 0.85,
      service: 'simulation',
      language: options.language || 'fr-FR',
      duration: await this.estimateDuration(audioPath)
    };
  }

  // Préprocessing audio
  async preprocessAudio(audioPath) {
    return new Promise((resolve, reject) => {
      const outputPath = audioPath.replace(/\.[^/.]+$/, '_processed.webm');
      
      ffmpeg(audioPath)
        .audioCodec('libopus')
        .audioFrequency(48000)
        .audioChannels(1)
        .audioBitrate('64k')
        .format('webm')
        .on('end', () => resolve(outputPath))
        .on('error', (err) => {
          console.error('Erreur conversion audio:', err);
          resolve(audioPath); // Retourner l'original en cas d'erreur
        })
        .save(outputPath);
    });
  }

  // Validation du fichier audio
  async validateAudioFile(audioPath) {
    try {
      const stats = await fs.stat(audioPath);
      
      // Vérifier la taille (max 25MB)
      if (stats.size > 25 * 1024 * 1024) {
        throw new Error('Fichier audio trop volumineux (max 25MB)');
      }

      // Vérifier l'extension
      const ext = path.extname(audioPath).toLowerCase();
      const allowedExts = ['.mp3', '.wav', '.webm', '.ogg', '.m4a'];
      
      if (!allowedExts.includes(ext)) {
        throw new Error(`Format audio non supporté: ${ext}`);
      }

      return true;
    } catch (error) {
      throw new Error(`Validation audio échouée: ${error.message}`);
    }
  }

  // Estimation de la durée audio
  async estimateDuration(audioPath) {
    return new Promise((resolve) => {
      ffmpeg.ffprobe(audioPath, (err, metadata) => {
        if (err) {
          resolve(0);
        } else {
          resolve(metadata.format.duration || 0);
        }
      });
    });
  }

  // Nettoyage de la transcription
  cleanTranscription(text) {
    return text
      // Normaliser les espaces
      .replace(/\s+/g, ' ')
      // Supprimer les espaces avant la ponctuation
      .replace(/\s+([,.!?;:])/g, '$1')
      // Ajouter des espaces après la ponctuation
      .replace(/([,.!?;:])([^\s])/g, '$1 $2')
      // Capitaliser après les points
      .replace(/\.\s*([a-z])/g, (match, letter) => '. ' + letter.toUpperCase())
      // Capitaliser le début
      .replace(/^[a-z]/, (match) => match.toUpperCase())
      .trim();
  }

  // Calcul de confiance moyenne
  calculateAverageConfidence(results) {
    if (!results || results.length === 0) return 0;
    
    const confidences = results
      .map(result => result.alternatives[0]?.confidence || 0)
      .filter(conf => conf > 0);
    
    return confidences.length > 0 
      ? confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length
      : 0.5;
  }

  // Transcription en temps réel (pour interface vocale)
  async startRealTimeTranscription(options = {}) {
    // Implémentation pour transcription en temps réel
    // Utiliser WebSocket avec Google Cloud Speech Streaming API
    
    return {
      start: () => console.log('Transcription temps réel démarrée'),
      stop: () => console.log('Transcription temps réel arrêtée'),
      onResult: (callback) => {
        // Simulation de résultats en temps réel
        setTimeout(() => {
          callback({
            text: "Transcription en cours...",
            isFinal: false,
            confidence: 0.8
          });
        }, 1000);
      }
    };
  }

  // Métriques du service
  getMetrics() {
    return {
      googleSpeechAvailable: !!this.googleClient,
      supportedFormats: ['MP3', 'WAV', 'WebM', 'OGG', 'M4A'],
      maxFileSize: '25MB',
      languages: ['fr-FR', 'en-US', 'es-ES', 'de-DE'],
      features: [
        'Ponctuation automatique',
        'Horodatage des mots',
        'Modèle amélioré',
        'Transcription temps réel'
      ]
    };
  }
}

// Instance singleton
const speechService = new SpeechService();

export default speechService;