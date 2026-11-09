/**
 * Test du flow complet CESEDA : Email → Résumé IA → Création Dossier → Copilote
 */

const BASE = 'http://localhost:3000';

async function testFlow() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🧪 TEST FLOW COMPLET — Avocat CESEDA première utilisation');
  console.log('═══════════════════════════════════════════════════════\n');

  // 1. Test résumé IA d'un email OQTF sans délai
  console.log('📧 ÉTAPE 1 — Résumé IA email OQTF sans délai...');
  const emailData = {
    subject: 'URGENT - Mon mari a recu une OQTF sans delai ce matin',
    body: `Bonjour Maitre,

Je suis desesperee. Mon mari Moussa DIALLO a recu ce matin une OQTF sans delai de depart volontaire. 
La police est venue a 6h du matin. Il est en France depuis 5 ans, nos enfants (3) sont scolarises a Paris. 
Il a un CDI depuis 2 ans chez Carrefour. 
On nous dit qu'il a 48h pour faire recours. 
Pouvez-vous nous aider en urgence ?

Merci.
Mme Diallo
Tel: 06 77 88 99 00`,
    from: 'mme.diallo@gmail.com'
  };

  try {
    const res1 = await fetch(`${BASE}/api/ai/summarize-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(emailData)
    });
    const summary = await res1.json();
    console.log('   Status:', res1.status);
    console.log('   Résumé IA:');
    console.log('   • Client:', summary.client || summary.data?.client);
    console.log('   • Type:', summary.typeDossier || summary.data?.typeDossier);
    console.log('   • Urgence:', summary.urgence || summary.data?.urgence);
    console.log('   • Deadline:', summary.deadlineDetectee || summary.data?.deadlineDetectee);
    console.log('   • Résumé:', summary.resumeCourt || summary.data?.resumeCourt);
    console.log('   [Full response]:', JSON.stringify(summary, null, 2).substring(0, 500));
  } catch (e) {
    console.log('   ❌ Erreur:', e.message);
  }

  // 2. Test Copilote CESEDA sur le dossier BENALI existant
  console.log('\n🤖 ÉTAPE 2 — Copilote CESEDA sur dossier BENALI...');
  const dossierId = '1c8628f9-780d-4d9b-a847-7ba3b0eb9224'; // DOS-2026-001

  try {
    const res2 = await fetch(`${BASE}/api/ai/copilot/${dossierId}`);
    const copilot = await res2.json();
    console.log('   Status:', res2.status);
    if (res2.status === 200) {
      console.log('   • Risque:', copilot.summary?.riskLevel);
      console.log('   • Forces:', copilot.strengths?.length, 'détectées');
      console.log('   • Faiblesses:', copilot.weaknesses?.length, 'détectées');
      console.log('   • Articles CESEDA:', copilot.cesedaAnalysis?.articles?.map(a => a.reference).join(', '));
      console.log('   • Jurisprudences:', copilot.cesedaAnalysis?.jurisprudences?.map(j => j.reference).join(', '));
      console.log('   • Recours possibles:', copilot.cesedaAnalysis?.recours?.map(r => r.type).join(', '));
      console.log('   • Deadlines:', copilot.deadlines?.length);
      console.log('   • Actions recommandées:', copilot.actions?.length);
      if (copilot.actions?.length > 0) {
        console.log('     Top 3 actions:');
        copilot.actions.slice(0, 3).forEach((a, i) => {
          console.log(`     ${i+1}. [P${a.priority}] ${a.action}`);
        });
      }
    } else {
      console.log('   Response:', JSON.stringify(copilot).substring(0, 300));
    }
  } catch (e) {
    console.log('   ❌ Erreur:', e.message);
  }

  // 3. Test recherche jurisprudence
  console.log('\n⚖️  ÉTAPE 3 — Recherche jurisprudence OQTF...');
  try {
    const res3 = await fetch(`${BASE}/api/jurisprudence/search?q=OQTF+vie+familiale+article+8+CEDH`);
    const juris = await res3.json();
    console.log('   Status:', res3.status);
    if (Array.isArray(juris?.results || juris)) {
      const results = juris.results || juris;
      console.log(`   ${results.length} résultats trouvés`);
      results.slice(0, 3).forEach((r, i) => {
        console.log(`   ${i+1}. ${r.titre || r.title || r.reference} — ${(r.resume || r.summary || '').substring(0, 80)}`);
      });
    } else {
      console.log('   Response:', JSON.stringify(juris).substring(0, 300));
    }
  } catch (e) {
    console.log('   ❌ Erreur:', e.message);
  }

  // 4. Test deadlines
  console.log('\n⏰ ÉTAPE 4 — Vérification alertes deadlines...');
  try {
    const res4 = await fetch(`${BASE}/api/legal-deadlines?tenantId=948395f7-adfb-4b44-bb40-511c192b2771&upcoming=true`);
    const deadlines = await res4.json();
    console.log('   Status:', res4.status);
    const list = deadlines.deadlines || deadlines;
    if (Array.isArray(list)) {
      console.log(`   ${list.length} deadline(s) actives`);
      list.forEach(d => {
        const due = new Date(d.dueDate);
        const now = new Date();
        const daysLeft = Math.ceil((due - now) / (1000*60*60*24));
        const emoji = daysLeft <= 1 ? '🔴' : daysLeft <= 3 ? '🟠' : daysLeft <= 7 ? '🟡' : '🟢';
        console.log(`   ${emoji} ${d.label} — J${daysLeft > 0 ? '-'+daysLeft : '+'+Math.abs(daysLeft)} (${d.status})`);
      });
    } else {
      console.log('   Response:', JSON.stringify(deadlines).substring(0, 300));
    }
  } catch (e) {
    console.log('   ❌ Erreur:', e.message);
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('✅ TEST TERMINÉ');
  console.log('═══════════════════════════════════════════════════════');
}

testFlow().catch(console.error);
