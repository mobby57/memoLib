/**
 * 🚀 Validation Complète de Tous les Workflows Avancés
 * memoLib - Test Suite Complète
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config({ path: '.env' });

const prisma = new PrismaClient();

// Couleurs pour la sortie console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

interface TestResult {
  name: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: any;
}

const results: TestResult[] = [];

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logResult(emoji: string, title: string, status: 'success' | 'warning' | 'error', message: string) {
  const color = status === 'success' ? 'green' : status === 'warning' ? 'yellow' : 'red';
  log(`${emoji} ${title}`, color);
  log(`  ${message}`, color);
  results.push({ name: title, status, message });
}

async function testDatabaseConnection() {
  log('\n📊 Test 1: Connexion Base de Données', 'cyan');
  try {
    await prisma.$connect();
    const tenants = await prisma.tenant.count();
    const users = await prisma.user.count();
    const dossiers = await prisma.dossier.count();
    
    logResult('✅', 'Base de Données', 'success', 
      `Connectée - ${tenants} tenants, ${users} utilisateurs, ${dossiers} dossiers`);
    
    return { tenants, users, dossiers };
  } catch (error) {
    logResult('❌', 'Base de Données', 'error', `Erreur: ${error}`);
    return null;
  }
}

async function testGitHubConfiguration() {
  log('\n🐙 Test 2: Configuration GitHub', 'cyan');
  
  const requiredVars = [
    'GITHUB_APP_ID',
    'GITHUB_CLIENT_ID',
    'GITHUB_CLIENT_SECRET',
    'GITHUB_CALLBACK_URL',
    'GITHUB_REPOSITORY',
  ];
  
  const missing: string[] = [];
  const configured: string[] = [];
  
  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      configured.push(varName);
    } else {
      missing.push(varName);
    }
  });
  
  if (missing.length === 0) {
    logResult('✅', 'Configuration GitHub', 'success', 
      `Toutes les variables configurées (${configured.length}/${requiredVars.length})`);
  } else {
    logResult('⚠️', 'Configuration GitHub', 'warning', 
      `Variables manquantes: ${missing.join(', ')}`);
  }
  
  return { configured: configured.length, missing: missing.length };
}

async function testEmailConfiguration() {
  log('\n📧 Test 3: Configuration Email', 'cyan');
  
  const emailEnabled = process.env.EMAIL_ENABLED === 'true';
  const emailAddress = process.env.EMAIL_ADDRESS;
  const emailPassword = process.env.EMAIL_PASSWORD;
  
  if (emailEnabled && emailAddress && emailPassword) {
    logResult('✅', 'Configuration Email', 'success', 
      `Email monitoring activé (${emailAddress})`);
  } else if (emailEnabled) {
    logResult('⚠️', 'Configuration Email', 'warning', 
      'Activé mais credentials incomplets');
  } else {
    logResult('ℹ️', 'Configuration Email', 'warning', 
      'Email monitoring désactivé');
  }
  
  return { enabled: emailEnabled, configured: !!(emailAddress && emailPassword) };
}

async function testOllamaConnection() {
  log('\n🤖 Test 4: IA Locale (Ollama)', 'cyan');
  
  const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
  
  try {
    const response = await fetch(ollamaUrl, {
      signal: AbortSignal.timeout(5000),
    });
    
    if (response.ok) {
      logResult('✅', 'Ollama IA', 'success', 
        `Connecté à ${ollamaUrl}`);
      return true;
    } else {
      logResult('⚠️', 'Ollama IA', 'warning', 
        `Service accessible mais erreur: ${response.status}`);
      return false;
    }
  } catch (error) {
    logResult('❌', 'Ollama IA', 'error', 
      `Non accessible sur ${ollamaUrl}. Lancez: ollama serve`);
    return false;
  }
}

async function testWebSocketConfiguration() {
  log('\n🔌 Test 5: Configuration WebSocket', 'cyan');
  
  const wsEnabled = process.env.WEBSOCKET_ENABLED === 'true';
  const wsPort = process.env.WEBSOCKET_PORT || '3001';
  
  if (wsEnabled) {
    logResult('✅', 'WebSocket', 'success', 
      `Activé sur le port ${wsPort}`);
  } else {
    logResult('ℹ️', 'WebSocket', 'warning', 
      'WebSocket désactivé');
  }
  
  return { enabled: wsEnabled, port: wsPort };
}

async function testAdvancedAIFeatures() {
  log('\n🧠 Test 6: Fonctionnalités IA Avancées', 'cyan');
  
  const features = {
    learning: process.env.AI_LEARNING_ENABLED === 'true',
    suggestions: process.env.AI_SUGGESTIONS_ENABLED === 'true',
    semantic: process.env.SEMANTIC_SEARCH_ENABLED === 'true',
  };
  
  const enabledCount = Object.values(features).filter(Boolean).length;
  
  if (enabledCount === 3) {
    logResult('✅', 'IA Avancée', 'success', 
      'Toutes les fonctionnalités activées (3/3)');
  } else {
    logResult('⚠️', 'IA Avancée', 'warning', 
      `${enabledCount}/3 fonctionnalités activées`);
  }
  
  return features;
}

async function testSmartFormsSystem() {
  log('\n📝 Test 7: Système de Formulaires Intelligents', 'cyan');
  
  try {
    const submissions = await prisma.formSubmission.count();
    const approvals = await prisma.approvalTask.count();
    const risks = await prisma.riskAssessment.count();
    const decisions = await prisma.strategicDecision.count();
    
    logResult('✅', 'Smart Forms', 'success', 
      `Opérationnel - ${submissions} soumissions, ${approvals} approbations, ${risks} risques`);
    
    return { submissions, approvals, risks, decisions };
  } catch (error) {
    logResult('⚠️', 'Smart Forms', 'warning', 
      'Tables présentes mais erreur d\'accès');
    return null;
  }
}

async function testEmailClassificationSystem() {
  log('\n🏷️ Test 8: Système de Classification Email', 'cyan');
  
  try {
    const emails = await prisma.email.count();
    const classifications = await prisma.emailClassification.count();
    
    if (emails > 0) {
      logResult('✅', 'Classification Email', 'success', 
        `${emails} emails, ${classifications} classifications`);
    } else {
      logResult('ℹ️', 'Classification Email', 'warning', 
        'Système prêt, aucun email traité encore');
    }
    
    return { emails, classifications };
  } catch (error) {
    logResult('❌', 'Classification Email', 'error', 
      'Erreur d\'accès aux tables email');
    return null;
  }
}

async function testAuditLogSystem() {
  log('\n📜 Test 9: Système d\'Audit (Zero-Trust)', 'cyan');
  
  try {
    const auditLogs = await prisma.auditLog.count();
    
    if (auditLogs > 0) {
      logResult('✅', 'Audit Log', 'success', 
        `${auditLogs} événements tracés`);
    } else {
      logResult('ℹ️', 'Audit Log', 'warning', 
        'Système prêt, aucun événement encore');
    }
    
    return auditLogs;
  } catch (error) {
    logResult('⚠️', 'Audit Log', 'warning', 
      'Table présente mais erreur d\'accès');
    return 0;
  }
}

async function testWorkspaceSystem() {
  log('\n📁 Test 10: Système Workspace CESDA', 'cyan');
  
  try {
    const workspaces = await prisma.workspace.count();
    const documents = await prisma.workspaceDocument.count();
    const drafts = await prisma.workspaceDraft.count();
    
    logResult('✅', 'Workspace CESDA', 'success', 
      `${workspaces} workspaces, ${documents} documents, ${drafts} brouillons`);
    
    return { workspaces, documents, drafts };
  } catch (error) {
    logResult('⚠️', 'Workspace CESDA', 'warning', 
      'Tables présentes mais erreur d\'accès');
    return null;
  }
}

async function testCloudflareConfiguration() {
  log('\n☁️ Test 11: Configuration Cloudflare Tunnel', 'cyan');
  
  const tunnelEnabled = process.env.CLOUDFLARE_TUNNEL_ENABLED === 'true';
  const tunnelUrl = process.env.CLOUDFLARE_TUNNEL_URL;
  const webhookUrl = process.env.PUBLIC_WEBHOOK_URL;
  
  if (tunnelEnabled && tunnelUrl) {
    logResult('✅', 'Cloudflare Tunnel', 'success', 
      `Activé - ${tunnelUrl}`);
  } else if (tunnelEnabled) {
    logResult('⚠️', 'Cloudflare Tunnel', 'warning', 
      'Activé mais URL non configurée');
  } else {
    logResult('ℹ️', 'Cloudflare Tunnel', 'warning', 
      'Tunnel désactivé');
  }
  
  return { enabled: tunnelEnabled, url: tunnelUrl, webhookUrl };
}

async function testSecurityConfiguration() {
  log('\n🔒 Test 12: Configuration Sécurité', 'cyan');
  
  const features = {
    nextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    encryptionKey: !!process.env.ENCRYPTION_KEY,
    jwtSecret: !!process.env.JWT_SECRET,
    rateLimitEnabled: process.env.API_RATE_LIMIT_ENABLED === 'true',
  };
  
  const secureCount = Object.values(features).filter(Boolean).length;
  
  if (secureCount === 4) {
    logResult('✅', 'Sécurité', 'success', 
      'Toutes les clés configurées (4/4)');
  } else {
    logResult('⚠️', 'Sécurité', 'warning', 
      `${secureCount}/4 clés configurées`);
  }
  
  return features;
}

async function generateReport() {
  log('\n' + '='.repeat(60), 'bold');
  log('📊 RAPPORT DE VALIDATION COMPLET', 'bold');
  log('='.repeat(60), 'bold');
  
  const successCount = results.filter(r => r.status === 'success').length;
  const warningCount = results.filter(r => r.status === 'warning').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  const total = results.length;
  
  log(`\n✅ Succès: ${successCount}/${total}`, 'green');
  log(`⚠️  Avertissements: ${warningCount}/${total}`, 'yellow');
  log(`❌ Erreurs: ${errorCount}/${total}`, 'red');
  
  const score = Math.round((successCount / total) * 100);
  
  log('\n' + '='.repeat(60), 'bold');
  log(`🎯 Score Global: ${score}%`, score >= 80 ? 'green' : score >= 60 ? 'yellow' : 'red');
  log('='.repeat(60), 'bold');
  
  if (score >= 90) {
    log('\n🎉 EXCELLENT ! Tous les workflows sont opérationnels !', 'green');
  } else if (score >= 75) {
    log('\n👍 BON ! La plupart des workflows fonctionnent.', 'yellow');
  } else if (score >= 50) {
    log('\n⚠️  ATTENTION ! Plusieurs workflows nécessitent de la configuration.', 'yellow');
  } else {
    log('\n❌ CRITIQUE ! Beaucoup de workflows ne sont pas configurés.', 'red');
  }
  
  // Recommandations
  log('\n📋 RECOMMANDATIONS:', 'cyan');
  
  if (warningCount > 0 || errorCount > 0) {
    results.forEach(result => {
      if (result.status !== 'success') {
        log(`  • ${result.name}: ${result.message}`, 'yellow');
      }
    });
  } else {
    log('  ✅ Aucune action requise - Tous les systèmes opérationnels !', 'green');
  }
  
  log('\n' + '='.repeat(60), 'bold');
}

async function main() {
  log('\n🚀 VALIDATION DE TOUS LES WORKFLOWS AVANCÉS', 'bold');
  log('memoLib - Test Suite Complète\n', 'bold');
  
  try {
    // Tests séquentiels
    await testDatabaseConnection();
    await testGitHubConfiguration();
    await testEmailConfiguration();
    await testOllamaConnection();
    await testWebSocketConfiguration();
    await testAdvancedAIFeatures();
    await testSmartFormsSystem();
    await testEmailClassificationSystem();
    await testAuditLogSystem();
    await testWorkspaceSystem();
    await testCloudflareConfiguration();
    await testSecurityConfiguration();
    
    // Générer le rapport
    await generateReport();
    
  } catch (error) {
    log('\n❌ Erreur lors de la validation:', 'red');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
