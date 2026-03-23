/**
 * API Route - Reception Email Entrant (Webhook)
 * POST /api/emails/incoming - Recoit un email et declenche le workflow
 */

import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { eventLogService } from '@/lib/services/event-log.service';
import { smartInboxService } from '@/lib/services/smart-inbox.service';
import { filterRuleService } from '@/frontend/lib/services/filter-rule.service';
import { analyzeEmail } from '@/lib/workflows/email-intelligence';
import { Prisma } from '@prisma/client';
import {
  IncomingEmailPayloadSchema,
  normalizeIncomingEmailPayload,
} from '@/lib/email/ingestion';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const expectedWebhookSecret = process.env.INCOMING_EMAIL_WEBHOOK_SECRET;
    if (!expectedWebhookSecret) {
      logger.error('[EMAIL] Secret webhook entrant non configure');
      return NextResponse.json({ error: 'Service indisponible' }, { status: 503 });
    }

    const providedSecret =
      request.headers.get('x-webhook-secret') ||
      request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

    if (!providedSecret || providedSecret !== expectedWebhookSecret) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const rawRequestBody = await request.text();

    let requestBody: unknown;
    try {
      requestBody = JSON.parse(rawRequestBody);
    } catch {
      return NextResponse.json({ error: 'Payload JSON invalide' }, { status: 400 });
    }

    const parsedPayload = IncomingEmailPayloadSchema.safeParse(requestBody);
    if (!parsedPayload.success) {
      return NextResponse.json(
        { error: 'Payload email invalide', details: parsedPayload.error.flatten() },
        { status: 400 }
      );
    }

    const normalized = normalizeIncomingEmailPayload(parsedPayload.data, rawRequestBody);
    const { from, to, subject, body: emailBody, htmlBody, attachments, messageId } = normalized;

    // Trouver le tenant destinataire base sur l'email "to"
    const tenant = await prisma.tenant.findFirst({
      where: {
        users: {
          some: {
            email: { in: normalized.tenantLookupRecipients },
            role: { in: ['ADMIN', 'LAWYER', 'USER'] },
          },
        },
      },
    });

    if (!tenant) {
      logger.info(`[EMAIL] Aucun tenant trouve pour: ${to}`);
      return NextResponse.json({ error: 'Destinataire non trouve' }, { status: 404 });
    }

    const duplicateEmail = await findDuplicateEmail(tenant.id, normalized);
    if (duplicateEmail) {
      await eventLogService.createEventLog({
        eventType: 'FLOW_RECEIVED',
        entityType: 'email',
        entityId: duplicateEmail.id,
        actorType: 'SYSTEM',
        tenantId: tenant.id,
        metadata: {
          source: 'incoming-webhook',
          deduplicated: true,
          duplicateOfEmailId: duplicateEmail.id,
          messageId: normalized.messageId,
          providerMessageId: normalized.providerMessageId,
          contentHash: normalized.contentHash,
        },
      });

      return NextResponse.json({
        success: true,
        duplicate: true,
        emailId: duplicateEmail.id,
        message: 'Email deja traite (idempotent)',
      });
    }

    // Chercher si l'expediteur est un client connu
    const client = await prisma.client.findFirst({
      where: {
        tenantId: tenant.id,
        email: normalized.fromAddress || from.toLowerCase(),
      },
    });

    // Analyser l'email avec l'IA
    let aiAnalysis: string | null = null;
    let category = 'general-inquiry';
    let urgency = 'medium';
    let sentiment = 'neutral';

    try {
      const analysis = await analyzeEmail({
        subject,
        body: emailBody,
        from,
        receivedAt: normalized.receivedAt,
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
    let email;
    try {
      email = await prisma.email.create({
        data: {
          tenantId: tenant.id,
          messageId,
          providerMessageId: normalized.providerMessageId,
          threadId: normalized.threadId,
          internetMessageId: normalized.internetMessageId,
          sourceChannel: normalized.sourceChannel,
          sourceProvider: normalized.sourceProvider,
          sourceDirection: normalized.sourceDirection,
          from: from.toLowerCase(),
          fromAddress: normalized.fromAddress,
          to: to.toLowerCase(),
          toAddresses: normalized.toAddresses,
          cc: normalized.cc,
          bcc: normalized.bcc,
          replyTo: normalized.replyTo,
          inReplyTo: normalized.inReplyTo,
          referenceIds: normalized.referenceIds,
          subject,
          body: emailBody || '',
          bodyText: normalized.bodyText,
          htmlBody,
          preview: (emailBody || '').substring(0, 200),
          hasAttachments: normalized.hasAttachments,
          rawFormat: normalized.rawFormat,
          rawPayload: normalized.rawPayload,
          rawHeaders: normalized.rawHeaders,
          rawContent: normalized.rawContent,
          normalizedPayload: normalized.normalizedPayload,
          contentHash: normalized.contentHash,
          category,
          urgency,
          sentiment,
          aiAnalysis,
          clientId: client?.id,
          receivedAt: normalized.receivedAt,
          receivedDate: normalized.receivedDate,
        },
      });
    } catch (error) {
      // Handle race conditions on unique messageId inserts with an idempotent response.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const existing = await findDuplicateEmail(tenant.id, normalized);
        if (existing) {
          return NextResponse.json({
            success: true,
            duplicate: true,
            emailId: existing.id,
            message: 'Email deja traite (idempotent)',
          });
        }
      }
      throw error;
    }

    // RULE-005: Tracer réception flux email
    await eventLogService.createEventLog({
      eventType: 'FLOW_RECEIVED',
      entityType: 'email',
      entityId: email.id,
      actorType: 'SYSTEM',
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
        eventType: 'FLOW_CLASSIFIED',
        entityType: 'email',
        entityId: email.id,
        actorType: 'AI',
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
    if (attachments.length > 0) {
      await prisma.emailAttachment.createMany({
        data: attachments.map(att => ({
          emailId: email.id,
          filename: att.filename,
          mimeType: att.mimeType,
          size: att.size,
          storageKey: att.storageKey,
          contentId: att.contentId,
          disposition: att.disposition,
          checksum: att.checksum,
          metadata: att.metadata,
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
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
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

async function findDuplicateEmail(
  tenantId: string,
  normalized: {
    messageId: string | null;
    providerMessageId: string | null;
    internetMessageId: string | null;
    contentHash: string;
  }
) {
  const orConditions: Prisma.EmailWhereInput[] = [];

  if (normalized.messageId) {
    orConditions.push({ messageId: normalized.messageId });
  }
  if (normalized.providerMessageId) {
    orConditions.push({ providerMessageId: normalized.providerMessageId });
  }
  if (normalized.internetMessageId) {
    orConditions.push({ internetMessageId: normalized.internetMessageId });
  }
  if (normalized.contentHash) {
    orConditions.push({ contentHash: normalized.contentHash });
  }

  if (orConditions.length === 0) {
    return null;
  }

  return prisma.email.findFirst({
    where: {
      tenantId,
      OR: orConditions,
    },
    select: { id: true },
  });
}
