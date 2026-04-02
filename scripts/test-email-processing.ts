#!/usr/bin/env tsx
/**
 * Test Email Processing
 * Envoie un email et surveille le traitement complet
 */

async function testEmailProcessing() {
  const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
  
  console.log('\n📧 TEST DE TRAITEMENT EMAIL\n');
  console.log(`🔗 URL: ${BASE_URL}\n`);

  // 1. Envoyer un email de test
  console.log('1️⃣ Envoi email de test...');
  try {
    const emailPayload = {
      from: 'client@example.com',
      to: 'avocat@memolib.fr',
      subject: 'Demande de consultation juridique',
      body: 'Bonjour, je souhaite obtenir une consultation pour un dossier de droit du travail.',
      receivedAt: new Date().toISOString(),
    };

    const sendRes = await fetch(`${BASE_URL}/api/emails/incoming`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(emailPayload),
    });

    if (sendRes.ok) {
      const data = await sendRes.json();
      console.log('✅ Email envoyé');
      console.log(`   ID: ${data.id || 'N/A'}`);
      console.log(`   Status: ${data.status || 'N/A'}`);
      
      // 2. Vérifier le traitement
      console.log('\n2️⃣ Vérification du traitement...');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Attendre 2s
      
      // 3. Récupérer les emails
      console.log('\n3️⃣ Récupération des emails...');
      const listRes = await fetch(`${BASE_URL}/api/emails?limit=5`);
      if (listRes.ok) {
        const emails = await listRes.json();
        console.log(`✅ ${emails.length || 0} emails trouvés`);
        
        if (emails.length > 0) {
          const latest = emails[0];
          console.log('\n📨 Dernier email:');
          console.log(`   De: ${latest.from || 'N/A'}`);
          console.log(`   Sujet: ${latest.subject || 'N/A'}`);
          console.log(`   Status: ${latest.status || 'N/A'}`);
          console.log(`   Score: ${latest.score || 'N/A'}`);
          console.log(`   Catégorie: ${latest.category || 'N/A'}`);
        }
      }
      
      // 4. Vérifier les statistiques
      console.log('\n4️⃣ Statistiques...');
      const statsRes = await fetch(`${BASE_URL}/api/analytics/emails`);
      if (statsRes.ok) {
        const stats = await statsRes.json();
        console.log('✅ Statistiques récupérées');
        console.log(`   Total: ${stats.total || 0}`);
        console.log(`   Non lus: ${stats.unread || 0}`);
        console.log(`   Importants: ${stats.important || 0}`);
      }
      
    } else {
      console.log(`❌ Erreur envoi: ${sendRes.status}`);
      const error = await sendRes.text();
      console.log(`   ${error}`);
    }
    
  } catch (error: any) {
    console.log(`❌ Erreur: ${error.message}`);
  }

  // 5. Résumé du processus
  console.log('\n📊 PROCESSUS DE TRAITEMENT:');
  console.log('   1. Réception email → /api/emails/incoming');
  console.log('   2. Analyse & scoring → IA + règles métier');
  console.log('   3. Catégorisation → Important/Normal/Spam');
  console.log('   4. Stockage → Base de données');
  console.log('   5. Notification → WebSocket (si actif)');
  console.log('   6. Disponible → Dashboard avocat');

  console.log('\n💡 Pour tester avec Gmail:');
  console.log('   npm run email:monitor');
  console.log('   Puis envoyez un email à votre adresse configurée\n');
}

testEmailProcessing().catch(console.error);
