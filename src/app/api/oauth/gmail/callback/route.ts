import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export const dynamic = 'force-dynamic';

/**
 * GET /api/oauth/gmail/callback?code=xxx
 * Échange le code OAuth contre un refresh_token Gmail
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.json({ error: `OAuth denied: ${error}` }, { status: 400 });
  }

  if (!code) {
    return NextResponse.json({ error: 'Code manquant' }, { status: 400 });
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/oauth/gmail/callback`
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);

    // En production, stocker le refresh_token en DB par tenant
    // Pour le pilote, on l'affiche pour le mettre dans .env.local
    return new NextResponse(`
      <html><body style="font-family:sans-serif;padding:2rem;">
        <h1>✅ Gmail connecté!</h1>
        <p>Refresh token obtenu. Ajoute-le dans <code>.env.local</code>:</p>
        <pre style="background:#f1f5f9;padding:1rem;border-radius:8px;overflow-x:auto;">GMAIL_REFRESH_TOKEN=${tokens.refresh_token}</pre>
        <p>Puis redémarre le serveur (<code>npm run dev</code>).</p>
        <p><a href="/dashboard">← Retour au dashboard</a></p>
      </body></html>
    `, { headers: { 'Content-Type': 'text/html' } });
  } catch (e: any) {
    return NextResponse.json({ error: 'Token exchange failed', detail: e.message }, { status: 500 });
  }
}
