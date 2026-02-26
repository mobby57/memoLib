"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CreditCard, Calendar, CheckCircle, XCircle, AlertCircle } from "lucide-react";

type Subscription = {
  id: string;
  plan: string;
  status: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  maxClients: number;
  maxDossiers: number;
  maxStorage: number;
};

type Payment = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  paidAt: string;
  last4?: string;
  brand?: string;
};

export default function BillingDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    }
    fetchBillingData();
  }, [searchParams]);

  const fetchBillingData = async () => {
    try {
      const res = await fetch("/api/billing/subscription");
      const data = await res.json();

      if (data.subscription) {
        setSubscription(data.subscription);
        setPayments(data.payments || []);
      }
    } catch (error) {
      console.error("Error fetching billing data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm("Êtes-vous sûr de vouloir annuler votre abonnement ?")) {
      return;
    }

    try {
      const res = await fetch("/api/billing/cancel", {
        method: "POST",
      });

      if (res.ok) {
        alert("Votre abonnement sera annulé à la fin de la période de facturation");
        fetchBillingData();
      } else {
        alert("Une erreur est survenue");
      }
    } catch (error) {
      console.error("Error canceling subscription:", error);
      alert("Une erreur est survenue");
    }
  };

  const handleManageSubscription = async () => {
    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Error opening customer portal:", error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatAmount = (amount: number, currency: string) => {
    return `${(amount / 100).toFixed(2)} ${currency.toUpperCase()}`;
  };

  const getPlanPrice = (plan: string) => {
    const prices: Record<string, number> = {
      FREE: 0,
      PRO: 29,
      ENTERPRISE: 99,
    };
    return prices[plan] || 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="text-2xl font-bold text-blue-600">
            MemoLib
          </Link>
          <Link href="/dashboard" className="text-sm text-gray-600 hover:text-blue-600">
            Retour au dashboard
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            <span>Votre abonnement a été activé avec succès !</span>
          </div>
        )}

        <h1 className="text-3xl font-bold text-gray-900 mb-8">Facturation et abonnement</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Subscription Card */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">Plan actuel</h2>
                {subscription ? (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl font-bold text-blue-600">
                        {subscription.plan}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          subscription.status === "ACTIVE"
                            ? "bg-green-100 text-green-800"
                            : subscription.status === "TRIALING"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {subscription.status}
                      </span>
                    </div>
                    <p className="text-gray-600">
                      {getPlanPrice(subscription.plan)}€/mois
                    </p>
                  </>
                ) : (
                  <p className="text-gray-600">Aucun abonnement actif</p>
                )}
              </div>
              <CreditCard className="w-12 h-12 text-gray-400" />
            </div>

            {subscription && (
              <>
                {/* Limits */}
                <div className="space-y-3 mb-6 border-t pt-4">
                  <h3 className="font-semibold text-gray-700">Limites incluses</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Clients</p>
                      <p className="text-lg font-semibold">
                        {subscription.maxClients === 999999 ? "∞" : subscription.maxClients}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Dossiers</p>
                      <p className="text-lg font-semibold">
                        {subscription.maxDossiers === 999999 ? "∞" : subscription.maxDossiers}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Stockage</p>
                      <p className="text-lg font-semibold">
                        {subscription.maxStorage / 1024} Go
                      </p>
                    </div>
                  </div>
                </div>

                {/* Renewal */}
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-6 border-t pt-4">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {subscription.cancelAtPeriodEnd
                      ? `Se termine le ${formatDate(subscription.currentPeriodEnd)}`
                      : `Prochain renouvellement le ${formatDate(subscription.currentPeriodEnd)}`}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-3 border-t pt-4">
                  {subscription.plan !== "FREE" && !subscription.cancelAtPeriodEnd && (
                    <button
                      onClick={handleCancelSubscription}
                      className="px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition"
                    >
                      Annuler l'abonnement
                    </button>
                  )}
                  {subscription.plan === "FREE" && (
                    <Link
                      href="/pricing"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      Passer à un plan payant
                    </Link>
                  )}
                  {subscription.plan !== "FREE" && (
                    <button
                      onClick={handleManageSubscription}
                      className="px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition"
                    >
                      Gérer l'abonnement
                    </button>
                  )}
                </div>
              </>
            )}

            {!subscription && (
              <Link
                href="/pricing"
                className="block text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Choisir un plan
              </Link>
            )}
          </div>

          {/* Quick Stats */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-700 mb-4">Statut</h3>
              <div className="space-y-3">
                {subscription?.status === "ACTIVE" && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span>Abonnement actif</span>
                  </div>
                )}
                {subscription?.status === "TRIALING" && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <AlertCircle className="w-5 h-5" />
                    <span>Période d'essai</span>
                  </div>
                )}
                {!subscription && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <XCircle className="w-5 h-5" />
                    <span>Aucun abonnement</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Payments History */}
        {payments.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Historique des paiements</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Montant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Méthode
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {payments.map((payment) => (
                    <tr key={payment.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(payment.paidAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatAmount(payment.amount, payment.currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            payment.status === "SUCCEEDED"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {payment.brand && payment.last4
                          ? `${payment.brand} •••• ${payment.last4}`
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
