/**
 * 🧪 Script de Test du Système de Formulaires Intelligents
 */

import { prisma } from '../src/lib/prisma';

async function testSmartFormsSystem() {
  console.log('🧪 Test du système de formulaires intelligents...\n');

  try {
    // Test 1: Créer une demande de ressources
    console.log('1️⃣ Test: Demande de ressources');
    const resourceRequest = await createTestResourceRequest();
    console.log('✅ Demande créée:', resourceRequest);

    // Test 2: Créer une décision stratégique
    console.log('\n2️⃣ Test: Décision stratégique');
    const strategicDecision = await createTestStrategicDecision();
    console.log('✅ Décision créée:', strategicDecision);

    // Test 3: Créer une évaluation de risque
    console.log('\n3️⃣ Test: Évaluation de risque');
    const riskAssessment = await createTestRiskAssessment();
    console.log('✅ Risque évalué:', riskAssessment);

    // Test 4: Créer workflow d'approbation
    console.log('\n4️⃣ Test: Workflow d\'approbation');
    const approvalTasks = await createTestApprovalWorkflow(resourceRequest.id);
    console.log('✅ Tâches créées:', approvalTasks.length);

    // Test 5: Créer alerte critique
    console.log('\n5️⃣ Test: Alerte critique');
    const alert = await createTestAlert();
    console.log('✅ Alerte créée:', alert);

    // Test 6: Statistiques globales
    console.log('\n6️⃣ Test: Statistiques du système');
    const stats = await getSystemStats();
    console.log('✅ Statistiques:', stats);

    console.log('\n✅ Tous les tests ont réussi!');
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
    throw error;
  }
}

async function createTestResourceRequest() {
  return await prisma.formSubmission.create({
    data: {
      formType: 'resource-request',
      submitterId: 'user-123',
      submitterEmail: 'test@example.com',
      status: 'pending',
      data: JSON.stringify({
        resourceType: 'human',
        justification: 'Besoin urgent d\'un développeur full-stack pour projet client stratégique',
        urgency: 'high',
        estimatedCost: 65000,
        duration: '12 mois',
        alternatives: 'Freelance possible mais préférence CDI',
      }),
      impactScore: 12,
      requiresApproval: true,
    },
  });
}

async function createTestStrategicDecision() {
  return await prisma.strategicDecision.create({
    data: {
      title: 'Migration vers architecture cloud-native',
      context: 'Infrastructure actuelle coûteuse et difficile à maintenir',
      proposedSolution: 'Migration progressive vers Azure avec approche microservices',
      expectedImpact: JSON.stringify({
        cost: 'Réduction 30% sur 3 ans',
        efficiency: 'Amélioration 50% temps déploiement',
        scalability: 'Auto-scaling automatique',
      }),
      risks: 'Complexité migration, courbe d\'apprentissage, coûts initiaux',
      timeline: '18 mois - Phase 1: 6 mois, Phase 2: 12 mois',
      kpis: 'Uptime 99.9%, Coût/utilisateur, Time-to-deploy',
      riskScore: 7,
      status: 'pending-approval',
      submitterId: 'user-456',
      submitterEmail: 'cto@example.com',
    },
  });
}

async function createTestRiskAssessment() {
  return await prisma.riskAssessment.create({
    data: {
      category: 'security',
      description: 'Détection de tentatives d\'accès non autorisées répétées sur API admin',
      probability: 'high',
      severity: 'major',
      riskScore: 16,
      priorityLevel: 'critical',
      mitigationPlan: 'Mise en place rate limiting, 2FA obligatoire, monitoring renforcé',
      responsiblePerson: 'security-team@example.com',
      status: 'active',
      submitterId: 'user-789',
      submitterEmail: 'devops@example.com',
    },
  });
}

async function createTestApprovalWorkflow(submissionId: string) {
  const approvers = [
    { role: 'Manager', level: 1, dueInDays: 3 },
    { role: 'Director', level: 2, dueInDays: 7 },
    { role: 'CEO', level: 3, dueInDays: 14 },
  ];

  const tasks = [];
  for (const approver of approvers) {
    const task = await prisma.approvalTask.create({
      data: {
        submissionId,
        approverRole: approver.role,
        status: approver.level === 1 ? 'pending' : 'waiting',
        level: approver.level,
        isActive: approver.level === 1,
        dueDate: new Date(Date.now() + approver.dueInDays * 24 * 60 * 60 * 1000),
      },
    });
    tasks.push(task);
  }

  return tasks;
}

async function createTestAlert() {
  return await prisma.systemAlert.create({
    data: {
      type: 'risk-critical',
      severity: 'critical',
      title: 'Risque de sécurité critique détecté',
      description: 'Tentatives d\'intrusion répétées - action immédiate requise',
      targetRole: 'ADMIN',
      status: 'active',
      actionUrl: '/lawyer/forms?type=risk-assessment',
    },
  });
}

async function getSystemStats() {
  const [
    totalSubmissions,
    pendingApprovals,
    criticalRisks,
    strategicDecisions,
  ] = await Promise.all([
    prisma.formSubmission.count(),
    prisma.approvalTask.count({ where: { status: 'pending' } }),
    prisma.riskAssessment.count({ where: { priorityLevel: 'critical' } }),
    prisma.strategicDecision.count({ where: { status: 'pending-approval' } }),
  ]);

  return {
    totalSubmissions,
    pendingApprovals,
    criticalRisks,
    strategicDecisions,
  };
}

// Exécuter les tests
testSmartFormsSystem()
  .then(() => {
    console.log('\n🎉 Système de formulaires intelligents opérationnel!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Échec des tests:', error);
    process.exit(1);
  });
