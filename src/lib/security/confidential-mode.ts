/**
 * 🔒 Mode Confidentiel — Protection Secret Professionnel
 * 
 * Quand un dossier est marqué `confidentialMode: true`, AUCUNE donnée
 * ne doit quitter le réseau local. Cela signifie :
 * - IA : uniquement Ollama (local), pas de cloud (OpenAI/Mistral/Anthropic)
 * - Embeddings : uniquement local
 * - Si Ollama n'est pas disponible → fallback regex, JAMAIS cloud
 * 
 * Article 66-5 de la loi du 31 décembre 1971 :
 * "En toutes matières, que ce soit dans le domaine du conseil ou dans celui
 * de la défense, les consultations adressées par un avocat à son client ou
 * destinées à celui-ci [...] sont couvertes par le secret professionnel."
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

// ============================================
// TYPES
// ============================================

export interface ConfidentialCheckResult {
  isConfidential: boolean;
  dossierId?: string;
  reason?: string;
  allowedProviders: ('ollama' | 'regex')[];
  blockedProviders: string[];
}

// ============================================
// VÉRIFICATION
// ============================================

/**
 * Vérifie si un dossier est en mode confidentiel
 */
export async function checkConfidentialMode(dossierId: string): Promise<ConfidentialCheckResult> {
  if (!dossierId) {
    return { isConfidential: false, allowedProviders: ['ollama', 'regex'], blockedProviders: [] };
  }

  try {
    const dossier = await prisma.dossier.findUnique({
      where: { id: dossierId },
      select: { id: true, confidentialMode: true, numero: true },
    });

    if (!dossier) {
      return { isConfidential: false, allowedProviders: ['ollama', 'regex'], blockedProviders: [] };
    }

    if (dossier.confidentialMode) {
      logger.info('Confidential mode ACTIVE — cloud AI blocked', { dossierId: dossier.id, numero: dossier.numero });
      return {
        isConfidential: true,
        dossierId: dossier.id,
        reason: 'Dossier marqué confidentiel (art. 66-5). IA cloud bloquée.',
        allowedProviders: ['ollama', 'regex'],
        blockedProviders: ['openai', 'mistral', 'anthropic', 'cloudflare'],
      };
    }

    return { isConfidential: false, allowedProviders: ['ollama', 'regex'], blockedProviders: [] };
  } catch (error) {
    // En cas d'erreur DB, appliquer le principe de précaution → mode confidentiel
    logger.warn('Cannot check confidential mode, defaulting to SAFE', { dossierId, error });
    return {
      isConfidential: true,
      dossierId,
      reason: 'Vérification impossible — mode confidentiel appliqué par précaution.',
      allowedProviders: ['ollama', 'regex'],
      blockedProviders: ['openai', 'mistral', 'anthropic', 'cloudflare'],
    };
  }
}

/**
 * Vérifie si un email est lié à un dossier confidentiel
 */
export async function checkEmailConfidential(emailId: string): Promise<ConfidentialCheckResult> {
  if (!emailId) {
    return { isConfidential: false, allowedProviders: ['ollama', 'regex'], blockedProviders: [] };
  }

  try {
    const email = await prisma.email.findUnique({
      where: { id: emailId },
      select: { dossierId: true },
    });

    if (email?.dossierId) {
      return checkConfidentialMode(email.dossierId);
    }

    return { isConfidential: false, allowedProviders: ['ollama', 'regex'], blockedProviders: [] };
  } catch {
    return { isConfidential: false, allowedProviders: ['ollama', 'regex'], blockedProviders: [] };
  }
}

/**
 * Vérifie si un tenant force le mode confidentiel global
 * (tous les dossiers sont confidentiels)
 */
export async function checkTenantConfidentialMode(tenantId: string): Promise<boolean> {
  if (!tenantId) return false;

  try {
    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId },
      select: { ollamaEnabled: true, ollamaUrl: true },
    });

    // Si le tenant a désactivé Ollama ET n'a pas de provider cloud configuré,
    // c'est une configuration incohérente — on ne force pas le mode confidentiel ici.
    // Le mode confidentiel global serait un champ TenantSettings.forceConfidential (futur)
    return false;
  } catch {
    return false;
  }
}

// ============================================
// HELPERS POUR LES ROUTES API
// ============================================

/**
 * Génère une réponse d'erreur quand le mode confidentiel bloque l'IA cloud
 * et qu'Ollama n'est pas disponible.
 */
export function confidentialModeError(dossierId?: string): string {
  return (
    '🔒 Ce dossier est en mode confidentiel (secret professionnel). ' +
    'L\'IA cloud est bloquée pour protéger les données. ' +
    (dossierId ? `Dossier: ${dossierId}. ` : '') +
    'Solutions : installez Ollama (IA locale) ou désactivez le mode confidentiel sur ce dossier.'
  );
}

/**
 * Marquer un dossier comme confidentiel
 */
export async function setConfidentialMode(dossierId: string, confidential: boolean): Promise<void> {
  await prisma.dossier.update({
    where: { id: dossierId },
    data: { confidentialMode: confidential },
  });

  logger.info(`Dossier confidential mode ${confidential ? 'ENABLED' : 'DISABLED'}`, { dossierId });
}
