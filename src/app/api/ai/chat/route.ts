import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { message, tenantId, context } = await request.json();
    const response = await processAIChat(message, tenantId, context);
    
    return NextResponse.json({
      success: true,
      content: response.content,
      suggestedActions: response.actions
    });
  } catch (error) {
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
        { id: 'create-dossier', label: '📁 Créer un nouveau dossier', type: 'navigate', target: '/dossiers/nouveau' },
        { id: 'view-dossiers', label: '📋 Voir tous les dossiers', type: 'navigate', target: '/dossiers' }
      ]
    };
  }
  
  if (lowerMessage.includes('client')) {
    return {
      content: 'Je peux vous aider avec la gestion de vos clients.',
      actions: [
        { id: 'add-client', label: '👤 Ajouter un client', type: 'navigate', target: '/clients/nouveau' },
        { id: 'view-clients', label: '👥 Voir tous les clients', type: 'navigate', target: '/clients' }
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
