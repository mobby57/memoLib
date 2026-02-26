"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, X, Zap, Shield, TrendingUp, Users } from "lucide-react";

type PricingPlan = {
  id: string;
  name: string;
  price: number;
  priceId: string; // Stripe Price ID
  description: string;
  features: string[];
  limitations: string[];
  recommended?: boolean;
  maxClients: number;
  maxDossiers: number;
  maxStorage: number;
};

const plans: PricingPlan[] = [
  {
    id: "FREE",
    name: "Gratuit",
    price: 0,
    priceId: "", // No Stripe price for free plan
    description: "Idéal pour découvrir MemoLib",
    features: [
      "5 clients maximum",
      "10 dossiers maximum",
      "1 Go de stockage",
      "Gestion basique des dossiers",
      "Notifications par email",
      "Support communautaire",
    ],
    limitations: [
      "Pas d'analyse IA",
      "Pas de rapports avancés",
      "Pas d'accès API",
    ],
    maxClients: 5,
    maxDossiers: 10,
    maxStorage: 1024,
  },
  {
    id: "PRO",
    name: "Pro",
    price: 29,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO || "price_pro_monthly",
    description: "Pour avocats individuels et petits cabinets",
    features: [
      "50 clients",
      "500 dossiers",
      "50 Go de stockage",
      "Analyse IA des documents",
      "Rapports avancés",
      "Intégrations (Stripe, Twilio, etc.)",
      "Support prioritaire",
      "Webhooks personnalisés",
    ],
    limitations: [],
    recommended: true,
    maxClients: 50,
    maxDossiers: 500,
    maxStorage: 51200,
  },
  {
    id: "ENTERPRISE",
    name: "Enterprise",
    price: 99,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE || "price_enterprise_monthly",
    description: "Pour grands cabinets et organisations",
    features: [
      "Clients illimités",
      "Dossiers illimités",
      "500 Go de stockage",
      "Toutes les fonctionnalités Pro",
      "API complète",
      "Support dédié 24/7",
      "Formation personnalisée",
      "SLA garantis",
      "Audit et conformité",
      "White-labeling",
    ],
    limitations: [],
    maxClients: 999999,
    maxDossiers: 999999,
    maxStorage: 512000,
  },
];

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const getPrice = (plan: PricingPlan) => {
    const price = billingCycle === "yearly" ? plan.price * 10 : plan.price;
    return price;
  };

  const handleCheckout = async (plan: PricingPlan) => {
    if (plan.id === "FREE") {
      // Redirect to signup
      window.location.href = "/signup?plan=FREE";
      return;
    }

    try {
      // Call Stripe checkout API
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: plan.priceId,
          billingCycle,
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Erreur lors de la création de la session de paiement");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Une erreur est survenue. Veuillez réessayer.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8  py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            MemoLib
          </Link>
          <Link
            href="/login"
            className="text-sm text-gray-600 hover:text-blue-600"
          >
            Se connecter
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Tarifs adaptés à votre cabinet
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          Choisissez le plan qui correspond à vos besoins. Tous les plans incluent un essai gratuit de 14 jours.
        </p>

        {/* Billing Toggle */}
        <div className="flex justify-center items-center gap-4 mb-12">
          <span
            className={`text-sm font-medium ${
              billingCycle === "monthly" ? "text-gray-900" : "text-gray-500"
            }`}
          >
            Mensuel
          </span>
          <button
            onClick={() =>
              setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")
            }
            className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600"
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                billingCycle === "yearly" ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
          <span
            className={`text-sm font-medium ${
              billingCycle === "yearly" ? "text-gray-900" : "text-gray-500"
            }`}
          >
            Annuel
            <span className="ml-1 text-green-600 text-xs">(2 mois offerts)</span>
          </span>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-2xl border-2 ${
                plan.recommended
                  ? "border-blue-600 shadow-2xl scale-105"
                  : "border-gray-200 shadow-lg"
              } bg-white p-8 relative`}
            >
              {plan.recommended && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    ⭐ Recommandé
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                <div className="mb-4">
                  <span className="text-5xl font-bold text-gray-900">
                    {getPrice(plan)}€
                  </span>
                  <span className="text-gray-500 ml-2">
                    {plan.id === "FREE" ? "" : billingCycle === "monthly" ? "/mois" : "/an"}
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleCheckout(plan)}
                className={`w-full py-3 rounded-lg font-semibold mb-6 transition ${
                  plan.recommended
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                }`}
              >
                {plan.id === "FREE" ? "Commencer gratuitement" : "Essai gratuit 14 jours"}
              </button>

              {/* Features */}
              <div className="space-y-3 mb-6">
                <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Fonctionnalités incluses
                </p>
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Limitations */}
              {plan.limitations.length > 0 && (
                <div className="space-y-2 border-t pt-4">
                  {plan.limitations.map((limitation, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <X className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-500 text-sm">{limitation}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-slate-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Questions fréquentes</h2>
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="font-semibold text-lg mb-2">Puis-je changer de plan à tout moment ?</h3>
              <p className="text-gray-600">
                Oui, vous pouvez upgrader ou downgrader votre plan à tout moment. Les changements prennent effet immédiatement et vous serez facturé au prorata.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="font-semibold text-lg mb-2">Comment fonctionne l'essai gratuit ?</h3>
              <p className="text-gray-600">
                Tous les plans payants incluent 14 jours d'essai gratuit. Aucune carte bancaire n'est requise. Vous pouvez annuler à tout moment pendant la période d'essai.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="font-semibold text-lg mb-2">Quels moyens de paiement acceptez-vous ?</h3>
              <p className="text-gray-600">
                Nous acceptons toutes les cartes bancaires (Visa, Mastercard, American Express) via Stripe, ainsi que les virements SEPA pour les abonnements annuels.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="font-semibold text-lg mb-2">Mes données sont-elles sécurisées ?</h3>
              <p className="text-gray-600">
                Oui, toutes vos données sont chiffrées (AES-256) et stockées dans l'Union Européenne. Nous sommes conformes RGPD et disposons de certifications ISO 27001.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-center">
        <h2 className="text-4xl font-bold mb-4">Prêt à transformer votre cabinet ?</h2>
        <p className="text-xl mb-8 opacity-90">
          Rejoignez des centaines d'avocats qui utilisent MemoLib chaque jour
        </p>
        <button
          onClick={() => handleCheckout(plans[1])}
          className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition"
        >
          Commencer mon essai gratuit
        </button>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2026 MemoLib. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}
