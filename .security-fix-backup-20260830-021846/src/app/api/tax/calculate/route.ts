import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { taxCalculator, type TaxCalculationRequest } from '@/lib/tax/calculator';

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await req.json();

        const request: TaxCalculationRequest = {
            amount: body.amount,
            currency: body.currency,
            country: body.country,
            state: body.state,
            city: body.city,
            zip: body.zip,
            customerType: body.customerType || 'B2C',
            vatNumber: body.vatNumber,
            productCategory: body.productCategory || 'digital'
        };

        // Validate required fields
        if (!request.amount || !request.currency || !request.country) {
            return NextResponse.json(
                { error: 'Missing required fields: amount, currency, country' },
                { status: 400 }
            );
        }

        // Calculate tax
        const result = await taxCalculator.calculateTax(request);

        return NextResponse.json({
            success: true,
            calculation: result
        });
    } catch (error: any) {
        console.error('Tax calculation error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
