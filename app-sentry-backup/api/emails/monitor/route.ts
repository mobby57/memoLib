import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { action } = await req.json();

    if (action === 'start') {
      // Le monitoring se fait via le script séparé
      return NextResponse.json({ 
        success: true, 
        message: 'Utilisez "npm run email:monitor" dans un terminal séparé'
      });
    }

    if (action === 'status') {
      return NextResponse.json({ 
        success: true, 
        monitoring: false,
        message: 'Email monitoring via script externe'
      });
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Action invalide' 
    }, { status: 400 });

  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    monitoring: false,
    status: 'Use npm run email:monitor to start monitoring'
  });
}
