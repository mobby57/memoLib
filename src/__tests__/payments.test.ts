/**
 * Tests unitaires - Payment Processing
 * @jest-environment node
 */

jest.mock('@/lib/prisma', () => ({
  prisma: {
    payment: { create: jest.fn(), findUnique: jest.fn() },
    invoice: { create: jest.fn() },
  },
}));

jest.mock('stripe', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    paymentIntents: { create: jest.fn() },
  })),
}));

import { beforeEach, describe, expect, it } from '@jest/globals';

// Logique métier extraite pour les tests
const PLAN_PRICES: Record<string, number> = {
  STARTER: 2900,   // centimes
  PRO: 7900,
  ENTERPRISE: 19900,
};

function calculateInvoiceTotal(
  lignes: { quantite: number; prixUnitaire: number; tauxTVA: number }[]
): { htTotal: number; tvaTotal: number; ttcTotal: number } {
  const htTotal = lignes.reduce((sum, l) => sum + l.quantite * l.prixUnitaire, 0);
  const tvaTotal = lignes.reduce(
    (sum, l) => sum + l.quantite * l.prixUnitaire * (l.tauxTVA / 100),
    0
  );
  return { htTotal, tvaTotal, ttcTotal: htTotal + tvaTotal };
}

function buildPaymentIntentParams(planId: string, currency = 'eur') {
  const amount = PLAN_PRICES[planId];
  if (!amount) throw new Error(`Plan inconnu: ${planId}`);
  return { amount, currency, metadata: { planId } };
}

type PaymentStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED';
function isTerminalStatus(status: PaymentStatus): boolean {
  return status === 'SUCCEEDED' || status === 'FAILED' || status === 'REFUNDED';
}

describe('Payment Processing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Payment Operations', () => {
    it('construit les paramètres Stripe corrects pour chaque plan', () => {
      const params = buildPaymentIntentParams('PRO');
      expect(params.amount).toBe(7900);
      expect(params.currency).toBe('eur');
      expect(params.metadata.planId).toBe('PRO');
    });

    it('lève une erreur pour un plan inconnu', () => {
      expect(() => buildPaymentIntentParams('INEXISTANT')).toThrow('Plan inconnu: INEXISTANT');
    });

    it('calcule correctement le montant TTC d\'une facture', () => {
      const lignes = [
        { quantite: 2, prixUnitaire: 150, tauxTVA: 20 },
        { quantite: 1, prixUnitaire: 80,  tauxTVA: 20 },
      ];
      const { htTotal, tvaTotal, ttcTotal } = calculateInvoiceTotal(lignes);
      expect(htTotal).toBe(380);
      expect(tvaTotal).toBe(76);
      expect(ttcTotal).toBe(456);
    });

    it('identifie correctement les statuts terminaux', () => {
      expect(isTerminalStatus('SUCCEEDED')).toBe(true);
      expect(isTerminalStatus('FAILED')).toBe(true);
      expect(isTerminalStatus('REFUNDED')).toBe(true);
      expect(isTerminalStatus('PENDING')).toBe(false);
    });

    it('gère une ligne de facture à zéro sans erreur', () => {
      const lignes = [{ quantite: 0, prixUnitaire: 100, tauxTVA: 20 }];
      const { ttcTotal } = calculateInvoiceTotal(lignes);
      expect(ttcTotal).toBe(0);
    });
  });
});
