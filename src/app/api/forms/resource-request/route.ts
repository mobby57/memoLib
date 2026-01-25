import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

/**
 *  API: Soumission de demande de ressources
 */

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const data = await request.json();
    const { resourceType, justification, urgency, estimatedCost, duration, alternatives, metadata } = data;

    // Creer la demande dans la base de donnees
    const submission = await prisma.$executeRaw`
      INSERT INTO FormSubmission (
        id, formType, submitterId, status, data, impactScore, 
        requiresApproval, createdAt, updatedAt
      ) VALUES (
        ${generateId()},
        'resource-request',
        ${session.user.email},
        'pending',
        ${JSON.stringify(data)},
        ${metadata.impactScore},
        ${metadata.requiresApproval},
        ${new Date().toISOString()},
        ${new Date().toISOString()}
      )
    `;

    // Si approbation requise, creer les taches d'approbation
    if (metadata.requiresApproval && metadata.approvers) {
      for (const approver of metadata.approvers) {
        await createApprovalTask(submission, approver, metadata);
      }
    }

    // Envoyer notification par email
    await sendNotificationEmail(metadata.approvers, {
      formType: 'Demande de ressources',
      submitter: session.user.email,
      urgency,
      impactScore: metadata.impactScore,
    });

    return NextResponse.json({
      success: true,
      submissionId: submission,
      message: 'Demande soumise avec succes',
    });
  } catch (error) {
    console.error('Erreur soumission:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la soumission' },
      { status: 500 }
    );
  }
}

async function createApprovalTask(submissionId: any, approver: string, metadata: any) {
  // Creer une tache d'approbation
  await prisma.$executeRaw`
    INSERT INTO ApprovalTask (
      id, submissionId, approverRole, status, dueDate, createdAt
    ) VALUES (
      ${generateId()},
      ${submissionId},
      ${approver},
      'pending',
      ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()},
      ${new Date().toISOString()}
    )
  `;
}

async function sendNotificationEmail(approvers: string[], context: any) {
  // Integration avec le systeme d'email
  // Pour l'instant, log uniquement
  console.log(' Email notification:', { approvers, context });
}

function generateId(): string {
  return `form_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
