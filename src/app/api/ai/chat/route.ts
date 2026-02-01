import { NextRequest, NextResponse } from 'next/server';
import { traceAsync, collectMetric } from '@/lib/monitoring';
import { checkAICostLimit, recordAIUsage } from '@/lib/billing/cost-guard';

export async function POST(request: NextRequest) {
  const startTime = performance.now();
  
  try {
    const { message, tenantId, context } = await request.json();
    
    // Vérifier la limite de coûts IA
    if (tenantId) {
      const costCheck = await checkAICostLimit(tenantId, 'gpt-4-turbo');
      if (!costCheck.allowed) {
        return NextResponse.json(
          { success: false, error: 'AI budget limit reached', budgetRemaining: costCheck.budgetRemaining },
          { status: 429 }
        );
      }
    }
    
    const response = await traceAsync(
      'ai.chat.process',
      () => processAIChat(message, tenantId, context),
      { operation: 'ai.inference', tags: { model: 'local' } }
    );
    
    // Enregistrer l'utilisation (coût approximatif)
    if (tenantId) {
      await recordAIUsage(tenantId, 'local-llm', message.length, response.content.length);
    }
    
    // Collecter la métrique de performance
    collectMetric('api.ai.chat', performance.now() - startTime);
    
    return NextResponse.json({
      success: true,
      content: response.content,
      suggestedActions: response.actions
    });
  } catch (error) {
    collectMetric('api.ai.chat.error', performance.now() - startTime);
    return NextResponse.json(
      { success: false, error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}

async function processAIChat(message: string, tenantId: string, context: string) {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('dossier')) {
    return {
      content: 'Je peux vous aider avec la gestion de vos dossiers. Que souhaitez-vous faire ?',
      actions: [
        { id: 'create-dossier', label: ' Creer un nouveau dossier', type: 'navigate', target: '/dossiers/nouveau' },
        { id: 'view-dossiers', label: ' Voir tous les dossiers', type: 'navigate', target: '/dossiers' }
      ]
    };
  }
  
  if (lowerMessage.includes('client')) {
    return {
      content: 'Je peux vous aider avec la gestion de vos clients.',
      actions: [
        { id: 'add-client', label: ' Ajouter un client', type: 'navigate', target: '/clients/nouveau' },
        { id: 'view-clients', label: ' Voir tous les clients', type: 'navigate', target: '/clients' }
      ]
    };
  }
  
  return {
    content: 'Je comprends votre demande. Comment puis-je vous aider davantage ?',
    actions: [
      { id: 'dashboard', label: '🏠 Tableau de bord', type: 'navigate', target: '/dashboard' }
    ]
  };
}
