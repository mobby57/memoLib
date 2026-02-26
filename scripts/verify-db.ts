import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verify() {
  console.log('🔍 Vérification de la base de données...\n');

  try {
    // 1. Vérifier les plans
    const plans = await prisma.plan.findMany();
    console.log(`✅ Plans: ${plans.length} trouvés`);
    plans.forEach(p => console.log(`   - ${p.displayName} (${p.name})`));

    // 2. Vérifier les articles CESEDA
    const articles = await prisma.legalReference.findMany();
    console.log(`\n✅ Articles CESEDA: ${articles.length} trouvés`);
    articles.forEach(a => console.log(`   - ${a.code} ${a.article}: ${a.title}`));

    // 3. Vérifier le tenant démo
    const tenants = await prisma.tenant.findMany();
    console.log(`\n✅ Tenants: ${tenants.length} trouvés`);
    tenants.forEach(t => console.log(`   - ${t.name} (${t.subdomain})`));

    // 4. Vérifier le super admin
    const users = await prisma.user.findMany({ where: { role: 'super_admin' } });
    console.log(`\n✅ Super Admins: ${users.length} trouvés`);
    users.forEach(u => console.log(`   - ${u.name} (${u.email})`));

    // 5. Vérifier les nouvelles tables
    console.log('\n🔍 Vérification des nouvelles tables...');
    
    const infoUnits = await prisma.informationUnit.count();
    console.log(`✅ InformationUnit: ${infoUnits} enregistrements`);

    const deadlines = await prisma.legalDeadline.count();
    console.log(`✅ LegalDeadline: ${deadlines} enregistrements`);

    const proofs = await prisma.proof.count();
    console.log(`✅ Proof: ${proofs} enregistrements`);

    const auditLogs = await prisma.auditLog.count();
    console.log(`✅ AuditLog: ${auditLogs} enregistrements`);

    console.log('\n🎉 Vérification terminée avec succès !');
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verify();
