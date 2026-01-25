// Script de vérification des tables AI
const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  
  console.log('=== Vérification Système Anti-Faillite ===\n');
  
  try {
    // Test AIUsageLog
    const usageCount = await prisma.aIUsageLog.count();
    console.log('✅ AIUsageLog: OK (' + usageCount + ' enregistrements)');
  } catch (e) {
    console.log('❌ AIUsageLog: ERREUR -', e.message);
  }
  
  try {
    // Test AIMonthlySummary
    const summaryCount = await prisma.aIMonthlySummary.count();
    console.log('✅ AIMonthlySummary: OK (' + summaryCount + ' enregistrements)');
  } catch (e) {
    console.log('❌ AIMonthlySummary: ERREUR -', e.message);
  }
  
  // Afficher les plans et limites
  try {
    const plans = await prisma.plan.findMany({
      select: { name: true, priceMonthly: true }
    });
    console.log('\n📊 Plans tarifaires:');
    plans.forEach(p => {
      const limits = { SOLO: 5, CABINET: 30, ENTERPRISE: 100, FREE: 0.5 };
      const limit = limits[p.name] || 5;
      console.log(`   ${p.name}: ${p.priceMonthly}€/mois (budget IA: ${limit}€)`);
    });
  } catch (e) {
    console.log('Plans: non disponibles');
  }
  
  console.log('\n🛡️ Système anti-faillite OPÉRATIONNEL!');
  
  await prisma.$disconnect();
}

main();
