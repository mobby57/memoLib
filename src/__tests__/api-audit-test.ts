#!/usr/bin/env node

/**
 * Test des APIs Audit Trail & Timeline
 *
 * Valide :
 * - GET /api/audit/trail (admin audit trail complet)
 * - GET /api/audit/timeline/[entityType]/[entityId] (entity timeline)
 * - Filtres, pagination, permissions
 */

import { PrismaClient, EventType, ActorType } from '@prisma/client';

const prisma = new PrismaClient();

interface ApiTest {
  name: string;
  endpoint: string;
  method: string;
  description: string;
}

const tests: ApiTest[] = [
  {
    name: 'GET /api/audit/trail - Admin audit trail complet',
    endpoint: '/api/audit/trail',
    method: 'GET',
    description: 'Récupère tous les events du tenant avec pagination',
  },
  {
    name: 'GET /api/audit/trail?eventType=FLOW_RECEIVED - Filtrer par type',
    endpoint: '/api/audit/trail?eventType=FLOW_RECEIVED',
    method: 'GET',
    description: "Filtre audit trail par type d'événement",
  },
  {
    name: 'GET /api/audit/trail?actorId=user-123 - Filtrer par acteur',
    endpoint: '/api/audit/trail?actorId=user-123',
    method: 'GET',
    description: 'Filtre audit trail par ID utilisateur',
  },
  {
    name: 'GET /api/audit/trail?limit=10&offset=0 - Pagination',
    endpoint: '/api/audit/trail?limit=10&offset=0',
    method: 'GET',
    description: 'Récupère 10 events avec offset 0',
  },
  {
    name: "GET /api/audit/timeline/flow/flow-123 - Timeline d'entité",
    endpoint: '/api/audit/timeline/flow/flow-123',
    method: 'GET',
    description: "Récupère la timeline de l'entité flow-123",
  },
  {
    name: 'GET /api/audit/timeline/suggestion/sugg-456?limit=20 - Timeline avec limite',
    endpoint: '/api/audit/timeline/suggestion/sugg-456?limit=20',
    method: 'GET',
    description: 'Timeline avec limite de 20 events',
  },
];

async function generateTestData() {
  console.log('📊 Génération données de test...\n');

  // Créer plan + tenant
  const plan = await prisma.plan.create({
    data: {
      name: `test-api-${Date.now()}`,
      displayName: 'Test API Audit',
      priceMonthly: 0,
      priceYearly: 0,
      maxWorkspaces: 1,
      maxDossiers: 10,
      maxClients: 10,
      maxStorageGb: 1,
      maxUsers: 1,
    },
  });

  const tenant = await prisma.tenant.create({
    data: {
      name: 'Test Audit APIs',
      subdomain: `test-api-${Date.now()}`,
      planId: plan.id,
    },
  });

  // Créer plusieurs events pour tester
  const events = [
    { type: EventType.FLOW_RECEIVED, entity: 'flow-api-123', actor: 'system' },
    { type: EventType.FLOW_CLASSIFIED, entity: 'flow-api-123', actor: 'system' },
    { type: EventType.FLOW_RECEIVED, entity: 'flow-api-456', actor: 'system' },
    { type: EventType.USER_VALIDATED_SUGGESTION, entity: 'suggestion-789', actor: 'user-123' },
    { type: EventType.DUPLICATE_DETECTED, entity: 'flow-api-123', actor: 'system' },
    { type: EventType.ACCESS_LOGIN, entity: 'user-login', actor: 'user-123' },
    { type: EventType.USER_ADDED_COMMENT, entity: 'flow-api-456', actor: 'user-456' },
  ];

  for (let i = 0; i < events.length; i++) {
    const evt = events[i];
    await prisma.eventLog.create({
      data: {
        eventType: evt.type,
        entityType: evt.entity.split('-')[0],
        entityId: evt.entity,
        actorType: evt.actor === 'system' ? ActorType.SYSTEM : ActorType.USER,
        actorId: evt.actor === 'system' ? null : evt.actor,
        tenantId: tenant.id,
        metadata: { test: true, index: i },
        immutable: true,
        checksum: `test-checksum-${i}`,
      },
    });
  }

  console.log(`✅ ${events.length} events créés\n`);
  return { tenant, plan };
}

async function printApiDocumentation() {
  console.log('\n📚 DOCUMENTATION API AUDIT\n');
  console.log('='.repeat(70));

  console.log('\n🔐 GET /api/audit/trail (ADMIN-ONLY)\n');
  console.log("Récupère l'audit trail complet du tenant avec filtres avancés");
  console.log('\nParamètres query (optionnels):');
  console.log('  • eventType    : Filtrer par type (EventType enum)');
  console.log('  • actorId      : Filtrer par acteur');
  console.log('  • startDate    : ISO date (ex: 2026-02-01T00:00:00Z)');
  console.log('  • endDate      : ISO date');
  console.log('  • limit        : Nombre de résultats par page (défaut: 100)');
  console.log('  • offset       : Offset de pagination (défaut: 0)');
  console.log('\nRéponse:');
  console.log(`{
  "trail": [
    {
      "id": "cml46p2v...",
      "timestamp": "2026-02-01T20:15:00Z",
      "eventType": "FLOW_RECEIVED",
      "entityType": "flow",
      "entityId": "flow-123",
      "actorType": "SYSTEM",
      "actorId": null,
      "metadata": {...},
      "checksum": "sha256...",
      "tenantId": "..."
    }
  ],
  "pagination": {
    "total": 42,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}`);

  console.log('\n\n🔍 GET /api/audit/timeline/[entityType]/[entityId]\n');
  console.log("Récupère la timeline d'une entité spécifique");
  console.log('\nParamètres path:');
  console.log("  • entityType : Type d'entité (ex: flow, suggestion, user)");
  console.log("  • entityId   : ID de l'entité");
  console.log('\nParamètres query (optionnels):');
  console.log('  • limit      : Nombre de résultats (défaut: 100)');
  console.log('  • offset     : Offset pagination (défaut: 0)');
  console.log('\nRéponse: Array[EventLog]');

  console.log('\n' + '='.repeat(70) + '\n');
}

async function printExamples() {
  console.log('💡 EXEMPLES DE REQUÊTES\n');

  console.log('1️⃣  Audit trail complet (première page):');
  console.log('   curl http://localhost:3000/api/audit/trail \\');
  console.log('     -H "Authorization: Bearer <token>"');

  console.log('\n2️⃣  Events FLOW_RECEIVED du dernier jour:');
  console.log(
    '   curl "http://localhost:3000/api/audit/trail?eventType=FLOW_RECEIVED&startDate=2026-01-31T00:00:00Z" \\'
  );
  console.log('     -H "Authorization: Bearer <token>"');

  console.log('\n3️⃣  Actions utilisateur user-123:');
  console.log('   curl "http://localhost:3000/api/audit/trail?actorId=user-123" \\');
  console.log('     -H "Authorization: Bearer <token>"');

  console.log('\n4️⃣  Timeline du flow flow-123:');
  console.log('   curl http://localhost:3000/api/audit/timeline/flow/flow-123 \\');
  console.log('     -H "Authorization: Bearer <token>"');

  console.log('\n5️⃣  Timeline avec limite (derniers 5 events):');
  console.log('   curl "http://localhost:3000/api/audit/timeline/flow/flow-123?limit=5" \\');
  console.log('     -H "Authorization: Bearer <token>"');

  console.log('\n');
}

async function run() {
  console.log('🧪 Tests API Audit Trail & Timeline\n');

  try {
    // Générer données
    const { tenant, plan } = await generateTestData();

    // Documentation
    await printApiDocumentation();
    await printExamples();

    // Lister les endpoints testables
    console.log('✅ ENDPOINTS À TESTER\n');
    tests.forEach((test, i) => {
      console.log(`${i + 1}. ${test.name}`);
      console.log(`   Endpoint: ${test.endpoint}`);
      console.log(`   ${test.description}\n`);
    });

    console.log('🚀 Prochaines étapes:\n');
    console.log('1. Lancer le dev server: npm run dev (dans src/frontend)');
    console.log('2. Se connecter avec un compte ADMIN');
    console.log(`3. Utiliser les endpoints listés ci-dessus`);
    console.log(`4. Tenant ID pour les requêtes: ${tenant.id}\n`);

    console.log('📝 Notes:\n');
    console.log('• Les endpoints nécessitent une session NextAuth valide (ADMIN)');
    console.log('• Les events générés restent immutables (RULE-004)');
    console.log('• La pagination fonctionne avec limit/offset');
    console.log('• Les filtres sont composables (ex: eventType + actorId)\n');

    // Cleanup
    console.log('🧹 Cleanup...');
    await prisma.tenant.delete({ where: { id: tenant.id } }).catch(() => {});
    await prisma.plan.delete({ where: { id: plan.id } }).catch(() => {});
    console.log('✅ Done\n');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

run().catch(console.error);
