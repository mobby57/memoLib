#!/usr/bin/env tsx
/**
 * Script de synchronisation Figma
 * Extrait les design tokens (couleurs, typographies, espacements) depuis Figma
 */

import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';

// Charger les variables d'environnement
config();

// Configuration
const FIGMA_ACCESS_TOKEN = process.env.FIGMA_ACCESS_TOKEN;
const FIGMA_FILE_KEY = 'auVG69j7QrCFGBt5svFre0'; // Extrait de votre URL Figma
const OUTPUT_DIR = path.join(__dirname, '../src/styles/tokens');

interface FigmaFile {
  document: FigmaNode;
  styles: Record<string, FigmaStyle>;
}

interface FigmaNode {
  id: string;
  name: string;
  type: string;
  children?: FigmaNode[];
  fills?: FigmaPaint[];
  strokes?: FigmaPaint[];
  effects?: FigmaEffect[];
  style?: {
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: number;
    lineHeight?: { value: number; unit: string };
  };
  absoluteBoundingBox?: {
    width: number;
    height: number;
  };
}

interface FigmaPaint {
  type: string;
  color?: {
    r: number;
    g: number;
    b: number;
    a: number;
  };
}

interface FigmaEffect {
  type: string;
  radius?: number;
  color?: {
    r: number;
    g: number;
    b: number;
    a: number;
  };
  offset?: {
    x: number;
    y: number;
  };
}

interface FigmaStyle {
  key: string;
  name: string;
  styleType: string;
  description?: string;
}

interface DesignTokens {
  colors: Record<string, string>;
  typography: Record<string, TypographyToken>;
  spacing: Record<string, string>;
  shadows: Record<string, string>;
}

interface TypographyToken {
  fontFamily: string;
  fontSize: string;
  fontWeight: number;
  lineHeight: string;
}

/**
 * Convertit une couleur RGBA Figma en format CSS
 */
function rgbaToHex(color: { r: number; g: number; b: number; a: number }): string {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  
  if (color.a < 1) {
    return `rgba(${r}, ${g}, ${b}, ${color.a.toFixed(2)})`;
  }
  
  return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * Extrait les couleurs depuis le document Figma
 */
function extractColors(node: FigmaNode, colors: Record<string, string> = {}): Record<string, string> {
  // Chercher les nœuds de couleur (généralement dans un frame "Colors" ou "Palette")
  if (node.type === 'RECTANGLE' || node.type === 'FRAME') {
    if (node.fills && node.fills.length > 0) {
      const fill = node.fills[0];
      if (fill && fill.type === 'SOLID' && fill.color) {
        const colorName = node.name.toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '');
        colors[colorName] = rgbaToHex(fill.color);
      }
    }
  }
  
  // Récursif pour les enfants
  if (node.children) {
    for (const child of node.children) {
      extractColors(child, colors);
    }
  }
  
  return colors;
}

/**
 * Extrait les typographies depuis le document Figma
 */
function extractTypography(node: FigmaNode, typography: Record<string, TypographyToken> = {}): Record<string, TypographyToken> {
  if (node.type === 'TEXT' && node.style) {
    const tokenName = node.name.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    
    typography[tokenName] = {
      fontFamily: node.style.fontFamily || 'inherit',
      fontSize: node.style.fontSize ? `${node.style.fontSize}px` : '16px',
      fontWeight: node.style.fontWeight || 400,
      lineHeight: node.style.lineHeight 
        ? `${node.style.lineHeight.value}${node.style.lineHeight.unit}` 
        : 'normal',
    };
  }
  
  if (node.children) {
    for (const child of node.children) {
      extractTypography(child, typography);
    }
  }
  
  return typography;
}

/**
 * Extrait les espacements depuis le document Figma
 */
function extractSpacing(node: FigmaNode, spacing: Record<string, string> = {}): Record<string, string> {
  // Chercher les frames/rectangles utilisés pour définir les espacements
  if ((node.type === 'FRAME' || node.type === 'RECTANGLE') && 
      node.name.toLowerCase().includes('spacing')) {
    if (node.absoluteBoundingBox) {
      const spacingName = node.name.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
      const size = Math.round(node.absoluteBoundingBox.width);
      spacing[spacingName] = `${size}px`;
    }
  }
  
  if (node.children) {
    for (const child of node.children) {
      extractSpacing(child, spacing);
    }
  }
  
  return spacing;
}

/**
 * Extrait les ombres depuis le document Figma
 */
function extractShadows(node: FigmaNode, shadows: Record<string, string> = {}): Record<string, string> {
  if (node.effects && node.effects.length > 0) {
    for (const effect of node.effects) {
      if (effect.type === 'DROP_SHADOW' && effect.color && effect.offset) {
        const shadowName = node.name.toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '');
        
        const color = rgbaToHex(effect.color);
        const x = effect.offset.x || 0;
        const y = effect.offset.y || 0;
        const blur = effect.radius || 0;
        
        shadows[shadowName] = `${x}px ${y}px ${blur}px ${color}`;
      }
    }
  }
  
  if (node.children) {
    for (const child of node.children) {
      extractShadows(child, shadows);
    }
  }
  
  return shadows;
}

/**
 * Récupère le fichier Figma depuis l'API
 */
async function fetchFigmaFile(): Promise<FigmaFile> {
  if (!FIGMA_ACCESS_TOKEN) {
    throw new Error('FIGMA_ACCESS_TOKEN non défini dans .env');
  }
  
  const url = `https://api.figma.com/v1/files/${FIGMA_FILE_KEY}`;
  
  console.log('🔄 Récupération du fichier Figma...');
  
  const response = await fetch(url, {
    headers: {
      'X-Figma-Token': FIGMA_ACCESS_TOKEN,
    },
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erreur Figma API (${response.status}): ${errorText}`);
  }
  
  return response.json();
}

/**
 * Génère les fichiers de design tokens
 */
function generateTokenFiles(tokens: DesignTokens): void {
  // Créer le dossier de sortie s'il n'existe pas
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  // Générer tokens.ts
  const tokensTS = `/**
 * Design Tokens extraits depuis Figma
 * Généré automatiquement - NE PAS MODIFIER MANUELLEMENT
 */

export const colors = ${JSON.stringify(tokens.colors, null, 2)} as const;

export const typography = ${JSON.stringify(tokens.typography, null, 2)} as const;

export const spacing = ${JSON.stringify(tokens.spacing, null, 2)} as const;

export const shadows = ${JSON.stringify(tokens.shadows, null, 2)} as const;

export type ColorToken = keyof typeof colors;
export type TypographyToken = keyof typeof typography;
export type SpacingToken = keyof typeof spacing;
export type ShadowToken = keyof typeof shadows;
`;
  
  fs.writeFileSync(path.join(OUTPUT_DIR, 'tokens.ts'), tokensTS);
  console.log('✅ Généré: tokens.ts');
  
  // Générer tokens.css
  const tokensCSS = `:root {
  /* Couleurs */
${Object.entries(tokens.colors).map(([name, value]) => `  --color-${name}: ${value};`).join('\n')}

  /* Espacements */
${Object.entries(tokens.spacing).map(([name, value]) => `  --spacing-${name}: ${value};`).join('\n')}

  /* Ombres */
${Object.entries(tokens.shadows).map(([name, value]) => `  --shadow-${name}: ${value};`).join('\n')}
}
`;
  
  fs.writeFileSync(path.join(OUTPUT_DIR, 'tokens.css'), tokensCSS);
  console.log('✅ Généré: tokens.css');
}

/**
 * Fonction principale
 */
async function main(): Promise<void> {
  try {
    console.log('🎨 Synchronisation des design tokens Figma...\n');
    
    // Récupérer le fichier Figma
    const figmaFile = await fetchFigmaFile();
    
    // Extraire les tokens
    console.log('🔍 Extraction des design tokens...');
    const colors = extractColors(figmaFile.document);
    const typography = extractTypography(figmaFile.document);
    const spacing = extractSpacing(figmaFile.document);
    const shadows = extractShadows(figmaFile.document);
    
    const tokens: DesignTokens = {
      colors,
      typography,
      spacing,
      shadows,
    };
    
    // Statistiques
    console.log(`\n📊 Tokens extraits:`);
    console.log(`   - Couleurs: ${Object.keys(colors).length}`);
    console.log(`   - Typographies: ${Object.keys(typography).length}`);
    console.log(`   - Espacements: ${Object.keys(spacing).length}`);
    console.log(`   - Ombres: ${Object.keys(shadows).length}`);
    
    // Générer les fichiers
    console.log('\n📝 Génération des fichiers...');
    generateTokenFiles(tokens);
    
    console.log('\n✨ Synchronisation terminée avec succès !');
    console.log(`📁 Fichiers générés dans: ${OUTPUT_DIR}`);
    
  } catch (error) {
    console.error('❌ Erreur:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Exécuter le script
main();
