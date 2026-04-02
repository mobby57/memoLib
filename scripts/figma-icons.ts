#!/usr/bin/env tsx
/**
 * Script de synchronisation des icônes Figma
 * Télécharge et optimise les icônes SVG depuis Figma
 */

import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';

// Charger les variables d'environnement
config();

// Configuration
const FIGMA_ACCESS_TOKEN = process.env.FIGMA_ACCESS_TOKEN;
const FIGMA_FILE_KEY = 'auVG69j7QrCFGBt5svFre0';
const ICONS_OUTPUT_DIR = path.join(__dirname, '../public/icons');
const ICONS_COMPONENT_DIR = path.join(__dirname, '../src/components/icons');

interface FigmaNode {
  id: string;
  name: string;
  type: string;
  children?: FigmaNode[];
}

interface FigmaFile {
  document: FigmaNode;
}

interface ImageResponse {
  images: Record<string, string | null>;
}

/**
 * Récupère le fichier Figma
 */
async function fetchFigmaFile(): Promise<FigmaFile> {
  if (!FIGMA_ACCESS_TOKEN) {
    throw new Error('FIGMA_ACCESS_TOKEN non défini');
  }
  
  const response = await fetch(
    `https://api.figma.com/v1/files/${FIGMA_FILE_KEY}`,
    {
      headers: { 'X-Figma-Token': FIGMA_ACCESS_TOKEN },
    }
  );
  
  if (!response.ok) {
    throw new Error(`Erreur API Figma: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Trouve tous les composants d'icônes dans le document
 */
function findIcons(node: FigmaNode, icons: { id: string; name: string }[] = []): { id: string; name: string }[] {
  // Chercher les composants dans une page/frame "Icons" ou avec "icon" dans le nom
  if (node.type === 'COMPONENT' && 
      (node.name.toLowerCase().includes('icon') || 
       node.name.toLowerCase().includes('ico'))) {
    icons.push({
      id: node.id,
      name: node.name,
    });
  }
  
  // Récursif
  if (node.children) {
    for (const child of node.children) {
      findIcons(child, icons);
    }
  }
  
  return icons;
}

/**
 * Télécharge les icônes en SVG depuis Figma
 */
async function downloadIcons(iconIds: string[]): Promise<Record<string, string>> {
  if (!FIGMA_ACCESS_TOKEN) {
    throw new Error('FIGMA_ACCESS_TOKEN non défini');
  }
  
  const ids = iconIds.join(',');
  const response = await fetch(
    `https://api.figma.com/v1/images/${FIGMA_FILE_KEY}?ids=${ids}&format=svg`,
    {
      headers: { 'X-Figma-Token': FIGMA_ACCESS_TOKEN },
    }
  );
  
  if (!response.ok) {
    throw new Error(`Erreur téléchargement icônes: ${response.status}`);
  }
  
  const data: ImageResponse = await response.json();
  return data.images as Record<string, string>;
}

/**
 * Télécharge un SVG depuis une URL
 */
async function fetchSVG(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Erreur téléchargement SVG: ${response.status}`);
  }
  return response.text();
}

/**
 * Optimise un SVG (supprime les attributs inutiles)
 */
function optimizeSVG(svg: string): string {
  return svg
    .replace(/\s+/g, ' ')
    .replace(/<!--.*?-->/g, '')
    .replace(/\s*xmlns="[^"]*"/g, ' xmlns="http://www.w3.org/2000/svg"')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Génère un composant React pour une icône
 */
function generateIconComponent(name: string, svg: string): string {
  const componentName = name
    .split(/[-_\s]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
  
  // Extraire les attributs du SVG
  const svgMatch = svg.match(/<svg([^>]*)>([\s\S]*)<\/svg>/);
  if (!svgMatch) {
    throw new Error(`SVG invalide pour ${name}`);
  }
  
  const svgContent = svgMatch[2];
  
  return `import React from 'react';

export interface ${componentName}Props extends React.SVGProps<SVGSVGElement> {
  size?: number;
  color?: string;
}

export function ${componentName}({ 
  size = 24, 
  color = 'currentColor',
  ...props 
}: ${componentName}Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      ${svgContent}
    </svg>
  );
}

export default ${componentName};
`;
}

/**
 * Génère un fichier index pour exporter toutes les icônes
 */
function generateIconsIndex(iconNames: string[]): string {
  const exports = iconNames.map(name => {
    const componentName = name
      .split(/[-_\s]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
    return `export { ${componentName} } from './${componentName}';`;
  }).join('\n');
  
  return `/**
 * Icônes générées automatiquement depuis Figma
 * NE PAS MODIFIER MANUELLEMENT
 */

${exports}
`;
}

/**
 * Fonction principale
 */
async function main(): Promise<void> {
  try {
    console.log('🎨 Synchronisation des icônes Figma...\n');
    
    // Récupérer le fichier
    console.log('🔄 Récupération du fichier Figma...');
    const figmaFile = await fetchFigmaFile();
    
    // Trouver les icônes
    console.log('🔍 Recherche des icônes...');
    const icons = findIcons(figmaFile.document);
    
    if (icons.length === 0) {
      console.log('⚠️  Aucune icône trouvée dans le fichier Figma');
      console.log('   Assurez-vous que vos composants contiennent "icon" dans le nom');
      return;
    }
    
    console.log(`✅ ${icons.length} icône(s) trouvée(s)`);
    
    // Télécharger les icônes
    console.log('\n📥 Téléchargement des icônes...');
    const iconIds = icons.map(icon => icon.id);
    const imageUrls = await downloadIcons(iconIds);
    
    // Créer les dossiers de sortie
    if (!fs.existsSync(ICONS_OUTPUT_DIR)) {
      fs.mkdirSync(ICONS_OUTPUT_DIR, { recursive: true });
    }
    if (!fs.existsSync(ICONS_COMPONENT_DIR)) {
      fs.mkdirSync(ICONS_COMPONENT_DIR, { recursive: true });
    }
    
    // Télécharger et sauvegarder chaque icône
    const processedIcons: string[] = [];
    
    for (const icon of icons) {
      const url = imageUrls[icon.id];
      if (!url) {
        console.log(`⚠️  URL manquante pour ${icon.name}`);
        continue;
      }
      
      try {
        // Télécharger le SVG
        const svg = await fetchSVG(url);
        const optimizedSVG = optimizeSVG(svg);
        
        // Nettoyer le nom
        const cleanName = icon.name.toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '');
        
        // Sauvegarder le SVG
        const svgPath = path.join(ICONS_OUTPUT_DIR, `${cleanName}.svg`);
        fs.writeFileSync(svgPath, optimizedSVG);
        
        // Générer le composant React
        const component = generateIconComponent(cleanName, optimizedSVG);
        const componentName = cleanName
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join('');
        const componentPath = path.join(ICONS_COMPONENT_DIR, `${componentName}.tsx`);
        fs.writeFileSync(componentPath, component);
        
        processedIcons.push(cleanName);
        console.log(`✅ ${icon.name} → ${cleanName}.svg`);
      } catch (error) {
        console.error(`❌ Erreur pour ${icon.name}:`, error);
      }
    }
    
    // Générer l'index
    if (processedIcons.length > 0) {
      const indexContent = generateIconsIndex(processedIcons);
      fs.writeFileSync(path.join(ICONS_COMPONENT_DIR, 'index.ts'), indexContent);
      console.log('\n✅ Fichier index.ts généré');
    }
    
    console.log('\n✨ Synchronisation terminée !');
    console.log(`📁 SVG: ${ICONS_OUTPUT_DIR}`);
    console.log(`📁 Composants React: ${ICONS_COMPONENT_DIR}`);
    console.log(`📊 ${processedIcons.length}/${icons.length} icône(s) traitée(s)`);
    
  } catch (error) {
    console.error('❌ Erreur:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Exécuter
main();
