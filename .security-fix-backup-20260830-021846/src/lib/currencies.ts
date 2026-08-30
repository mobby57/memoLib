/**
 * Currency utilities - Minimal stub
 * Full multi-currency support removed during MVP cleanup.
 * Only EUR formatting retained for core functionality.
 */

export type CurrencyCode = 'EUR' | 'USD' | 'GBP' | 'CHF' | 'CAD';

export function formatCurrencyAmount(amount: number, currency: CurrencyCode = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount / 100);
}

export function isCurrencySupported(currency: string): currency is CurrencyCode {
  return ['EUR', 'USD', 'GBP', 'CHF', 'CAD'].includes(currency);
}

export function getSupportedCurrencies(): CurrencyCode[] {
  return ['EUR', 'USD', 'GBP', 'CHF', 'CAD'];
}
