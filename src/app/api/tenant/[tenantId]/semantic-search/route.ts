/**
import { logger } from '@/lib/logger';
 * API Recherche Sémantique - Recherche par Sens avec IA
 * Endpoint: /api/tenant/[tenantId]/semantic-search
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface SemanticSearchParams {
  params: { tenantId: string };
}

// Fonction pour calculer la similarité cosinus (simulation)
function calculateCosineSimilarity(query: string, text: string): number {
  // Simulation de similarité basée sur des mots-clés et contexte
  const queryWords = query.toLowerCase().split(' ');
  const textWords = text.toLowerCase().split(' ');
  
  let matches = 0;
  let contextBonus = 0;
  
  // Correspondances exactes
  queryWords.forEach(qWord => {
    if (textWords.some(tWord => tWord.includes(qWord) || qWord.includes(tWord))) {
      matches++;
    }
  });
  
  // Bonus contextuel pour termes juridiques
  const legalTerms = {
    'regulariser': ['titre', 'sejour', 'prefecture', 'oqtf'],
    'naturalisation': ['francais', 'nationalite', 'citoyennete'],
    'asile': ['protection', 'refugie', 'ofpra', 'cnda'],
    'famille': ['regroupement', 'conjoint', 'enfant'],
    'travail': ['salarie', 'emploi', 'autorisation']
  };
  
  Object.entries(legalTerms).forEach(([term, related]) => {
    if (query.toLowerCase().includes(term)) {
      related.forEach(relatedTerm => {
        if (text.toLowerCase().includes(relatedTerm)) {
          contextBonus += 0.2;
        }
      });
    }
  });
  
  const baseScore = matches / Math.max(queryWords.length, 1);
  return Math.min(baseScore + contextBonus, 1);
}

// Analyser les patterns communs entre dossiers
function analyzePatterns(dossiers: any[]) {
  const patterns = {
    documentsCommuns: new Map<string, number>(),
    dureesMoyennes: new Map<string, number[]>(),
    tauxReussite: new Map<string, { total: number, reussis: number }>()
  };

  dossiers.forEach(dossier => {
    const type = dossier.typeDossier;
    
    // Documents communs
    dossier.documents.forEach((doc: any) => {
      const key = `${type}:${doc.documentType || 'autre'}`;
      patterns.documentsCommuns.set(key, (patterns.documentsCommuns.get(key) || 0) + 1);
    });
    
    // Durées
    if (dossier.dateCloture) {
      const duree = Math.floor(
        (new Date(dossier.dateCloture).getTime() - new Date(dossier.dateCreation).getTime()) 
        / (24 * 60 * 60 * 1000)
      );
      if (!patterns.dureesMoyennes.has(type)) {
        patterns.dureesMoyennes.set(type, []);
      }
      patterns.dureesMoyennes.get(type)!.push(duree);
    }
    
    // Taux de réussite
    if (!patterns.tauxReussite.has(type)) {
      patterns.tauxReussite.set(type, { total: 0, reussis: 0 });
    }
    const stats = patterns.tauxReussite.get(type)!;
    stats.total++;
    if (dossier.statut === 'termine') {
      stats.reussis++;
    }
  });

  return {
    documentsFrequents: Array.from(patterns.documentsCommuns.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([key, count]) => {
        const [type, docType] = key.split(':');
        return { type, documentType: docType, frequency: count };
      }),
    
    dureesMoyennes: Array.from(patterns.dureesMoyennes.entries())
      .map(([type, durees]) => ({
        type,
        moyenneJours: Math.round(durees.reduce((a, b) => a + b, 0) / durees.length),
        min: Math.min(...durees),
        max: Math.max(...durees)
      })),
    
    tauxReussite: Array.from(patterns.tauxReussite.entries())
      .map(([type, stats]) => ({
        type,
        taux: stats.total > 0 ? (stats.reussis / stats.total) * 100 : 0,
        total: stats.total
      }))
  };
}

export async function GET(
  request: NextRequest,
  { params }: SemanticSearchParams
) {
  try {
    const { tenantId } = params;
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query.trim()) {
      return NextResponse.json({
        results: [],
        patterns: null,
        suggestions: [
          'regulariser situation administrative',
          'demande naturalisation francaise',
          'recours OQTF prefecture',
          'regroupement familial conjoint',
          'renouvellement titre sejour'
        ]
      });
    }

    // Rechercher dans les dossiers
    const allDossiers = await prisma.dossier.findMany({
      where: { tenantId },
      include: {
        client: {
          select: { firstName: true, lastName: true, email: true }
        },
        documents: {
          select: { documentType: true, filename: true }
        }
      }
    });

    // Calculer la similarité pour chaque dossier
    const results = allDossiers.map(dossier => {
      const searchText = [
        dossier.typeDossier,
        dossier.objet || '',
        dossier.description || '',
        dossier.notes || '',
        dossier.client.firstName,
        dossier.client.lastName,
        dossier.articleCeseda || '',
        dossier.categorieJuridique || ''
      ].join(' ');

      const similarity = calculateCosineSimilarity(query, searchText);

      return {
        dossier: {
          id: dossier.id,
          numero: dossier.numero,
          typeDossier: dossier.typeDossier,
          objet: dossier.objet,
          statut: dossier.statut,
          priorite: dossier.priorite,
          dateCreation: dossier.dateCreation,
          dateEcheance: dossier.dateEcheance,
          client: dossier.client,
          documentCount: dossier.documents.length
        },
        similarity: Math.round(similarity * 100),
        matchedFields: [] // Simplification pour cette version
      };
    })
    .filter(result => result.similarity > 20) // Seuil minimum de 20%
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);

    // Analyser les patterns si on a des résultats
    let patterns = null;
    if (results.length > 0) {
      const similarDossiers = allDossiers.filter(d => 
        results.some(r => r.dossier.id === d.id)
      );
      patterns = analyzePatterns(similarDossiers);
    }

    // Suggestions de requêtes populaires (simulation)
    const suggestions = [
      'régulariser situation administrative',
      'demande naturalisation française', 
      'recours OQTF préfecture',
      'regroupement familial conjoint',
      'renouvellement titre séjour',
      'demande asile politique',
      'carte résident permanent',
      'autorisation travail salarié'
    ].filter(s => !s.toLowerCase().includes(query.toLowerCase()));

    return NextResponse.json({
      results,
      patterns,
      suggestions: suggestions.slice(0, 5),
      query,
      totalResults: results.length,
      searchTime: Date.now() % 100 + 'ms' // Simulation
    });

  } catch (error) {
    logger.error('Erreur recherche sémantique:', { error });
    return NextResponse.json(
      { error: 'Erreur lors de la recherche sémantique' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: SemanticSearchParams
) {
  try {
    const { tenantId } = params;
    const body = await request.json();
    const { query, filters = {} } = body;

    // Version POST pour recherches avancées avec filtres
    const whereClause: any = { tenantId };

    // Appliquer les filtres
    if (filters.typeDossier) {
      whereClause.typeDossier = filters.typeDossier;
    }
    if (filters.statut) {
      whereClause.statut = filters.statut;
    }
    if (filters.priorite) {
      whereClause.priorite = filters.priorite;
    }
    if (filters.dateDebut && filters.dateFin) {
      whereClause.dateCreation = {
        gte: new Date(filters.dateDebut),
        lte: new Date(filters.dateFin)
      };
    }

    const filteredDossiers = await prisma.dossier.findMany({
      where: whereClause,
      include: {
        client: {
          select: { firstName: true, lastName: true, email: true }
        },
        documents: {
          select: { documentType: true, filename: true }
        }
      }
    });

    // Appliquer la recherche sémantique sur les résultats filtrés
    const results = filteredDossiers.map(dossier => {
      const searchText = [
        dossier.typeDossier,
        dossier.objet || '',
        dossier.description || '',
        dossier.notes || '',
        dossier.client.firstName,
        dossier.client.lastName
      ].join(' ');

      const similarity = calculateCosineSimilarity(query, searchText);

      return {
        dossier: {
          id: dossier.id,
          numero: dossier.numero,
          typeDossier: dossier.typeDossier,
          objet: dossier.objet,
          statut: dossier.statut,
          priorite: dossier.priorite,
          dateCreation: dossier.dateCreation,
          client: dossier.client,
          documentCount: dossier.documents.length
        },
        similarity: Math.round(similarity * 100)
      };
    })
    .filter(result => result.similarity > 15)
    .sort((a, b) => b.similarity - a.similarity);

    return NextResponse.json({
      results,
      query,
      filters,
      totalResults: results.length
    });

  } catch (error) {
    logger.error('Erreur recherche sémantique avancée:', { error });
    return NextResponse.json(
      { error: 'Erreur lors de la recherche sémantique avancée' },
      { status: 500 }
    );
  }
}