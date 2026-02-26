// components/payments/SubscriptionCard.tsx
'use client';

import { useState } from 'react';
import { PRODUCT_TIERS, type ProductTier } from '@/lib/stripe/config';

interface SubscriptionCardProps {
    tier: ProductTier;
    billingCycle: 'monthly' | 'yearly';
    currentTier?: ProductTier;
    onSelect: (tier: ProductTier, billingCycle: 'monthly' | 'yearly') => void;
}

export default function SubscriptionCard({
    tier,
    billingCycle,
    currentTier,
    onSelect,
}: SubscriptionCardProps) {
    const product = PRODUCT_TIERS[tier];
    const [isLoading, setIsLoading] = useState(false);

    const price = billingCycle === 'monthly'
        ? product.priceMonthly
        : product.priceYearly;

    const monthlyPrice = billingCycle === 'yearly'
        ? (product.priceYearly / 12).toFixed(2)
        : product.priceMonthly;

    const isCurrentTier = currentTier === tier;
    const isFree = tier === 'FREE';

    const handleSelect = async () => {
        setIsLoading(true);
        try {
            await onSelect(tier, billingCycle);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`
      relative border-2 rounded-xl p-6 transition-all
      ${isCurrentTier
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }
      ${tier === 'PRO' ? 'shadow-lg scale-105' : ''}
    `}>
            {tier === 'PRO' && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                        Most Popular
                    </span>
                </div>
            )}

            {isCurrentTier && (
                <div className="absolute -top-3 right-4">
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                        Current Plan
                    </span>
                </div>
            )}

            <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {product.name}
                </h3>

                <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-gray-900">
                        ${monthlyPrice}
                    </span>
                    <span className="text-gray-600">/month</span>
                </div>

                {billingCycle === 'yearly' && !isFree && (
                    <p className="text-sm text-green-600 mt-1">
                        Save ${(product.priceMonthly * 12 - product.priceYearly).toFixed(2)}/year
                    </p>
                )}
            </div>

            <ul className="space-y-3 mb-6">
                {tier === 'FREE' && (
                    <>
                        <FeatureItem text="Up to 50 documents" />
                        <FeatureItem text="Up to 100 tasks" />
                        <FeatureItem text="1 team member" />
                        <FeatureItem text="5 GB storage" />
                        <FeatureItem text="Community support" />
                    </>
                )}

                {tier === 'PRO' && (
                    <>
                        <FeatureItem text="Up to 1,000 documents" highlight />
                        <FeatureItem text="Up to 5,000 tasks" highlight />
                        <FeatureItem text="Up to 10 team members" highlight />
                        <FeatureItem text="100 GB storage" highlight />
                        <FeatureItem text="Email support" highlight />
                        <FeatureItem text="API access" highlight />
                        <FeatureItem text="Advanced features" highlight />
                    </>
                )}

                {tier === 'ENTERPRISE' && (
                    <>
                        <FeatureItem text="Unlimited documents" highlight />
                        <FeatureItem text="Unlimited tasks" highlight />
                        <FeatureItem text="Unlimited team members" highlight />
                        <FeatureItem text="1 TB storage" highlight />
                        <FeatureItem text="24/7 phone support" highlight />
                        <FeatureItem text="API access" highlight />
                        <FeatureItem text="Custom integrations" highlight />
                        <FeatureItem text="Dedicated support" highlight />
                    </>
                )}
            </ul>

            <button
                onClick={handleSelect}
                disabled={isCurrentTier || isLoading}
                className={`
          w-full py-3 px-4 rounded-lg font-medium transition-colors
          ${isCurrentTier
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : tier === 'PRO'
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-900 text-white hover:bg-gray-800'
                    }
          disabled:opacity-50
        `}
            >
                {isLoading ? 'Processing...' : isCurrentTier ? 'Current Plan' : isFree ? 'Start Free' : 'Upgrade'}
            </button>
        </div>
    );
}

function FeatureItem({ text, highlight }: { text: string; highlight?: boolean }) {
    return (
        <li className="flex items-start gap-2">
            <svg
                className={`w-5 h-5 mt-0.5 ${highlight ? 'text-blue-600' : 'text-green-500'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                />
            </svg>
            <span className="text-gray-700">{text}</span>
        </li>
    );
}
