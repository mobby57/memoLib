/**
 * Analyser le guide utilisateur PISTE pour extraire les infos d'authentification
 */

import fs from 'fs';
import path from 'path';
const pdfParse = require('pdf-parse');

async function readPisteGuide() {
  try {
    const pdfPath = 'C:\\Users\\moros\\Downloads\\PISTE-Guide_Utilisateur (1).pdf';
    
    console.log('📖 Lecture du guide PISTE...\n');
    
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdfParse(dataBuffer);
    
    console.log(`📄 Pages: ${data.numpages}`);
    console.log(`📝 Longueur texte: ${data.text.length} caractères\n`);
    
    // Chercher les sections pertinentes
    const text = data.text;
    
    console.log('🔍 Recherche des sections importantes...\n');
    
    // 1. Authentification OAuth
    const oauthMatches = text.match(/.{0,200}(OAuth|authentication|authentification|client_credentials).{0,200}/gi);
    if (oauthMatches && oauthMatches.length > 0) {
      console.log('🔐 SECTIONS OAUTH/AUTHENTIFICATION:');
      console.log('=' .repeat(80));
      oauthMatches.slice(0, 5).forEach((match, i) => {
        console.log(`\n${i + 1}. ${match.trim()}`);
      });
      console.log('\n');
    }
    
    // 2. Client ID / Secret
    const credentialMatches = text.match(/.{0,200}(client.?id|client.?secret|clé|credentials|api.?key).{0,200}/gi);
    if (credentialMatches && credentialMatches.length > 0) {
      console.log('🔑 SECTIONS CREDENTIALS:');
      console.log('=' .repeat(80));
      credentialMatches.slice(0, 5).forEach((match, i) => {
        console.log(`\n${i + 1}. ${match.trim()}`);
      });
      console.log('\n');
    }
    
    // 3. Légifrance
    const legifranceMatches = text.match(/.{0,200}(légifrance|legifrance|dila).{0,200}/gi);
    if (legifranceMatches && legifranceMatches.length > 0) {
      console.log('⚖️ SECTIONS LÉGIFRANCE:');
      console.log('=' .repeat(80));
      legifranceMatches.slice(0, 5).forEach((match, i) => {
        console.log(`\n${i + 1}. ${match.trim()}`);
      });
      console.log('\n');
    }
    
    // 4. Application
    const appMatches = text.match(/.{0,200}(application|créer|create|enregistrer).{0,200}/gi);
    if (appMatches && appMatches.length > 0) {
      console.log('📱 SECTIONS APPLICATION:');
      console.log('=' .repeat(80));
      appMatches.slice(0, 5).forEach((match, i) => {
        console.log(`\n${i + 1}. ${match.trim()}`);
      });
      console.log('\n');
    }
    
    // 5. URLs et endpoints
    const urlMatches = text.match(/https?:\/\/[^\s\)]+/gi);
    if (urlMatches && urlMatches.length > 0) {
      console.log('🌐 URLs TROUVÉES:');
      console.log('=' .repeat(80));
      const uniqueUrls = [...new Set(urlMatches)];
      uniqueUrls.slice(0, 10).forEach((url, i) => {
        console.log(`${i + 1}. ${url}`);
      });
      console.log('\n');
    }
    
    // Sauvegarder le texte complet pour analyse
    const outputPath = path.join(__dirname, '../logs/piste-guide-extracted.txt');
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, data.text, 'utf-8');
    console.log(`💾 Texte complet sauvegardé dans: ${outputPath}`);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    if (error instanceof Error) {
      console.error('Message:', error.message);
    }
  }
}

readPisteGuide();
