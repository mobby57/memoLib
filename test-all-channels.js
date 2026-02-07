/**
 * Test complet du Pattern Adapter Multi-Canal
 * Teste tous les canaux supportés : EMAIL, SMS, WHATSAPP, FORM
 */

const testCases = [
  {
    name: 'EMAIL',
    payload: {
      channel: 'EMAIL',
      messageId: 'msg_email_' + Date.now(),
      from: 'client@example.com',
      to: 'cabinet@example.com',
      subject: 'Consultation juridique',
      text: 'Bonjour, question sur un contrat de bail...',
    },
  },
  {
    name: 'SMS',
    payload: {
      channel: 'SMS',
      MessageSid: 'SM' + Date.now(),
      From: '+33612345678',
      To: '+33698765432',
      Body: 'RDV urgent demain 14h possible ?',
    },
  },
  {
    name: 'WHATSAPP',
    payload: {
      channel: 'WHATSAPP',
      entry: [
        {
          changes: [
            {
              value: {
                messages: [
                  {
                    id: 'wamid_' + Date.now(),
                    from: '+33612345678',
                    type: 'text',
                    text: { body: 'Question urgente via WhatsApp' },
                  },
                ],
                contacts: [{ profile: { name: 'Marie Dupont' } }],
              },
            },
          ],
        },
      ],
    },
  },
  {
    name: 'FORM',
    payload: {
      channel: 'FORM',
      submissionId: 'form_' + Date.now(),
      email: 'contact@client.fr',
      name: 'Jean Martin',
      subject: 'Demande de consultation',
      message: 'Je souhaite un rendez-vous pour discuter d\'un litige.',
      consentGiven: true,
    },
  },
];

async function testAllChannels() {
  console.log('🧪 Test Pattern Adapter Multi-Canal - Tous les canaux\n');
  console.log('='.repeat(70) + '\n');

  const results = [];

  for (const testCase of testCases) {
    try {
      console.log(`📡 Test canal: ${testCase.name}`);
      console.log(`   Payload: ${JSON.stringify(testCase.payload).substring(0, 80)}...`);

      const response = await fetch('http://localhost:3000/api/webhooks/test-multichannel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testCase.payload),
      });

      const data = await response.json();

      if (response.status === 200 && data.success) {
        console.log(`   ✅ Succès (${response.status})`);
        console.log(`   └─ MessageId: ${data.messageId}`);
        console.log(`   └─ Channel: ${data.channel}`);
        console.log(`   └─ Checksum: ${data.checksum?.substring(0, 12)}...`);
        console.log(`   └─ Duration: ${data.duration?.toFixed(2)}ms\n`);
        results.push({ channel: testCase.name, status: 'SUCCESS', duration: data.duration });
      } else {
        console.log(`   ❌ Échec (${response.status})`);
        console.log(`   └─ Error: ${data.error || 'Unknown'}`);
        console.log(`   └─ Response:`, data, '\n');
        results.push({ channel: testCase.name, status: 'FAILED', error: data.error });
      }
    } catch (error) {
      console.log(`   ❌ Exception: ${error.message}\n`);
      results.push({ channel: testCase.name, status: 'ERROR', error: error.message });
    }
  }

  console.log('='.repeat(70));
  console.log('📊 Résumé des tests\n');

  const successCount = results.filter((r) => r.status === 'SUCCESS').length;
  const totalCount = results.length;

  results.forEach((r) => {
    const icon = r.status === 'SUCCESS' ? '✅' : '❌';
    const duration = r.duration ? ` (${r.duration.toFixed(2)}ms)` : '';
    console.log(`${icon} ${r.channel.padEnd(12)} ${r.status}${duration}`);
  });

  console.log('\n' + '='.repeat(70));
  console.log(`\n🎯 Résultat final: ${successCount}/${totalCount} canaux validés`);

  if (successCount === totalCount) {
    console.log('✅ Pattern Adapter Multi-Canal : VALIDATION COMPLÈTE\n');
  } else {
    console.log('⚠️  Certains canaux ont échoué - vérification requise\n');
  }
}

testAllChannels();
