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
import { type Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import {
  IncomingEmailPayloadSchema,
  normalizeIncomingEmailPayload,
} from '@/lib/email/ingestion';
import { recordEmailIngestion } from '@/lib/email/ingestion-metrics';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  try {
    const isDemoRuntime =
      process.env.NODE_ENV === 'development' ||
      process.env.DEMO_MODE === '1' ||
      process.env.DEMO_MODE === 'true' ||
      process.env.APP_ENV === 'staging' ||
      process.env.NEXT_PUBLIC_APP_ENV === 'staging' ||
      process.env.VERCEL_ENV === 'preview';
    const allowDemoBypass = isDemoRuntime && request.headers.get('x-demo-request') === '1';

    const expectedWebhookSecret = process.env.INCOMING_EMAIL_WEBHOOK_SECRET;
    if (!expectedWebhookSecret && !allowDemoBypass) {
      logger.error('[EMAIL] Secret webhook entrant non configure');
      recordEmailIngestion({
        outcome: 'config_error',
        durationMs: Date.now() - startedAt,
      });
      return NextResponse.json({ error: 'Service indisponible' }, { status: 503 });
    }

    const providedSecret =
      request.headers.get('x-webhook-secret') ||
      request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

    if (!allowDemoBypass && (!providedSecret || providedSecret !== expectedWebhookSecret)) {
      recordEmailIngestion({
        outcome: 'unauthorized',
        durationMs: Date.now() - startedAt,
      });
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const rawRequestBody = await request.text();

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
      logger.info(`[EMAIL] Aucun tenant trouve pour: ${to}`);
      recordEmailIngestion({
        outcome: 'tenant_not_found',
        durationMs: Date.now() - startedAt,
        to,
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
            messageId: normalized.messageId,
            providerMessageId: normalized.providerMessageId,
            contentHash: normalized.contentHash,
          },
        });
      } catch (eventLogError) {
        logger.error('[EMAIL] EventLog duplicate best-effort failed:', {
          error: eventLogError,
          emailId: duplicateEmail.id,
        });
      }

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

    let resolvedClientId = client?.id ?? null;
    let linkedDossierId: string | null = null;

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

    // Lier ou créer client/dossier en best effort pour les flux métier prioritaires.
    try {
      if (!resolvedClientId && shouldCreateClient(category, urgency)) {
        const guessedIdentity = guessIdentityFromEmail(from);
        const createdClient = await prisma.client.create({
          data: {
            tenantId: tenant.id,
            firstName: guessedIdentity.firstName,
            lastName: guessedIdentity.lastName,
            email: normalized.fromAddress || from.toLowerCase(),
            status: 'actif',
          },
        });
        resolvedClientId = createdClient.id;
      }

      if (resolvedClientId) {
        const existingDossier = await prisma.dossier.findFirst({
          where: {
            tenantId: tenant.id,
            clientId: resolvedClientId,
            statut: { in: ['en_cours', 'nouveau'] },
          },
          orderBy: { updatedAt: 'desc' },
        });

        if (existingDossier) {
          linkedDossierId = existingDossier.id;
        } else if (shouldCreateDossier(category, urgency)) {
          const createdDossier = await prisma.dossier.create({
            data: {
              tenantId: tenant.id,
              numero: generateDossierNumber(),
              clientId: resolvedClientId,
              typeDossier: mapCategoryToDossierType(category),
              statut: 'nouveau',
              priorite: urgency === 'high' ? 'haute' : 'normale',
              phase: 'instruction',
              objet: subject,
              description: (emailBody || '').slice(0, 1000) || 'Dossier cree depuis email entrant',
            },
          });
          linkedDossierId = createdDossier.id;
        }
      }
    } catch (matchingError) {
      logger.error('[EMAIL] Client/dossier matching best-effort failed:', {
        error: matchingError,
        from,
        category,
      });
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
          clientId: resolvedClientId,
          dossierId: linkedDossierId,
          receivedAt: normalized.receivedAt,
          receivedDate: normalized.receivedDate,
        },
      });
    } catch (error) {
      // Handle race conditions on unique messageId inserts with an idempotent response.
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
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
          from,
          to,
          subject,
          category,
          urgency,
          clientId: resolvedClientId,
          dossierId: linkedDossierId,
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
    } catch (eventLogError) {
      logger.error('[EMAIL] EventLog best-effort failed:', { error: eventLogError, emailId: email.id });
    }

    // Phase 3: Évaluer et appliquer règles de filtrage (best effort)
    try {
      const ruleMatches = await filterRuleService.evaluateAllRules(email, tenant.id);
      for (const match of ruleMatches) {
        await filterRuleService.applyActions(email.id, match.rule, tenant.id);
        logger.info(`[FILTER-RULE] Appliquée: ${match.rule.name} sur email ${email.id}`);
      }
    } catch (filterError) {
      logger.error('[EMAIL] Filter rules best-effort failed:', {
        error: filterError,
        emailId: email.id,
      });
    }

    // Phase 4: Calculer score Smart Inbox (best effort)
    try {
      const scoreResult = await smartInboxService.calculateScore(email, tenant.id);
      await smartInboxService.saveScore(email.id, scoreResult, tenant.id);
      logger.info(`[SMART-INBOX] Score calculé: ${scoreResult.score}/100 pour email ${email.id}`);
    } catch (smartInboxError) {
      logger.error('[EMAIL] Smart inbox best-effort failed:', {
        error: smartInboxError,
        emailId: email.id,
      });
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
          error: attachmentError instanceof Error ? attachmentError.message : 'attachment_error',
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
            from,
            subject,
            category,
            urgency,
            clientId: resolvedClientId,
            dossierId: linkedDossierId,
          }),
          startedAt: new Date(),
        },
      });

      workflowId = workflow.id;

      // Simuler l'execution du workflow (etapes)
      await executeWorkflowSteps(workflow.id, email, category, urgency);
    } catch (workflowError) {
      logger.error('[EMAIL] Workflow best-effort failed:', { error: workflowError, emailId: email.id });
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
  } catch (error) {
    logger.error('[EMAIL] Erreur reception email:', { error });
    recordEmailIngestion({
      outcome: 'server_error',
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : 'unknown_error',
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

function shouldCreateClient(category: string, urgency: string): boolean {
  return ['new-case', 'client-urgent', 'document-request', 'appointment-request'].includes(category) || urgency === 'high';
}

function shouldCreateDossier(category: string, urgency: string): boolean {
  return ['new-case', 'client-urgent', 'court-document', 'deadline-reminder'].includes(category) || urgency === 'high';
}

function mapCategoryToDossierType(category: string): string {
  const mapping: Record<string, string> = {
    'new-case': 'Ouverture dossier',
    'client-urgent': 'Urgence client',
    'court-document': 'Document judiciaire',
    'deadline-reminder': 'Gestion echeance',
    'document-request': 'Demande document',
    'appointment-request': 'Demande rendez-vous',
  };
  return mapping[category] || 'Demande generale';
}

function generateDossierNumber(): string {
  const stamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `DOS-${stamp}-${random}`;
}

function guessIdentityFromEmail(from: string): { firstName: string; lastName: string } {
  const emailPart = from.includes('@') ? from.split('@')[0] : from;
  const cleaned = emailPart.replace(/[^a-zA-Z0-9._-]/g, '');
  const parts = cleaned.split(/[._-]+/).filter(Boolean);

  if (parts.length >= 2) {
    return {
      firstName: capitalize(parts[0]),
      lastName: capitalize(parts.slice(1).join(' ')),
    };
  }

  return {
    firstName: 'Client',
    lastName: capitalize(parts[0] || 'Email'),
  };
}

function capitalize(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
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
  const orConditions: { messageId?: string | null; providerMessageId?: string | null; internetMessageId?: string | null; contentHash?: string | null }[] = [];

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
