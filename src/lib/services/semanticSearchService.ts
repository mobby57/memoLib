/**
 * Service de Recherche S�mantique
 * Utilise Ollama embeddings pour trouver des dossiers similaires
 * 
 * Innovation: Recherche intelligente bas�e sur le sens, pas juste les mots-cl�s
 */

import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

interface SemanticSearchResult {
  id: string;
  numero: string;
  type: string;
  description: string;
  similarity: number;
  client: {
    id: string;
    nom: string;
    prenom: string;
  };
  createdAt: Date;
  statut: string;
}

export class SemanticSearchService {
  private ollamaUrl: string;
  private embeddingModel: string;

  constructor() {
    this.ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    this.embeddingModel = 'nomic-embed-text:latest';
  }

  /**
   * G�n�re un embedding pour un texte
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await fetch(`${this.ollamaUrl}/api/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.embeddingModel,
          prompt: text
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama embeddings error: ${response.status}`);
      }

      const data = await response.json();
      return data.embedding;
    } catch (error) {
      logger.error('Erreur g�n�ration embedding Ollama', error, {
        textLength: text.length,
        ollamaUrl: this.ollamaUrl,
        model: this.embeddingModel
      });
      // Fallback: retourner un vecteur simple bas� sur le hash du texte
      return this.simpleFallbackEmbedding(text);
    }
  }

  /**
   * Fallback simple si Ollama n'est pas disponible
   */
  private simpleFallbackEmbedding(text: string): number[] {
    const normalized = text.toLowerCase();
    const vector = new Array(128).fill(0);
    
    for (let i = 0; i < normalized.length; i++) {
      const charCode = normalized.charCodeAt(i);
      vector[charCode % 128] += 1;
    }
    
    // Normaliser
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return vector.map(val => val / (magnitude || 1));
  }

  /**
   * Calcule la similarit� cosinus entre deux vecteurs
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) return 0;
    
    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      magnitudeA += vecA[i] * vecA[i];
      magnitudeB += vecB[i] * vecB[i];
    }
    
    const magnitude = Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  /**
   * Recherche s�mantique de dossiers similaires
   */
  async searchSimilarCases(
    tenantId: string,
    query: string,
    limit: number = 5,
    minSimilarity: number = 0.5
  ): Promise<SemanticSearchResult[]> {
    // G�n�rer l'embedding de la requ�te
    const queryEmbedding = await this.generateEmbedding(query);

    // R�cup�rer tous les dossiers (dans une vraie app, on stockerait les embeddings)
    const dossiers = await prisma.dossier.findMany({
      where: { tenantId },
      include: {
        client: true
      },
      take: 100 // Limiter pour la d�mo
    });

    // Calculer la similarit� pour chaque dossier
    const results: (SemanticSearchResult & { embedding: number[] })[] = [];

    for (const dossier of dossiers) {
      // Cr�er une repr�sentation textuelle du dossier
      const dossierText = [
        dossier.typeDossier,
        dossier.description || '',
        dossier.notes || '',
        dossier.client.firstName,
        dossier.client.lastName
      ].join(' ');

      const dossierEmbedding = await this.generateEmbedding(dossierText);
      const similarity = this.cosineSimilarity(queryEmbedding, dossierEmbedding);

      if (similarity >= minSimilarity) {
        results.push({
          id: dossier.id,
          numero: dossier.numero,
          type: dossier.typeDossier,
          description: dossier.description || '',
          similarity,
          client: {
            id: dossier.client.id,
            nom: dossier.client.lastName,
            prenom: dossier.client.firstName
          },
          createdAt: dossier.createdAt,
          statut: dossier.statut,
          embedding: dossierEmbedding
        });
      }
    }

    // Trier par similarit� d�croissante
    results.sort((a, b) => b.similarity - a.similarity);

    // Retourner les top r�sultats sans l'embedding
    return results.slice(0, limit).map(({ embedding, ...rest }) => rest);
  }

  /**
   * Trouve des dossiers similaires � un dossier existant
   */
  async findSimilarCases(
    dossierId: string,
    limit: number = 5
  ): Promise<SemanticSearchResult[]> {
    const dossier = await prisma.dossier.findUnique({
      where: { id: dossierId },
      include: { client: true }
    });

    if (!dossier) {
      throw new Error('Dossier non trouv�');
    }

    const query = [
      dossier.typeDossier,
      dossier.description || '',
      dossier.notes || ''
    ].join(' ');

    const results = await this.searchSimilarCases(
      dossier.tenantId,
      query,
      limit + 1, // +1 car le dossier lui-m�me sera dans les r�sultats
      0.3 // Seuil plus bas pour trouver des cas similaires
    );

    // Filtrer le dossier source
    return results.filter(r => r.id !== dossierId);
  }

  /**
   * Suggestions de recherche intelligentes
   */
  async suggestSearchQueries(tenantId: string): Promise<string[]> {
    // Analyser les types de dossiers les plus fr�quents
    const dossierTypes = await prisma.dossier.groupBy({
      by: ['typeDossier'],
      where: { tenantId },
      _count: { typeDossier: true },
      orderBy: { _count: { typeDossier: 'desc' } },
      take: 5
    });

    return dossierTypes.map((dt: { typeDossier: string }) => {
      switch (dt.typeDossier) {
        case 'REGULARISATION':
          return 'Dossiers de r�gularisation avec employeur';
        case 'TITRE_SEJOUR':
          return 'Renouvellement de titre de s�jour';
        case 'REGROUPEMENT_FAMILIAL':
          return 'Demandes de regroupement familial';
        case 'NATURALISATION':
          return 'Proc�dures de naturalisation';
        default:
          return `Dossiers de type ${dt.typeDossier}`;
      }
    });
  }

  /**
   * Analyse de patterns dans les dossiers similaires
   */
  async analyzePatterns(
    tenantId: string,
    query: string
  ): Promise<{
    commonDocuments: string[];
    averageDuration: number;
    successRate: number;
    recommendations: string[];
  }> {
    const similarCases = await this.searchSimilarCases(tenantId, query, 20, 0.6);

    if (similarCases.length === 0) {
      return {
        commonDocuments: [],
        averageDuration: 0,
        successRate: 0,
        recommendations: ['Pas assez de cas similaires pour analyser les patterns']
      };
    }

    // R�cup�rer les d�tails complets des dossiers similaires
    const detailedCases = await prisma.dossier.findMany({
      where: {
        id: { in: similarCases.map(c => c.id) }
      }
    });

    // Analyser les documents communs
    const commonDocuments: string[] = [];

    // Calculer la dur�e moyenne
    const durations = detailedCases
      .filter(d => d.dateCloture)
      .map(d => {
        const start = d.createdAt.getTime();
        const end = d.dateCloture!.getTime();
        return (end - start) / (1000 * 60 * 60 * 24); // jours
      });

    const averageDuration = durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0;

    // Calculer le taux de succ�s
    const successfulCases = detailedCases.filter(d => 
      d.statut === 'CLOTURE' || d.statut === 'TERMINE'
    ).length;
    const successRate = detailedCases.length > 0
      ? successfulCases / detailedCases.length
      : 0;

    // G�n�rer des recommandations
    const recommendations: string[] = [];

    if (commonDocuments.length > 0) {
      recommendations.push(
        `?? Documents fr�quemment requis: ${commonDocuments.slice(0, 3).join(', ')}`
      );
    }

    if (averageDuration > 0) {
      recommendations.push(
        `?? Dur�e moyenne constat�e: ${Math.round(averageDuration)} jours`
      );
    }

    if (successRate > 0.8) {
      recommendations.push(
        `? Taux de succ�s �lev� (${(successRate * 100).toFixed(0)}%) pour ce type de dossier`
      );
    } else if (successRate < 0.5) {
      recommendations.push(
        `?? Taux de succ�s mod�r� (${(successRate * 100).toFixed(0)}%). Prudence recommand�e.`
      );
    }

    return {
      commonDocuments,
      averageDuration,
      successRate,
      recommendations
    };
  }
}

// Singleton
let semanticSearchServiceInstance: SemanticSearchService | null = null;

export function getSemanticSearchService(): SemanticSearchService {
  if (!semanticSearchServiceInstance) {
    semanticSearchServiceInstance = new SemanticSearchService();
  }
  return semanticSearchServiceInstance;
}
