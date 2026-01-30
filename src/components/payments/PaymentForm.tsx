// components/payments/PaymentForm.tsx
'use client';

import { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { formatCurrencyAmount, type CurrencyCode } from '@/lib/currencies';

interface PaymentFormProps {
    amount: number;
    currency: CurrencyCode;
    onSuccess?: () => void;
    onError?: (error: string) => void;
}

export default function PaymentForm({
    amount,
    currency,
    onSuccess,
    onError,
}: PaymentFormProps) {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            const { error: submitError } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: `${window.location.origin}/payment/success`,
                },
            });

            if (submitError) {
                setError(submitError.message || 'Payment failed');
                onError?.(submitError.message || 'Payment failed');
            } else {
                onSuccess?.();
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred');
            onError?.(err.message || 'An error occurred');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                    {formatCurrencyAmount(amount, currency)}
                </p>
            </div>

            <PaymentElement
                options={{
                    layout: 'tabs',
                }}
            />

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-800">{error}</p>
                </div>
            )}

            <button
                type="submit"
                disabled={!stripe || isProcessing}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                {isProcessing ? 'Processing...' : `Pay ${formatCurrencyAmount(amount, currency)}`}
            </button>

            <p className="text-xs text-center text-gray-500">
                Powered by Stripe • Secure payment processing
            </p>
        </form>
    );
}
