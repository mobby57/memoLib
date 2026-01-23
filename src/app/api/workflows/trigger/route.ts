import { NextRequest, NextResponse } from 'next/server';
import { analyzeEmail } from '@/lib/workflows/email-intelligence';
import { createContextualNotification } from '@/lib/workflows/notification-engine';
import { executeWorkflow, ALL_WORKFLOWS } from '@/lib/workflows/workflow-engine';
import { getServerSession } from 'next-auth';

/**
 * 🔄 API: Déclenchement automatique des workflows
 * Reçoit un email, l'analyse avec l'IA, et lance le workflow approprié
 */

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { emailData } = await request.json();

    // ÉTAPE 1: Analyse IA de l'email
    console.log('🤖 Analyse IA de l\'email...');
    const analysis = await analyzeEmail({
      subject: emailData.subject,
      body: emailData.body,
      from: emailData.from,
      receivedAt: new Date(emailData.receivedAt),
      attachments: emailData.attachments || [],
    });

    console.log('✅ Analyse terminée:', {
      category: analysis.category,
      urgency: analysis.urgency,
      questions: analysis.questions.length,
    });

    // ÉTAPE 2: Créer notification contextuelle obligatoire
    console.log('🔔 Création notification contextuelle...');
    const notification = await createContextualNotification(
      analysis,
      session.user.email
    );

    console.log('✅ Notification créée:', notification.id);

    // ÉTAPE 3: Déterminer et lancer le workflow approprié
    const workflow = determineWorkflow(analysis);
    
    console.log('⚙️ Lancement workflow:', workflow.name);
    const workflowResult = await executeWorkflow(workflow, {
      emailAnalysis: analysis,
      notification,
      userId: session.user.email,
    });

    console.log('✅ Workflow complété:', workflowResult.success);

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
      message: 'Workflow automatique lancé avec succès',
    });
  } catch (error) {
    console.error('❌ Erreur workflow automatique:', error);
    return NextResponse.json(
      { error: 'Erreur lors du traitement automatique' },
      { status: 500 }
    );
  }
}

/**
 * Détermine le workflow approprié selon l'analyse
 */
function determineWorkflow(analysis: any): any {
  const workflowMap: Record<string, number> = {
    'client-urgent': 0, // WORKFLOW_URGENT_EMAIL
    'invoice': 1, // WORKFLOW_INVOICE_PROCESSING
    'new-case': 2, // WORKFLOW_NEW_CASE_INTAKE
    'legal-question': 3, // WORKFLOW_LEGAL_QUESTION_RESPONSE
    'deadline-reminder': 4, // WORKFLOW_DEADLINE_MANAGEMENT
    'court-document': 5, // WORKFLOW_COURT_DOCUMENT
  };

  const workflowIndex = workflowMap[analysis.category] ?? 0;
  return ALL_WORKFLOWS[workflowIndex];
}
