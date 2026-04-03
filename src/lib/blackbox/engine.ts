import crypto from 'crypto';

export interface BlackboxInput {
  value: number;
  category?: string;
  riskFactor?: number;
}

export interface BlackboxResult {
  score: number;
  decision: 'approve' | 'review' | 'reject';
  proof: string;
}

function getBlackboxSecret(): string {
  const secret = process.env.BLACKBOX_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error('BLACKBOX_SECRET must be defined with at least 32 characters.');
  }

  return secret;
}

function normalizeRiskFactor(riskFactor?: number): number {
  if (typeof riskFactor !== 'number' || Number.isNaN(riskFactor)) {
    return 1;
  }

  return Math.max(0.5, Math.min(riskFactor, 3));
}

function computeProprietaryScore(input: BlackboxInput): number {
  const categoryWeight = (input.category ?? 'default').length % 7;
  const riskFactor = normalizeRiskFactor(input.riskFactor);
  const raw = (input.value * 37.17 + categoryWeight * 11.3) / riskFactor;

  return Math.max(0, Math.min(100, Math.round(raw)));
}

function computeDecision(score: number): BlackboxResult['decision'] {
  if (score >= 75) {
    return 'approve';
  }

  if (score >= 45) {
    return 'review';
  }

  return 'reject';
}

function signPayload(payload: object, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
}

export function runBlackbox(input: BlackboxInput): BlackboxResult {
  const secret = getBlackboxSecret();
  const score = computeProprietaryScore(input);
  const decision = computeDecision(score);

  const proof = signPayload(
    {
      score,
      decision,
      ts: Math.floor(Date.now() / 1000),
    },
    secret
  );

  return { score, decision, proof };
}
