/**
 * Script de test des prompts IA enrichis
 * Usage: npx tsx scripts/test-ai-prompts.ts
 */

import { buildSummarizeEmailPrompt, buildDraftReplyPrompt, buildClassifyEmailPrompt } from '../src/lib/ai/prompts/email-prompts';
import { getKnowledgeContext, getCriticalDeadline } from '../src/lib/ai/knowledge/ceseda-knowledge';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const MODEL = process.env.OLLAMA_MODEL || 'llama3.2:latest';

// ─── EMAILS DE TEST ──────────────────────────────────────────

const TEST_EMAILS = [
  {
    name: 'OQTF urgente',
    from: 'Mohammed Benali <m.benali@gmail.com>',
    subject: 'URGENT - OQTF reçue hier',
    body: `Bonjour Maître,

Je vous écris car j'ai reçu hier une OQTF avec un délai de départ volontaire de 30 jours.
Je suis en France depuis 8 ans, j'ai deux enfants scolarisés ici et ma femme a un titre de séjour.
Je ne comprends pas cette décision car j'ai toujours payé mes impôts et travaillé.

Pouvez-vous m'aider à faire un recours ? C'est très urgent.

Merci beaucoup,
Mohammed Benali
06 12 34 56 78`,
  },
  {
    name: 'Demande d\'asile',
    from: 'Fatima Ahmadi <fatima.a@hotmail.com>',
    subject: 'Demande de rendez-vous - asile',
    body: `Bonjour,

Je suis arrivée en France il y a 2 semaines. J'ai fui l'Afghanistan car les talibans
menaçaient ma famille. J'ai enregistré ma demande d'asile au guichet unique mardi dernier.

On m'a dit que je devais remplir le formulaire OFPRA rapidement. Est-ce que vous pouvez
m'accompagner ? Je ne parle pas bien français et j'ai peur de faire des erreurs.

J'ai mon attestation de demande d'asile et mon passeport.

Cordialement,
Fatima Ahmadi`,
  },
  {
    name: 'Renouvellement titre de séjour',
    from: 'Carlos Martinez <carlos.m@yahoo.fr>',
    subject: 'Renouvellement carte de séjour',
    body: `Bonjour Maître,

Ma carte de séjour salarié expire le 15 juillet 2026. Je souhaite la renouveler.
Mon employeur a changé depuis l'année dernière, est-ce que ça pose problème ?

J'ai déjà pris rendez-vous en préfecture mais c'est seulement pour septembre.
Que faire si ma carte expire avant le rendez-vous ?

Merci,
Carlos Martinez`,
  },
];

// ─── APPEL OLLAMA ────────────────────────────────────────────

async function callOllama(prompt: string): Promise<string> {
  const response = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, prompt, stream: false, options: { temperature: 0.1 } }),
    signal: AbortSignal.timeout(120000),
  });
  if (!response.ok) throw new Error(`Ollama: ${response.status}`);
  const data = await response.json();
  return data.response;
}

// ─── TESTS ───────────────────────────────────────────────────

async function testSummarize(email: typeof TEST_EMAILS[0]) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`📧 TEST RÉSUMÉ: ${email.name}`);
  console.log('═'.repeat(60));

  const prompt = buildSummarizeEmailPrompt(email.subject, email.body, email.from,
    email.name.includes('OQTF') ? 'OQTF' : email.name.includes('asile') ? 'ASILE' : 'TITRE_SEJOUR');

  console.log(`\n📏 Taille prompt: ${prompt.length} caractères`);

  const result = await callOllama(prompt);
  console.log(`\n📋 Réponse IA:\n${result}`);

  // Vérifier que c'est du JSON valide
  try {
    const json = JSON.parse(result.match(/\{[\s\S]*\}/)?.[0] || '');
    console.log('\n✅ JSON valide');
    console.log(`   → Client: ${json.client}`);
    console.log(`   → Urgence: ${json.urgence}`);
    console.log(`   → Type: ${json.typeDossier}`);
    console.log(`   → Action: ${json.actionRequise}`);
    console.log(`   → Deadline: ${json.deadlineDetectee}`);
    if (json.articlesApplicables) console.log(`   → Articles: ${json.articlesApplicables.join(', ')}`);
    if (json.risqueIdentifie) console.log(`   → Risque: ${json.risqueIdentifie}`);
  } catch {
    console.log('\n❌ Réponse non-JSON');
  }
}

async function testDraftReply(email: typeof TEST_EMAILS[0]) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`✍️  TEST BROUILLON: ${email.name}`);
  console.log('═'.repeat(60));

  const dossierType = email.name.includes('OQTF') ? 'OQTF' : email.name.includes('asile') ? 'ASILE' : 'TITRE_SEJOUR';
  const prompt = buildDraftReplyPrompt({
    emailSubject: email.subject,
    emailBody: email.body,
    emailFrom: email.from,
    dossierType,
    urgencyLevel: email.name.includes('OQTF') ? 'critique' : 'moyenne',
  });

  console.log(`\n📏 Taille prompt: ${prompt.length} caractères`);

  const result = await callOllama(prompt);
  console.log(`\n📋 Brouillon:\n${result}`);
}

function testKnowledgeBase() {
  console.log(`\n${'═'.repeat(60)}`);
  console.log('📚 TEST BASE DE CONNAISSANCES');
  console.log('═'.repeat(60));

  for (const type of ['OQTF', 'ASILE', 'TITRE_SEJOUR', 'NATURALISATION']) {
    const ctx = getKnowledgeContext(type);
    const deadline = getCriticalDeadline(type);
    console.log(`\n📌 ${type}:`);
    console.log(`   Contexte: ${ctx.length} caractères injectés`);
    if (deadline) console.log(`   Deadline critique: ${deadline.delai} (${deadline.article})`);
  }
}

// ─── MAIN ────────────────────────────────────────────────────

async function main() {
  console.log('🧪 Test des prompts IA enrichis MemoLib');
  console.log(`   Modèle: ${MODEL}`);
  console.log(`   URL: ${OLLAMA_URL}`);

  // Test 1: Base de connaissances (pas besoin d'Ollama)
  testKnowledgeBase();

  // Test 2: Résumé avec Ollama
  for (const email of TEST_EMAILS) {
    await testSummarize(email);
  }

  // Test 3: Brouillon (juste le premier pour gagner du temps)
  await testDraftReply(TEST_EMAILS[0]);

  console.log(`\n\n${'═'.repeat(60)}`);
  console.log('✅ Tests terminés');
  console.log('═'.repeat(60));
}

main().catch(console.error);
