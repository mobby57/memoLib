/**
import { logger } from '@/lib/logger';
 * API Suggestions Intelligentes - IA Proactive
 * Endpoint: /api/tenant/[tenantId]/suggestions
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface SuggestionsParams {
  params: Promise<{ tenantId: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: SuggestionsParams
) {
  try {
    const { tenantId } = await params;
    const now = new Date();
    const suggestions: Array<{
      id: string;
      type: string;
      priority: string;
      title: string;
      description: string;
      confidence: number;
      actionSuggested: string;
      details: unknown[];
      estimatedTimeGain: string;
    }> = [];

    // 1. Dossiers inactifs (> 14 jours) - utilise updatedAt au lieu de lastActivityAt
    const inactiveDossiers = await prisma.dossier.findMany({
      where: {
        tenantId,
        statut: 'en_cours',
        updatedAt: {
          lt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
        }
      },
      include: {
        client: {
          select: { firstName: true, lastName: true }
        }
      },
      take: 5
    });

    if (inactiveDossiers.length > 0) {
      suggestions.push({
        id: 'inactive_dossiers',
        type: 'dossiers_inactifs',
        priority: 'high',
        title: `${inactiveDossiers.length} dossier(s) inactif(s) détecté(s)`,
        description: 'Des dossiers n\'ont pas eu d\'activité depuis plus de 14 jours',
        confidence: 0.85,
        actionSuggested: 'Relance client recommandée',
        details: inactiveDossiers.map(d => ({
          dossierId: d.id,
          clientName: `${d.client.firstName} ${d.client.lastName}`,
          daysSinceActivity: Math.floor((now.getTime() - new Date(d.updatedAt).getTime()) / (24 * 60 * 60 * 1000))
        })),
        estimatedTimeGain: '30 minutes/jour'
      });
    }

    // 2. Documents manquants récurrents
    const documentsManquants = await prisma.dossier.findMany({
      where: {
        tenantId,
        statut: { in: ['en_cours', 'en_attente'] }
      },
      include: {
        documents: true,
        client: {
          select: { firstName: true, lastName: true }
        }
      }
    });

    const dossiersAvecPeuDocuments = documentsManquants.filter(d => d.documents.length < 3);
    
    if (dossiersAvecPeuDocuments.length >= 3) {
      suggestions.push({
        id: 'missing_documents',
        type: 'documents_manquants',
        priority: 'medium',
        title: `${dossiersAvecPeuDocuments.length} dossiers avec peu de documents`,
        description: 'Plusieurs dossiers ont moins de 3 documents, automatisation possible',
        confidence: 0.78,
        actionSuggested: 'Créer un formulaire de collecte automatique',
        details: dossiersAvecPeuDocuments.slice(0, 5).map(d => ({
          dossierId: d.id,
          clientName: `${d.client.firstName} ${d.client.lastName}`,
          documentCount: d.documents.length
        })),
        estimatedTimeGain: '2 heures/semaine'
      });
    }

    // 3. Échéances proches (< 14 jours) - utilise LegalDeadline
    const echeancesProches = await prisma.legalDeadline.findMany({
      where: {
        dossier: {
          tenantId
        },
        dueDate: {
          gte: now,
          lte: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
        },
        status: 'PENDING'
      },
      include: {
        dossier: {
          include: {
            client: {
              select: { firstName: true, lastName: true }
            }
          }
        }
      },
      orderBy: { dueDate: 'asc' },
      take: 10
    });

    if (echeancesProches.length > 0) {
      const critiques = echeancesProches.filter(e => 
        new Date(e.dueDate).getTime() - now.getTime() < 3 * 24 * 60 * 60 * 1000
      );

      suggestions.push({
        id: 'upcoming_deadlines',
        type: 'echeances_proches',
        priority: critiques.length > 0 ? 'critical' : 'high',
        title: `${echeancesProches.length} échéance(s) dans les 14 prochains jours`,
        description: critiques.length > 0 
          ? `Dont ${critiques.length} critique(s) dans les 3 prochains jours`
          : 'Rappels automatiques recommandés',
        confidence: 0.92,
        actionSuggested: 'Activer les rappels automatiques',
        details: echeancesProches.map(e => ({
          echeanceId: e.id,
          type: e.type,
          clientName: `${e.dossier.client.firstName} ${e.dossier.client.lastName}`,
          daysUntilDeadline: Math.ceil((new Date(e.dueDate).getTime() - now.getTime()) / (24 * 60 * 60 * 1000)),
          isCritical: new Date(e.dueDate).getTime() - now.getTime() < 3 * 24 * 60 * 60 * 1000
        })),
        estimatedTimeGain: '1 heure/jour'
      });
    }

    // 4. Opportunités d'automatisation (basé sur les audits récents)
    const recentAudits = await prisma.auditLog.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        }
      },
      take: 100
    });

    const actionsByType = recentAudits.reduce((acc, audit) => {
      acc[audit.action] = (acc[audit.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const frequentActions = Object.entries(actionsByType)
      .filter(([_, count]) => count >= 20)
      .sort(([_, a], [__, b]) => b - a);

    if (frequentActions.length > 0) {
      suggestions.push({
        id: 'automation_opportunities',
        type: 'opportunites_automatisation',
        priority: 'medium',
        title: `${frequentActions.length} type(s) d'action(s) fréquente(s)`,
        description: 'Actions répétitives détectées, automatisation possible',
        confidence: 0.73,
        actionSuggested: 'Configurer l\'auto-approbation pour les actions fréquentes',
        details: frequentActions.map(([type, count]) => ({
          actionType: type,
          monthlyCount: count,
          automationPotential: count > 50 ? 'high' : count > 30 ? 'medium' : 'low'
        })),
        estimatedTimeGain: '3 heures/semaine'
      });
    }

    // 5. Anomalies détectées
    const anomalies = [];

    // Dossiers très anciens (> 90 jours)
    const anciensDossiers = await prisma.dossier.count({
      where: {
        tenantId,
        statut: 'en_cours',
        dateCreation: {
          lt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        }
      }
    });

    if (anciensDossiers > 0) {
      anomalies.push(`${anciensDossiers} dossier(s) ouvert(s) depuis plus de 90 jours`);
    }

    // Factures impayées (> 60 jours)
    const facturesImpayees = await prisma.facture.count({
      where: {
        tenantId,
        statut: 'en_attente',
        dateEcheance: {
          lt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
        }
      }
    });

    if (facturesImpayees > 0) {
      anomalies.push(`${facturesImpayees} facture(s) impayée(s) depuis plus de 60 jours`);
    }

    if (anomalies.length > 0) {
      suggestions.push({
        id: 'anomalies_detected',
        type: 'anomalies',
        priority: 'high',
        title: `${anomalies.length} anomalie(s) détectée(s)`,
        description: 'Situations nécessitant une attention particulière',
        confidence: 0.88,
        actionSuggested: 'Révision et nettoyage recommandés',
        details: anomalies.map((anomaly, index) => ({
          id: index,
          description: anomaly
        })),
        estimatedTimeGain: '1 heure/semaine'
      });
    }

    // Trier par priorité
    const priorityOrder: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
    suggestions.sort((a, b) => (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0));

    return NextResponse.json({
      suggestions,
      generatedAt: now.toISOString(),
      totalSuggestions: suggestions.length
    });

  } catch (error) {
    logger.error('Erreur suggestions:', { error });
    return NextResponse.json(
      { error: 'Erreur lors de la génération des suggestions' },
      { status: 500 }
    );
  }
}