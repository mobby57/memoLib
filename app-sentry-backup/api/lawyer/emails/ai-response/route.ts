import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { aiResponseService } from '@/lib/email/ai-response-service';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await req.json();
    const { emailId, action, data } = body;

    if (!emailId) {
      return NextResponse.json({ error: 'emailId requis' }, { status: 400 });
    }

    let result;

    switch (action) {
      case 'generate':
        result = await aiResponseService.generateResponse(emailId, data?.context);
        return NextResponse.json({ 
          success: true, 
          response: result 
        });

      case 'improve':
        if (!data?.currentDraft || !data?.instructions) {
          return NextResponse.json(
            { error: 'currentDraft et instructions requis' },
            { status: 400 }
          );
        }
        result = await aiResponseService.improveResponse(
          emailId,
          data.currentDraft,
          data.instructions
        );
        return NextResponse.json({ 
          success: true, 
          response: result 
        });

      case 'extract':
        result = await aiResponseService.extractStructuredData(emailId);
        return NextResponse.json({ 
          success: true, 
          extracted: result 
        });

      case 'summarize':
        result = await aiResponseService.generateSummary(
          emailId,
          data?.maxLength || 100
        );
        return NextResponse.json({ 
          success: true, 
          summary: result 
        });

      default:
        return NextResponse.json(
          { error: 'Action non supportée' },
          { status: 400 }
        );
    }

  } catch (error: any) {
    console.error('Erreur API AI responses:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error.message },
      { status: 500 }
    );
  }
}
