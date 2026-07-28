/**
 * Sync Plans → Stripe Products & Prices
 * Usage: npx tsx scripts/sync-stripe-plans.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import Stripe from 'stripe';
import { writeFileSync } from 'fs';
import { join } from 'path';

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY manquante dans .env.local');
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-04-30.basil' as Stripe.LatestApiVersion,
});

const PLANS = [
  { name: 'SOLO', display: 'MemoLib Solo', monthly: 2900, yearly: 27800, desc: 'Avocat indépendant — 50 dossiers, 1 utilisateur' },
  { name: 'CABINET', display: 'MemoLib Cabinet', monthly: 7900, yearly: 75800, desc: 'Petit cabinet — 300 dossiers, 5 utilisateurs' },
  { name: 'ENTERPRISE', display: 'MemoLib Enterprise', monthly: 19900, yearly: 191000, desc: 'Grand cabinet — 1000 dossiers, 20 utilisateurs, API' },
];

async function main() {
  console.log('🔄 Synchronisation des plans vers Stripe...\n');

  const priceMap: Record<string, { monthly: string; yearly: string; productId: string }> = {};

  for (const plan of PLANS) {
    // Chercher produit existant par metadata
    let product: Stripe.Product | undefined;
    const products = await stripe.products.list({ limit: 100, active: true });
    product = products.data.find(p => p.metadata?.plan === plan.name);

    if (product) {
      console.log(`✅ Produit existant: ${product.name} (${product.id})`);
    } else {
      product = await stripe.products.create({
        name: plan.display,
        description: plan.desc,
        metadata: { plan: plan.name },
      });
      console.log(`🆕 Produit créé: ${product.name} (${product.id})`);
    }

    // Chercher les prix existants
    const prices = await stripe.prices.list({ product: product.id, active: true });
    const matchesPrice = (price: Stripe.Price, interval: Stripe.Price.Recurring.Interval, amount: number) =>
      price.recurring?.interval === interval && price.unit_amount === amount && price.currency === 'eur';
    let monthlyPrice = prices.data.find(p => matchesPrice(p, 'month', plan.monthly));
    let yearlyPrice = prices.data.find(p => matchesPrice(p, 'year', plan.yearly));

    if (!monthlyPrice) {
      monthlyPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.monthly,
        currency: 'eur',
        recurring: { interval: 'month' },
        nickname: `${plan.name} Mensuel`,
        metadata: { plan: plan.name, cycle: 'monthly' },
      });
      console.log(`   💰 Prix mensuel créé: ${plan.monthly / 100}€/mois (${monthlyPrice.id})`);
    } else {
      console.log(`   ✅ Prix mensuel existant: ${(monthlyPrice.unit_amount || 0) / 100}€/mois (${monthlyPrice.id})`);
    }

    if (!yearlyPrice) {
      yearlyPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.yearly,
        currency: 'eur',
        recurring: { interval: 'year' },
        nickname: `${plan.name} Annuel`,
        metadata: { plan: plan.name, cycle: 'yearly' },
      });
      console.log(`   💰 Prix annuel créé: ${plan.yearly / 100}€/an (${yearlyPrice.id})`);
    } else {
      console.log(`   ✅ Prix annuel existant: ${(yearlyPrice.unit_amount || 0) / 100}€/an (${yearlyPrice.id})`);
    }

    priceMap[plan.name] = {
      monthly: monthlyPrice.id,
      yearly: yearlyPrice.id,
      productId: product.id,
    };

    console.log('');
  }

  // Sauvegarder le mapping
  const outputPath = join(process.cwd(), 'src', 'lib', 'billing', 'stripe-prices.json');
  writeFileSync(outputPath, JSON.stringify(priceMap, null, 2));
  console.log(`📁 Mapping sauvegardé: ${outputPath}`);

  // Afficher les env vars
  console.log('\n📋 Variables d\'environnement (alternative) :\n');
  for (const [plan, ids] of Object.entries(priceMap)) {
    console.log(`STRIPE_PRICE_${plan}_MONTHLY=${ids.monthly}`);
    console.log(`STRIPE_PRICE_${plan}_YEARLY=${ids.yearly}`);
  }

  console.log('\n✅ Synchronisation terminée !');
}

main().catch(e => { console.error('❌ Erreur:', e.message || e); process.exit(1); });
