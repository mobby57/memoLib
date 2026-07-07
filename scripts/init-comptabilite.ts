/**
 * Script d'initialisation du module comptabilité
 * À exécuter une fois pour chaque tenant existant
 *
 * Usage : npx tsx scripts/init-comptabilite.ts [tenantId]
 */

import prisma from '../src/lib/prisma';
import { PlanComptableService } from '../src/lib/services/comptabilite';

const JOURNAUX_DEFAUT = [
  { code: 'VE', libelle: 'Journal des ventes', type: 'VENTES' as const },
  { code: 'AC', libelle: 'Journal des achats', type: 'ACHATS' as const },
  { code: 'BQ', libelle: 'Journal de banque', type: 'BANQUE' as const },
  { code: 'CA', libelle: 'Journal de caisse', type: 'CAISSE' as const },
  { code: 'OD', libelle: 'Opérations diverses', type: 'OD' as const },
  { code: 'CP', libelle: 'Journal CARPA', type: 'CARPA' as const },
];

async function initComptabilite(tenantId?: string) {
  const tenants = tenantId
    ? [await prisma.tenant.findUnique({ where: { id: tenantId } })]
    : await prisma.tenant.findMany({ where: { status: 'active' } });

  for (const tenant of tenants) {
    if (!tenant) continue;

    console.log(`\n📊 Initialisation comptabilité pour : ${tenant.name} (${tenant.id})`);

    // 1. Créer les journaux
    let journauxCreated = 0;
    for (const journal of JOURNAUX_DEFAUT) {
      try {
        await prisma.journal.create({
          data: {
            tenantId: tenant.id,
            code: journal.code,
            libelle: journal.libelle,
            type: journal.type,
            updatedAt: new Date(),
          },
        });
        journauxCreated++;
      } catch (e: any) {
        if (e.code === 'P2002') {
          // Déjà existant, skip
        } else {
          console.error(`  ❌ Erreur journal ${journal.code}:`, e.message);
        }
      }
    }
    console.log(`  ✅ Journaux : ${journauxCreated} créés`);

    // 2. Créer le plan comptable
    const comptesCreated = await PlanComptableService.initialiserPlanComptable(tenant.id);
    console.log(`  ✅ Plan comptable : ${comptesCreated} comptes créés`);

    // 3. Créer les sous-comptes clients existants
    const clients = await prisma.client.findMany({
      where: { tenantId: tenant.id },
      select: { id: true, firstName: true, lastName: true },
    });

    let clientsComptes = 0;
    for (const client of clients) {
      try {
        await PlanComptableService.creerCompteClient(
          tenant.id,
          client.id,
          `${client.firstName} ${client.lastName}`
        );
        clientsComptes++;
      } catch {
        // Skip si déjà existant
      }
    }
    console.log(`  ✅ Sous-comptes clients : ${clientsComptes} créés`);

    console.log(`  🎉 Module comptabilité initialisé pour ${tenant.name}`);
  }

  console.log('\n✅ Initialisation terminée !');
}

// Exécution
const tenantIdArg = process.argv[2];
initComptabilite(tenantIdArg)
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Erreur:', err);
    process.exit(1);
  });
