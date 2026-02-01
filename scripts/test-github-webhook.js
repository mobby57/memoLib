#!/usr/bin/env node

/**
 * Script de test pour webhook GitHub
 * Simule un événement GitHub sans avoir à configurer le webhook réel
 * 
 * Usage: node scripts/test-github-webhook.js
 */

const crypto = require('crypto');

const WEBHOOK_URL = 'http://localhost:3000/api/webhooks/github';
const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || 'your_webhook_secret_here';

// Payloads de test
const testPayloads = {
  ping: {
    zen: 'Keep it logically awesome.',
    hook_id: 123456,
    repository: {
      full_name: 'test/repo',
      stargazers_count: 42
    }
  },

  push: {
    ref: 'refs/heads/main',
    repository: {
      full_name: 'memoLib/app',
      name: 'app'
    },
    pusher: {
      name: 'developer',
      email: 'dev@example.com'
    },
    commits: [
      {
        id: 'abc123def456',
        message: 'feat: Add GitHub webhook integration',
        author: {
          name: 'Developer',
          email: 'dev@example.com'
        },
        timestamp: new Date().toISOString()
      }
    ],
    sender: {
      login: 'developer'
    }
  },

  pull_request: {
    action: 'opened',
    number: 42,
    pull_request: {
      number: 42,
      title: 'Add awesome feature',
      state: 'open',
      html_url: 'https://github.com/test/repo/pull/42',
      user: {
        login: 'contributor'
      },
      merged: false
    },
    repository: {
      full_name: 'memoLib/app'
    }
  },

  issues: {
    action: 'opened',
    issue: {
      number: 123,
      title: 'Bug: Application crashes on login',
      user: {
        login: 'user123'
      },
      labels: [
        { name: 'bug' },
        { name: 'priority:high' }
      ]
    },
    repository: {
      full_name: 'memoLib/app'
    }
  },

  star: {
    action: 'created',
    repository: {
      full_name: 'memoLib/app',
      stargazers_count: 100
    },
    sender: {
      login: 'stargazer'
    }
  }
};

/**
 * Génère la signature GitHub
 */
function generateSignature(payload, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  return 'sha256=' + hmac.update(payload).digest('hex');
}

/**
 * Envoie un webhook de test
 */
async function sendTestWebhook(eventType) {
  const payload = testPayloads[eventType];
  
  if (!payload) {
    console.error(`❌ Type d'événement inconnu: ${eventType}`);
    console.log(`Types disponibles: ${Object.keys(testPayloads).join(', ')}`);
    process.exit(1);
  }

  const body = JSON.stringify(payload);
  const signature = generateSignature(body, WEBHOOK_SECRET);
  const delivery = crypto.randomUUID();

  console.log(`\n📤 Envoi webhook de test...`);
  console.log(`   Event: ${eventType}`);
  console.log(`   URL: ${WEBHOOK_URL}`);
  console.log(`   Delivery: ${delivery}\n`);

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-github-event': eventType,
        'x-hub-signature-256': signature,
        'x-github-delivery': delivery,
        'User-Agent': 'GitHub-Hookshot/test'
      },
      body
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Webhook traité avec succès!\n');
      console.log('Réponse:', JSON.stringify(result, null, 2));
    } else {
      console.error('❌ Erreur lors du traitement\n');
      console.error(`Status: ${response.status}`);
      console.error('Réponse:', JSON.stringify(result, null, 2));
    }

  } catch (error) {
    console.error('❌ Erreur réseau:', error.message);
    console.error('\n💡 Assurez-vous que l\'application Next.js est lancée sur localhost:3000');
    process.exit(1);
  }
}

/**
 * Test de statut (GET)
 */
async function testStatus() {
  console.log(`\n📊 Vérification du statut du webhook...\n`);

  try {
    const response = await fetch(WEBHOOK_URL);
    const result = await response.json();

    if (response.ok) {
      console.log('✅ Webhook actif!\n');
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.error('❌ Erreur:', result);
    }
  } catch (error) {
    console.error('❌ Erreur réseau:', error.message);
  }
}

/**
 * Main
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';

  console.log('🔧 GitHub Webhook Test Utility\n');

  switch (command) {
    case 'status':
      await testStatus();
      break;

    case 'ping':
    case 'push':
    case 'pull_request':
    case 'issues':
    case 'star':
      await sendTestWebhook(command);
      break;

    case 'all':
      console.log('🧪 Exécution de tous les tests...\n');
      for (const eventType of Object.keys(testPayloads)) {
        await sendTestWebhook(eventType);
        await new Promise(resolve => setTimeout(resolve, 500)); // 500ms entre chaque
      }
      break;

    case 'help':
    default:
      console.log('Usage: node scripts/test-github-webhook.js <command>\n');
      console.log('Commandes disponibles:');
      console.log('  status         Vérifier si le webhook est actif (GET)');
      console.log('  ping           Envoyer un événement ping');
      console.log('  push           Simuler un push sur main');
      console.log('  pull_request   Simuler l\'ouverture d\'une PR');
      console.log('  issues         Simuler la création d\'une issue bug');
      console.log('  star           Simuler un nouveau star');
      console.log('  all            Exécuter tous les tests');
      console.log('  help           Afficher cette aide\n');
      console.log('Exemples:');
      console.log('  node scripts/test-github-webhook.js status');
      console.log('  node scripts/test-github-webhook.js push');
      console.log('  GITHUB_WEBHOOK_SECRET=secret123 node scripts/test-github-webhook.js all\n');
      break;
  }
}

// Exécution
main().catch(console.error);
