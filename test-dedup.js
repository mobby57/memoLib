/**
 * Test de déduplication du webhook multi-canal
 */

const testPayload = {
  channel: 'WHATSAPP',
  entry: [
    {
      changes: [
        {
          value: {
            messages: [
              {
                id: 'wamid_TEST_DEDUP_12345',
                from: '+33612345678',
                type: 'text',
                text: { body: 'Message de test déduplication WhatsApp' },
              },
            ],
            contacts: [{ profile: { name: 'Test User' } }],
          },
        },
      ],
    },
  ],
};

async function testDeduplication() {
  console.log('🧪 Test de déduplication - Pattern Adapter Multi-Canal\n');

  try {
    // Premier envoi
    console.log('📤 Premier envoi...');
    const response1 = await fetch('http://localhost:3000/api/webhooks/test-multichannel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload),
    });
    const data1 = await response1.json();
    console.log(`✅ Statut: ${response1.status}`);
    console.log(`   MessageId: ${data1.messageId}`);
    console.log(`   Checksum: ${data1.checksum?.substring(0, 16)}...`);
    console.log(`   Duration: ${data1.duration}ms\n`);

    // Deuxième envoi (doublon attendu)
    console.log('📤 Deuxième envoi (même payload)...');
    const response2 = await fetch('http://localhost:3000/api/webhooks/test-multichannel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload),
    });
    const data2 = await response2.json();

    if (response2.status === 409) {
      console.log(`✅ SUCCÈS: Doublon détecté (HTTP ${response2.status})`);
      console.log(`   Error: ${data2.error}`);
      console.log(`   Message: ${data2.message}\n`);
    } else {
      console.log(`❌ ÉCHEC: Le doublon n'a pas été détecté !`);
      console.log(`   Statut reçu: ${response2.status} (attendu: 409)`);
      console.log(`   Réponse:`, data2, '\n');
    }

    // Test avec un nouveau message
    console.log('📤 Troisième envoi (nouveau payload)...');
    const newPayload = { ...testPayload };
    newPayload.entry[0].changes[0].value.messages[0].id = 'wamid_NEW_' + Date.now();
    const response3 = await fetch('http://localhost:3000/api/webhooks/test-multichannel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPayload),
    });
    const data3 = await response3.json();
    console.log(`✅ Statut: ${response3.status}`);
    console.log(`   MessageId: ${data3.messageId}`);
    console.log(`   Duration: ${data3.duration}ms\n`);

    console.log('✅ Tests terminés avec succès !');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testDeduplication();
