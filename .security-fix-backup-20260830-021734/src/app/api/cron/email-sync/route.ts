/**
 * CRON: /api/cron/email-sync
 * 
 * Synchronise les emails pour TOUS les tenants qui ont connecté Gmail/Outlook.
 * Exécuté toutes les 5 minutes par Vercel Cron.
 * 
 * Flow: EmailAccount (tokens OAuth) → Gmail API / Microsoft Graph → processEmail → DB
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: NextRequest) {
  // Vérifier l'authentification cron
  const authHeader = req.headers.get('authorization');
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Récupérer tous les comptes email actifs
    const accounts = await prisma.emailAccount.findMany({
      where: { isActive: true },
      select: {
        id: true,
        tenantId: true,
        provider: true,
        email: true,
        accessToken: true,
        refreshToken: true,
        tokenExpiry: true,
        lastSync: true,
      },
    });

    if (accounts.length === 0) {
      return NextResponse.json({ message: 'No active email accounts', synced: 0 });
    }

    let synced = 0;
    let errors = 0;
    const results: Array<{ email: string; status: string; count?: number; error?: string }> = [];

    for (const account of accounts) {
      try {
        // Vérifier/rafraîchir le token si expiré
        let accessToken = account.accessToken;
        if (account.tokenExpiry && new Date(account.tokenExpiry) < new Date()) {
          accessToken = await refreshOAuthToken(account);
        }

        if (!accessToken) {
          results.push({ email: account.email, status: 'error', error: 'No valid token' });
          errors++;
          continue;
        }

        // Fetch emails selon le provider
        let newEmails = 0;
        if (account.provider === 'gmail') {
          newEmails = await fetchGmailEmails(account.tenantId, account.email, accessToken, account.lastSync);
        } else if (account.provider === 'outlook' || account.provider === 'microsoft') {
          newEmails = await fetchOutlookEmails(account.tenantId, account.email, accessToken, account.lastSync);
        }

        // Mettre à jour lastSync
        await prisma.emailAccount.update({
          where: { id: account.id },
          data: { lastSync: new Date() },
        });

        synced++;
        results.push({ email: account.email, status: 'ok', count: newEmails });
      } catch (error) {
        errors++;
        const msg = error instanceof Error ? error.message : 'Unknown error';
        results.push({ email: account.email, status: 'error', error: msg });
        logger.error('Email sync failed for account', undefined, { accountId: account.id, error: msg });
      }
    }

    return NextResponse.json({
      message: `Email sync complete: ${synced} accounts synced, ${errors} errors`,
      synced,
      errors,
      total: accounts.length,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Email sync cron failed', error instanceof Error ? error : undefined);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// ============================================
// GMAIL API
// ============================================

async function fetchGmailEmails(
  tenantId: string,
  accountEmail: string,
  accessToken: string,
  lastSyncAt: Date | null
): Promise<number> {
  // Construire la query Gmail (emails non lus depuis le dernier sync)
  const after = lastSyncAt
    ? Math.floor(lastSyncAt.getTime() / 1000)
    : Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000); // 7 jours max au premier sync

  const query = `after:${after} in:inbox`;

  // 1. Lister les messages
  const listRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=20`,
    { headers: { Authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(15000) }
  );

  if (!listRes.ok) {
    if (listRes.status === 401) throw new Error('Gmail token expired');
    throw new Error(`Gmail API error: ${listRes.status}`);
  }

  const listData = await listRes.json();
  const messageIds: string[] = (listData.messages || []).map((m: { id: string }) => m.id);

  if (messageIds.length === 0) return 0;

  let imported = 0;

  // 2. Récupérer chaque message
  for (const msgId of messageIds.slice(0, 20)) { // Max 20 par cycle
    try {
      // Vérifier si déjà importé (dédup par providerMessageId)
      const existing = await prisma.email.findFirst({
        where: { tenantId, providerMessageId: msgId },
      });
      if (existing) continue;

      // Fetch le message complet
      const msgRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgId}?format=full`,
        { headers: { Authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(10000) }
      );

      if (!msgRes.ok) continue;
      const msgData = await msgRes.json();

      // Extraire les headers
      const headers = msgData.payload?.headers || [];
      const getHeader = (name: string) => headers.find((h: { name: string; value: string }) => 
        h.name.toLowerCase() === name.toLowerCase())?.value || '';

      const subject = getHeader('Subject');
      const from = getHeader('From');
      const to = getHeader('To');
      const date = getHeader('Date');

      // Extraire le body (text/plain ou text/html)
      const body = extractGmailBody(msgData.payload);

      // Sauvegarder en DB
      await prisma.email.create({
        data: {
          id: crypto.randomUUID(),
          tenantId,
          providerMessageId: msgId,
          from,
          to,
          subject,
          body: body.slice(0, 10000),
          sourceProvider: 'gmail',
          sourceChannel: 'email',
          sourceDirection: 'inbound',
          receivedAt: date ? new Date(date) : new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      imported++;
    } catch (err) {
      // Skip individual email errors, continue with the rest
      logger.warn('Failed to import Gmail message', { msgId, error: err instanceof Error ? err.message : 'unknown' });
    }
  }

  return imported;
}

function extractGmailBody(payload: any): string {
  if (!payload) return '';

  // Simple text/plain
  if (payload.mimeType === 'text/plain' && payload.body?.data) {
    return Buffer.from(payload.body.data, 'base64url').toString('utf-8');
  }

  // Multipart — chercher text/plain d'abord, puis text/html
  if (payload.parts) {
    const textPart = payload.parts.find((p: any) => p.mimeType === 'text/plain');
    if (textPart?.body?.data) {
      return Buffer.from(textPart.body.data, 'base64url').toString('utf-8');
    }
    const htmlPart = payload.parts.find((p: any) => p.mimeType === 'text/html');
    if (htmlPart?.body?.data) {
      const html = Buffer.from(htmlPart.body.data, 'base64url').toString('utf-8');
      return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }
    // Récursif pour multipart/alternative
    for (const part of payload.parts) {
      const result = extractGmailBody(part);
      if (result) return result;
    }
  }

  return '';
}

// ============================================
// OUTLOOK / MICROSOFT GRAPH
// ============================================

async function fetchOutlookEmails(
  tenantId: string,
  accountEmail: string,
  accessToken: string,
  lastSyncAt: Date | null
): Promise<number> {
  const since = lastSyncAt
    ? lastSyncAt.toISOString()
    : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Fetch emails depuis Microsoft Graph
  const url = `https://graph.microsoft.com/v1.0/me/messages?` +
    `$filter=receivedDateTime ge ${since}&` +
    `$orderby=receivedDateTime desc&` +
    `$top=20&` +
    `$select=id,subject,from,toRecipients,body,receivedDateTime`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    if (res.status === 401) throw new Error('Outlook token expired');
    throw new Error(`Microsoft Graph error: ${res.status}`);
  }

  const data = await res.json();
  const messages = data.value || [];
  let imported = 0;

  for (const msg of messages) {
    try {
      // Dédup
      const existing = await prisma.email.findFirst({
        where: { tenantId, providerMessageId: msg.id },
      });
      if (existing) continue;

      const from = msg.from?.emailAddress
        ? `${msg.from.emailAddress.name || ''} <${msg.from.emailAddress.address}>`
        : '';
      const to = (msg.toRecipients || [])
        .map((r: any) => r.emailAddress?.address)
        .filter(Boolean)
        .join(', ');

      // Body: strip HTML
      const bodyContent = msg.body?.contentType === 'text'
        ? msg.body.content
        : (msg.body?.content || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

      await prisma.email.create({
        data: {
          id: crypto.randomUUID(),
          tenantId,
          providerMessageId: msg.id,
          from,
          to,
          subject: msg.subject || '',
          body: bodyContent.slice(0, 10000),
          sourceProvider: 'outlook',
          sourceChannel: 'email',
          sourceDirection: 'inbound',
          receivedAt: msg.receivedDateTime ? new Date(msg.receivedDateTime) : new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      imported++;
    } catch (err) {
      logger.warn('Failed to import Outlook message', { msgId: msg.id, error: err instanceof Error ? err.message : 'unknown' });
    }
  }

  return imported;
}

// ============================================
// TOKEN REFRESH
// ============================================

async function refreshOAuthToken(account: {
  id: string;
  provider: string;
  refreshToken: string | null;
}): Promise<string | null> {
  if (!account.refreshToken) return null;

  let tokenUrl: string;
  let body: Record<string, string>;

  if (account.provider === 'gmail') {
    tokenUrl = 'https://oauth2.googleapis.com/token';
    body = {
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
      refresh_token: account.refreshToken,
      grant_type: 'refresh_token',
    };
  } else {
    // Microsoft
    tokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
    body = {
      client_id: process.env.MICROSOFT_CLIENT_ID || '',
      client_secret: process.env.MICROSOFT_CLIENT_SECRET || '',
      refresh_token: account.refreshToken,
      grant_type: 'refresh_token',
    };
  }

  try {
    const res = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(body),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      logger.warn('Token refresh failed', { accountId: account.id, status: res.status });
      // Désactiver le compte si le refresh échoue
      await prisma.emailAccount.update({
        where: { id: account.id },
        data: { isActive: false },
      });
      return null;
    }

    const data = await res.json();
    const newAccessToken = data.access_token;
    const expiresIn = data.expires_in || 3600;

    // Mettre à jour les tokens en DB
    await prisma.emailAccount.update({
      where: { id: account.id },
      data: {
        accessToken: newAccessToken,
        tokenExpiry: new Date(Date.now() + expiresIn * 1000),
        ...(data.refresh_token ? { refreshToken: data.refresh_token } : {}),
      },
    });

    return newAccessToken;
  } catch (error) {
    logger.error('Token refresh error', undefined, { accountId: account.id });
    return null;
  }
}
