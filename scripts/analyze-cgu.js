const fs = require('fs');
const pdfParse = require('pdf-parse');

async function analyzePDF(filePath) {
  try {
    console.log(`\n📄 Analyse de: ${filePath}\n`);
    
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    
    const text = data.text;
    
    console.log(`📊 Total pages: ${data.numpages}`);
    console.log(`📝 Caractères extraits: ${text.length}\n`);
    
    // Rechercher des mots-clés importants
    const keywords = [
      'souscription',
      'activation',
      'conditions',
      'accès',
      'OAuth',
      'authentification',
      'API',
      'délai',
      'validation',
      'acceptation',
      'CGU',
      'droit',
      'quota',
      'limite'
    ];
    
    console.log('🔍 Recherche de mots-clés:\n');
    
    keywords.forEach(keyword => {
      const regex = new RegExp(keyword, 'gi');
      const matches = text.match(regex);
      if (matches && matches.length > 0) {
        console.log(`   ✅ "${keyword}": ${matches.length} occurrence(s)`);
      }
    });
    
    // Extraire sections pertinentes
    console.log('\n📋 Sections pertinentes:\n');
    
    // Chercher les sections sur l'accès
    const accesSections = text.match(/.{0,200}(accès|activation|souscription).{0,200}/gi);
    if (accesSections) {
      console.log('--- Sections sur l\'accès ---');
      accesSections.slice(0, 5).forEach((section, i) => {
        console.log(`${i + 1}. ${section.trim()}\n`);
      });
    }
    
    // Chercher les délais
    const delaiSections = text.match(/.{0,150}(délai|jour|heure|temps).{0,150}/gi);
    if (delaiSections) {
      console.log('\n--- Délais mentionnés ---');
      delaiSections.slice(0, 5).forEach((section, i) => {
        console.log(`${i + 1}. ${section.trim()}\n`);
      });
    }
    
    // Sauvegarder le texte complet
    const outputFile = filePath.replace('.pdf', '.txt');
    fs.writeFileSync(outputFile, text);
    console.log(`\n💾 Texte complet sauvegardé dans: ${outputFile}`);
    
    return text;
    
  } catch (error) {
    console.error(`❌ Erreur: ${error.message}`);
    return null;
  }
}

async function main() {
  const files = [
    'c:\\Users\\moros\\Downloads\\CGU_Legifrance_API_VF_15-12-2022 (1).pdf',
    'c:\\Users\\moros\\Downloads\\CGU_Legifrance_API_VF_15-12-2022 (2).pdf'
  ];
  
  for (const file of files) {
    if (fs.existsSync(file)) {
      await analyzePDF(file);
    } else {
      console.log(`⚠️  Fichier non trouvé: ${file}`);
    }
  }
}

main();
