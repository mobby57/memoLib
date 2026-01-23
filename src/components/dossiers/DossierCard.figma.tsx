/**
 * 🎨 Figma Code Connect - DossierCard
 * 
 * Composant: IA Poste Manager > Dossiers > DossierCard
 * Synchronisation design-code pour cartes de dossier CESEDA
 */

import { CodeConnect } from '@figma/code-connect';
import DossierCard from './DossierCard';

CodeConnect.figma(
  'https://www.figma.com/design/YOUR_FILE_ID/IA-Poste-Manager?node-id=DOSSIER_CARD_ID',
  DossierCard,
  {
    dossier: figma.nestedProps('Dossier Data', {
      numero: figma.string('Dossier Number'),
      typeDossier: figma.enum('Type CESEDA', {
        'OQTF': 'OQTF',
        'NATURALISATION': 'NATURALISATION',
        'ASILE': 'ASILE',
        'TITRE_SEJOUR': 'TITRE_SEJOUR'
      }),
      statut: figma.enum('Status', {
        'en_cours': 'en_cours',
        'en_attente': 'en_attente',
        'urgent': 'urgent',
        'termine': 'termine'
      }),
      priorite: figma.enum('Priority', {
        'basse': 'basse',
        'normale': 'normale',
        'haute': 'haute',
        'critique': 'critique'
      }),
      clientName: figma.string('Client Name'),
      deadlineDate: figma.string('Deadline (ISO)'),
      description: figma.string('Description')
    }),
    
    // Visual
    variant: figma.enum('Card Variant', {
      'minimal': 'minimal',
      'standard': 'standard',
      'detailed': 'detailed'
    }),
    
    isLoading: figma.boolean('Loading State'),
    isSelected: figma.boolean('Selected'),
    
    // Events
    onClick: figma.action('On Click'),
    onMenu: figma.action('On Menu')
  }
);

/**
 * **Carte de dossier juridique CESEDA**
 * 
 * Affiche les informations clés d'un dossier avec:
 * - Type procédure (OQTF, Naturalisation, Asile, Titre de séjour)
 * - Statut et priorité visuels
 * - Échéance critique
 * - Client associé
 * - Actions rapides
 * 
 * ### Variants
 * - **minimal** - Titre + statut seulement
 * - **standard** - Infos complètes (par défaut)
 * - **detailed** - Avec description et historique
 * 
 * ### États
 * - Normal, Urgent (orange), Critique (rouge)
 * - Loading (skeleton)
 * - Selected (highlight)
 */
