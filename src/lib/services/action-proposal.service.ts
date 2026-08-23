import { createHash, randomUUID } from 'crypto';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth/authOptions';
import { prisma } from '@/lib/prisma';

const proposalStatuses = ['PENDING', 'APPROVED', 'REJECTED'] as const;
const allowedRoles = new Set(['ADMIN', 'LAWYER', 'MANAGER', 'SUPER_ADMIN']);

export const ActionProposalType = {
  REVIEW_EMAIL: 'REVIEW_EMAIL',
  CREATE_DOSSIER: 'CREATE_DOSSIER',
  CREATE_LEGAL_DEADLINE: 'CREATE_LEGAL_DEADLINE',
  REQUEST_DOCUMENTS: 'REQUEST_DOCUMENTS',
  SCHEDULE_APPOINTMENT: 'SCHEDULE_APPOINTMENT',
} as const;

export const ActionProposalStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

export const ActionProposalPriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const;

export const ActionProposalRiskLevel = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
} as const;

type ActionProposalTypeValue = (typeof ActionProposalType)[keyof typeof ActionProposalType];
type ActionProposalPriorityValue = (typeof ActionProposalPriority)[keyof typeof ActionProposalPriority];
type ActionProposalRiskLevelValue = (typeof ActionProposalRiskLevel)[keyof typeof ActionProposalRiskLevel];
type ActionProposalTransaction = {
  actionProposal: typeof prisma.actionProposal;
  auditLog: typeof prisma.auditLog;
};

const ProposalIdSchema = z.string().trim().min(1).max(191);

export const ActionProposalListQuerySchema = z
  .object({
    status: z.enum(proposalStatuses).optional(),
    dossierId: ProposalIdSchema.optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    offset: z.coerce.number().int().min(0).default(0),
  })
  .strict();

export const ActionProposalDecisionSchema = z
  .object({
    reason: z.string().trim().min(1).max(500).optional(),
  })
  .strict();

const EmailActionProposalInputSchema = z
  .object({
    tenantId: z.string().trim().min(1).max(191),
    emailId: ProposalIdSchema,
    category: z.string().trim().min(1).max(64),
    urgency: z.enum(['low', 'medium', 'high', 'critical']),
    sentiment: z.string().trim().min(1).max(64),
    hasAttachments: z.boolean(),
    receivedAt: z.coerce.date(),
  })
  .strict();

export type ActionProposalActor = {
  tenantId: string;
  userId: string;
  role: string;
};

export type ActionProposalAccessResult =
  | { kind: 'ok'; actor: ActionProposalActor }
  | { kind: 'unauthenticated' }
  | { kind: 'forbidden' };

export type ActionProposalDecision =
  | typeof ActionProposalStatus.APPROVED
  | typeof ActionProposalStatus.REJECTED;

export type ActionProposalDecisionResult =
  | { kind: 'updated'; proposal: unknown }
  | { kind: 'idempotent'; proposal: unknown }
  | { kind: 'not_found' }
  | { kind: 'forbidden' }
  | { kind: 'conflict'; proposal: unknown };

export const ACTION_PROPOSAL_EXECUTION_POLICY = 'RECORD_DECISION_ONLY' as const;

export async function getActionProposalAccess(): Promise<ActionProposalAccessResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { kind: 'unauthenticated' };
  }

  const tenantId = session.user.tenantId;
  const role = session.user.role?.toUpperCase() ?? '';
  if (!tenantId || !allowedRoles.has(role)) {
    return { kind: 'forbidden' };
  }

  return {
    kind: 'ok',
    actor: {
      tenantId,
      userId: session.user.id,
      role,
    },
  };
}

export async function listActionProposals(
  actor: ActionProposalActor,
  query: z.infer<typeof ActionProposalListQuerySchema>
) {
  const where = {
    tenantId: actor.tenantId,
    ...(query.status ? { status: query.status } : {}),
    ...(query.dossierId ? { dossierId: query.dossierId } : {}),
  };

  const [proposals, total] = await Promise.all([
    prisma.actionProposal.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { proposedAt: 'desc' }],
      take: query.limit,
      skip: query.offset,
    }),
    prisma.actionProposal.count({ where }),
  ]);

  return { proposals, total, hasMore: query.offset + proposals.length < total };
}

export async function createEmailActionProposal(input: unknown) {
  const parsed = EmailActionProposalInputSchema.parse(input);
  const type = getProposalType(parsed.category);
  const priority = getPriority(parsed.urgency);
  const riskLevel = getRiskLevel(parsed.urgency);
  const payloadJson = JSON.stringify({
    source: 'EMAIL_INGESTION',
    category: parsed.category,
    urgency: parsed.urgency,
    sentiment: parsed.sentiment,
    hasAttachments: parsed.hasAttachments,
    receivedAt: parsed.receivedAt.toISOString(),
  });
  const idempotencyKey = `email:${parsed.emailId}:triage:v1`;

  return prisma.actionProposal.upsert({
    where: {
      tenantId_idempotencyKey: {
        tenantId: parsed.tenantId,
        idempotencyKey,
      },
    },
    create: {
      id: randomUUID(),
      tenantId: parsed.tenantId,
      emailId: parsed.emailId,
      type,
      status: ActionProposalStatus.PENDING,
      priority,
      riskLevel,
      rationale: getRationale(type),
      payloadJson,
      proposedBy: 'SYSTEM',
      idempotencyKey,
    },
    update: {},
  });
}

export async function decideActionProposal(
  actor: ActionProposalActor,
  id: string,
  decision: ActionProposalDecision,
  reason?: string
): Promise<ActionProposalDecisionResult> {
  const existing = await prisma.actionProposal.findUnique({
    where: { id },
    select: { id: true, tenantId: true },
  });
  if (!existing) {
    return { kind: 'not_found' };
  }
  if (existing.tenantId !== actor.tenantId) {
    return { kind: 'forbidden' };
  }

  return prisma.$transaction(async (tx: ActionProposalTransaction) => {
    const decisionAt = new Date();
    const update = await tx.actionProposal.updateMany({
      where: {
        id,
        tenantId: actor.tenantId,
        status: ActionProposalStatus.PENDING,
      },
      data: {
        status: decision,
        decidedAt: decisionAt,
        decidedBy: actor.userId,
        decisionReason: reason ?? null,
        ...(decision === ActionProposalStatus.APPROVED
          ? {
              executedAt: null,
              executedBy: null,
              executionResult: JSON.stringify({
                policy: ACTION_PROPOSAL_EXECUTION_POLICY,
                externalEffect: 'NOT_EXECUTED',
              }),
            }
          : {}),
      },
    });

    const proposal = await tx.actionProposal.findUnique({ where: { id } });
    if (!proposal || proposal.tenantId !== actor.tenantId) {
      return { kind: 'not_found' };
    }

    if (update.count === 0) {
      if (proposal.status === decision) {
        return { kind: 'idempotent', proposal };
      }
      return { kind: 'conflict', proposal };
    }

    await writeDecisionAudit(tx, actor, proposal.id, decision, proposal.type, decisionAt);
    return { kind: 'updated', proposal };
  });
}

function getProposalType(category: string): ActionProposalTypeValue {
  switch (category) {
    case 'new-case':
    case 'client-urgent':
      return ActionProposalType.CREATE_DOSSIER;
    case 'deadline-reminder':
      return ActionProposalType.CREATE_LEGAL_DEADLINE;
    case 'document-request':
      return ActionProposalType.REQUEST_DOCUMENTS;
    case 'appointment-request':
      return ActionProposalType.SCHEDULE_APPOINTMENT;
    default:
      return ActionProposalType.REVIEW_EMAIL;
  }
}

function getPriority(urgency: z.infer<typeof EmailActionProposalInputSchema>['urgency']): ActionProposalPriorityValue {
  switch (urgency) {
    case 'critical':
      return ActionProposalPriority.CRITICAL;
    case 'high':
      return ActionProposalPriority.HIGH;
    case 'low':
      return ActionProposalPriority.LOW;
    default:
      return ActionProposalPriority.MEDIUM;
  }
}

function getRiskLevel(urgency: z.infer<typeof EmailActionProposalInputSchema>['urgency']): ActionProposalRiskLevelValue {
  if (urgency === 'critical' || urgency === 'high') {
    return ActionProposalRiskLevel.HIGH;
  }
  if (urgency === 'medium') {
    return ActionProposalRiskLevel.MEDIUM;
  }
  return ActionProposalRiskLevel.LOW;
}

function getRationale(type: ActionProposalTypeValue): string {
  const rationaleByType: Record<ActionProposalTypeValue, string> = {
    [ActionProposalType.REVIEW_EMAIL]: 'Analyse serveur requiert une revue humaine.',
    [ActionProposalType.CREATE_DOSSIER]: 'Analyse serveur suggère une ouverture de dossier à valider.',
    [ActionProposalType.CREATE_LEGAL_DEADLINE]: 'Analyse serveur signale un délai potentiel à valider.',
    [ActionProposalType.REQUEST_DOCUMENTS]: 'Analyse serveur suggère une demande de documents à valider.',
    [ActionProposalType.SCHEDULE_APPOINTMENT]: 'Analyse serveur suggère un rendez-vous à valider.',
  };
  return rationaleByType[type];
}

async function writeDecisionAudit(
  tx: ActionProposalTransaction,
  actor: ActionProposalActor,
  proposalId: string,
  decision: ActionProposalDecision,
  proposalType: ActionProposalTypeValue,
  timestamp: Date
) {
  const previousLog = await tx.auditLog.findFirst({
    where: { tenantId: actor.tenantId },
    orderBy: { timestamp: 'desc' },
    select: { id: true, timestampHash: true },
  });
  const action = decision === ActionProposalStatus.APPROVED ? 'APPROVE' : 'REJECT';
  const timestampHash = createHash('sha256')
    .update(`${action}|ActionProposal|${proposalId}|${timestamp.toISOString()}|${previousLog?.timestampHash || ''}`)
    .digest('hex');

  await tx.auditLog.create({
    data: {
      id: randomUUID(),
      tenantId: actor.tenantId,
      userId: actor.userId,
      userEmail: createHash('sha256').update(actor.userId).digest('hex'),
      userRole: actor.role,
      action,
      entityType: 'ActionProposal',
      entityId: proposalId,
      oldValue: JSON.stringify({ status: ActionProposalStatus.PENDING }),
      newValue: JSON.stringify({
        status: decision,
        proposalType,
        executionPolicy:
          decision === ActionProposalStatus.APPROVED ? ACTION_PROPOSAL_EXECUTION_POLICY : undefined,
      }),
      timestamp,
      timestampHash,
      previousLogId: previousLog?.id ?? null,
    },
  });
}

export function parseActionProposalId(id: string) {
  return ProposalIdSchema.safeParse(id);
}
