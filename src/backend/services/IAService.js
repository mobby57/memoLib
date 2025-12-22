// 🤖 SERVICE IA PRODUCTION - IAPosteManager v3.0
import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';

class IAService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      organization: process.env.OPENAI_ORG_ID
    });
    
    this.systemPrompt = `Tu es un assistant administratif expert français spécialisé dans l'analyse de courriers officiels.

MISSION: Analyser des documents administratifs et générer 3 réponses adaptées.

RÈGLES STRICTES:
- Français impeccable uniquement
- Jamais d'informations inventées
- Toujours indiquer le niveau de certitude
- Format JSON structuré obligatoire
- Ton professionnel et respectueux

ANALYSE REQUISE:
1. Type de document (courrier_officiel, facture, convocation, réclamation)
2. Expéditeur (nom, organisme, service)
3. Objet principal et demandes
4. Urgence (1-5) et délais
5. Ton détecté

GÉNÉRATION REQUISE:
3 versions de réponse:
- COURTE (50-150 mots): Directe, essentiel
- STANDARD (150-300 mots): Équilibrée, professionnelle  
- DÉTAILLÉE (300-500 mots): Complète, argumentée

Accessibilité: Texte simple, phrases courtes, structure claire.`;
  }

  // Analyse complète d'un document
  async analyzeDocument(inputs) {
    const startTime = Date.now();
    
    try {
      // Consolidation des entrées
      const content = this.consolidateInputs(inputs);
      
      // Analyse principale
      const analysis = await this.performAnalysis(content);
      
      // Génération des réponses
      const responses = await this.generateResponses(analysis);
      
      return {
        id: `analysis_${Date.now()}`,
        timestamp: new Date().toISOString(),
        inputs: {
          hasDocument: !!inputs.document,
          hasAudio: !!inputs.audio,
          hasText: !!inputs.text
        },
        analysis,
        responses,
        confidence: this.calculateConfidence(analysis, responses),
        processingTime: Date.now() - startTime
      };
      
    } catch (error) {
      console.error('Erreur analyse IA:', error);
      throw new Error(`Analyse impossible: ${error.message}`);
    }
  }

  // Consolidation des entrées multiples
  consolidateInputs(inputs) {
    const parts = [];
    
    if (inputs.document) {
      parts.push(`DOCUMENT: ${inputs.document}`);
    }
    
    if (inputs.audio) {
      parts.push(`AUDIO TRANSCRIT: ${inputs.audio}`);
    }
    
    if (inputs.text) {
      parts.push(`CONTEXTE UTILISATEUR: ${inputs.text}`);
    }
    
    return parts.join('\n\n');
  }

  // Analyse principale avec GPT-4
  async performAnalysis(content) {
    const prompt = `Analyse ce courrier administratif et retourne un JSON structuré:

CONTENU À ANALYSER:
${content}

FORMAT JSON REQUIS:
{
  "document_type": "courrier_officiel|facture|convocation|réclamation|autre",
  "expediteur": {
    "nom": "string",
    "organisme": "string",
    "service": "string|null",
    "email_detecte": "string|null"
  },
  "contenu": {
    "objet_principal": "string",
    "demandes": ["string"],
    "delais": ["string"],
    "documents_requis": ["string"]
  },
  "urgence": 1-5,
  "ton_detecte": "formel|neutre|urgent|amical",
  "confiance_analyse": 0.0-1.0,
  "actions_requises": ["string"],
  "mots_cles": ["string"]
}

ANALYSE:`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: this.systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 1500
    });

    try {
      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Erreur parsing JSON:', error);
      return this.createFallbackAnalysis(content);
    }
  }

  // Génération des 3 réponses
  async generateResponses(analysis) {
    const prompt = `Génère 3 réponses email pour cette analyse:

ANALYSE:
${JSON.stringify(analysis, null, 2)}

GÉNÉRER 3 VERSIONS:

1. COURTE (50-150 mots): Directe, efficace, essentiel uniquement
2. STANDARD (150-300 mots): Équilibrée, professionnelle, complète
3. DÉTAILLÉE (300-500 mots): Argumentée, références, contexte complet

FORMAT JSON:
{
  "version_courte": {
    "objet": "string",
    "corps": "string",
    "ton": "string",
    "points_cles": ["string"]
  },
  "version_standard": {
    "objet": "string",
    "corps": "string",
    "ton": "string",
    "points_cles": ["string"]
  },
  "version_detaillee": {
    "objet": "string",
    "corps": "string",
    "ton": "string",
    "points_cles": ["string"]
  },
  "recommandation": "version_courte|version_standard|version_detaillee",
  "justification": "string"
}

RÉPONSES:`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: this.systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.4,
      max_tokens: 2000
    });

    try {
      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Erreur parsing réponses:', error);
      return this.createFallbackResponses(analysis);
    }
  }

  // Calcul de confiance
  calculateConfidence(analysis, responses) {
    const factors = [
      analysis.confiance_analyse || 0.7,
      responses.error ? 0.3 : 0.9,
      analysis.expediteur?.organisme ? 0.9 : 0.6
    ];
    
    return factors.reduce((sum, factor) => sum + factor, 0) / factors.length;
  }

  // Analyse de fallback en cas d'erreur
  createFallbackAnalysis(content) {
    return {
      document_type: 'autre',
      expediteur: {
        nom: 'Expéditeur non identifié',
        organisme: 'Organisation non identifiée',
        service: null,
        email_detecte: null
      },
      contenu: {
        objet_principal: 'Demande administrative',
        demandes: ['Réponse requise'],
        delais: ['Non spécifié'],
        documents_requis: []
      },
      urgence: 3,
      ton_detecte: 'neutre',
      confiance_analyse: 0.3,
      actions_requises: ['Analyser manuellement'],
      mots_cles: []
    };
  }

  // Réponses de fallback
  createFallbackResponses(analysis) {
    const baseResponse = `Madame, Monsieur,

J'ai bien reçu votre courrier.

Je vous remercie de votre attention et reste à votre disposition pour tout complément d'information.

Cordialement`;

    return {
      version_courte: {
        objet: 'Re: Votre courrier',
        corps: baseResponse,
        ton: 'neutre',
        points_cles: ['Accusé de réception']
      },
      version_standard: {
        objet: 'Re: Votre courrier - Réponse',
        corps: baseResponse,
        ton: 'professionnel',
        points_cles: ['Accusé de réception', 'Disponibilité']
      },
      version_detaillee: {
        objet: 'Re: Votre courrier - Réponse détaillée',
        corps: baseResponse,
        ton: 'formel',
        points_cles: ['Accusé de réception', 'Disponibilité', 'Suivi']
      },
      recommandation: 'version_standard',
      justification: 'Réponse équilibrée en l\'absence d\'analyse précise'
    };
  }

  // Amélioration continue
  async saveFeedback(analysisId, feedback) {
    try {
      const feedbackData = {
        analysisId,
        rating: feedback.rating,
        corrections: feedback.corrections,
        chosenVersion: feedback.chosenVersion,
        timestamp: new Date().toISOString()
      };

      // Sauvegarder en fichier pour l'instant
      const feedbackPath = path.join(process.cwd(), 'data', 'feedback.jsonl');
      await fs.appendFile(feedbackPath, JSON.stringify(feedbackData) + '\n');
      
      return { success: true };
    } catch (error) {
      console.error('Erreur sauvegarde feedback:', error);
      return { success: false, error: error.message };
    }
  }

  // Métriques de performance
  async getMetrics() {
    try {
      const feedbackPath = path.join(process.cwd(), 'data', 'feedback.jsonl');
      const feedbackData = await fs.readFile(feedbackPath, 'utf-8');
      const feedbacks = feedbackData.split('\n').filter(Boolean).map(JSON.parse);
      
      const avgRating = feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length;
      
      return {
        totalAnalyses: feedbacks.length,
        averageRating: avgRating || 0,
        lastUpdate: new Date().toISOString()
      };
    } catch (error) {
      return {
        totalAnalyses: 0,
        averageRating: 0,
        lastUpdate: new Date().toISOString()
      };
    }
  }
}

export default IAService;