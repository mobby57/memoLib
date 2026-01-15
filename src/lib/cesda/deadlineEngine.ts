// ============================================
// MOTEUR DE CALCUL DES DÉLAIS CESDA
// ============================================

import {
  ProcedureType,
  UrgencyLevel,
  DeadlineCalculation,
  DeadlineConfig,
  STANDARD_DEADLINES,
} from "@/types/cesda"

/**
 * Calcule le délai d'une procédure CESDA
 */
export function calculateDeadline(
  procedureType: ProcedureType,
  notificationDate: Date,
  metadata?: any
): DeadlineCalculation {
  const now = new Date()
  let deadlineDate: Date
  let config: DeadlineConfig | undefined

  // Déterminer la configuration du délai
  switch (procedureType) {
    case ProcedureType.OQTF:
      // OQTF sans délai = 48h
      // OQTF avec délai = 30 jours
      if (metadata?.oqtfType === "sans_delai") {
        config = STANDARD_DEADLINES.OQTF_SANS_DELAI
        deadlineDate = addHours(notificationDate, 48)
      } else {
        config = STANDARD_DEADLINES.OQTF_AVEC_DELAI
        deadlineDate = addDays(notificationDate, 30)
      }
      break

    case ProcedureType.REFUS_TITRE:
    case ProcedureType.RETRAIT_TITRE:
      // Recours gracieux ou contentieux = 2 mois
      config = STANDARD_DEADLINES.REFUS_TITRE
      deadlineDate = addMonths(notificationDate, 2)
      break

    case ProcedureType.ASILE:
      // Dépend du stade
      if (metadata?.stade === "CNDA") {
        config = STANDARD_DEADLINES.ASILE_CNDA
        deadlineDate = addDays(notificationDate, 30)
      } else {
        // OFPRA - pas de délai strict client, mais délai interne traitement
        deadlineDate = addMonths(notificationDate, 6)
      }
      break

    case ProcedureType.REGROUPEMENT_FAMILIAL:
      // Délai d'instruction préfecture = 6 mois (pas un délai à respecter par avocat)
      deadlineDate = addMonths(notificationDate, 6)
      break

    case ProcedureType.NATURALISATION:
      // Instruction longue, pas de délai client strict
      deadlineDate = addMonths(notificationDate, 18)
      break

    default:
      // Délai par défaut
      deadlineDate = addDays(notificationDate, 60)
  }

  // Calculer le temps restant
  const diff = deadlineDate.getTime() - now.getTime()
  const hoursRemaining = Math.max(0, diff / (1000 * 60 * 60))
  const daysRemaining = Math.max(0, hoursRemaining / 24)

  // Déterminer le niveau d'urgence
  const urgencyLevel = calculateUrgencyLevel(hoursRemaining, procedureType)

  return {
    notificationDate,
    deadlineDate,
    daysRemaining: Math.floor(daysRemaining),
    hoursRemaining: Math.floor(hoursRemaining),
    urgencyLevel,
    isExpired: diff <= 0,
    procedureType,
  }
}

/**
 * Calcule le niveau d'urgence basé sur le temps restant
 */
export function calculateUrgencyLevel(
  hoursRemaining: number,
  procedureType: ProcedureType
): UrgencyLevel {
  // OQTF sans délai (48h) - seuils très serrés
  if (procedureType === ProcedureType.OQTF) {
    if (hoursRemaining <= 12) return UrgencyLevel.CRITIQUE
    if (hoursRemaining <= 24) return UrgencyLevel.ELEVE
    if (hoursRemaining <= 36) return UrgencyLevel.MOYEN
    return UrgencyLevel.FAIBLE
  }

  // Autres procédures - seuils standards
  if (hoursRemaining <= 48) return UrgencyLevel.CRITIQUE // < 2 jours
  if (hoursRemaining <= 168) return UrgencyLevel.ELEVE // < 1 semaine
  if (hoursRemaining <= 720) return UrgencyLevel.MOYEN // < 1 mois
  return UrgencyLevel.FAIBLE
}

/**
 * Ajoute des heures à une date
 */
export function addHours(date: Date, hours: number): Date {
  const result = new Date(date)
  result.setHours(result.getHours() + hours)
  return result
}

/**
 * Ajoute des jours à une date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

/**
 * Ajoute des mois à une date
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  return result
}

/**
 * Vérifie si un délai est dépassé
 */
export function isDeadlineExpired(deadlineDate: Date): boolean {
  return new Date() > new Date(deadlineDate)
}

/**
 * Formate un délai en texte lisible
 */
export function formatTimeRemaining(deadline: DeadlineCalculation): string {
  if (deadline.isExpired) {
    return "Délai expiré"
  }

  const { daysRemaining, hoursRemaining } = deadline

  if (daysRemaining > 0) {
    return `${daysRemaining} jour${daysRemaining > 1 ? "s" : ""} restant${
      daysRemaining > 1 ? "s" : ""
    }`
  }

  if (hoursRemaining > 0) {
    return `${hoursRemaining} heure${hoursRemaining > 1 ? "s" : ""} restante${
      hoursRemaining > 1 ? "s" : ""
    }`
  }

  return "Moins d'une heure"
}

/**
 * Génère des alertes basées sur les délais
 */
export function generateDeadlineAlerts(
  workspaces: Array<{
    id: string
    title: string
    procedureType: ProcedureType
    notificationDate?: Date
    deadlineDate?: Date
    metadata?: any
  }>
): Array<{
  workspaceId: string
  title: string
  message: string
  level: "info" | "warning" | "critical"
  deadline: DeadlineCalculation
}> {
  const alerts: Array<any> = []

  for (const workspace of workspaces) {
    if (!workspace.notificationDate || !workspace.deadlineDate) continue

    const deadline = calculateDeadline(
      workspace.procedureType as ProcedureType,
      new Date(workspace.notificationDate),
      workspace.metadata
    )

    // Alerte critique si < 48h
    if (deadline.hoursRemaining <= 48 && !deadline.isExpired) {
      alerts.push({
        workspaceId: workspace.id,
        title: `🔴 Délai critique - ${workspace.title}`,
        message: `Il reste seulement ${formatTimeRemaining(deadline)}. Action immédiate requise.`,
        level: "critical",
        deadline,
      })
    }
    // Alerte warning si < 7 jours
    else if (deadline.daysRemaining <= 7 && !deadline.isExpired) {
      alerts.push({
        workspaceId: workspace.id,
        title: `⚠️ Délai approchant - ${workspace.title}`,
        message: `Il reste ${formatTimeRemaining(deadline)}.`,
        level: "warning",
        deadline,
      })
    }
    // Alerte si expiré
    else if (deadline.isExpired) {
      alerts.push({
        workspaceId: workspace.id,
        title: `❌ Délai expiré - ${workspace.title}`,
        message: `Le délai est dépassé. Vérifier les options de recours.`,
        level: "critical",
        deadline,
      })
    }
  }

  // Trier par urgence (critique d'abord, puis par heures restantes)
  return alerts.sort((a, b) => {
    if (a.level === "critical" && b.level !== "critical") return -1
    if (a.level !== "critical" && b.level === "critical") return 1
    return a.deadline.hoursRemaining - b.deadline.hoursRemaining
  })
}

/**
 * Calcule la date limite à partir du type de procédure et de la date de notification
 */
export function autoCalculateDeadline(
  procedureType: ProcedureType,
  notificationDate: Date,
  metadata?: any
): Date {
  const calc = calculateDeadline(procedureType, notificationDate, metadata)
  return calc.deadlineDate
}
