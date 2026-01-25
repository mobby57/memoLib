/**
 * 🎨 Figma Code Connect - Global Setup
 * 
 * Configuration centralisee pour tous les composants
 * Genere automatiquement la documentation depuis Figma
 */

import { CodeConnect } from '@figma/code-connect';

// Configuration globale
CodeConnect.config({
  // Figma file
  figmaFile: 'https://www.figma.com/file/YOUR_FIGMA_FILE_ID/IA-Poste-Manager',
  
  // Source code
  sourceDirectory: './src',
  outputDirectory: './docs/figma-exports',
  
  // Comportements
  autoSync: true,
  onBuild: true,
  updateStrategy: 'merge',
  
  // Generation de docs
  generateDocs: {
    enabled: true,
    format: 'markdown',
    includePropTypes: true,
    includeStories: true,
    includeAccessibility: true
  },
  
  // Integrations
  integrations: {
    discord: false, // a activer pour notifications
    slack: false,   // a activer pour notifications
    github: true    // Commit automatiques
  }
});

/**
 *  REGISTRY: Tous les composants connectes
 * 
 * Chaque composant a un fichier .figma.tsx correspondant:
 * 
 *  SmartFormBuilder.figma.tsx
 *     Formulaires intelligents avec suggestions IA
 * 
 *  DossierCard.figma.tsx
 *     Cartes de dossier CESEDA
 * 
 *  WorkspaceReasoning.figma.tsx
 *     Machine a etats du raisonnement
 * 
 *  dashboard.figma.tsx
 *     Dashboard d'analytics
 * 
 *  Workflow:
 * 1. Designer modifie composant dans Figma
 * 2. Code Connect detecte changement
 * 3. Props mapping applique
 * 4. Documentation regeneree
 * 5. Commit Git si changement code
 * 6. Notification pour equipe dev
 */
