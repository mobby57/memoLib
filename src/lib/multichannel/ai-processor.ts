/**
 * Service IA pour traitement multi-canal
 * Résumé, catégorisation, détection urgence, extraction entités
 */

import { AIAnalysis, ExtractedEntity, NormalizedMessage, SuggestedAction, UrgencyLevel } from './types';

export class AIService {
  // Clé publique OpenAI (fallback)
  private openaiApiKey: string;

  // Configuration Azure OpenAI (prioritaire si complète)
  private azureEndpoint?: string;
  private azureApiKey?: string;
  private azureDeployment?: string;
  private azureApiVersion: string;

  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY || '';

    this.azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
    this.azureApiKey = process.env.AZURE_OPENAI_API_KEY;
    this.azureDeployment = process.env.AZURE_OPENAI_DEPLOYMENT;
    this.azureApiVersion = process.env.AZURE_OPENAI_API_VERSION || '2025-01-01-preview';
  }

  /**
   * Analyser un message avec l'IA
   */
  async analyzeMessage(message: NormalizedMessage): Promise<AIAnalysis> {
    const content = this.prepareContent(message);

    try {
      // Appel IA en parallèle pour performance
      const [summary, classification, entities, urgency] = await Promise.all([
        this.generateSummary(content),
        this.classifyMessage(content, message.channel),
        this.extractEntities(content),
        this.detectUrgency(content, message.channel),
      ]);

      const suggestedActions = this.generateActions(message, classification, urgency);
      const missingInfo = this.detectMissingInfo(message, entities);

      return {
        summary,
        category: classification.category,
        tags: classification.tags,
        urgency,
        sentiment: classification.sentiment,
        language: classification.language,
        entities,
        suggestedActions,
        missingInfo,
        processedAt: new Date(),
        confidence: classification.confidence,
      };
    } catch (error) {
      console.error('Erreur analyse IA:', error);
      // Fallback basique sans IA
      return this.fallbackAnalysis(message);
    }
  }

  /**
   * Préparer le contenu pour l'analyse
   */
  private prepareContent(message: NormalizedMessage): string {
    let content = '';

    if (message.subject) {
      content += `Sujet: ${message.subject}\n`;
    }

    content += `Canal: ${message.channel}\n`;
    content += `De: ${message.sender.name || message.sender.email || message.sender.phone || 'Inconnu'}\n`;
    content += `Message: ${message.body}\n`;

    if (message.attachments.length > 0) {
      content += `Pièces jointes: ${message.attachments.map(a => a.filename).join(', ')}\n`;
    }

    return content;
  }

  /**
   * Générer un résumé du message
   */
  private async generateSummary(content: string): Promise<string> {
    if (!this.openaiApiKey) {
      return content.substring(0, 200);
    }

    const response = await this.callOpenAI({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `Tu es un assistant juridique. Résume ce message en 2-3 phrases maximum, en français.
          Focus sur: le contexte juridique, les demandes spécifiques, les délais mentionnés.`,
        },
        { role: 'user', content },
      ],
      max_tokens: 150,
      temperature: 0.3,
    });

    return response.choices[0]?.message?.content || content.substring(0, 200);
  }

  /**
   * Classifier le message
   */
  private async classifyMessage(content: string, channel: string): Promise<{
    category: string;
    tags: string[];
    sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
    language: string;
    confidence: number;
  }> {
    if (!this.openaiApiKey) {
      return {
        category: 'GENERAL',
        tags: [channel.toLowerCase()],
        sentiment: 'NEUTRAL',
        language: 'fr',
        confidence: 0.5,
      };
    }

    const response = await this.callOpenAI({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `Analyse ce message et retourne un JSON avec:
          - category: IMMIGRATION | DROIT_TRAVAIL | FAMILLE | COMMERCIAL | PENAL | ADMINISTRATIF | GENERAL
          - tags: liste de mots-clés pertinents (max 5)
          - sentiment: POSITIVE | NEUTRAL | NEGATIVE
          - language: code ISO (fr, en, ar, etc.)
          - confidence: 0.0 à 1.0
          Réponds UNIQUEMENT avec le JSON, pas d'explication.`,
        },
        { role: 'user', content },
      ],
      max_tokens: 200,
      temperature: 0.2,
      response_format: { type: 'json_object' },
    });

    try {
      return JSON.parse(response.choices[0]?.message?.content || '{}');
    } catch {
      return {
        category: 'GENERAL',
        tags: [],
        sentiment: 'NEUTRAL',
        language: 'fr',
        confidence: 0.5,
      };
    }
  }

  /**
   * Extraire les entités nommées
   */
  private async extractEntities(content: string): Promise<ExtractedEntity[]> {
    if (!this.openaiApiKey) {
      return this.extractEntitiesRegex(content);
    }

    const response = await this.callOpenAI({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `Extrait les entités du message. Retourne un JSON array avec:
          [{ "type": "PERSON|ORGANIZATION|DATE|AMOUNT|REFERENCE|ADDRESS|PHONE|EMAIL", "value": "...", "confidence": 0.0-1.0 }]
          Réponds UNIQUEMENT avec le JSON array.`,
        },
        { role: 'user', content },
      ],
      max_tokens: 500,
      temperature: 0.2,
      response_format: { type: 'json_object' },
    });

    try {
      const result = JSON.parse(response.choices[0]?.message?.content || '{"entities":[]}');
      return result.entities || [];
    } catch {
      return this.extractEntitiesRegex(content);
    }
  }

  /**
   * Extraction regex fallback
   */
  private extractEntitiesRegex(content: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];

    // Emails
    const emails = content.match(/[\w.-]+@[\w.-]+\.\w+/g) || [];
    emails.forEach(e => entities.push({ type: 'EMAIL', value: e, confidence: 1.0 }));

    // Téléphones
    const phones = content.match(/(?:\+33|0)\s?[1-9](?:[\s.-]?\d{2}){4}/g) || [];
    phones.forEach(p => entities.push({ type: 'PHONE', value: p, confidence: 0.9 }));

    // Dates
    const dates = content.match(/\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/g) || [];
    dates.forEach(d => entities.push({ type: 'DATE', value: d, confidence: 0.8 }));

    // Montants
    const amounts = content.match(/\d+(?:[.,]\d+)?\s?(?:€|EUR|euros?)/gi) || [];
    amounts.forEach(a => entities.push({ type: 'AMOUNT', value: a, confidence: 0.9 }));

    // Références (numéros de dossier, etc.)
    const refs = content.match(/(?:N°|REF|Dossier)\s*:?\s*[\w\-\/]+/gi) || [];
    refs.forEach(r => entities.push({ type: 'REFERENCE', value: r, confidence: 0.7 }));

    return entities;
  }

  /**
   * Détecter le niveau d'urgence
   */
  private async detectUrgency(content: string, channel: string): Promise<UrgencyLevel> {
    // Mots-clés d'urgence
    const criticalKeywords = ['urgent', 'immédiat', 'critique', 'deadline', 'expulsion', 'garde à vue', 'arrestation'];
    const highKeywords = ['important', 'prioritaire', 'rapidement', 'dès que possible', 'délai', 'audience'];

    const contentLower = content.toLowerCase();

    if (criticalKeywords.some(k => contentLower.includes(k))) {
      return 'CRITICAL';
    }

    if (highKeywords.some(k => contentLower.includes(k))) {
      return 'HIGH';
    }

    // Canaux avec urgence implicite
    if (['VOICE', 'WHATSAPP'].includes(channel)) {
      return 'MEDIUM';
    }

    if (this.openaiApiKey) {
      const response = await this.callOpenAI({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `Évalue l'urgence de ce message juridique.
            Réponds UNIQUEMENT avec: LOW, MEDIUM, HIGH ou CRITICAL
            Critères:
            - CRITICAL: délai légal imminent (<24h), situation de danger
            - HIGH: délai proche (<7j), demande prioritaire
            - MEDIUM: demande standard avec suivi
            - LOW: information, question simple`,
          },
          { role: 'user', content },
        ],
        max_tokens: 10,
        temperature: 0.1,
      });

      const urgency = response.choices[0]?.message?.content?.trim().toUpperCase();
      if (['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(urgency)) {
        return urgency as UrgencyLevel;
      }
    }

    return 'LOW';
  }

  /**
   * Générer des actions suggérées
   */
  private generateActions(
    message: NormalizedMessage,
    classification: { category: string },
    urgency: UrgencyLevel
  ): SuggestedAction[] {
    const actions: SuggestedAction[] = [];

    // Action urgence
    if (urgency === 'CRITICAL' || urgency === 'HIGH') {
      actions.push({
        type: 'ALERT',
        description: 'Notifier l\'avocat responsable',
        priority: 1,
        automated: true,
      });
    }

    // Réponse nécessaire
    if (message.direction === 'INBOUND') {
      actions.push({
        type: 'RESPOND',
        description: 'Accusé de réception à envoyer',
        priority: 2,
        automated: false,
      });
    }

    // Création dossier si nouveau client
    if (!message.clientId) {
      actions.push({
        type: 'CREATE_DOSSIER',
        description: 'Créer un nouveau dossier pour ce contact',
        priority: 3,
        automated: false,
      });
    }

    // Lier au client
    if (!message.clientId && (message.sender.email || message.sender.phone)) {
      actions.push({
        type: 'LINK_CLIENT',
        description: 'Rechercher et lier à un client existant',
        priority: 2,
        automated: true,
      });
    }

    return actions;
  }

  /**
   * Détecter les informations manquantes
   */
  private detectMissingInfo(message: NormalizedMessage, entities: ExtractedEntity[]): string[] {
    const missing: string[] = [];

    if (!message.sender.email && !message.sender.phone) {
      missing.push('Contact de l\'expéditeur (email ou téléphone)');
    }

    if (!entities.some(e => e.type === 'REFERENCE')) {
      missing.push('Numéro de référence ou dossier');
    }

    if (!entities.some(e => e.type === 'DATE')) {
      missing.push('Dates importantes ou délais');
    }

    return missing;
  }

  /**
   * Analyse fallback sans IA
   */
  private fallbackAnalysis(message: NormalizedMessage): AIAnalysis {
    return {
      summary: message.body.substring(0, 200),
      category: 'GENERAL',
      tags: [message.channel.toLowerCase()],
      urgency: 'LOW',
      sentiment: 'NEUTRAL',
      language: 'fr',
      entities: this.extractEntitiesRegex(message.body),
      suggestedActions: [],
      missingInfo: [],
      processedAt: new Date(),
      confidence: 0.3,
    };
  }

  /**
   * Appel OpenAI
   */
  private async callOpenAI(params: {
    model: string;
    messages: Array<{ role: string; content: string }>;
    max_tokens: number;
    temperature: number;
    response_format?: { type: string };
  }): Promise<any> {
    // Priorité à Azure OpenAI si configuration complète disponible
    const useAzure = this.azureEndpoint && this.azureApiKey && this.azureDeployment;

    if (useAzure) {
      const base = this.azureEndpoint!.replace(/\/+$/, '');
      const url = `${base}/openai/deployments/${this.azureDeployment}/chat/completions?api-version=${this.azureApiVersion}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.azureApiKey!,
        },
        // Azure ignore le champ model quand le déploiement est dans l'URL, on peut le laisser tel quel
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`Azure OpenAI error: ${response.status}`);
      }

      return response.json();
    }

    // Fallback vers l'API OpenAI publique
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.openaiApiKey}`,
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`OpenAI error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Transcrire un fichier audio (voicemail, appel)
   */
  async transcribeAudio(audioUrl: string): Promise<string> {
    if (!this.openaiApiKey) {
      return '[Transcription non disponible - clé API manquante]';
    }

    // Télécharger l'audio
    const audioResponse = await fetch(audioUrl);
    const audioBlob = await audioResponse.blob();

    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.mp3');
    formData.append('model', 'whisper-1');
    formData.append('language', 'fr');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openaiApiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Transcription error: ${response.status}`);
    }

    const result = await response.json();
    return result.text;
  }
}

export const aiService = new AIService();
