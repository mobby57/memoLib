/**
 * 🛡️ ANTI-OUBLI SYSTEM — MemoLib
 * 
 * L'IA rend IMPOSSIBLE l'oubli d'un délai ou d'une action critique.
 * Elle ne décide JAMAIS — elle alerte, rappelle, bloque, escalade.
 * 
 * Niveaux d'alerte :
 * 1. RAPPEL     → Notification web + badge (J-7)
 * 2. ALERTE     → Email + notification urgente (J-3)
 * 3. URGENCE    → Email + SMS + bannière rouge dans l'app (J-1)
 * 4. CRITIQUE   → Bloque la vue dashboard + force acknowledgment (J-0)
 * 5. DÉPASSÉ    → Alerte supérieur hiérarchique + log audit (J+1)
 * 
 * Principes :
 * - L'IA NE PREND AUCUNE DÉCISION
 * - L'IA NE PEUT PAS ÊTRE DÉSACTIVÉE pour les délais légaux
 * - Chaque alerte nécessite un ACK humain pour disparaître
 * - Si pas d'ACK → escalade automatique
 */

export interface AntiOubliAlert {
  id: string;
  dossierId: string;
  deadlineId: string;
  type: 'RAPPEL' | 'ALERTE' | 'URGENCE' | 'CRITIQUE' | 'DEPASSE';
  titre: string;
  message: string;
  deadlineDate: Date;
  heuresRestantes: number;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  escalatedTo?: string;
  channels: ('web' | 'email' | 'sms' | 'banner')[];
  createdAt: Date;
}

/**
 * Calcule le niveau d'alerte selon le temps restant
 */
export function calculateAlertLevel(
  deadlineDate: Date,
  now: Date = new Date()
): AntiOubliAlert['type'] | null {
  const msRemaining = deadlineDate.getTime() - now.getTime();
  const heuresRestantes = msRemaining / (1000 * 60 * 60);
  const joursRestants = heuresRestantes / 24;

  if (joursRestants < -1) return 'DEPASSE';    // J+1 et plus
  if (joursRestants <= 0) return 'CRITIQUE';    // Jour J
  if (joursRestants <= 1) return 'URGENCE';     // J-1 (24h)
  if (joursRestants <= 3) return 'ALERTE';      // J-3
  if (joursRestants <= 7) return 'RAPPEL';      // J-7
  return null; // Pas encore d'alerte
}

/**
 * Détermine les canaux de notification selon le niveau
 */
export function getAlertChannels(level: AntiOubliAlert['type']): AntiOubliAlert['channels'] {
  switch (level) {
    case 'RAPPEL':    return ['web'];
    case 'ALERTE':    return ['web', 'email'];
    case 'URGENCE':   return ['web', 'email', 'sms', 'banner'];
    case 'CRITIQUE':  return ['web', 'email', 'sms', 'banner'];
    case 'DEPASSE':   return ['web', 'email', 'sms', 'banner'];
  }
}

/**
 * Génère le message d'alerte adapté au contexte juridique
 */
export function generateAlertMessage(
  level: AntiOubliAlert['type'],
  dossierNumero: string,
  clientName: string,
  deadlineType: string,
  heuresRestantes: number
): { titre: string; message: string } {
  switch (level) {
    case 'RAPPEL':
      return {
        titre: `📋 Rappel — ${deadlineType}`,
        message: `Dossier ${dossierNumero} (${clientName}) : échéance dans ${Math.ceil(heuresRestantes / 24)} jours. Pensez à préparer les pièces.`,
      };
    case 'ALERTE':
      return {
        titre: `⚠️ Alerte — ${deadlineType} dans 3 jours`,
        message: `Dossier ${dossierNumero} (${clientName}) : le délai de ${deadlineType} expire dans ${Math.ceil(heuresRestantes / 24)} jours. Action requise.`,
      };
    case 'URGENCE':
      return {
        titre: `🚨 URGENT — ${deadlineType} demain !`,
        message: `Dossier ${dossierNumero} (${clientName}) : MOINS DE 24H pour ${deadlineType}. Déposez le recours AUJOURD'HUI.`,
      };
    case 'CRITIQUE':
      return {
        titre: `🔴 CRITIQUE — ${deadlineType} AUJOURD'HUI`,
        message: `Dossier ${dossierNumero} (${clientName}) : DEADLINE ATTEINTE. Si le recours n'est pas déposé, le client perd ses droits. CONFIRMEZ que vous avez agi.`,
      };
    case 'DEPASSE':
      return {
        titre: `❌ DÉPASSÉ — ${deadlineType} EXPIRÉ`,
        message: `Dossier ${dossierNumero} (${clientName}) : Le délai est DÉPASSÉ. Si aucune action n'a été prise, le client a perdu son droit de recours. Escalade au responsable.`,
      };
  }
}

/**
 * Vérifie si l'alerte nécessite un acknowledgment obligatoire
 * → L'avocat DOIT cliquer "J'ai pris connaissance" pour les niveaux URGENCE+
 */
export function requiresAcknowledgment(level: AntiOubliAlert['type']): boolean {
  return ['URGENCE', 'CRITIQUE', 'DEPASSE'].includes(level);
}

/**
 * Vérifie si l'alerte doit escalader au supérieur
 * → Si pas d'ACK dans les délais, on alerte le responsable/associé
 */
export function shouldEscalate(alert: AntiOubliAlert, now: Date = new Date()): boolean {
  if (alert.acknowledged) return false;
  if (alert.escalatedTo) return false; // Déjà escaladé

  const heuresSinceAlert = (now.getTime() - alert.createdAt.getTime()) / (1000 * 60 * 60);

  switch (alert.type) {
    case 'CRITIQUE': return heuresSinceAlert >= 2;  // Escalade après 2h sans ACK
    case 'DEPASSE':  return heuresSinceAlert >= 1;  // Escalade après 1h
    case 'URGENCE':  return heuresSinceAlert >= 6;  // Escalade après 6h
    default: return false;
  }
}

/**
 * Checklist de dossier — bloque la clôture si pièces manquantes
 * L'IA empêche de "fermer" un dossier incomplet
 */
export function canCloseDossier(checklist: {
  total: number;
  received: number;
  requiredMissing: string[];
}): { allowed: boolean; reason?: string; missing?: string[] } {
  if (checklist.requiredMissing.length > 0) {
    return {
      allowed: false,
      reason: `Impossible de clôturer : ${checklist.requiredMissing.length} pièce(s) obligatoire(s) manquante(s).`,
      missing: checklist.requiredMissing,
    };
  }
  return { allowed: true };
}

/**
 * Détection proactive — l'IA signale les incohérences
 * Ex: dossier OQTF sans deadline = ANORMAL
 */
export function detectAnomalies(dossier: {
  typeDossier: string;
  dateEcheance: Date | null;
  checklistComplete: boolean;
  statut: string;
  createdAt: Date;
}): string[] {
  const anomalies: string[] = [];
  const now = new Date();
  const joursOuvert = (now.getTime() - dossier.createdAt.getTime()) / (1000 * 60 * 60 * 24);

  // OQTF sans deadline = danger
  if (dossier.typeDossier.includes('OQTF') && !dossier.dateEcheance) {
    anomalies.push('⚠️ Dossier OQTF sans date d\'échéance — AJOUTEZ UNE DEADLINE IMMÉDIATEMENT');
  }

  // Dossier ouvert depuis > 30j sans checklist complète
  if (joursOuvert > 30 && !dossier.checklistComplete && dossier.statut !== 'CLOS') {
    anomalies.push('📋 Dossier ouvert depuis 30+ jours avec des pièces manquantes — relancez le client');
  }

  // Dossier en statut "EN_COURS" depuis > 90j sans activité
  if (joursOuvert > 90 && dossier.statut === 'EN_COURS') {
    anomalies.push('💤 Dossier inactif depuis 90+ jours — vérifiez si une action est requise');
  }

  // Asile sans deadline CNDA
  if (dossier.typeDossier === 'ASILE' && !dossier.dateEcheance) {
    anomalies.push('⚠️ Dossier Asile sans deadline CNDA — vérifiez le délai de recours (1 mois)');
  }

  return anomalies;
}
