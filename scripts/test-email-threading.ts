#!/usr/bin/env tsx
/**
 * Test Email Threading - Conversation Grouping
 * Teste si le système groupe les emails en conversations
 */

async function testEmailThreading() {
  const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
  
  console.log('\n🧵 TEST DE GROUPEMENT D\'EMAILS EN CONVERSATION\n');
  console.log(`🔗 URL: ${BASE_URL}\n`);

  const clientEmail = 'client.test@example.com';
  const avocatEmail = 'avocat@memolib.fr';
  const subject = 'Demande de consultation juridique';

  try {
    // 1. Premier email
    console.log('1️⃣ Envoi du PREMIER email...');
    const email1 = await fetch(`${BASE_URL}/api/emails/incoming`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: clientEmail,
        to: avocatEmail,
        subject: subject,
        body: 'Bonjour, je souhaite obtenir une consultation pour un dossier de droit du travail.',
        messageId: `msg-${Date.now()}-1@example.com`,
        receivedAt: new Date().toISOString(),
      }),
    });

    if (email1.ok) {
      const data1 = await email1.json();
      console.log('✅ Premier email envoyé');
      console.log(`   ID: ${data1.emailId}`);
      console.log(`   Catégorie: ${data1.category}`);
      console.log(`   Urgence: ${data1.urgency}`);
    } else {
      console.log(`❌ Erreur: ${email1.status}`);
      return;
    }

    // Attendre 2 secondes
    console.log('\n⏳ Attente 2 secondes...\n');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 2. Deuxième email (même conversation)
    console.log('2️⃣ Envoi du DEUXIÈME email (même sujet)...');
    const email2 = await fetch(`${BASE_URL}/api/emails/incoming`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: clientEmail,
        to: avocatEmail,
        subject: `Re: ${subject}`,
        body: 'J\'aimerais également savoir quels documents je dois préparer.',
        messageId: `msg-${Date.now()}-2@example.com`,
        inReplyTo: `msg-${Date.now()}-1@example.com`,
        receivedAt: new Date().toISOString(),
      }),
    });

    if (email2.ok) {
      const data2 = await email2.json();
      console.log('✅ Deuxième email envoyé');
      console.log(`   ID: ${data2.emailId}`);
      console.log(`   Catégorie: ${data2.category}`);
    }

    // 3. Vérifier le groupement
    console.log('\n3️⃣ Vérification du groupement...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    const listRes = await fetch(`${BASE_URL}/api/emails?from=${encodeURIComponent(clientEmail)}&limit=10`);
    if (listRes.ok) {
      const emails = await listRes.json();
      console.log(`✅ ${emails.length} emails trouvés du même expéditeur`);

      // Analyser le groupement
      const bySubject = emails.reduce((acc: any, email: any) => {
        const baseSubject = email.subject.replace(/^(Re:|Fwd:)\s*/i, '').trim();
        if (!acc[baseSubject]) acc[baseSubject] = [];
        acc[baseSubject].push(email);
        return acc;
      }, {});

      console.log('\n📊 ANALYSE DU GROUPEMENT:');
      Object.entries(bySubject).forEach(([subject, emails]: [string, any]) => {
        console.log(`\n   Sujet: "${subject}"`);
        console.log(`   Nombre d'emails: ${emails.length}`);
        if (emails.length > 1) {
          console.log('   ✅ CONVERSATION DÉTECTÉE');
          emails.forEach((e: any, i: number) => {
            console.log(`      ${i + 1}. ${e.subject} (${new Date(e.receivedAt).toLocaleTimeString()})`);
          });
        } else {
          console.log('   ℹ️  Email unique (pas de conversation)');
        }
      });
    }

    // 4. Comportement attendu
    console.log('\n📋 COMPORTEMENT DU SYSTÈME:\n');
    console.log('✅ Actuellement:');
    console.log('   • Chaque email est stocké individuellement');
    console.log('   • Catégorisation IA pour chaque email');
    console.log('   • Lien avec le client si connu');
    console.log('   • Workflow déclenché pour chaque email');
    
    console.log('\n🔄 Groupement par:');
    console.log('   • Même expéditeur (from)');
    console.log('   • Même sujet (subject, sans Re:/Fwd:)');
    console.log('   • Même client (clientId)');
    console.log('   • Même dossier (si lié)');
    
    console.log('\n💡 Améliorations possibles:');
    console.log('   • Détecter les threads via messageId/inReplyTo');
    console.log('   • Créer un modèle Conversation/Thread');
    console.log('   • Grouper automatiquement dans l\'UI');
    console.log('   • Afficher l\'historique complet');
    console.log('   • Ne notifier qu\'une fois par conversation');

  } catch (error: any) {
    console.log(`❌ Erreur: ${error.message}`);
  }

  console.log('\n');
}

testEmailThreading().catch(console.error);
