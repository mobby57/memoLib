/**
 * Service Gmail Add-on / Extension
 *
 * Fournit les endpoints nécessaires pour un plugin Gmail (extension Chrome)
 * qui permet de :
 * 1. Analyser un email directement depuis Gmail (résumé IA)
 * 2. Créer un dossier depuis un email Gmail
 * 3. Voir le contexte client si le mail est d'un client connu
 *
 * Architecture :
 * - Extension Chrome injecte un sidebar dans Gmail
 * - Communique avec l'API MemoLib via ces endpoints
 * - Auth via token API (pas de session cookie)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/integrations/gmail/analyze
 * Reçoit un email depuis le plugin Gmail, retourne le résumé IA + contexte client
 */
export async function POST(req: NextRequest) {
  const token = req.headers.get('x-api-key');
  if (!token) return NextResponse.json({ error: 'API key requise (header x-api-key)' }, { status: 401 });

  // Valider le token API
  const apiKey = await prisma.apiKey.findFirst({
    where: { key: token, active: true },
    include: { tenant: true },
  });
  if (!apiKey) return NextResponse.json({ error: 'API key invalide' }, { status: 401 });

  const { subject, body, from, to, messageId } = await req.json();

  if (!body) return NextResponse.json({ error: 'body requis' }, { status: 400 });

  // Chercher si le client est connu
  const clientEmail = from?.match(/<([^>]+)>/)?.[1] || from;
  const knownClient = clientEmail ? await prisma.client.findFirst({
    where: { tenantId: apiKey.tenantId, email: clientEmail },
    select: { id: true, firstName: true, lastName: true, dossiers: { select: { numero: true, typeDossier: true, statut: true }, take: 5, orderBy: { createdAt: 'desc' } } },
  }) : null;

  // Résumé IA via l'endpoint interne
  let summary = null;
  try {
    const aiRes = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/ai/summarize-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': `next-auth.session-token=internal` },
      body: JSON.stringify({ subject, body, from }),
    });
    if (aiRes.ok) summary = await aiRes.json();
  } catch { /* fallback: pas de résumé */ }

  // Vérifier si cet email existe déjà (déduplication)
  const exists = messageId ? await prisma.email.findFirst({
    where: { tenantId: apiKey.tenantId, messageId },
    select: { id: true, dossierId: true },
  }) : null;

  return NextResponse.json({
    success: true,
    client: knownClient ? {
      name: `${knownClient.firstName} ${knownClient.lastName}`,
      dossiers: knownClient.dossiers,
    } : null,
    summary,
    alreadyImported: !!exists,
    existingDossierId: exists?.dossierId,
    actions: {
      createDossier: '/api/emails/create-dossier',
      importEmail: '/api/webhooks/email-inbound',
    },
  });
}
