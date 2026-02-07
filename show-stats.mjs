/**
 * Affiche les statistiques du store in-memory
 */

import { getStoreStats } from './src/frontend/lib/db.js';

const stats = getStoreStats();

console.log('📊 Statistiques du store in-memory\n');
console.log('='.repeat(70));
console.log(`\n📦 Messages stockés: ${stats.messageCount}\n`);

if (stats.messages.length > 0) {
  console.log('📋 Liste des messages:\n');
  stats.messages.forEach((msg, index) => {
    console.log(
      `${index + 1}. ID: ${msg.id} | Canal: ${msg.channel.padEnd(10)} | Checksum: ${msg.checksum.substring(0, 12)}...`
    );
    console.log(`   └─ Sender: ${msg.sender_email || msg.sender_phone || 'N/A'}`);
    console.log(`   └─ Body: ${msg.body?.substring(0, 60)}...`);
    console.log(`   └─ Date: ${msg.created_at.toISOString()}\n`);
  });
} else {
  console.log('⚠️  Aucun message dans le store\n');
}

console.log('='.repeat(70));
