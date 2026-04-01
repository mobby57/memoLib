import { NextResponse } from 'next/server';

/**
 * Route de démo - Authentification temporaire sans DB
 * À SUPPRIMER EN PRODUCTION
 */
export async function POST(req: Request) {
  try {
    const isDemoMode = process.env.DEMO_MODE === 'true' || process.env.DEMO_MODE === '1';
    if (process.env.NODE_ENV === 'production' || !isDemoMode) {
      return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }

    const { email, password } = await req.json();

    const demoAdminPassword = process.env.DEMO_ADMIN_PASSWORD;
    const demoLawyerPassword = process.env.DEMO_LAWYER_PASSWORD;
    const demoClientPassword = process.env.DEMO_CLIENT_PASSWORD;

    if (!demoAdminPassword || !demoLawyerPassword || !demoClientPassword) {
      return NextResponse.json({ error: 'Demo credentials not configured' }, { status: 503 });
    }

    // Comptes de démonstration hardcodés
    const demoUsers = {
      'admin@memolib.fr': {
        id: 'demo-admin-1',
        email: 'admin@memolib.fr',
        name: 'Admin Demo',
        role: 'SUPER_ADMIN',
        password: demoAdminPassword,
        tenantId: 'demo-tenant-1',
      },
      'avocat@memolib.fr': {
        id: 'demo-lawyer-1',
        email: 'avocat@memolib.fr',
        name: 'Avocat Demo',
        role: 'LAWYER',
        password: demoLawyerPassword,
        tenantId: 'demo-tenant-1',
      },
      'client@memolib.fr': {
        id: 'demo-client-1',
        email: 'client@memolib.fr',
        name: 'Client Demo',
        role: 'CLIENT',
        password: demoClientPassword,
        tenantId: 'demo-tenant-1',
        clientId: 'demo-client-1',
      },
    };

    const user = demoUsers[email as keyof typeof demoUsers];

    if (!user || user.password !== password) {
      return NextResponse.json({ error: 'Email ou mot de passe incorrect' }, { status: 401 });
    }

    // Retourner les infos utilisateur (sans le mot de passe)
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      user: userWithoutPassword,
      success: true,
    });
  } catch (error) {
    console.error('Erreur demo-login:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
