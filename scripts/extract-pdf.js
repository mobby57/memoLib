/**
 * Extraire texte du PDF PISTE
 */

const fs = require('fs');
const PDFParser = require("pdf2json");

const pdfPath = 'C:\\Users\\moros\\Downloads\\PISTE-Guide_Utilisateur (1).pdf';
const pdfParser = new PDFParser();

console.log('📖 Lecture du guide PISTE...\n');

pdfParser.on("pdfParser_dataError", errData => {
  console.error('❌ Erreur:', errData.parserError);
});

pdfParser.on("pdfParser_dataReady", pdfData => {
  try {
    const rawText = pdfParser.getRawTextContent();
    
    console.log(`📄 Texte extrait: ${rawText.length} caractères\n`);
    
    // Sauvegarder
    fs.writeFileSync('logs/piste-guide.txt', rawText, 'utf-8');
    console.log('💾 Sauvegardé dans: logs/piste-guide.txt\n');
    
    // Rechercher OAuth
    console.log('🔍 RECHERCHE OAUTH:\n');
    const oauthLines = rawText.split('\n').filter(line => 
      line.match(/oauth|client.*id|client.*secret|credentials/i)
    );
    oauthLines.slice(0, 10).forEach(line => console.log(`  ${line.trim()}`));
    
    console.log('\n🔍 RECHERCHE LÉGIFRANCE:\n');
    const legiLines = rawText.split('\n').filter(line => 
      line.match(/légifrance|legifrance|dila/i)
    );
    legiLines.slice(0, 10).forEach(line => console.log(`  ${line.trim()}`));
    
    console.log('\n🔍 RECHERCHE APPLICATION:\n');
    const appLines = rawText.split('\n').filter(line => 
      line.match(/application|créer|create|enregistrer/i)
    );
    appLines.slice(0, 10).forEach(line => console.log(`  ${line.trim()}`));
    
  } catch (error) {
    console.error('❌ Erreur traitement:', error.message);
  }
});

pdfParser.loadPDF(pdfPath);
