/**
 * API Route - Reception Email Entrant (Webhook)
 * POST /api/emails/incoming - Recoit un email et declenche le workflow
 */

import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { eventLogService } from '@/lib/services/event-log.service';
import { smartInboxService } from '@/lib/services/smart-inbox.service';
import { analyzeEmail } from '@/lib/workflows/email-intelligence';
import { ActorType, EventType } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { from, to, subject, body: emailBody, htmlBody, attachments, messageId } = body;

    if (!from || !to || !subject) {
      return NextResponse.json({ error: 'from, to et subject sont requis' }, { status: 400 });
    }

    // Trouver le tenant destinataire base sur l'email "to"
    const tenant = await prisma.tenant.findFirst({
      where: {
        users: {
          some: {
            email: to.toLowerCase(),
            role: { in: ['ADMIN', 'LAWYER', 'USER'] },
          },
        },
      },
    });

    if (!tenant) {
      logger.info('[EMAIL] Aucun tenant trouve pour: ${to}');
      return NextResponse.json({ error: 'Destinataire non trouve' }, { status: 404 });
    }

    // Chercher si l'expediteur est un client connu
    const client = await prisma.client.findFirst({
      where: {
        tenantId: tenant.id,
        email: from.toLowerCase(),
      },
    });

    // Analyser l'email avec l'IA
    let aiAnalysis = null;
    let category = 'general-inquiry';
    let urgency = 'medium';
    let sentiment = 'neutral';

    try {
      const analysis = await analyzeEmail({
        subject,
        body: emailBody,
        from,
        receivedAt: new Date(),
        attachments,
      });

      aiAnalysis = JSON.stringify(analysis);
      category = analysis.category;
      urgency = analysis.urgency;
      sentiment = analysis.sentiment;

      // RULE-005: Tracer classification IA (après email créé)
      // Note: EventLog sera créé après création email pour avoir entityId
    } catch (aiError) {
      logger.error('[EMAIL] Erreur analyse IA:', { error: aiError });
      // Continuer sans analyse IA
    }

    // Creer l'email dans la base
    const email = await prisma.email.create({
      data: {
        tenantId: tenant.id,
        messageId,
        from: from.toLowerCase(),
        to: to.toLowerCase(),
        subject,
        body: emailBody || '',
        htmlBody,
        preview: (emailBody || '').substring(0, 200),
        category,
        urgency,
        sentiment,
        aiAnalysis,
        clientId: client?.id,
        receivedAt: new Date(),
      },
    });

    // RULE-005: Tracer réception flux email
    await eventLogService.createEventLog({
      eventType: EventType.FLOW_RECEIVED,
      entityType: 'email',
      entityId: email.id,
      actorType: ActorType.SYSTEM,
      tenantId: tenant.id,
      metadata: {
        source: 'incoming-webhook',
        from,
        to,
        subject,
        category,
        urgency,
        clientId: client?.id,
        hasAttachments: attachments && attachments.length > 0,
      },
    });

    // RULE-005: Tracer classification IA si analyse réussie
    if (aiAnalysis) {
      await eventLogService.createEventLog({
        eventType: EventType.FLOW_CLASSIFIED,
        entityType: 'email',
        entityId: email.id,
        actorType: ActorType.AI,
        tenantId: tenant.id,
        metadata: {
          category,
          urgency,
          sentiment,
          confidence: 'high', // Peut être ajouté depuis analysis
        },
      });
    }

    // Phase 3: Évaluer et appliquer règles de filtrage
    const ruleMatches = await filterRuleService.evaluateAllRules(email, tenant.id);
    for (const match of ruleMatches) {
      await filterRuleService.applyActions(email.id, match.rule, tenant.id);
      logger.info(`[FILTER-RULE] Appliquée: ${match.rule.name} sur email ${email.id}`);
    }

    // Phase 4: Calculer score Smart Inbox
    const scoreResult = await smartInboxService.calculateScore(email, tenant.id);
    await smartInboxService.saveScore(email.id, scoreResult, tenant.id);
    logger.info(`[SMART-INBOX] Score calculé: ${scoreResult.score}/100 pour email ${email.id}`);

    // Creer les pieces jointes si presentes
    if (attachments && attachments.length > 0) {
      await prisma.emailAttachment.createMany({
        data: attachments.map((att: any) => ({
          emailId: email.id,
          filename: att.filename,
          mimeType: att.mimeType || 'application/octet-stream',
          size: att.size || 0,
          storageKey: att.storageKey,
        })),
      });
    }

    // Declencher le workflow approprie
    const workflow = await prisma.workflowExecution.create({
      data: {
        tenantId: tenant.id,
        workflowId: `email-${category}`,
        workflowName: getWorkflowName(category),
        emailId: email.id,
        status: 'running',
        currentStep: 'classification',
        progress: 10,
        triggerType: 'email',
        triggerData: JSON.stringify({
          emailId: email.id,
          from,
          subject,
          category,
          urgency,
          clientId: client?.id,
        }),
        startedAt: new Date(),
      },
    });

    // Simuler l'execution du workflow (etapes)
    await executeWorkflowSteps(workflow.id, email, category, urgency);

    return NextResponse.json({
      success: true,
      emailId: email.id,
      workflowId: workflow.id,
      category,
      urgency,
      message: 'Email recu et workflow declenche',
    });
  } catch (error) {
    logger.error('[EMAIL] Erreur reception email:', { error });
    return NextResponse.json({ error: 'Erreur serveur', details: String(error) }, { status: 500 });
  }
}

function getWorkflowName(category: string): string {
  const names: Record<string, string> = {
    'client-urgent': 'Traitement Email Urgent',
    'new-case': 'Ouverture Nouveau Dossier',
    'deadline-reminder': 'Gestion echeance',
    invoice: 'Traitement Facture',
    'legal-question': 'Reponse Question Juridique',
    'court-document': 'Document Judiciaire',
    'client-complaint': 'Reclamation Client',
    'document-request': 'Demande Document',
    'appointment-request': 'Demande Rendez-vous',
    'general-inquiry': 'Demande Generale',
  };
  return names[category] || 'Traitement Email';
}

async function executeWorkflowSteps(
  workflowId: string,
  email: any,
  category: string,
  urgency: string
) {
  const steps: Array<{ name: string; progress: number }> = [
    { name: 'classification', progress: 20 },
    { name: 'client_matching', progress: 40 },
    { name: 'dossier_linking', progress: 60 },
    { name: 'notification', progress: 80 },
    { name: 'completed', progress: 100 },
  ];

  // Simuler l'execution progressive des etapes
  for (const step of steps) {
    await prisma.workflowExecution.update({
      where: { id: workflowId },
      data: {
        currentStep: step.name,
        progress: step.progress,
        steps: JSON.stringify(
          steps.slice(0, steps.indexOf(step) + 1).map(s => ({
            name: s.name,
            status: 'completed',
            completedAt: new Date().toISOString(),
          }))
        ),
      },
    });
  }

  // Marquer le workflow comme termine
  await prisma.workflowExecution.update({
    where: { id: workflowId },
    data: {
      status: 'completed',
      completedAt: new Date(),
      result: JSON.stringify({
        emailProcessed: true,
        category,
        urgency,
        actions: ['Email classifie', 'Notification envoyee'],
      }),
    },
  });

  // Marquer l'email comme traite
  await prisma.email.update({
    where: { id: email.id },
    data: {
      isProcessed: true,
      processedAt: new Date(),
    },
  });
}
