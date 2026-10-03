/**
 * API Route - Reception Email Entrant (Webhook)
 * POST /api/emails/incoming - Recoit un email et declenche le workflow
 * 
 * Security: HMAC-SHA256 signature + timestamp verification
 * Expected headers:
 *   - x-webhook-signature: HMAC-SHA256 hash of body
 *   - x-webhook-timestamp: Unix timestamp of request
 */

import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { eventLogService } from '@/lib/services/event-log.service';
import { smartInboxService } from '@/lib/services/smart-inbox.service';
import { filterRuleService } from '@/lib/services/filter-rule.service';
import { analyzeEmail } from '@/lib/workflows/email-intelligence';
import { IncomingEmailPayloadSchema, normalizeIncomingEmailPayload } from '@/lib/email/ingestion';
import { recordEmailIngestion } from '@/lib/email/ingestion-metrics';
import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookRequest } from '@/lib/security/webhook-verification';
import { createEmailActionProposal } from '@/lib/services/action-proposal.service';
import { checkRateLimit, getClientIP } from '@/lib/rate-limit';

/** Détecte une erreur Prisma connue par duck-typing (portable entre versions Prisma). */
function isPrismaKnownError(error: unknown, code: string): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === code
  );
}

const MAX_WEBHOOK_BODY_BYTES = 1_100_000;

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  try {
    const expectedWebhookSecret = process.env.INCOMING_EMAIL_WEBHOOK_SECRET;
    if (!expectedWebhookSecret) {
      logger.error('[EMAIL] Secret webhook entrant non configure');
      recordEmailIngestion({
        outcome: 'config_error',
        durationMs: Date.now() - startedAt,
      });
      return NextResponse.json({ error: 'Service indisponible' }, { status: 503 });
    }

    const declaredContentLength = Number(request.headers.get('content-length'));
    if (Number.isFinite(declaredContentLength) && declaredContentLength > MAX_WEBHOOK_BODY_BYTES) {
      return NextResponse.json({ error: 'Payload trop volumineux' }, { status: 413 });
    }

    const rateLimit = await checkRateLimit(`incoming-email:${getClientIP(request)}`, 'webhook');
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Trop de requêtes. Réessayez plus tard.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.max(1, Math.ceil((rateLimit.reset.getTime() - Date.now()) / 1000))) },
        }
      );
    }

    const rawRequestBody = await request.text();
    if (Buffer.byteLength(rawRequestBody, 'utf8') > MAX_WEBHOOK_BODY_BYTES) {
      return NextResponse.json({ error: 'Payload trop volumineux' }, { status: 413 });
    }

    // Verify webhook with HMAC signature and timestamp
    const verification = verifyWebhookRequest(
      request,
      rawRequestBody,
      expectedWebhookSecret,
      {
        signatureHeader: 'x-webhook-signature',
        timestampHeader: 'x-webhook-timestamp',
        maxAge: 5 * 60, // 5 minutes
      }
    );

    if (!verification.valid) {
      logger.warn('[EMAIL_WEBHOOK] Signature verification failed');
      recordEmailIngestion({
        outcome: 'unauthorized',
        durationMs: Date.now() - startedAt,
      });
      return verification.response;
    }

    let requestBody: unknown;
    try {
      requestBody = JSON.parse(rawRequestBody);
    } catch {
      recordEmailIngestion({
        outcome: 'invalid_json',
        durationMs: Date.now() - startedAt,
      });
      return NextResponse.json({ error: 'Payload JSON invalide' }, { status: 400 });
    }

    const parsedPayload = IncomingEmailPayloadSchema.safeParse(requestBody);
    if (!parsedPayload.success) {
      recordEmailIngestion({
        outcome: 'invalid_payload',
        durationMs: Date.now() - startedAt,
      });
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
      logger.info('[EMAIL] Aucun tenant trouve pour le destinataire');
      recordEmailIngestion({
        outcome: 'tenant_not_found',
        durationMs: Date.now() - startedAt,
      });
      return NextResponse.json({ error: 'Destinataire non trouve' }, { status: 404 });
    }

    const duplicateEmail = await findDuplicateEmail(tenant.id, normalized);
    if (duplicateEmail) {
      try {
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
            contentHash: normalized.contentHash,
          },
        });
      } catch {
        logger.error('[EMAIL] EventLog duplicate best-effort failed');
      }

      return NextResponse.json({
        success: true,
        duplicate: true,
        emailId: duplicateEmail.id,
        message: 'Email deja traite (idempotent)',
      });
    }

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
    } catch {
      logger.error('[EMAIL] Erreur analyse IA');
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
          receivedAt: normalized.receivedAt,
          receivedDate: normalized.receivedDate,
        },
      });
    } catch (error) {
      // Handle race conditions on unique messageId inserts with an idempotent response.
      if (isPrismaKnownError(error, 'P2002')) {
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

    // RULE-005: Tracer réception/classification en best effort (ne jamais bloquer l'ingestion)
    try {
      await eventLogService.createEventLog({
        eventType: 'FLOW_RECEIVED',
        entityType: 'email',
        entityId: email.id,
        actorType: 'SYSTEM',
        tenantId: tenant.id,
        metadata: {
          source: 'incoming-webhook',
          category,
          urgency,
          hasAttachments: attachments && attachments.length > 0,
        },
      });

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
    } catch {
      logger.error('[EMAIL] EventLog best-effort failed');
    }

    // Phase 3: Évaluer et appliquer règles de filtrage (best effort)
    try {
      const ruleMatches = await filterRuleService.evaluateAllRules(email, tenant.id);
      for (const match of ruleMatches) {
        await filterRuleService.applyActions(email.id, match.rule, tenant.id);
        logger.info('[FILTER-RULE] Appliquée');
      }
    } catch {
      logger.error('[EMAIL] Filter rules best-effort failed');
    }

    // Phase 4: Calculer score Smart Inbox (best effort)
    try {
      const scoreResult = await smartInboxService.calculateScore(email, tenant.id);
      await smartInboxService.saveScore(email.id, scoreResult, tenant.id);
      logger.info('[SMART-INBOX] Score calculé');
    } catch {
      logger.error('[EMAIL] Smart inbox best-effort failed');
    }

    // Phase 5: Créer une proposition structurée et idempotente pour validation humaine.
    try {
      await createEmailActionProposal({
        tenantId: tenant.id,
        emailId: email.id,
        category,
        urgency: normalizeProposalUrgency(urgency),
        sentiment,
        hasAttachments: normalized.hasAttachments,
        receivedAt: normalized.receivedAt,
      });
    } catch {
      logger.error('[EMAIL] Action proposal creation failed');
    }

    // Creer les pieces jointes si presentes
    if (attachments.length > 0) {
      try {
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
      } catch (attachmentError) {
        recordEmailIngestion({
          outcome: 'attachment_error',
          durationMs: Date.now() - startedAt,
          tenantId: tenant.id,
          category,
          urgency,
          hasAttachments: true,
          error: 'attachment_error',
        });
        throw attachmentError;
      }
    }

    // Declencher le workflow approprie (best effort)
    let workflowId: string | null = null;
    try {
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
            category,
            urgency,
          }),
          startedAt: new Date(),
        },
      });

      workflowId = workflow.id;

      // Simuler l'execution du workflow (etapes)
      await executeWorkflowSteps(workflow.id, email, category, urgency);
    } catch {
      logger.error('[EMAIL] Workflow best-effort failed');
    }

    recordEmailIngestion({
      outcome: 'success',
      durationMs: Date.now() - startedAt,
      tenantId: tenant.id,
      category,
      urgency,
      hasAttachments: attachments.length > 0,
    });

    return NextResponse.json({
      success: true,
      emailId: email.id,
      workflowId,
      category,
      urgency,
      message: workflowId
        ? 'Email recu et workflow declenche'
        : 'Email recu (workflow indisponible)',
    });
  } catch {
    logger.error('[EMAIL] Erreur reception email');
    recordEmailIngestion({
      outcome: 'server_error',
      durationMs: Date.now() - startedAt,
      error: 'server_error',
    });
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

function normalizeProposalUrgency(urgency: string): 'low' | 'medium' | 'high' | 'critical' {
  if (urgency === 'low' || urgency === 'high' || urgency === 'critical') {
    return urgency;
  }
  return 'medium';
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
  const orConditions: {
    messageId?: string | null;
    providerMessageId?: string | null;
    internetMessageId?: string | null;
    contentHash?: string | null;
  }[] = [];

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
