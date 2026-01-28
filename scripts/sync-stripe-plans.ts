/**
 * Script de synchronisation des plans avec Stripe
 * Crée les produits et prix dans Stripe Dashboard
 * 
 * Usage: npx tsx scripts/sync-stripe-plans.ts
 */

import { PrismaClient } from '@prisma/client';
import { createStripeProduct, createStripePrice } from '../src/lib/billing/stripe-client';

const prisma = new PrismaClient();

async function syncPlansToStripe() {
  console.log('🚀 Synchronisation des plans avec Stripe...\n');

  try {
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { priceMonthly: 'asc' }
    });

    console.log(`📊 ${plans.length} plans actifs trouvés\n`);

    for (const plan of plans) {
      console.log(`\n📦 Création du produit: ${plan.displayName}`);

      // Créer le produit Stripe
      const product = await createStripeProduct({
        name: plan.displayName,
        description: plan.description || `Plan ${plan.displayName} - memoLib`,
        metadata: {
          planId: plan.id,
          planName: plan.name,
        }
      });

      console.log(`   ✅ Produit créé: ${product.id}`);

      // Créer le prix mensuel
      const monthlyPrice = await createStripePrice({
        productId: product.id,
        amount: Math.round(plan.priceMonthly * 100), // Convertir en centimes
        currency: plan.currency.toLowerCase(),
        interval: 'month',
        nickname: `${plan.name} - Mensuel`
      });

      console.log(`   💵 Prix mensuel: ${monthlyPrice.id} (${plan.priceMonthly}€/mois)`);

      // Créer le prix annuel (avec économie)
      const yearlyPrice = await createStripePrice({
        productId: product.id,
        amount: Math.round(plan.priceYearly * 100),
        currency: plan.currency.toLowerCase(),
        interval: 'year',
        nickname: `${plan.name} - Annuel`
      });

      const savings = Math.round(((plan.priceMonthly * 12 - plan.priceYearly) / (plan.priceMonthly * 12)) * 100);
      console.log(`   💰 Prix annuel: ${yearlyPrice.id} (${plan.priceYearly}€/an, économie: ${savings}%)`);

      // Mettre à jour le plan dans la base avec les IDs Stripe
      await prisma.plan.update({
        where: { id: plan.id },
        data: {
          // Stocker les IDs Stripe dans metadata JSON
          // Note: Nécessite d'ajouter un champ metadata au modèle Plan si pas déjà présent
        }
      });

      console.log(`   📋 IDs Stripe à sauvegarder:`);
      console.log(`      Product ID: ${product.id}`);
      console.log(`      Monthly Price ID: ${monthlyPrice.id}`);
      console.log(`      Yearly Price ID: ${yearlyPrice.id}`);
    }

    console.log('\n\n✅ Synchronisation terminée !');
    console.log('\n📝 Prochaines étapes:');
    console.log('   1. Copiez les Price IDs ci-dessus');
    console.log('   2. Mettez à jour le code de checkout avec les vrais IDs');
    console.log('   3. Configurez les webhooks Stripe:');
    console.log('      URL: https://votre-domaine.com/api/webhooks/stripe');
    console.log('      Événements: invoice.paid, invoice.payment_failed, customer.subscription.*');
    console.log('   4. Ajoutez STRIPE_WEBHOOK_SECRET dans .env.local');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter
syncPlansToStripe();
