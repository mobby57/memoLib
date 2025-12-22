import { useState, useEffect } from 'react';

class EmotionalAI {
  constructor() {
    this.emotions = ['joy', 'sadness', 'anger', 'fear', 'surprise', 'disgust', 'neutral'];
    this.culturalAdaptations = {
      'FR': { formality: 0.8, directness: 0.6 },
      'US': { formality: 0.5, directness: 0.9 },
      'JP': { formality: 0.9, directness: 0.3 },
      'DE': { formality: 0.7, directness: 0.8 }
    };
  }

  async detectMood(text, voice = null, facial = null) {
    // Analyse textuelle
    const textEmotion = this.analyzeText(text);
    
    // Analyse vocale si disponible
    const voiceEmotion = voice ? this.analyzeVoice(voice) : null;
    
    // Analyse faciale si disponible
    const facialEmotion = facial ? this.analyzeFacial(facial) : null;
    
    // Fusion des analyses
    const finalEmotion = this.fuseEmotions(textEmotion, voiceEmotion, facialEmotion);
    
    return {
      emotion: finalEmotion.emotion,
      confidence: finalEmotion.confidence,
      empathyScore: this.calculateEmpathyScore(finalEmotion),
      culturalContext: this.getCulturalContext()
    };
  }

  analyzeText(text) {
    const emotionKeywords = {
      joy: ['heureux', 'content', 'ravi', 'excellent', 'parfait', 'génial'],
      sadness: ['triste', 'déçu', 'malheureux', 'déprimé', 'chagrin'],
      anger: ['colère', 'furieux', 'énervé', 'irrité', 'fâché'],
      fear: ['peur', 'anxieux', 'inquiet', 'nerveux', 'stressé'],
      surprise: ['surpris', 'étonné', 'incroyable', 'wow', 'impressionnant'],
      neutral: ['ok', 'bien', 'normal', 'standard', 'habituel']
    };

    let scores = {};
    Object.keys(emotionKeywords).forEach(emotion => {
      scores[emotion] = 0;
      emotionKeywords[emotion].forEach(keyword => {
        if (text.toLowerCase().includes(keyword)) {
          scores[emotion] += 1;
        }
      });
    });

    const maxEmotion = Object.keys(scores).reduce((a, b) => 
      scores[a] > scores[b] ? a : b
    );

    return {
      emotion: maxEmotion,
      confidence: Math.min(scores[maxEmotion] * 0.3 + 0.4, 0.95)
    };
  }

  analyzeVoice(audioData) {
    // Simulation d'analyse vocale
    const pitch = Math.random() * 100;
    const tempo = Math.random() * 100;
    
    let emotion = 'neutral';
    let confidence = 0.7;

    if (pitch > 70) emotion = 'joy';
    else if (pitch < 30) emotion = 'sadness';
    else if (tempo > 80) emotion = 'anger';
    else if (tempo < 20) emotion = 'fear';

    return { emotion, confidence };
  }

  analyzeFacial(imageData) {
    // Simulation d'analyse faciale
    return {
      emotion: this.emotions[Math.floor(Math.random() * this.emotions.length)],
      confidence: 0.8 + Math.random() * 0.15
    };
  }

  fuseEmotions(text, voice, facial) {
    const emotions = [text, voice, facial].filter(Boolean);
    if (emotions.length === 0) return { emotion: 'neutral', confidence: 0.5 };

    // Pondération : texte 50%, voix 30%, facial 20%
    const weights = [0.5, 0.3, 0.2];
    let finalEmotion = emotions[0].emotion;
    let finalConfidence = 0;

    emotions.forEach((emotion, index) => {
      if (emotion) {
        finalConfidence += emotion.confidence * (weights[index] || 0.1);
      }
    });

    return {
      emotion: finalEmotion,
      confidence: Math.min(finalConfidence, 0.95)
    };
  }

  calculateEmpathyScore(emotion) {
    const empathyMap = {
      joy: 0.9,
      sadness: 0.8,
      anger: 0.6,
      fear: 0.7,
      surprise: 0.8,
      disgust: 0.5,
      neutral: 0.7
    };
    return empathyMap[emotion.emotion] || 0.7;
  }

  getCulturalContext() {
    const userLang = navigator.language.split('-')[0].toUpperCase();
    return this.culturalAdaptations[userLang] || this.culturalAdaptations['US'];
  }

  adaptTone(content, targetEmotion, culturalContext) {
    const adaptations = {
      joy: {
        prefix: "C'est formidable ! ",
        suffix: " 😊",
        tone: "enthusiastic"
      },
      sadness: {
        prefix: "Je comprends votre situation. ",
        suffix: " Nous sommes là pour vous aider.",
        tone: "empathetic"
      },
      anger: {
        prefix: "Je comprends votre frustration. ",
        suffix: " Permettez-moi de résoudre cela rapidement.",
        tone: "calming"
      },
      neutral: {
        prefix: "",
        suffix: "",
        tone: "professional"
      }
    };

    const adaptation = adaptations[targetEmotion] || adaptations.neutral;
    
    return {
      content: adaptation.prefix + content + adaptation.suffix,
      tone: adaptation.tone,
      culturalAdaptation: culturalContext
    };
  }
}

// Hook React pour utiliser l'IA émotionnelle
export const useEmotionalAI = () => {
  const [emotionalAI] = useState(() => new EmotionalAI());
  const [currentEmotion, setCurrentEmotion] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeEmotion = async (text, voice = null, facial = null) => {
    setIsAnalyzing(true);
    try {
      const result = await emotionalAI.detectMood(text, voice, facial);
      setCurrentEmotion(result);
      return result;
    } catch (error) {
      console.error('Erreur analyse émotionnelle:', error);
      return { emotion: 'neutral', confidence: 0.5 };
    } finally {
      setIsAnalyzing(false);
    }
  };

  const adaptContent = (content, targetEmotion) => {
    const culturalContext = emotionalAI.getCulturalContext();
    return emotionalAI.adaptTone(content, targetEmotion, culturalContext);
  };

  return {
    analyzeEmotion,
    adaptContent,
    currentEmotion,
    isAnalyzing,
    emotionalAI
  };
};

export default EmotionalAI;