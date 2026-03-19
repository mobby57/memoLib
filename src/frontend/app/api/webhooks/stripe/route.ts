import { NextRequest, NextResponse } from "next/server";
import { POST as canonicalWebhookPost } from '@/app/api/payments/webhook/route';

export async function POST(req: NextRequest) {
  return canonicalWebhookPost(req);
}
