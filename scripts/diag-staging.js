// Diagnostic staging (lecture seule). À lancer DEMAIN via :
//   railway ssh "node scripts/diag-staging.js"
// (le fichier doit être déployé avec le prochain railway up pour exister côté serveur)
//
// Dit : combien de plans/users/tenants, leurs noms, et le dernier compte créé.
// Aucune modification. Sert à comprendre pourquoi le provisioning échoue.

const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

(async () => {
  try {
    const plans = await p.plan.findMany({ select: { name: true, priceMonthly: true } });
    const users = await p.user.count();
    const tenants = await p.tenant.count();
    const last = await p.user.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { email: true, role: true, tenantId: true, clerkUserId: true, createdAt: true },
    });

    console.log('=== DIAGNOSTIC STAGING ===');
    console.log('Plans en base :', plans.map((x) => x.name).join(', ') || '(AUCUN)');
    console.log('  -> code attend : solo / cabinet / enterprise');
    console.log('Users :', users, '| Tenants :', tenants);
    console.log('Dernier user :', JSON.stringify(last, null, 2));
    console.log('');
    if (last && !last.tenantId) {
      console.log('⚠️ Le dernier user n a PAS de tenantId -> provisioning a échoué (= cause UI KO)');
    }
    if (!plans.some((x) => ['solo', 'cabinet', 'enterprise'].includes(x.name))) {
      console.log('⚠️ Aucun plan nommé solo/cabinet/enterprise -> le webhook jette "Plan introuvable"');
      console.log('   -> appliquer FIX_PROVISIONING_PLANS (fallback) OU renommer les plans.');
    }
  } catch (e) {
    console.log('ERREUR :', e.message);
  } finally {
    await p.$disconnect();
  }
})();
