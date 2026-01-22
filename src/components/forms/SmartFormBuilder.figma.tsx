/**
 * 🎨 Figma Code Connect - SmartFormBuilder
 * 
 * Synchronisation automatique avec le design Figma
 * Composant: IA Poste Manager > Smart Forms > SmartFormBuilder
 * 
 * Maintient la cohérence entre design et code
 */

import { CodeConnect } from '@figma/code-connect';
import SmartFormBuilder from './SmartFormBuilder';

CodeConnect.figma(
  'https://www.figma.com/design/YOUR_FILE_ID/IA-Poste-Manager?node-id=SMART_FORM_ID',
  SmartFormBuilder,
  {
    // Props mapping
    config: figma.nestedProps('Form Config', {
      title: figma.string('Title'),
      description: figma.string('Description'),
      fields: figma.nestedProps('Fields', {
        type: figma.enum('Field Type'),
        required: figma.boolean('Required'),
        validation: figma.string('Validation Rule')
      })
    }),
    
    // Visual states
    variant: figma.enum('Variant', {
      'default': 'default',
      'compact': 'compact',
      'fullscreen': 'fullscreen'
    }),
    
    theme: figma.enum('Theme', {
      'light': 'light',
      'dark': 'dark'
    }),
    
    // IA suggestions
    showAISuggestions: figma.boolean('Show AI Suggestions'),
    aiConfidence: figma.number('AI Confidence Score (0-1)'),
    
    // Handler
    onSubmit: figma.action('On Submit')
  }
);

/**
 * Documentation automatique pour Figma
 * 
 * **Composant intelligent pour collecte de données**
 * 
 * ### Fonctionnalités
 * - ✅ Champs conditionnels adaptatifs
 * - ✅ Suggestions IA en temps réel (Ollama)
 * - ✅ Validation multi-niveaux
 * - ✅ Impact scoring (1-20)
 * - ✅ Accessibility (WCAG 2.1 AA)
 * 
 * ### Variants
 * - **default** - Formulaire standard avec suggestions
 * - **compact** - Mode condensé pour modales
 * - **fullscreen** - Vue complète avec analytics
 * 
 * ### Props Importants
 * - `config`: Configuration du formulaire (title, fields, validation)
 * - `showAISuggestions`: Afficher les suggestions IA
 * - `onSubmit`: Callback de soumission
 * - `theme`: Light/Dark mode
 * 
 * ### Intégrations
 * - IA: Ollama (llama3.2:3b)
 * - Storage: Prisma + PostgreSQL
 * - Validation: Zod schemas
 */
