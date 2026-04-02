/**
 * Multi-Currency Support for MemoLib
 * Supports 25+ currencies with real-time conversion
 */

export interface Currency {
    code: string;
    symbol: string;
    name: string;
    locale: string;
    stripeCode: string;
    decimals: number;
}

export const CURRENCIES: Record<string, Currency> = {
    USD: { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US', stripeCode: 'usd', decimals: 2 },
    EUR: { code: 'EUR', symbol: '€', name: 'Euro', locale: 'fr-FR', stripeCode: 'eur', decimals: 2 },
    GBP: { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB', stripeCode: 'gbp', decimals: 2 },
    JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', locale: 'ja-JP', stripeCode: 'jpy', decimals: 0 },
    CHF: { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', locale: 'de-CH', stripeCode: 'chf', decimals: 2 },
    CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', locale: 'en-CA', stripeCode: 'cad', decimals: 2 },
    AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU', stripeCode: 'aud', decimals: 2 },
    NZD: { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', locale: 'en-NZ', stripeCode: 'nzd', decimals: 2 },
    CNY: { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', locale: 'zh-CN', stripeCode: 'cny', decimals: 2 },
    INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN', stripeCode: 'inr', decimals: 2 },
    SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', locale: 'en-SG', stripeCode: 'sgd', decimals: 2 },
    HKD: { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', locale: 'zh-HK', stripeCode: 'hkd', decimals: 2 },
    KRW: { code: 'KRW', symbol: '₩', name: 'South Korean Won', locale: 'ko-KR', stripeCode: 'krw', decimals: 0 },
    THB: { code: 'THB', symbol: '฿', name: 'Thai Baht', locale: 'th-TH', stripeCode: 'thb', decimals: 2 },
    MYR: { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', locale: 'ms-MY', stripeCode: 'myr', decimals: 2 },
    BRL: { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', locale: 'pt-BR', stripeCode: 'brl', decimals: 2 },
    MXN: { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso', locale: 'es-MX', stripeCode: 'mxn', decimals: 2 },
    ARS: { code: 'ARS', symbol: 'AR$', name: 'Argentine Peso', locale: 'es-AR', stripeCode: 'ars', decimals: 2 },
    CLP: { code: 'CLP', symbol: 'CL$', name: 'Chilean Peso', locale: 'es-CL', stripeCode: 'clp', decimals: 0 },
    NOK: { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', locale: 'nb-NO', stripeCode: 'nok', decimals: 2 },
    SEK: { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', locale: 'sv-SE', stripeCode: 'sek', decimals: 2 },
    DKK: { code: 'DKK', symbol: 'kr', name: 'Danish Krone', locale: 'da-DK', stripeCode: 'dkk', decimals: 2 },
    CZK: { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna', locale: 'cs-CZ', stripeCode: 'czk', decimals: 2 },
    PLN: { code: 'PLN', symbol: 'zł', name: 'Polish Złoty', locale: 'pl-PL', stripeCode: 'pln', decimals: 2 },
    ZAR: { code: 'ZAR', symbol: 'R', name: 'South African Rand', locale: 'en-ZA', stripeCode: 'zar', decimals: 2 }
};

export type CurrencyCode = keyof typeof CURRENCIES;

/**
 * Exchange rates cache (in production, fetch from API)
 * Base currency: USD
 */
let exchangeRatesCache: Record<string, number> | null = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 3600000; // 1 hour

/**
 * Fetch latest exchange rates from API
 */
export async function fetchExchangeRates(): Promise<Record<string, number>> {
    const now = Date.now();

    // Return cached rates if still valid
    if (exchangeRatesCache && (now - lastFetchTime < CACHE_DURATION)) {
        return exchangeRatesCache;
    }

    try {
        // In production, use a real API like OpenExchangeRates
        // const apiKey = process.env.EXCHANGE_RATE_API_KEY;
        // const response = await fetch(`https://openexchangerates.org/api/latest.json?app_id=${apiKey}`);
        // const data = await response.json();
        // exchangeRatesCache = data.rates;

        // For now, use mock rates (relative to USD = 1.0)
        exchangeRatesCache = {
            USD: 1.0,
            EUR: 0.92,
            GBP: 0.79,
            JPY: 149.50,
            CHF: 0.88,
            CAD: 1.36,
            AUD: 1.53,
            NZD: 1.67,
            CNY: 7.24,
            INR: 83.12,
            SGD: 1.35,
            HKD: 7.83,
            KRW: 1320.45,
            THB: 35.82,
            MYR: 4.72,
            BRL: 4.98,
            MXN: 17.12,
            ARS: 350.25,
            CLP: 895.30,
            NOK: 10.87,
            SEK: 10.92,
            DKK: 6.88,
            CZK: 23.45,
            PLN: 4.05,
            ZAR: 18.95
        };

        lastFetchTime = now;
        return exchangeRatesCache;
    } catch (error) {
        console.error('Error fetching exchange rates:', error);

        // Return cached rates or fallback
        if (exchangeRatesCache) {
            return exchangeRatesCache;
        }

        throw new Error('Unable to fetch exchange rates');
    }
}

/**
 * Convert amount from one currency to another
 */
export async function convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string
): Promise<number> {
    if (fromCurrency === toCurrency) {
        return amount;
    }

    const rates = await fetchExchangeRates();

    const fromRate = rates[fromCurrency];
    const toRate = rates[toCurrency];

    if (!fromRate || !toRate) {
        throw new Error(`Exchange rate not available for ${fromCurrency} or ${toCurrency}`);
    }

    // Convert to USD first, then to target currency
    const usdAmount = amount / fromRate;
    const convertedAmount = usdAmount * toRate;

    return convertedAmount;
}

/**
 * Format amount with currency symbol
 */
export function formatCurrencyAmount(
    amount: number,
    currencyCode: string,
    locale?: string
): string {
    const currency = CURRENCIES[currencyCode as CurrencyCode];

    if (!currency) {
        return `${amount.toFixed(2)} ${currencyCode}`;
    }

    const formatter = new Intl.NumberFormat(locale || currency.locale, {
        style: 'currency',
        currency: currency.code,
        minimumFractionDigits: currency.decimals,
        maximumFractionDigits: currency.decimals
    });

    return formatter.format(amount);
}

/**
 * Get user's preferred currency from locale or browser settings
 */
export function getUserCurrency(): string {
    // In a real app, get from user preferences or browser locale
    if (typeof window !== 'undefined') {
        const locale = navigator.language || 'en-US';

        // Map common locales to currencies
        const localeToCurrency: Record<string, string> = {
            'en-US': 'USD',
            'en-GB': 'GBP',
            'fr-FR': 'EUR',
            'de-DE': 'EUR',
            'es-ES': 'EUR',
            'it-IT': 'EUR',
            'ja-JP': 'JPY',
            'zh-CN': 'CNY',
            'ko-KR': 'KRW',
            'en-CA': 'CAD',
            'en-AU': 'AUD',
            'pt-BR': 'BRL',
            'es-MX': 'MXN',
            'en-IN': 'INR',
            'en-SG': 'SGD',
            'th-TH': 'THB'
        };

        const currency = localeToCurrency[locale] || 'USD';
        return currency;
    }

    return 'USD';
}

/**
 * Convert Stripe amount (in smallest currency unit) to decimal
 */
export function fromStripeAmount(amount: number, currencyCode: string): number {
    const currency = CURRENCIES[currencyCode];
    if (!currency) return amount / 100;

    if (currency.decimals === 0) {
        return amount; // JPY, KRW don't use decimals
    }

    return amount / 100;
}

/**
 * Convert decimal amount to Stripe format (smallest currency unit)
 */
export function toStripeAmount(amount: number, currencyCode: string): number {
    const currency = CURRENCIES[currencyCode];
    if (!currency) return Math.round(amount * 100);

    if (currency.decimals === 0) {
        return Math.round(amount); // JPY, KRW don't use decimals
    }

    return Math.round(amount * 100);
}

/**
 * Get list of supported currencies
 */
export function getSupportedCurrencies(): Currency[] {
    return Object.values(CURRENCIES);
}

/**
 * Check if currency is supported
 */
export function isCurrencySupported(currencyCode: string): boolean {
    return currencyCode in CURRENCIES;
}
