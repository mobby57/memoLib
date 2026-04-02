import { GitHubEventType, GitHubWebhookPayload, verifyWebhookSignature } from '@/lib/github-app';
import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

// Désactiver le body parser de Next.js pour accéder au body brut
export const runtime = 'nodejs';

/**
 * Endpoint webhook GitHub
 * POST /api/github/webhook
 *
 * Reçoit les événements GitHub et les enregistre dans l'EventLog immuable
 */
export async function POST(req: NextRequest) {
  try {
    // Récupérer le body brut pour la vérification de signature
    const body = await req.text();
    const signature = req.headers.get('x-hub-signature-256');
    const event = req.headers.get('x-github-event') as GitHubEventType;
    const deliveryId = req.headers.get('x-github-delivery');

    // Vérification de la signature
    if (!verifyWebhookSignature(body, signature, process.env.GITHUB_APP_WEBHOOK_SECRET!)) {
      console.error('[GitHub Webhook] Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Parser le payload
    const payload: GitHubWebhookPayload = JSON.parse(body);

    // Générer le hash SHA-256 de l'événement pour l'EventLog
    const eventHash = createHash('sha256').update(body).digest('hex');

    // Créer l'entrée EventLog immuable
    const eventLog = {
      id: deliveryId,
      type: 'github_event',
      event_type: event,
      action: payload.action,
      timestamp: new Date().toISOString(),
      hash: eventHash,
      payload: {
        repository: payload.repository?.full_name,
        sender: payload.sender?.login,
        sender_email: payload.sender?.email,
        installation_id: payload.installation?.id,
      },
      raw_payload: payload,
    };

    console.log('[GitHub Webhook] Event received:', {
      event,
      action: payload.action,
      repository: payload.repository?.full_name,
      sender: payload.sender?.login,
      deliveryId,
    });

    // TODO: Enregistrer dans la base de données (EventLog)
    // await prisma.eventLog.create({ data: eventLog });

    // TODO: Traiter l'événement selon son type
    switch (event) {
      case 'push':
        await handlePushEvent(payload);
        break;
      case 'pull_request':
        await handlePullRequestEvent(payload);
        break;
      case 'issues':
        await handleIssuesEvent(payload);
        break;
      case 'issue_comment':
        await handleIssueCommentEvent(payload);
        break;
      case 'workflow_run':
        await handleWorkflowRunEvent(payload);
        break;
      case 'check_run':
        await handleCheckRunEvent(payload);
        break;
      case 'repository':
        await handleRepositoryEvent(payload);
        break;
      case 'member':
        await handleMemberEvent(payload);
        break;
      default:
        console.log(`[GitHub Webhook] Unhandled event type: ${event}`);
    }

    return NextResponse.json({ success: true, event, deliveryId });
  } catch (error) {
    console.error('[GitHub Webhook] Error processing webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Handlers pour chaque type d'événement

async function handlePushEvent(payload: GitHubWebhookPayload) {
  console.log('[GitHub] Push event:', {
    ref: payload.ref,
    commits: payload.commits?.length,
    pusher: payload.pusher?.name,
  });
  // TODO: Traiter les commits, lier aux dossiers/clients
}

async function handlePullRequestEvent(payload: GitHubWebhookPayload) {
  console.log('[GitHub] Pull Request event:', {
    action: payload.action,
    pr_number: payload.pull_request?.number,
    title: payload.pull_request?.title,
  });
  // TODO: Traiter la PR, créer des alertes si nécessaire
}

async function handleIssuesEvent(payload: GitHubWebhookPayload) {
  console.log('[GitHub] Issues event:', {
    action: payload.action,
    issue_number: payload.issue?.number,
    title: payload.issue?.title,
  });
  // TODO: Lier l'issue à un dossier/client
}

async function handleIssueCommentEvent(payload: GitHubWebhookPayload) {
  console.log('[GitHub] Issue Comment event:', {
    action: payload.action,
    issue_number: payload.issue?.number,
    comment_id: payload.comment?.id,
  });
  // TODO: Traiter le commentaire
}

async function handleWorkflowRunEvent(payload: GitHubWebhookPayload) {
  console.log('[GitHub] Workflow Run event:', {
    action: payload.action,
    workflow: payload.workflow_run?.name,
    status: payload.workflow_run?.status,
    conclusion: payload.workflow_run?.conclusion,
  });
  // TODO: Monitorer les CI/CD
}

async function handleCheckRunEvent(payload: GitHubWebhookPayload) {
  console.log('[GitHub] Check Run event:', {
    action: payload.action,
    check_name: payload.check_run?.name,
    status: payload.check_run?.status,
    conclusion: payload.check_run?.conclusion,
  });
  // TODO: Monitorer les checks
}

async function handleRepositoryEvent(payload: GitHubWebhookPayload) {
  console.log('[GitHub] Repository event:', {
    action: payload.action,
    repository: payload.repository?.full_name,
  });
  // TODO: Gérer les changements de repo
}

async function handleMemberEvent(payload: GitHubWebhookPayload) {
  console.log('[GitHub] Member event:', {
    action: payload.action,
    member: payload.member?.login,
  });
  // TODO: Audit des accès
}
