/**
 * Nettoyage des anciens plans obsolètes
 * Garde uniquement SOLO, CABINET, ENTERPRISE
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanOldPlans() {
  console.log('🧹 Nettoyage des anciens plans...\n');

  try {
    // Plans à conserver (nouveaux)
    const keepPlans = ['SOLO', 'CABINET', 'ENTERPRISE'];
    
    // Récupérer tous les plans
    const allPlans = await prisma.plan.findMany({
      select: { id: true, name: true, displayName: true, priceMonthly: true }
    });
    
    console.log(`📊 Plans actuels (${allPlans.length} total):`);
    allPlans.forEach(plan => {
      console.log(`   - ${plan.name} (${plan.displayName}) - ${plan.priceMonthly}€/mois`);
    });
    console.log('');
    
    // Identifier les plans à supprimer
    const plansToDelete = allPlans.filter(plan => !keepPlans.includes(plan.name));
    
    if (plansToDelete.length === 0) {
      console.log('✅ Aucun plan obsolète à supprimer.\n');
      return;
    }
    
    console.log(`🗑️  Plans à supprimer (${plansToDelete.length}):`);
    plansToDelete.forEach(plan => {
      console.log(`   - ${plan.name} (${plan.displayName})`);
    });
    console.log('');
    
    // Vérifier s'il y a des subscriptions liées
    for (const plan of plansToDelete) {
      const subscriptions = await prisma.subscription.findMany({
        where: { planId: plan.id },
        select: { id: true, status: true }
      });
      
      if (subscriptions.length > 0) {
        console.log(`⚠️  ATTENTION: Le plan ${plan.name} a ${subscriptions.length} subscription(s) active(s).`);
        console.log(`   Il ne sera PAS supprimé pour préserver l'intégrité des données.`);
      }
    }
    console.log('');
    
    // Désactiver les plans obsolètes (au lieu de supprimer)
    let deactivatedCount = 0;
    for (const plan of plansToDelete) {
      await prisma.plan.update({
        where: { id: plan.id },
        data: { isActive: false }
      });
      console.log(`✅ Plan désactivé: ${plan.name}`);
      deactivatedCount++;
    }
    
    console.log('');
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`✅ Nettoyage terminé: ${deactivatedCount} plan(s) désactivé(s)`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    
    // Afficher les plans restants
    const remainingPlans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { priceMonthly: 'asc' }
    });
    
    console.log(`📋 Plans actifs (${remainingPlans.length}):`);
    remainingPlans.forEach(plan => {
      console.log(`   ✅ ${plan.name} - ${plan.priceMonthly}€/mois (${plan.maxWorkspaces} workspace${plan.maxWorkspaces > 1 ? 's' : ''})`);
    });
    console.log('');
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanOldPlans()
  .then(() => {
    console.log('✅ Script terminé avec succès!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
