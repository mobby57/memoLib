/**
 * Isolation et securisation des interactions avec l'IA
 * Zero-Trust Architecture - IA Poste Manager
 */

import { logger } from '@/lib/logger';

/**
 * Anonymise les donnees avant envoi a l'IA
 * Supprime toutes les informations personnelles identifiables
 * @param data - Donnees a anonymiser
 * @returns Donnees anonymisees
 */
export function anonymizeForAI(data: any): any {
  if (!data) return data;
  
  const anonymized = { ...data };
  
  // Suppression donnees personnelles
  if (anonymized.firstName) anonymized.firstName = '[PReNOM]';
  if (anonymized.lastName) anonymized.lastName = '[NOM]';
  if (anonymized.email) anonymized.email = '[EMAIL]';
  if (anonymized.phone) anonymized.phone = '[TeLePHONE]';
  if (anonymized.address) anonymized.address = '[ADRESSE]';
  
  // Suppression documents d'identite
  delete anonymized.passportNumber;
  delete anonymized.idCardNumber;
  delete anonymized.nationality;
  delete anonymized.dateOfBirth;
  
  // Anonymisation des relations
  if (anonymized.client) {
    anonymized.client = anonymizeForAI(anonymized.client);
  }
  
  if (anonymized.user) {
    anonymized.user = {
      role: anonymized.user.role,
      // Pas d'autres infos
    };
  }
  
  // Conservation de la structure metier uniquement
  return {
    documentType: anonymized.documentType,
    typeDossier: anonymized.typeDossier,
    statut: anonymized.statut,
    priorite: anonymized.priorite,
    articleCeseda: anonymized.articleCeseda,
    // Informations structurelles uniquement
    hasDocuments: anonymized.documents?.length > 0,
    documentCount: anonymized.documents?.length || 0,
  };
}

/**
 * Verifie qu'aucune donnee sensible n'est presente dans l'input IA
 * @param input - Donnees a valider
 * @returns true si l'input est sur, false sinon
 */
export function validateAIInput(input: any): boolean {
  const text = JSON.stringify(input);
  
  // Patterns de donnees sensibles a bloquer
  const forbiddenPatterns = [
    /\b[A-Z]{2}\d{6,}\b/,                    // Numeros de passeport
    /\b\d{15}\b/,                            // Numeros de securite sociale
    /\b[\w.-]+@[\w.-]+\.\w{2,}\b/,          // Adresses email
    /\b(?:\+33|0)[1-9](?:\d{8})\b/,         // Numeros de telephone francais
    /\b\d{1,3}\s+(?:rue|avenue|boulevard)/i, // Adresses postales
  ];
  
  // Verification des patterns interdits
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(text)) {
      logger.error('Donnee sensible detectee dans input IA', { pattern: pattern.toString() });
      return false;
    }
  }
  
  return true;
}

/**
 * Tag les outputs IA comme brouillons non-contraignants
 * @param output - Output de l'IA
 * @returns Output tague avec metadonnees de securite
 */
export function tagAIOutput(output: any): any {
  return {
    ...output,
    __aiGenerated: true,
    __draft: true,
    __requiresHumanValidation: true,
    __notLegalAdvice: true,
    __timestamp: new Date().toISOString(),
    __disclaimer: 'Ce contenu a ete genere par IA et necessite une validation humaine. Il ne constitue pas un conseil juridique.'
  };
}

/**
 * Nettoie un texte genere par IA de toute donnee potentiellement sensible
 * (au cas ou l'IA aurait "hallucine" des donnees)
 * @param text - Texte a nettoyer
 * @returns Texte nettoye
 */
export function sanitizeAIOutput(text: string): string {
  let sanitized = text;
  
  // Remplacement patterns sensibles par des placeholders
  sanitized = sanitized.replace(/\b[\w.-]+@[\w.-]+\.\w{2,}\b/g, '[EMAIL]');
  sanitized = sanitized.replace(/\b(?:\+33|0)[1-9](?:\d{8})\b/g, '[TeLePHONE]');
  sanitized = sanitized.replace(/\b[A-Z]{2}\d{6,}\b/g, '[DOCUMENT_ID]');
  
  return sanitized;
}

/**
 * Prepare un dossier pour l'analyse IA
 * Anonymise et valide les donnees
 * @param dossier - Dossier a preparer
 * @returns Dossier anonymise et valide, ou null si non valide
 */
export function prepareDossierForAI(dossier: any): any | null {
  // Anonymisation
  const anonymized = anonymizeForAI(dossier);
  
  // Validation
  if (!validateAIInput(anonymized)) {
    logger.error('Dossier invalide pour traitement IA', { dossierId: dossier.id });
    return null;
  }
  
  return anonymized;
}

/**
 * Wrapper securise pour les appels IA
 * @param aiFunction - Fonction IA a executer
 * @param input - Donnees d'entree
 * @returns Output tague et nettoye
 */
export async function secureAICall<T>(
  aiFunction: (input: any) => Promise<T>,
  input: any
): Promise<T | null> {
  try {
    // 1. Anonymisation
    const anonymized = anonymizeForAI(input);
    
    // 2. Validation
    if (!validateAIInput(anonymized)) {
      throw new Error('Input contient des donnees sensibles');
    }
    
    // 3. Appel IA
    const output = await aiFunction(anonymized);
    
    // 4. Tag et nettoyage
    const tagged = tagAIOutput(output);
    
    // Si l'output est un string, le nettoyer
    if (typeof output === 'string') {
      return sanitizeAIOutput(output) as T;
    }
    
    return tagged as T;
    
  } catch (error) {
    logger.error('Erreur appel IA securise', { error });
    return null;
  }
}

/**
 * Constantes de configuration IA
 */
export const AI_CONFIG = {
  MAX_REQUESTS_PER_HOUR: 100,
  MAX_TOKENS_PER_REQUEST: 4000,
  TIMEOUT_MS: 30000,
  REQUIRE_HUMAN_VALIDATION: true,
  LOG_ALL_REQUESTS: true,
} as const;
