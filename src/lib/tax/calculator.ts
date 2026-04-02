/**
 * Multi-Jurisdiction Tax Calculator for MemoLib
 * Supports EU VAT, US Sales Tax, Canadian GST/HST, Australian GST
 * 
 * Integrates with TaxJar API for real-time tax calculation
 */

export interface TaxJurisdiction {
    code: string;
    name: string;
    taxType: 'VAT' | 'SALES_TAX' | 'GST' | 'HST' | 'NONE';
    defaultRate: number; // Percentage (e.g., 0.20 for 20%)
    reverseChargeEligible?: boolean; // For B2B in EU
}

export interface TaxCalculationRequest {
    amount: number; // In cents
    currency: string;
    country: string; // ISO 3166-1 alpha-2
    state?: string; // For US, CA
    city?: string; // For US
    zip?: string;

    customerType: 'B2C' | 'B2B';
    vatNumber?: string; // For EU B2B

    productCategory?: 'digital' | 'physical' | 'service';
}

export interface TaxCalculationResult {
    taxableAmount: number; // In cents
    taxRate: number; // Percentage
    taxAmount: number; // In cents
    totalAmount: number; // In cents

    jurisdiction: TaxJurisdiction;
    breakdown: TaxBreakdown[];

    reverseCharge: boolean;
    exemptReason?: string;
}

export interface TaxBreakdown {
    name: string; // "State Tax", "County Tax", "City Tax", "VAT"
    rate: number;
    amount: number;
}

/**
 * Tax jurisdictions database
 */
const TAX_JURISDICTIONS: Record<string, TaxJurisdiction> = {
    // European Union (VAT)
    'AT': { code: 'AT', name: 'Austria', taxType: 'VAT', defaultRate: 0.20 },
    'BE': { code: 'BE', name: 'Belgium', taxType: 'VAT', defaultRate: 0.21 },
    'BG': { code: 'BG', name: 'Bulgaria', taxType: 'VAT', defaultRate: 0.20 },
    'CY': { code: 'CY', name: 'Cyprus', taxType: 'VAT', defaultRate: 0.19 },
    'CZ': { code: 'CZ', name: 'Czech Republic', taxType: 'VAT', defaultRate: 0.21 },
    'DE': { code: 'DE', name: 'Germany', taxType: 'VAT', defaultRate: 0.19, reverseChargeEligible: true },
    'DK': { code: 'DK', name: 'Denmark', taxType: 'VAT', defaultRate: 0.25 },
    'EE': { code: 'EE', name: 'Estonia', taxType: 'VAT', defaultRate: 0.20 },
    'ES': { code: 'ES', name: 'Spain', taxType: 'VAT', defaultRate: 0.21 },
    'FI': { code: 'FI', name: 'Finland', taxType: 'VAT', defaultRate: 0.24 },
    'FR': { code: 'FR', name: 'France', taxType: 'VAT', defaultRate: 0.20, reverseChargeEligible: true },
    'GR': { code: 'GR', name: 'Greece', taxType: 'VAT', defaultRate: 0.24 },
    'HR': { code: 'HR', name: 'Croatia', taxType: 'VAT', defaultRate: 0.25 },
    'HU': { code: 'HU', name: 'Hungary', taxType: 'VAT', defaultRate: 0.27 },
    'IE': { code: 'IE', name: 'Ireland', taxType: 'VAT', defaultRate: 0.23, reverseChargeEligible: true },
    'IT': { code: 'IT', name: 'Italy', taxType: 'VAT', defaultRate: 0.22 },
    'LT': { code: 'LT', name: 'Lithuania', taxType: 'VAT', defaultRate: 0.21 },
    'LU': { code: 'LU', name: 'Luxembourg', taxType: 'VAT', defaultRate: 0.17 },
    'LV': { code: 'LV', name: 'Latvia', taxType: 'VAT', defaultRate: 0.21 },
    'MT': { code: 'MT', name: 'Malta', taxType: 'VAT', defaultRate: 0.18 },
    'NL': { code: 'NL', name: 'Netherlands', taxType: 'VAT', defaultRate: 0.21, reverseChargeEligible: true },
    'PL': { code: 'PL', name: 'Poland', taxType: 'VAT', defaultRate: 0.23 },
    'PT': { code: 'PT', name: 'Portugal', taxType: 'VAT', defaultRate: 0.23 },
    'RO': { code: 'RO', name: 'Romania', taxType: 'VAT', defaultRate: 0.19 },
    'SE': { code: 'SE', name: 'Sweden', taxType: 'VAT', defaultRate: 0.25 },
    'SI': { code: 'SI', name: 'Slovenia', taxType: 'VAT', defaultRate: 0.22 },
    'SK': { code: 'SK', name: 'Slovakia', taxType: 'VAT', defaultRate: 0.20 },

    // United Kingdom (post-Brexit)
    'GB': { code: 'GB', name: 'United Kingdom', taxType: 'VAT', defaultRate: 0.20 },

    // United States (varies by state - these are approximations)
    'US': { code: 'US', name: 'United States', taxType: 'SALES_TAX', defaultRate: 0.0 }, // No federal sales tax

    // Canada
    'CA': { code: 'CA', name: 'Canada', taxType: 'GST', defaultRate: 0.05 }, // Federal GST, provinces have additional PST/HST

    // Australia
    'AU': { code: 'AU', name: 'Australia', taxType: 'GST', defaultRate: 0.10 },

    // New Zealand
    'NZ': { code: 'NZ', name: 'New Zealand', taxType: 'GST', defaultRate: 0.15 },

    // Switzerland
    'CH': { code: 'CH', name: 'Switzerland', taxType: 'VAT', defaultRate: 0.077 },

    // Norway
    'NO': { code: 'NO', name: 'Norway', taxType: 'VAT', defaultRate: 0.25 },

    // Others (no tax for digital services)
    'SG': { code: 'SG', name: 'Singapore', taxType: 'GST', defaultRate: 0.08 },
    'JP': { code: 'JP', name: 'Japan', taxType: 'VAT', defaultRate: 0.10 },
    'KR': { code: 'KR', name: 'South Korea', taxType: 'VAT', defaultRate: 0.10 },
};

/**
 * US State Sales Tax Rates (approximate)
 */
const US_STATE_TAX_RATES: Record<string, number> = {
    'AL': 0.04,   // Alabama
    'AK': 0.00,   // Alaska (no state sales tax)
    'AZ': 0.056,  // Arizona
    'AR': 0.065,  // Arkansas
    'CA': 0.0725, // California
    'CO': 0.029,  // Colorado
    'CT': 0.0635, // Connecticut
    'DE': 0.00,   // Delaware (no sales tax)
    'FL': 0.06,   // Florida
    'GA': 0.04,   // Georgia
    'HI': 0.04,   // Hawaii
    'ID': 0.06,   // Idaho
    'IL': 0.0625, // Illinois
    'IN': 0.07,   // Indiana
    'IA': 0.06,   // Iowa
    'KS': 0.065,  // Kansas
    'KY': 0.06,   // Kentucky
    'LA': 0.045,  // Louisiana
    'ME': 0.055,  // Maine
    'MD': 0.06,   // Maryland
    'MA': 0.0625, // Massachusetts
    'MI': 0.06,   // Michigan
    'MN': 0.06875,// Minnesota
    'MS': 0.07,   // Mississippi
    'MO': 0.04225,// Missouri
    'MT': 0.00,   // Montana (no sales tax)
    'NE': 0.055,  // Nebraska
    'NV': 0.0685, // Nevada
    'NH': 0.00,   // New Hampshire (no sales tax)
    'NJ': 0.06625,// New Jersey
    'NM': 0.05125,// New Mexico
    'NY': 0.04,   // New York
    'NC': 0.0475, // North Carolina
    'ND': 0.05,   // North Dakota
    'OH': 0.0575, // Ohio
    'OK': 0.045,  // Oklahoma
    'OR': 0.00,   // Oregon (no sales tax)
    'PA': 0.06,   // Pennsylvania
    'RI': 0.07,   // Rhode Island
    'SC': 0.06,   // South Carolina
    'SD': 0.045,  // South Dakota
    'TN': 0.07,   // Tennessee
    'TX': 0.0625, // Texas
    'UT': 0.0485, // Utah
    'VT': 0.06,   // Vermont
    'VA': 0.053,  // Virginia
    'WA': 0.065,  // Washington
    'WV': 0.06,   // West Virginia
    'WI': 0.05,   // Wisconsin
    'WY': 0.04,   // Wyoming
    'DC': 0.06    // District of Columbia
};

/**
 * Canadian Provincial Tax Rates
 */
const CA_PROVINCIAL_TAX: Record<string, { gst: number; pst?: number; hst?: number; name: string }> = {
    'AB': { gst: 0.05, name: 'Alberta' }, // GST only
    'BC': { gst: 0.05, pst: 0.07, name: 'British Columbia' }, // GST + PST
    'MB': { gst: 0.05, pst: 0.07, name: 'Manitoba' }, // GST + PST
    'NB': { hst: 0.15, gst: 0.05, name: 'New Brunswick' }, // HST
    'NL': { hst: 0.15, gst: 0.05, name: 'Newfoundland and Labrador' }, // HST
    'NT': { gst: 0.05, name: 'Northwest Territories' }, // GST only
    'NS': { hst: 0.15, gst: 0.05, name: 'Nova Scotia' }, // HST
    'NU': { gst: 0.05, name: 'Nunavut' }, // GST only
    'ON': { hst: 0.13, gst: 0.05, name: 'Ontario' }, // HST
    'PE': { hst: 0.15, gst: 0.05, name: 'Prince Edward Island' }, // HST
    'QC': { gst: 0.05, pst: 0.09975, name: 'Quebec' }, // GST + QST
    'SK': { gst: 0.05, pst: 0.06, name: 'Saskatchewan' }, // GST + PST
    'YT': { gst: 0.05, name: 'Yukon' } // GST only
};

/**
 * Tax Calculator
 */
export class TaxCalculator {
    private taxjarApiKey?: string;

    constructor(taxjarApiKey?: string) {
        this.taxjarApiKey = taxjarApiKey || process.env.TAXJAR_API_KEY;
    }

    /**
     * Calculate tax for a transaction
     */
    async calculateTax(request: TaxCalculationRequest): Promise<TaxCalculationResult> {
        const jurisdiction = TAX_JURISDICTIONS[request.country];

        if (!jurisdiction) {
            // No tax for unknown jurisdictions
            return this.noTaxResult(request);
        }

        // Check for EU VAT reverse charge (B2B with valid VAT number)
        if (
            jurisdiction.taxType === 'VAT' &&
            jurisdiction.reverseChargeEligible &&
            request.customerType === 'B2B' &&
            request.vatNumber &&
            await this.validateVATNumber(request.vatNumber)
        ) {
            return this.reverseChargeResult(request, jurisdiction);
        }

        // Calculate tax based on jurisdiction
        switch (request.country) {
            case 'US':
                return await this.calculateUSTax(request);
            case 'CA':
                return await this.calculateCanadaTax(request);
            default:
                return this.calculateStandardTax(request, jurisdiction);
        }
    }

    /**
     * Calculate US Sales Tax
     */
    private async calculateUSTax(request: TaxCalculationRequest): Promise<TaxCalculationResult> {
        // Use TaxJar API if available for accurate calculations
        if (this.taxjarApiKey) {
            return await this.calculateWithTaxJar(request);
        }

        // Fallback: Use state rate
        const state = request.state || 'CA'; // Default to CA if not provided
        const stateRate = US_STATE_TAX_RATES[state] || 0;

        const taxAmount = Math.round(request.amount * stateRate);
        const totalAmount = request.amount + taxAmount;

        return {
            taxableAmount: request.amount,
            taxRate: stateRate,
            taxAmount,
            totalAmount,
            jurisdiction: {
                code: `US-${state}`,
                name: `United States - ${state}`,
                taxType: 'SALES_TAX',
                defaultRate: stateRate
            },
            breakdown: [
                {
                    name: 'State Sales Tax',
                    rate: stateRate,
                    amount: taxAmount
                }
            ],
            reverseCharge: false
        };
    }

    /**
     * Calculate Canadian GST/HST/PST
     */
    private async calculateCanadaTax(request: TaxCalculationRequest): Promise<TaxCalculationResult> {
        const province = request.state || 'ON'; // Default to Ontario
        const provinceTax = CA_PROVINCIAL_TAX[province] || CA_PROVINCIAL_TAX['ON'];

        const breakdown: TaxBreakdown[] = [];
        let totalTaxAmount = 0;

        if (provinceTax.hst) {
            // HST (harmonized)
            const hstAmount = Math.round(request.amount * provinceTax.hst);
            totalTaxAmount += hstAmount;
            breakdown.push({
                name: 'HST',
                rate: provinceTax.hst,
                amount: hstAmount
            });
        } else {
            // GST
            const gstAmount = Math.round(request.amount * provinceTax.gst);
            totalTaxAmount += gstAmount;
            breakdown.push({
                name: 'GST',
                rate: provinceTax.gst,
                amount: gstAmount
            });

            // PST (if applicable)
            if (provinceTax.pst) {
                const pstAmount = Math.round(request.amount * provinceTax.pst);
                totalTaxAmount += pstAmount;
                breakdown.push({
                    name: 'PST',
                    rate: provinceTax.pst,
                    amount: pstAmount
                });
            }
        }

        const totalRate = provinceTax.hst || (provinceTax.gst + (provinceTax.pst || 0));

        return {
            taxableAmount: request.amount,
            taxRate: totalRate,
            taxAmount: totalTaxAmount,
            totalAmount: request.amount + totalTaxAmount,
            jurisdiction: {
                code: `CA-${province}`,
                name: `Canada - ${provinceTax.name}`,
                taxType: provinceTax.hst ? 'HST' : 'GST',
                defaultRate: totalRate
            },
            breakdown,
            reverseCharge: false
        };
    }

    /**
     * Calculate standard tax (EU VAT, AU GST, etc.)
     */
    private calculateStandardTax(
        request: TaxCalculationRequest,
        jurisdiction: TaxJurisdiction
    ): TaxCalculationResult {
        const taxAmount = Math.round(request.amount * jurisdiction.defaultRate);
        const totalAmount = request.amount + taxAmount;

        return {
            taxableAmount: request.amount,
            taxRate: jurisdiction.defaultRate,
            taxAmount,
            totalAmount,
            jurisdiction,
            breakdown: [
                {
                    name: jurisdiction.taxType,
                    rate: jurisdiction.defaultRate,
                    amount: taxAmount
                }
            ],
            reverseCharge: false
        };
    }

    /**
     * No tax result
     */
    private noTaxResult(request: TaxCalculationRequest): TaxCalculationResult {
        return {
            taxableAmount: request.amount,
            taxRate: 0,
            taxAmount: 0,
            totalAmount: request.amount,
            jurisdiction: {
                code: request.country,
                name: request.country,
                taxType: 'NONE',
                defaultRate: 0
            },
            breakdown: [],
            reverseCharge: false,
            exemptReason: 'No tax applicable in this jurisdiction'
        };
    }

    /**
     * Reverse charge result (EU B2B)
     */
    private reverseChargeResult(
        request: TaxCalculationRequest,
        jurisdiction: TaxJurisdiction
    ): TaxCalculationResult {
        return {
            taxableAmount: request.amount,
            taxRate: 0,
            taxAmount: 0,
            totalAmount: request.amount,
            jurisdiction,
            breakdown: [],
            reverseCharge: true,
            exemptReason: 'EU VAT Reverse Charge - B2B with valid VAT number'
        };
    }

    /**
     * Calculate with TaxJar API (for accurate US/CA/AU tax)
     */
    private async calculateWithTaxJar(request: TaxCalculationRequest): Promise<TaxCalculationResult> {
        if (!this.taxjarApiKey) {
            throw new Error('TaxJar API key not configured');
        }

        try {
            const response = await fetch('https://api.taxjar.com/v2/taxes', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.taxjarApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from_country: 'US',
                    from_zip: '94105',
                    from_state: 'CA',
                    from_city: 'San Francisco',
                    from_street: '123 Tech Street',
                    to_country: request.country,
                    to_zip: request.zip,
                    to_state: request.state,
                    to_city: request.city,
                    amount: request.amount / 100,
                    shipping: 0,
                    line_items: [
                        {
                            id: '1',
                            quantity: 1,
                            product_tax_code: request.productCategory === 'digital' ? '31000' : '00000',
                            unit_price: request.amount / 100,
                            discount: 0
                        }
                    ]
                })
            });

            if (!response.ok) {
                throw new Error(`TaxJar API error: ${response.statusText}`);
            }

            const data = await response.json();
            const tax = data.tax;

            const breakdown: TaxBreakdown[] = [];
            if (tax.breakdown) {
                if (tax.breakdown.state_taxable_amount > 0) {
                    breakdown.push({
                        name: 'State Tax',
                        rate: tax.breakdown.state_tax_rate,
                        amount: Math.round(tax.breakdown.state_tax_collectable * 100)
                    });
                }
                if (tax.breakdown.county_taxable_amount > 0) {
                    breakdown.push({
                        name: 'County Tax',
                        rate: tax.breakdown.county_tax_rate,
                        amount: Math.round(tax.breakdown.county_tax_collectable * 100)
                    });
                }
                if (tax.breakdown.city_taxable_amount > 0) {
                    breakdown.push({
                        name: 'City Tax',
                        rate: tax.breakdown.city_tax_rate,
                        amount: Math.round(tax.breakdown.city_tax_collectable * 100)
                    });
                }
            }

            return {
                taxableAmount: request.amount,
                taxRate: tax.rate,
                taxAmount: Math.round(tax.amount_to_collect * 100),
                totalAmount: request.amount + Math.round(tax.amount_to_collect * 100),
                jurisdiction: TAX_JURISDICTIONS[request.country] || {
                    code: request.country,
                    name: request.country,
                    taxType: 'SALES_TAX',
                    defaultRate: tax.rate
                },
                breakdown,
                reverseCharge: false
            };
        } catch (error) {
            console.error('TaxJar API error:', error);
            // Fallback to standard calculation
            return await this.calculateUSTax(request);
        }
    }

    /**
     * Validate EU VAT number
     */
    private async validateVATNumber(vatNumber: string): Promise<boolean> {
        // In production, use VIES VAT validation service
        // http://ec.europa.eu/taxation_customs/vies/

        // For now, simple format check
        const vatRegex = /^[A-Z]{2}[0-9A-Z]{8,12}$/;
        return vatRegex.test(vatNumber.replace(/[\s-]/g, ''));
    }

    /**
     * Get tax jurisdiction info
     */
    static getJurisdiction(country: string): TaxJurisdiction | null {
        return TAX_JURISDICTIONS[country] || null;
    }

    /**
     * Check if country requires tax
     */
    static requiresTax(country: string): boolean {
        const jurisdiction = TAX_JURISDICTIONS[country];
        return jurisdiction ? jurisdiction.defaultRate > 0 : false;
    }
}

/**
 * Singleton instance
 */
export const taxCalculator = new TaxCalculator();
