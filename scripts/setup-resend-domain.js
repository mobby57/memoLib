require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const { Resend } = require("resend");

const prisma = new PrismaClient();

const resend = new Resend(process.env.RESEND_API_KEY);

function normalizeDomain(domain) {
  return domain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "");
}

async function getResendDomains() {
  const result = await resend.domains.list();

  if (result.error) {
    throw new Error(
      `Impossible de récupérer les domaines Resend : ${result.error.message}`
    );
  }

  return result.data || [];
}

async function createResendDomain(domain) {
  console.log(`   🆕 Création Resend : ${domain}`);

  const result = await resend.domains.create({
    name: domain,
    region: "eu-west-1",
    capabilities: {
      sending: "enabled",
      receiving: "disabled",
    },
  });

  if (result.error) {
    throw new Error(
      `Création Resend échouée : ${result.error.message}`
    );
  }

  return result.data;
}

async function syncTenant(tenant, resendDomains) {
  console.log(`
----------------------------------------
🏢 ${tenant.name}
----------------------------------------
Tenant ID : ${tenant.id}`);

  if (!tenant.domain) {
    console.log("⏭️ Aucun domaine → ignoré");
    return;
  }

  const domain = normalizeDomain(tenant.domain);

  console.log(`Domaine   : ${domain}`);

  let resendDomain = resendDomains.find(
    (item) => item.name.toLowerCase() === domain
  );

  // --------------------------------------------------
  // Création du domaine Resend
  // --------------------------------------------------

  if (!resendDomain) {
    resendDomain = await createResendDomain(domain);

    resendDomains.push(resendDomain);

    console.log("   ✅ Domaine créé");
  } else {
    console.log(`   ✅ Domaine déjà présent`);
  }

  console.log(`   Resend ID : ${resendDomain.id}`);
  console.log(`   Statut    : ${resendDomain.status}`);

  // --------------------------------------------------
  // Sauvegarder le domaine normalisé dans Tenant
  // --------------------------------------------------

  if (tenant.domain !== domain) {
    await prisma.tenant.update({
      where: {
        id: tenant.id,
      },
      data: {
        domain,
      },
    });

    console.log("   💾 Domaine normalisé en base");
  }

  // --------------------------------------------------
  // Récupérer les paramètres du tenant
  // --------------------------------------------------

  let settings = await prisma.tenantSettings.findUnique({
    where: {
      tenantId: tenant.id,
    },
  });

  // --------------------------------------------------
  // Créer TenantSettings s'il n'existe pas
  // --------------------------------------------------

  if (!settings) {
    settings = await prisma.tenantSettings.create({
      data: {
        id: `settings_${tenant.id}`,
        tenantId: tenant.id,
        emailEnabled: false,
      },
    });

    console.log("   ⚙️ TenantSettings créé");
  }

  // --------------------------------------------------
  // Domaine vérifié
  // --------------------------------------------------

  if (resendDomain.status === "verified") {
    if (!settings.emailEnabled) {
      await prisma.tenantSettings.update({
        where: {
          tenantId: tenant.id,
        },
        data: {
          emailEnabled: true,
        },
      });

      console.log("   🟢 Email activé");
    } else {
      console.log("   🟢 Email déjà activé");
    }

    return;
  }

  // --------------------------------------------------
  // Domaine non vérifié
  // --------------------------------------------------

  if (settings.emailEnabled) {
    await prisma.tenantSettings.update({
      where: {
        tenantId: tenant.id,
      },
      data: {
        emailEnabled: false,
      },
    });

    console.log(
      "   🟠 Domaine non vérifié → email désactivé"
    );
  } else {
    console.log(
      "   🟠 Domaine non vérifié → email reste désactivé"
    );
  }

  // --------------------------------------------------
  // Afficher les DNS
  // --------------------------------------------------

  if (resendDomain.records?.length) {
    console.log(`
   📋 DNS À CONFIGURER CHEZ LE CLIENT
`);

    for (const record of resendDomain.records) {
      console.log(`   Type  : ${record.type}`);
      console.log(`   Nom   : ${record.name}`);
      console.log(`   Valeur: ${record.value}`);

      if (record.priority) {
        console.log(`   Priorité: ${record.priority}`);
      }

      console.log("");
    }
  }
}

async function main() {
  console.log(`
========================================
🚀 MEMOLIB
🔄 SYNCHRONISATION DES DOMAINES RESEND
========================================
`);

  if (!process.env.RESEND_API_KEY) {
    throw new Error(
      "RESEND_API_KEY est absente du fichier .env"
    );
  }

  // --------------------------------------------------
  // Récupération des tenants
  // --------------------------------------------------

  const tenants = await prisma.tenant.findMany({
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      domain: true,
      subdomain: true,
    },
  });

  console.log(`🏢 ${tenants.length} tenant(s) trouvé(s)`);

  // --------------------------------------------------
  // Récupération Resend
  // --------------------------------------------------

  console.log(`
🔎 Récupération des domaines Resend...
`);

  const resendDomains = await getResendDomains();

  console.log(
    `✅ ${resendDomains.length} domaine(s) Resend trouvé(s)`
  );

  // --------------------------------------------------
  // Synchronisation
  // --------------------------------------------------

  let success = 0;
  let errors = 0;

  for (const tenant of tenants) {
    try {
      await syncTenant(tenant, resendDomains);
      success++;
    } catch (error) {
      errors++;

      console.error(`
❌ ERREUR TENANT
Nom : ${tenant.name}
ID  : ${tenant.id}
${error.message}
`);
    }
  }

  // --------------------------------------------------
  // Résumé
  // --------------------------------------------------

  console.log(`
========================================
📊 RÉSUMÉ
========================================

Tenants traités : ${tenants.length}
Succès          : ${success}
Erreurs         : ${errors}

========================================
✅ SYNCHRONISATION TERMINÉE
========================================
`);
}

main()
  .catch((error) => {
    console.error(`
========================================
❌ ERREUR FATALE
========================================

${error.message}

========================================
`);

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });