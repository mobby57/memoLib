import { logger } from '@/lib/logger';
import { analyzeEmail } from '@/lib/workflows/email-intelligence';
import { createContextualNotification } from '@/lib/workflows/notification-engine';
import { ALL_WORKFLOWS, executeWorkflow } from '@/lib/workflows/workflow-engine';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

/**
 *  API: Declenchement automatique des workflows
 * Recoit un email, l'analyse avec l'IA, et lance le workflow approprie
 */

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const { emailData } = await request.json();

    // eTAPE 1: Analyse IA de l'email
    logger.info("Analyse IA de l'email...");
    const analysis = await analyzeEmail({
      subject: emailData.subject,
      body: emailData.body,
      from: emailData.from,
      receivedAt: new Date(emailData.receivedAt),
      attachments: emailData.attachments || [],
    });

    logger.info('Analyse terminee:', {
      category: analysis.category,
      urgency: analysis.urgency,
      questions: analysis.questions.length,
    });

    // eTAPE 2: Creer notification contextuelle obligatoire
    logger.info(' Creation notification contextuelle...');
    const notification = await createContextualNotification(analysis, session.user.email);

    logger.info('Notification creee:', { notificationId: notification.id });

    // eTAPE 3: Determiner et lancer le workflow approprie
    const workflow = determineWorkflow(analysis);

    logger.info('Lancement workflow:', { workflowName: workflow.name });
    const workflowResult = await executeWorkflow(workflow, {
      emailAnalysis: analysis,
      notification,
      userId: session.user.email,
    });

    logger.info('Workflow complete:', { success: workflowResult.success });

    return NextResponse.json({
      success: true,
      analysis: {
        category: analysis.category,
        urgency: analysis.urgency,
        sentiment: analysis.sentiment,
        questionsCount: analysis.questions.length,
        actionsCount: analysis.suggestedActions.length,
      },
      notification: {
        id: notification.id,
        title: notification.title,
        severity: notification.severity,
        actionsCount: notification.actions.length,
      },
      workflow: {
        id: workflow.id,
        name: workflow.name,
        stepsExecuted: workflowResult.results.length,
        status: workflowResult.success ? 'completed' : 'failed',
      },
      message: 'Workflow automatique lance avec succes',
    });
  } catch (error) {
    logger.error(' Erreur workflow automatique:', { error });
    return NextResponse.json({ error: 'Erreur lors du traitement automatique' }, { status: 500 });
  }
}

/**
 * Determine le workflow approprie selon l'analyse
 */
function determineWorkflow(analysis: any): any {
  const workflowMap: Record<string, number> = {
    'client-urgent': 0, // WORKFLOW_URGENT_EMAIL
    invoice: 1, // WORKFLOW_INVOICE_PROCESSING
    'new-case': 2, // WORKFLOW_NEW_CASE_INTAKE
    'legal-question': 3, // WORKFLOW_LEGAL_QUESTION_RESPONSE
    'deadline-reminder': 4, // WORKFLOW_DEADLINE_MANAGEMENT
    'court-document': 5, // WORKFLOW_COURT_DOCUMENT
  };

  const workflowIndex = workflowMap[analysis.category] ?? 0;
  return ALL_WORKFLOWS[workflowIndex];
}
