import { NextResponse } from 'next/server';

/**
 * Route de démo - Authentification temporaire sans DB
 * À SUPPRIMER EN PRODUCTION
 */
export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    // Comptes de démonstration hardcodés
    const demoUsers = {
      'admin@memolib.fr': {
        id: 'demo-admin-1',
        email: 'admin@memolib.fr',
        name: 'Admin Demo',
        role: 'SUPER_ADMIN',
        password: 'admin123',
        tenantId: 'demo-tenant-1',
      },
      'avocat@memolib.fr': {
        id: 'demo-lawyer-1',
        email: 'avocat@memolib.fr',
        name: 'Avocat Demo',
        role: 'LAWYER',
        password: 'admin123',
        tenantId: 'demo-tenant-1',
      },
      'client@memolib.fr': {
        id: 'demo-client-1',
        email: 'client@memolib.fr',
        name: 'Client Demo',
        role: 'CLIENT',
        password: 'demo123',
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
