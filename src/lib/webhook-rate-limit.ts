import { NextRequest } from 'next/server';

export async function checkWebhookRateLimit(req: NextRequest, channel: string) {
  return { success: true, remaining: 100, resetTime: new Date() };
}
