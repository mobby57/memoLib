'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { PRODUCT_TIERS, type ProductTier } from '@/lib/stripe/config';
import SubscriptionCard from '@/components/payments/SubscriptionCard';
import PaymentForm from '@/components/payments/PaymentForm';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface Subscription {
    id: string;
    tier: ProductTier;
    status: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
}

interface PaymentMethod {
    id: string;
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
}

interface Invoice {
    id: string;
    amount: number;
    currency: string;
    status: string;
    createdAt: string;
    pdfUrl: string | null;
}

export default function BillingPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [showUpgrade, setShowUpgrade] = useState(false);
    const [selectedTier, setSelectedTier] = useState<ProductTier | null>(null);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin');
            return;
        }

        if (status === 'authenticated') {
            fetchBillingData();
        }
    }, [status, router]);

    const fetchBillingData = async () => {
        try {
            setLoading(true);
            const [subRes, pmRes, invRes] = await Promise.all([
                fetch('/api/subscriptions/current'),
                fetch('/api/payments/methods'),
                fetch('/api/payments/invoices')
            ]);

            if (subRes.ok) {
                const data = await subRes.json();
                setSubscription(data.subscription);
            }

            if (pmRes.ok) {
                const data = await pmRes.json();
                setPaymentMethods(data.paymentMethods || []);
            }

            if (invRes.ok) {
                const data = await invRes.json();
                setInvoices(data.invoices || []);
            }
        } catch (error) {
            console.error('Error fetching billing data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpgrade = (tier: ProductTier) => {
        setSelectedTier(tier);
        setShowUpgrade(true);
    };

    const handleCancelSubscription = async () => {
        if (!confirm('Are you sure you want to cancel your subscription?')) return;

        try {
            const res = await fetch('/api/subscriptions/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (res.ok) {
                await fetchBillingData();
                alert('Subscription cancelled successfully');
            } else {
                const error = await res.json();
                alert(`Error: ${error.message}`);
            }
        } catch (error) {
            console.error('Error cancelling subscription:', error);
            alert('Failed to cancel subscription');
        }
    };

    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-lg">Loading billing information...</div>
            </div>
        );
    }

    const currentTier = subscription?.tier || 'FREE';

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Billing & Subscription</h1>
                    <p className="text-lg text-gray-600">Manage your subscription and payment methods</p>
                </div>

                {/* Current Subscription */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <h2 className="text-2xl font-semibold mb-4">Current Plan</h2>
                    {subscription ? (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-xl font-bold">{subscription.tier} Plan</p>
                                    <p className="text-gray-600">Status: {subscription.status}</p>
                                    <p className="text-gray-600">
                                        Renews on: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                                    </p>
                                </div>
                                {subscription.tier !== 'FREE' && (
                                    <button
                                        onClick={handleCancelSubscription}
                                        className="px-4 py-2 border border-red-600 text-red-600 rounded-md hover:bg-red-50"
                                    >
                                        Cancel Subscription
                                    </button>
                                )}
                            </div>
                            {subscription.cancelAtPeriodEnd && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                                    <p className="text-yellow-800">
                                        Your subscription will be cancelled at the end of the current billing period.
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div>
                            <p className="text-xl font-bold">FREE Plan</p>
                            <p className="text-gray-600">You're currently on the free plan</p>
                        </div>
                    )}
                </div>

                {/* Upgrade Options */}
                <div className="mb-12">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-semibold">Available Plans</h2>
                        <div className="flex items-center space-x-2">
                            <span className={billingCycle === 'monthly' ? 'font-semibold' : 'text-gray-600'}>Monthly</span>
                            <button
                                onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                                className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600"
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                            <span className={billingCycle === 'yearly' ? 'font-semibold' : 'text-gray-600'}>
                                Yearly <span className="text-green-600 text-sm">(Save 20%)</span>
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {(['FREE', 'PRO', 'ENTERPRISE'] as ProductTier[]).map((tier) => (
                            <SubscriptionCard
                                key={tier}
                                tier={tier}
                                billingCycle={billingCycle}
                                currentTier={currentTier}
                                onSelect={handleUpgrade}
                            />
                        ))}
                    </div>
                </div>

                {/* Payment Methods */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <h2 className="text-2xl font-semibold mb-4">Payment Methods</h2>
                    {paymentMethods.length > 0 ? (
                        <div className="space-y-3">
                            {paymentMethods.map((pm) => (
                                <div key={pm.id} className="flex justify-between items-center border-b pb-3">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-12 h-8 bg-gray-200 rounded flex items-center justify-center">
                                            {pm.brand.toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-medium">•••• {pm.last4}</p>
                                            <p className="text-sm text-gray-600">
                                                Expires {pm.expMonth}/{pm.expYear}
                                            </p>
                                        </div>
                                    </div>
                                    <button className="text-red-600 hover:text-red-800">Remove</button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-600">No payment methods on file</p>
                    )}
                    <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                        Add Payment Method
                    </button>
                </div>

                {/* Invoices */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-2xl font-semibold mb-4">Invoice History</h2>
                    {invoices.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {invoices.map((invoice) => (
                                        <tr key={invoice.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {new Date(invoice.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {(invoice.amount / 100).toFixed(2)} {invoice.currency.toUpperCase()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`px-2 py-1 text-xs rounded-full ${invoice.status === 'paid'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-yellow-100 text-yellow-800'
                                                        }`}
                                                >
                                                    {invoice.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {invoice.pdfUrl && (
                                                    <a
                                                        href={invoice.pdfUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 hover:text-blue-800"
                                                    >
                                                        Download PDF
                                                    </a>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-gray-600">No invoices yet</p>
                    )}
                </div>

                {/* Upgrade Modal */}
                {showUpgrade && selectedTier && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-8 max-w-md w-full">
                            <h3 className="text-2xl font-bold mb-4">Upgrade to {selectedTier}</h3>
                            <p className="text-gray-600 mb-6">
                                Complete payment to upgrade to {selectedTier} plan
                            </p>
                            <Elements stripe={stripePromise}>
                                <PaymentForm
                                    amount={PRODUCT_TIERS[selectedTier][billingCycle === 'monthly' ? 'priceMonthly' : 'priceYearly']}
                                    currency="usd"
                                    onSuccess={() => {
                                        setShowUpgrade(false);
                                        fetchBillingData();
                                    }}
                                    onError={(error) => {
                                        console.error('Payment error:', error);
                                        alert('Payment failed. Please try again.');
                                    }}
                                />
                            </Elements>
                            <button
                                onClick={() => setShowUpgrade(false)}
                                className="mt-4 w-full px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
