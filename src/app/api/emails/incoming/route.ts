/**
 * API Route - Réception Email Entrant (Webhook)
 * POST /api/emails/incoming - Reçoit un email et déclenche le workflow
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { analyzeEmail } from '@/lib/workflows/email-intelligence';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { from, to, subject, body: emailBody, htmlBody, attachments, messageId } = body;

    if (!from || !to || !subject) {
      return NextResponse.json(
        { error: 'from, to et subject sont requis' },
        { status: 400 }
      );
    }

    // Trouver le tenant destinataire basé sur l'email "to"
    const tenant = await prisma.tenant.findFirst({
      where: {
        users: {
          some: {
            email: to.toLowerCase(),
            role: { in: ['ADMIN', 'LAWYER', 'USER'] }
          }
        }
      }
    });

    if (!tenant) {
      console.log(`[EMAIL] Aucun tenant trouvé pour: ${to}`);
      return NextResponse.json(
        { error: 'Destinataire non trouvé' },
        { status: 404 }
      );
    }

    // Chercher si l'expéditeur est un client connu
    const client = await prisma.client.findFirst({
      where: {
        tenantId: tenant.id,
        email: from.toLowerCase()
      }
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
        attachments
      });
      
      aiAnalysis = JSON.stringify(analysis);
      category = analysis.category;
      urgency = analysis.urgency;
      sentiment = analysis.sentiment;
    } catch (aiError) {
      console.error('[EMAIL] Erreur analyse IA:', aiError);
      // Continuer sans analyse IA
    }

    // Créer l'email dans la base
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
        receivedAt: new Date()
      }
    });

    // Créer les pièces jointes si présentes
    if (attachments && attachments.length > 0) {
      await prisma.emailAttachment.createMany({
        data: attachments.map((att: any) => ({
          emailId: email.id,
          filename: att.filename,
          mimeType: att.mimeType || 'application/octet-stream',
          size: att.size || 0,
          storageKey: att.storageKey
        }))
      });
    }

    // Déclencher le workflow approprié
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
          clientId: client?.id
        }),
        startedAt: new Date()
      }
    });

    // Simuler l'exécution du workflow (étapes)
    await executeWorkflowSteps(workflow.id, email, category, urgency);

    return NextResponse.json({
      success: true,
      emailId: email.id,
      workflowId: workflow.id,
      category,
      urgency,
      message: 'Email reçu et workflow déclenché'
    });

  } catch (error) {
    console.error('[EMAIL] Erreur réception email:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: String(error) },
      { status: 500 }
    );
  }
}

function getWorkflowName(category: string): string {
  const names: Record<string, string> = {
    'client-urgent': 'Traitement Email Urgent',
    'new-case': 'Ouverture Nouveau Dossier',
    'deadline-reminder': 'Gestion Échéance',
    'invoice': 'Traitement Facture',
    'legal-question': 'Réponse Question Juridique',
    'court-document': 'Document Judiciaire',
    'client-complaint': 'Réclamation Client',
    'document-request': 'Demande Document',
    'appointment-request': 'Demande Rendez-vous',
    'general-inquiry': 'Demande Générale'
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
    { name: 'completed', progress: 100 }
  ];

  // Simuler l'exécution progressive des étapes
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
            completedAt: new Date().toISOString()
          }))
        )
      }
    });
  }

  // Marquer le workflow comme terminé
  await prisma.workflowExecution.update({
    where: { id: workflowId },
    data: {
      status: 'completed',
      completedAt: new Date(),
      result: JSON.stringify({
        emailProcessed: true,
        category,
        urgency,
        actions: ['Email classifié', 'Notification envoyée']
      })
    }
  });

  // Marquer l'email comme traité
  await prisma.email.update({
    where: { id: email.id },
    data: {
      isProcessed: true,
      processedAt: new Date()
    }
  });
}
