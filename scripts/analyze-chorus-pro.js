/**
 * Analyser le PDF AIFE ChorusPro Structures
 */

const fs = require('fs');
const PDFParser = require("pdf2json");

const pdfPath = 'C:\\Users\\moros\\Downloads\\AIFE_ChorusPro_Structures_v1.pdf';
const pdfParser = new PDFParser();

console.log('📖 Analyse du PDF AIFE ChorusPro...\n');

pdfParser.on("pdfParser_dataError", errData => {
  console.error('❌ Erreur:', errData.parserError);
});

pdfParser.on("pdfParser_dataReady", pdfData => {
  try {
    const rawText = pdfParser.getRawTextContent();
    
    console.log(`📄 ${rawText.length} caractères extraits\n`);
    
    // Sauvegarder
    fs.mkdirSync('logs', { recursive: true });
    fs.writeFileSync('logs/chorus-pro-structures.txt', rawText, 'utf-8');
    console.log('💾 Texte sauvegardé: logs/chorus-pro-structures.txt\n');
    
    // Recherches ciblées
    console.log('=' .repeat(80));
    console.log('🔍 RECHERCHE: OAuth / Authentification');
    console.log('=' .repeat(80));
    const oauthLines = rawText.split('\n').filter(line => 
      line.match(/oauth|token|authentification|credentials|client.*id|client.*secret/i)
    );
    oauthLines.slice(0, 15).forEach(line => {
      if (line.trim()) console.log(`  → ${line.trim()}`);
    });
    
    console.log('\n' + '=' .repeat(80));
    console.log('🔍 RECHERCHE: Application / Enregistrement');
    console.log('=' .repeat(80));
    const appLines = rawText.split('\n').filter(line => 
      line.match(/application|enregistr|créer|create|app.*id|structure/i)
    );
    appLines.slice(0, 15).forEach(line => {
      if (line.trim()) console.log(`  → ${line.trim()}`);
    });
    
    console.log('\n' + '=' .repeat(80));
    console.log('🔍 RECHERCHE: API / Légifrance');
    console.log('=' .repeat(80));
    const apiLines = rawText.split('\n').filter(line => 
      line.match(/api|légifrance|legifrance|dila|piste/i)
    );
    apiLines.slice(0, 15).forEach(line => {
      if (line.trim()) console.log(`  → ${line.trim()}`);
    });
    
    console.log('\n' + '=' .repeat(80));
    console.log('🔍 RECHERCHE: Identifiants / Clés');
    console.log('=' .repeat(80));
    const keyLines = rawText.split('\n').filter(line => 
      line.match(/identifiant|clé|key|secret|password|mot.*passe/i)
    );
    keyLines.slice(0, 15).forEach(line => {
      if (line.trim()) console.log(`  → ${line.trim()}`);
    });
    
    console.log('\n' + '=' .repeat(80));
    console.log('🌐 URLs trouvées:');
    console.log('=' .repeat(80));
    const urls = [...new Set(rawText.match(/https?:\/\/[^\s\)]+/gi) || [])];
    urls.forEach(url => console.log(`  → ${url}`));
    
    console.log('\n' + '=' .repeat(80));
    console.log('📋 RÉSUMÉ');
    console.log('=' .repeat(80));
    console.log(`✅ ${rawText.length} caractères extraits`);
    console.log(`✅ ${oauthLines.length} références OAuth trouvées`);
    console.log(`✅ ${appLines.length} références Application trouvées`);
    console.log(`✅ ${apiLines.length} références API trouvées`);
    console.log(`✅ ${urls.length} URLs uniques trouvées`);
    console.log('\n📖 Fichier complet: logs/chorus-pro-structures.txt');
    
  } catch (error) {
    console.error('❌ Erreur traitement:', error.message);
  }
});

pdfParser.loadPDF(pdfPath);
