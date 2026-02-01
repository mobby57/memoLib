import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lawyerId = searchParams.get('lawyerId') || '1';

    // Données de démonstration
    const mockData = {
      stats: {
        totalClients: 127,
        activeDossiers: 342,
        pendingClientActions: 23,
        completedThisMonth: 89,
        aiSuggestionsToday: 12,
        clientDataCompleteness: 78
      },
      clients: [
        {
          id: '1',
          name: 'Jean Dupont',
          email: 'jean.dupont@email.com',
          avatar: 'JD',
          status: 'active',
          dossiers: { total: 3, active: 2, pending: 1, completed: 7 },
          dataCompleteness: 85,
          aiScore: 92,
          lastActivity: new Date().toISOString(),
          pendingActions: 1
        },
        {
          id: '2',
          name: 'Marie Martin',
          email: 'marie.martin@email.com',
          avatar: 'MM',
          status: 'attention',
          dossiers: { total: 5, active: 3, pending: 2, completed: 4 },
          dataCompleteness: 45,
          aiScore: 67,
          lastActivity: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          pendingActions: 3
        }
      ],
      recentActivity: [
        {
          id: '1',
          type: 'client_action',
          title: 'Documents ajoutés',
          description: 'Jean Dupont a uploadé 3 nouveaux documents',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          metadata: { dossierId: 'D-2024-001', clientId: '1' }
        },
        {
          id: '2',
          type: 'ai_action',
          title: 'Analyse IA terminée',
          description: 'Documents validés automatiquement avec 95% de confiance',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          metadata: { dossierId: 'D-2024-001', confidence: 95 }
        }
      ],
      aiInsights: [
        {
          id: '1',
          type: 'suggestion',
          title: 'Regrouper les dossiers similaires',
          description: '12 dossiers de réclamation La Poste peuvent être traités en groupe',
          impact: 'high',
          confidence: 85,
          accepted: false
        }
      ]
    };

    return NextResponse.json({
      success: true,
      data: mockData
    });

  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
