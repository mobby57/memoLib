import { NextRequest, NextResponse } from 'next/server';
import { checkDeadlineAlerts } from '@/lib/cron/deadline-alerts';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'dev-secret';

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const result = await checkDeadlineAlerts();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Alertes vérifiées',
      stats: result,
    });
  } catch (error) {
    console.error('Erreur cron deadline-alerts:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
