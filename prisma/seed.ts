import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database - Architecture 3 Niveaux...')

  // ============================================
  // ÉTAPE 1 : CRÉER LES 3 PLANS
  // ============================================
  console.log('\n📊 Création des plans tarifaires...')

  const basicPlan = await prisma.plan.create({
    data: {
      name: 'BASIC',
      displayName: 'Basic',
      description: 'Pour petits cabinets et indépendants',
      priceMonthly: 49.00,
      priceYearly: 490.00,
      maxDossiers: 100,
      maxClients: 20,
      maxStorageGb: 5,
      maxUsers: 3,
      aiAutonomyLevel: 1,
      humanValidation: true,
      advancedAnalytics: false,
      externalAiAccess: false,
      prioritySupport: false,
      customBranding: false,
      apiAccess: false,
    }
  })

  const premiumPlan = await prisma.plan.create({
    data: {
      name: 'PREMIUM',
      displayName: 'Premium',
      description: 'Pour cabinets structurés',
      priceMonthly: 149.00,
      priceYearly: 1490.00,
      maxDossiers: 1000,
      maxClients: 200,
      maxStorageGb: 50,
      maxUsers: 15,
      aiAutonomyLevel: 3,
      humanValidation: false,
      advancedAnalytics: true,
      externalAiAccess: true,
      prioritySupport: false,
      customBranding: true,
      apiAccess: true,
    }
  })

  const enterprisePlan = await prisma.plan.create({
    data: {
      name: 'ENTERPRISE',
      displayName: 'Enterprise',
      description: 'Pour grands cabinets et international',
      priceMonthly: 499.00,
      priceYearly: 4990.00,
      maxDossiers: 999999,
      maxClients: 999999,
      maxStorageGb: 500,
      maxUsers: 100,
      aiAutonomyLevel: 4,
      humanValidation: false,
      advancedAnalytics: true,
      externalAiAccess: true,
      prioritySupport: true,
      customBranding: true,
      apiAccess: true,
    }
  })

  console.log(`✅ Plans créés: Basic, Premium, Enterprise`)

  // ============================================
  // ÉTAPE 2 : CRÉER SUPER ADMIN
  // ============================================
  console.log('\n👑 Création du Super Admin...')

  const superAdmin = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'superadmin@iapostemanager.com',
      password: await bcrypt.hash('SuperAdmin2026!', 10),
      role: 'SUPER_ADMIN',
      status: 'active',
    }
  })

  console.log(`✅ Super Admin créé: ${superAdmin.email}`)

  // ============================================
  // ÉTAPE 3 : CRÉER LES 3 CABINETS
  // ============================================
  console.log('\n🏢 Création des cabinets...')

  // CABINET 1 : DUPONT (BASIC)
  const cabinetDupont = await prisma.tenant.create({
    data: {
      name: 'Cabinet Dupont',
      subdomain: 'cabinet-dupont',
      planId: basicPlan.id,
      status: 'active',
      billingEmail: 'facturation@cabinet-dupont.fr',
      currentDossiers: 0,
      currentClients: 0,
      currentStorageGb: 0,
      currentUsers: 0,
      settings: {
        create: {
          ollamaEnabled: true,
          ollamaUrl: 'http://localhost:11434',
          ollamaModel: 'llama3.2:latest',
          maxDossiers: basicPlan.maxDossiers,
          maxUsers: basicPlan.maxUsers,
          storageLimit: basicPlan.maxStorageGb * 1024,
        }
      }
    },
  })

  // CABINET 2 : MARTIN (PREMIUM)
  const cabinetMartin = await prisma.tenant.create({
    data: {
      name: 'Cabinet Martin & Associés',
      subdomain: 'cabinet-martin',
      planId: premiumPlan.id,
      status: 'active',
      billingEmail: 'facturation@cabinet-martin.fr',
      currentDossiers: 0,
      currentClients: 0,
      currentStorageGb: 0,
      currentUsers: 0,
      settings: {
        create: {
          ollamaEnabled: true,
          ollamaUrl: 'http://localhost:11434',
          ollamaModel: 'llama3.2:latest',
          maxDossiers: premiumPlan.maxDossiers,
          maxUsers: premiumPlan.maxUsers,
          storageLimit: premiumPlan.maxStorageGb * 1024,
        }
      }
    },
  })

  // CABINET 3 : ROUSSEAU (ENTERPRISE)
  const cabinetRousseau = await prisma.tenant.create({
    data: {
      name: 'Cabinet Rousseau International',
      subdomain: 'cabinet-rousseau',
      planId: enterprisePlan.id,
      status: 'active',
      billingEmail: 'facturation@cabinet-rousseau.fr',
      currentDossiers: 0,
      currentClients: 0,
      currentStorageGb: 0,
      currentUsers: 0,
      settings: {
        create: {
          ollamaEnabled: true,
          ollamaUrl: 'http://localhost:11434',
          ollamaModel: 'llama3.2:latest',
          maxDossiers: enterprisePlan.maxDossiers,
          maxUsers: enterprisePlan.maxUsers,
          storageLimit: enterprisePlan.maxStorageGb * 1024,
        }
      }
    },
  })

  console.log(`✅ Cabinets créés: Dupont (Basic), Martin (Premium), Rousseau (Enterprise)`)

  // ============================================
  // ÉTAPE 4 : CRÉER AVOCATS (ADMIN)
  // ============================================
  console.log('\n⚖️ Création des avocats...')

  const avocatDupont = await prisma.user.create({
    data: {
      name: 'Maître Jean Dupont',
      email: 'jean.dupont@cabinet-dupont.fr',
      password: await bcrypt.hash('Avocat2026!', 10),
      role: 'ADMIN',
      tenantId: cabinetDupont.id,
      status: 'active',
    }
  })

  const avocatMartin = await prisma.user.create({
    data: {
      name: 'Maître Sophie Martin',
      email: 'sophie.martin@cabinet-martin.fr',
      password: await bcrypt.hash('Avocat2026!', 10),
      role: 'ADMIN',
      tenantId: cabinetMartin.id,
      status: 'active',
    }
  })

  const avocatRousseau = await prisma.user.create({
    data: {
      name: 'Maître Pierre Rousseau',
      email: 'pierre.rousseau@cabinet-rousseau.fr',
      password: await bcrypt.hash('Avocat2026!', 10),
      role: 'ADMIN',
      tenantId: cabinetRousseau.id,
      status: 'active',
    }
  })

  console.log(`✅ Avocats créés pour chaque cabinet: ${avocatDupont.id}, ${avocatMartin.id}, ${avocatRousseau.id}`)

  // ============================================
  // ÉTAPE 5 : CRÉER CLIENTS FINAUX
  // ============================================
  console.log('\n👤 Création des clients...')

  // Clients Cabinet Dupont
  const clientDupont1 = await prisma.client.create({
    data: {
      tenantId: cabinetDupont.id,
      firstName: 'Mohamed',
      lastName: 'Benali',
      email: 'mohamed.benali@example.com',
      phone: '+33612345678',
      nationality: 'Algérie',
      status: 'active',
    }
  })

  const clientDupont2 = await prisma.client.create({
    data: {
      tenantId: cabinetDupont.id,
      firstName: 'Fatima',
      lastName: 'El Amrani',
      email: 'fatima.elamrani@example.com',
      phone: '+33612345679',
      nationality: 'Maroc',
      status: 'active',
    }
  })

  // Clients Cabinet Martin
  const clientMartin1 = await prisma.client.create({
    data: {
      tenantId: cabinetMartin.id,
      firstName: 'Karim',
      lastName: 'Ibrahim',
      email: 'karim.ibrahim@example.com',
      phone: '+33623456789',
      nationality: 'Syrie',
      status: 'active',
    }
  })

  const clientMartin2 = await prisma.client.create({
    data: {
      tenantId: cabinetMartin.id,
      firstName: 'Elena',
      lastName: 'Popescu',
      email: 'elena.popescu@example.com',
      phone: '+33623456790',
      nationality: 'Roumanie',
      status: 'active',
    }
  })

  // Clients Cabinet Rousseau
  const clientRousseau1 = await prisma.client.create({
    data: {
      tenantId: cabinetRousseau.id,
      firstName: 'Youssef',
      lastName: 'Hassan',
      email: 'youssef.hassan@example.com',
      phone: '+33634567890',
      nationality: 'Égypte',
      status: 'active',
    }
  })

  const clientRousseau2 = await prisma.client.create({
    data: {
      tenantId: cabinetRousseau.id,
      firstName: 'Aisha',
      lastName: 'Mohammed',
      email: 'aisha.mohammed@example.com',
      phone: '+33634567891',
      nationality: 'Soudan',
      status: 'active',
    }
  })

  console.log(`✅ Clients créés: 2 par cabinet`)

  // ============================================
  // ÉTAPE 6 : CRÉER COMPTES CLIENTS (pour portail)
  // ============================================
  console.log('\n🔐 Création des comptes portail clients...')

  await prisma.user.create({
    data: {
      name: `${clientDupont1.firstName} ${clientDupont1.lastName}`,
      email: clientDupont1.email,
      password: await bcrypt.hash('Client2026!', 10),
      role: 'CLIENT',
      tenantId: cabinetDupont.id,
      clientId: clientDupont1.id,
      status: 'active',
    }
  })

  await prisma.user.create({
    data: {
      name: `${clientMartin1.firstName} ${clientMartin1.lastName}`,
      email: clientMartin1.email,
      password: await bcrypt.hash('Client2026!', 10),
      role: 'CLIENT',
      tenantId: cabinetMartin.id,
      clientId: clientMartin1.id,
      status: 'active',
    }
  })

  console.log(`✅ Comptes portail créés pour 2 clients`)

  // ============================================
  // ÉTAPE 7 : CRÉER DOSSIERS CESEDA
  // ============================================
  console.log('\n📁 Création des dossiers CESEDA...')

  const dossierDupont1 = await prisma.dossier.create({
    data: {
      tenantId: cabinetDupont.id,
      numero: 'D-2026-001',
      clientId: clientDupont1.id,
      typeDossier: 'OQTF',
      articleCeseda: 'Art. L511-1',
      statut: 'urgent',
      priorite: 'critique',
      objet: 'Recours contre OQTF',
      description: 'OQTF notifiée le 20/12/2025, délai de recours 30 jours',
      dateEcheance: new Date('2026-01-19'),
      riskScore: 85,
    }
  })

  await prisma.dossier.create({
    data: {
      tenantId: cabinetDupont.id,
      numero: 'D-2026-002',
      clientId: clientDupont2.id,
      typeDossier: 'TitreSejour',
      statut: 'en_cours',
      priorite: 'normale',
      objet: 'Première demande titre de séjour',
      description: 'Demande titre de séjour salarié',
      dateEcheance: new Date('2026-03-15'),
    }
  })

  await prisma.dossier.create({
    data: {
      tenantId: cabinetMartin.id,
      numero: 'M-2026-045',
      clientId: clientMartin1.id,
      typeDossier: 'Asile',
      statut: 'en_cours',
      priorite: 'haute',
      objet: 'Demande d\'asile politique',
      description: 'Demande d\'asile - persécutions politiques',
      dateEcheance: new Date('2026-03-10'),
      riskScore: 45,
    }
  })

  await prisma.dossier.create({
    data: {
      tenantId: cabinetMartin.id,
      numero: 'M-2026-046',
      clientId: clientMartin2.id,
      typeDossier: 'CarteResident',
      articleCeseda: 'Art. L314-11',
      statut: 'en_attente',
      priorite: 'normale',
      objet: 'Carte de résident 10 ans',
      description: 'Demande carte de résident',
      dateEcheance: new Date('2026-02-28'),
    }
  })

  await prisma.dossier.create({
    data: {
      tenantId: cabinetRousseau.id,
      numero: 'R-2026-112',
      clientId: clientRousseau1.id,
      typeDossier: 'CarteResident',
      articleCeseda: 'Art. L313-11',
      statut: 'urgent',
      priorite: 'critique',
      objet: 'Renouvellement carte de résident',
      description: 'Renouvellement urgent - carte expirée',
      dateEcheance: new Date('2026-01-10'),
      riskScore: 70,
    }
  })

  await prisma.dossier.create({
    data: {
      tenantId: cabinetRousseau.id,
      numero: 'R-2026-113',
      clientId: clientRousseau2.id,
      typeDossier: 'Naturalisation',
      statut: 'en_cours',
      priorite: 'normale',
      objet: 'Demande de naturalisation',
      description: 'Naturalisation par mariage',
      dateEcheance: new Date('2026-06-20'),
    }
  })

  console.log(`✅ Dossiers créés: 2 par cabinet`)

  // ============================================
  // ÉTAPE 8 : CRÉER FACTURES
  // ============================================
  console.log('\n💰 Création des factures...')

  await prisma.facture.create({
    data: {
      tenantId: cabinetDupont.id,
      numero: 'F-2026-001',
      dossierId: dossierDupont1.id,
      clientName: `${clientDupont1.firstName} ${clientDupont1.lastName}`,
      montant: 1500.00,
      statut: 'en_attente',
      dateEcheance: new Date('2026-02-01'),
      description: 'Recours OQTF - Honoraires',
    }
  })

  await prisma.facture.create({
    data: {
      tenantId: cabinetMartin.id,
      numero: 'FM-2026-023',
      clientName: `${clientMartin1.firstName} ${clientMartin1.lastName}`,
      montant: 950.00,
      statut: 'payee',
      dateEcheance: new Date('2026-01-15'),
      datePaiement: new Date('2026-01-10'),
      description: 'Asile politique - Consultation',
    }
  })

  await prisma.facture.create({
    data: {
      tenantId: cabinetRousseau.id,
      numero: 'FR-2026-089',
      clientName: `${clientRousseau1.firstName} ${clientRousseau1.lastName}`,
      montant: 1200.00,
      statut: 'payee',
      dateEcheance: new Date('2026-01-05'),
      datePaiement: new Date('2026-01-03'),
      description: 'Carte de résident - Dossier urgent',
    }
  })

  console.log(`✅ Factures créées`)

  // ============================================
  // RÉSUMÉ FINAL
  // ============================================
  console.log('\n' + '='.repeat(50))
  console.log('🎉 SEED TERMINÉ AVEC SUCCÈS !')
  console.log('='.repeat(50))
  console.log('\n📊 COMPTES CRÉÉS:')
  console.log(`   👑 Super Admin: superadmin@iapostemanager.com / SuperAdmin2026!`)
  console.log(`   ⚖️  Avocat Dupont: jean.dupont@cabinet-dupont.fr / Avocat2026!`)
  console.log(`   ⚖️  Avocat Martin: sophie.martin@cabinet-martin.fr / Avocat2026!`)
  console.log(`   ⚖️  Avocat Rousseau: pierre.rousseau@cabinet-rousseau.fr / Avocat2026!`)
  console.log(`   👤 Client 1: ${clientDupont1.email} / Client2026!`)
  console.log(`   👤 Client 2: ${clientMartin1.email} / Client2026!`)
  console.log('\n🏢 CABINETS:')
  console.log(`   • ${cabinetDupont.name} (Plan: BASIC)`)
  console.log(`   • ${cabinetMartin.name} (Plan: PREMIUM)`)
  console.log(`   • ${cabinetRousseau.name} (Plan: ENTERPRISE)`)
  console.log('\n📁 DOSSIERS: 6 dossiers CESEDA créés')
  console.log('💰 FACTURES: 3 factures créées')
  console.log('=' .repeat(50) + '\n')

  console.log('\n🎉 Database seeded successfully!')
  console.log('\n📝 Identifiants de connexion:')
  console.log('   Email: admin@demo.com')
  console.log('\n📁 DOSSIERS: 6 dossiers CESEDA créés')
  console.log('💰 FACTURES: 3 factures créées')
  console.log('='.repeat(50) + '\n')
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
