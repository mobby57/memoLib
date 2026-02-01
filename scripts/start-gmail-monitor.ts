import { gmailMonitor } from '@/lib/email/gmail-monitor';

async function main() {
  const tenantId = process.env.TENANT_ID;
  
  if (!tenantId) {
    console.error('❌ TENANT_ID requis dans .env.local');
    process.exit(1);
  }

  console.log('🚀 Démarrage monitoring Gmail...');
  
  await gmailMonitor.initialize();
  await gmailMonitor.startMonitoring(tenantId);
  
  console.log('✅ Monitoring actif - CTRL+C pour arrêter');
}

main().catch(console.error);
