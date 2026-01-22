/**
 * 🎨 Figma Code Connect - Global Setup
 * 
 * Configuration centralisée pour tous les composants
 * Génère automatiquement la documentation depuis Figma
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
  
  // Génération de docs
  generateDocs: {
    enabled: true,
    format: 'markdown',
    includePropTypes: true,
    includeStories: true,
    includeAccessibility: true
  },
  
  // Intégrations
  integrations: {
    discord: false, // À activer pour notifications
    slack: false,   // À activer pour notifications
    github: true    // Commit automatiques
  }
});

/**
 * 📋 REGISTRY: Tous les composants connectés
 * 
 * Chaque composant a un fichier .figma.tsx correspondant:
 * 
 * ✅ SmartFormBuilder.figma.tsx
 *    └─ Formulaires intelligents avec suggestions IA
 * 
 * ✅ DossierCard.figma.tsx
 *    └─ Cartes de dossier CESEDA
 * 
 * ✅ WorkspaceReasoning.figma.tsx
 *    └─ Machine à états du raisonnement
 * 
 * ✅ dashboard.figma.tsx
 *    └─ Dashboard d'analytics
 * 
 * 📊 Workflow:
 * 1. Designer modifie composant dans Figma
 * 2. Code Connect détecte changement
 * 3. Props mapping appliqué
 * 4. Documentation regénérée
 * 5. Commit Git si changement code
 * 6. Notification pour équipe dev
 */
