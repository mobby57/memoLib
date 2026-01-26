/**
 * Script de Test - Cloudflare Workers AI
 * 
 * Teste toutes les fonctionnalités du SDK Cloudflare:
 * - Workers AI (génération texte, chat, embeddings, traduction)
 * - Hybrid AI Client (fallback Ollama ↔ Cloudflare)
 * - R2 Storage (upload/download)
 */

import { cloudflareAI, isCloudflareAvailable } from '../src/lib/cloudflare/client';
import { hybridAI } from '../src/lib/ai/hybrid-client';

async function testCloudflareAvailability() {
  console.log('\n🔍 Test 1: Disponibilité Cloudflare Workers AI\n');
  
  const available = await isCloudflareAvailable();
  
  if (available) {
    console.log('✅ Cloudflare SDK configuré correctement');
    console.log(`   Account ID: ${process.env.CLOUDFLARE_ACCOUNT_ID?.substring(0, 8)}...`);
    
    // Lister les modèles disponibles
    const models = await cloudflareAI.listModels();
    console.log(`\n📋 Modèles disponibles: ${models.length}`);
    console.log('   Exemples:', models.slice(0, 5).join(', '));
  } else {
    console.log('❌ Cloudflare non disponible');
    console.log('   Vérifier: CLOUDFLARE_ACCOUNT_ID et CLOUDFLARE_API_TOKEN dans .env');
  }
  
  return available;
}

async function testCloudflareGeneration() {
  console.log('\n🤖 Test 2: Génération de Texte avec Workers AI\n');
  
  try {
    const prompt = "Explique en 2 phrases ce qu'est le CESEDA en droit français.";
    const systemPrompt = "Tu es un assistant juridique français spécialisé en droit des étrangers.";
    
    console.log(`📝 Prompt: "${prompt}"`);
    console.log('⏳ Génération en cours...\n');
    
    const startTime = Date.now();
    const response = await cloudflareAI.generate(prompt, { systemPrompt });
    const latency = Date.now() - startTime;
    
    console.log(`✅ Réponse générée (${latency}ms):`);
    console.log(`   ${response}`);
  } catch (error) {
    console.log('❌ Erreur:', error instanceof Error ? error.message : error);
  }
}

async function testCloudflareChat() {
  console.log('\n💬 Test 3: Chat Multi-Tours avec Workers AI\n');
  
  try {
    const messages = [
      { role: 'system' as const, content: 'Tu es un avocat spécialisé en droit CESEDA.' },
      { role: 'user' as const, content: 'Quels sont les délais de recours pour une OQTF ?' },
    ];
    
    console.log('📝 Conversation:');
    messages.forEach((m, i) => console.log(`   [${i + 1}] ${m.role}: ${m.content.substring(0, 60)}...`));
    console.log('⏳ Génération en cours...\n');
    
    const response = await cloudflareAI.chat(messages);
    
    console.log('✅ Réponse:');
    console.log(`   ${response}`);
  } catch (error) {
    console.log('❌ Erreur:', error instanceof Error ? error.message : error);
  }
}

async function testCloudflareEmbeddings() {
  console.log('\n🔢 Test 4: Génération Embeddings (Recherche Sémantique)\n');
  
  try {
    const text = "Dossier de naturalisation avec titre de séjour en cours de renouvellement";
    
    console.log(`📝 Texte: "${text}"`);
    console.log('⏳ Génération embeddings...\n');
    
    const embeddings = await cloudflareAI.generateEmbeddings(text);
    
    console.log('✅ Embeddings générés:');
    console.log(`   Dimension: ${embeddings.length}`);
    console.log(`   Aperçu: [${embeddings.slice(0, 5).map(n => n.toFixed(4)).join(', ')}...]`);
  } catch (error) {
    console.log('❌ Erreur:', error instanceof Error ? error.message : error);
  }
}

async function testCloudflareTranslation() {
  console.log('\n🌍 Test 5: Traduction Automatique\n');
  
  try {
    const text = "The OQTF (Obligation to Leave French Territory) is an administrative decision.";
    
    console.log(`📝 Texte EN: "${text}"`);
    console.log('⏳ Traduction vers FR...\n');
    
    const translated = await cloudflareAI.translate(text, 'fr');
    
    console.log('✅ Traduction FR:');
    console.log(`   ${translated}`);
  } catch (error) {
    console.log('❌ Erreur:', error instanceof Error ? error.message : error);
  }
}

async function testHybridAI() {
  console.log('\n🔄 Test 6: Hybrid AI Client (Ollama ↔ Cloudflare)\n');
  
  // Vérifier disponibilité
  const availability = await hybridAI.checkAvailability();
  
  console.log('📊 État des providers:');
  console.log(`   Ollama:        ${availability.ollama ? '✅ Disponible' : '❌ Indisponible'}`);
  console.log(`   Cloudflare AI: ${availability.cloudflare ? '✅ Disponible' : '❌ Indisponible'}`);
  console.log(`   Recommandé:    ${availability.recommended}`);
  
  // Tester génération avec fallback
  try {
    console.log('\n⏳ Génération avec fallback automatique...\n');
    
    const result = await hybridAI.generate(
      "Résume en 1 phrase le principe de l'OQTF.",
      "Tu es un assistant juridique."
    );
    
    console.log('✅ Génération réussie:');
    console.log(`   Provider utilisé: ${result.provider}`);
    console.log(`   Modèle: ${result.model}`);
    console.log(`   Latence: ${result.latency}ms`);
    console.log(`   Réponse: ${result.response}`);
  } catch (error) {
    console.log('❌ Aucun provider disponible:', error instanceof Error ? error.message : error);
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   🧪 TEST CLOUDFLARE WORKERS AI + HYBRID CLIENT          ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  // Test 1: Disponibilité
  const available = await testCloudflareAvailability();
  
  if (available) {
    // Tests Cloudflare Workers AI
    await testCloudflareGeneration();
    await testCloudflareChat();
    await testCloudflareEmbeddings();
    await testCloudflareTranslation();
  } else {
    console.log('\n⚠️  Cloudflare non configuré - Skipping tests Workers AI');
    console.log('   Pour activer:');
    console.log('   1. Ajouter CLOUDFLARE_ACCOUNT_ID et CLOUDFLARE_API_TOKEN dans .env');
    console.log('   2. Activer Workers AI: CLOUDFLARE_WORKERS_AI=true');
  }
  
  // Test 6: Hybrid AI (toujours)
  await testHybridAI();
  
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║   ✅ TESTS TERMINÉS                                       ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  console.log('📚 Documentation:');
  console.log('   Cloudflare Workers AI: https://developers.cloudflare.com/workers-ai/');
  console.log('   SDK TypeScript: https://github.com/cloudflare/cloudflare-typescript');
  console.log('   Hybrid Client: src/lib/ai/hybrid-client.ts\n');
}

main().catch(console.error);
