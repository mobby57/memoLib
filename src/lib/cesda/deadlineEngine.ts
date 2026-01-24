// ============================================
// MOTEUR DE CALCUL DES DeLAIS CESDA
// ============================================

import {
  ProcedureType,
  UrgencyLevel,
  DeadlineCalculation,
  DeadlineConfig,
  STANDARD_DEADLINES,
} from "@/types/cesda"

/**
 * Calcule le delai d'une procedure CESDA
 */
export function calculateDeadline(
  procedureType: ProcedureType,
  notificationDate: Date,
  metadata?: any
): DeadlineCalculation {
  const now = new Date()
  let deadlineDate: Date
  let config: DeadlineConfig | undefined

  // Determiner la configuration du delai
  switch (procedureType) {
    case ProcedureType.OQTF:
      // OQTF sans delai = 48h
      // OQTF avec delai = 30 jours
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
      // Depend du stade
      if (metadata?.stade === "CNDA") {
        config = STANDARD_DEADLINES.ASILE_CNDA
        deadlineDate = addDays(notificationDate, 30)
      } else {
        // OFPRA - pas de delai strict client, mais delai interne traitement
        deadlineDate = addMonths(notificationDate, 6)
      }
      break

    case ProcedureType.REGROUPEMENT_FAMILIAL:
      // Delai d'instruction prefecture = 6 mois (pas un delai a respecter par avocat)
      deadlineDate = addMonths(notificationDate, 6)
      break

    case ProcedureType.NATURALISATION:
      // Instruction longue, pas de delai client strict
      deadlineDate = addMonths(notificationDate, 18)
      break

    default:
      // Delai par defaut
      deadlineDate = addDays(notificationDate, 60)
  }

  // Calculer le temps restant
  const diff = deadlineDate.getTime() - now.getTime()
  const hoursRemaining = Math.max(0, diff / (1000 * 60 * 60))
  const daysRemaining = Math.max(0, hoursRemaining / 24)

  // Determiner le niveau d'urgence
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
 * Calcule le niveau d'urgence base sur le temps restant
 */
export function calculateUrgencyLevel(
  hoursRemaining: number,
  procedureType: ProcedureType
): UrgencyLevel {
  // OQTF sans delai (48h) - seuils tres serres
  if (procedureType === ProcedureType.OQTF) {
    if (hoursRemaining <= 12) return UrgencyLevel.CRITIQUE
    if (hoursRemaining <= 24) return UrgencyLevel.ELEVE
    if (hoursRemaining <= 36) return UrgencyLevel.MOYEN
    return UrgencyLevel.FAIBLE
  }

  // Autres procedures - seuils standards
  if (hoursRemaining <= 48) return UrgencyLevel.CRITIQUE // < 2 jours
  if (hoursRemaining <= 168) return UrgencyLevel.ELEVE // < 1 semaine
  if (hoursRemaining <= 720) return UrgencyLevel.MOYEN // < 1 mois
  return UrgencyLevel.FAIBLE
}

/**
 * Ajoute des heures a une date
 */
export function addHours(date: Date, hours: number): Date {
  const result = new Date(date)
  result.setHours(result.getHours() + hours)
  return result
}

/**
 * Ajoute des jours a une date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

/**
 * Ajoute des mois a une date
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  return result
}

/**
 * Verifie si un delai est depasse
 */
export function isDeadlineExpired(deadlineDate: Date): boolean {
  return new Date() > new Date(deadlineDate)
}

/**
 * Formate un delai en texte lisible
 */
export function formatTimeRemaining(deadline: DeadlineCalculation): string {
  if (deadline.isExpired) {
    return "Delai expire"
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
 * Genere des alertes basees sur les delais
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
        title: `[emoji] Delai critique - ${workspace.title}`,
        message: `Il reste seulement ${formatTimeRemaining(deadline)}. Action immediate requise.`,
        level: "critical",
        deadline,
      })
    }
    // Alerte warning si < 7 jours
    else if (deadline.daysRemaining <= 7 && !deadline.isExpired) {
      alerts.push({
        workspaceId: workspace.id,
        title: `️ Delai approchant - ${workspace.title}`,
        message: `Il reste ${formatTimeRemaining(deadline)}.`,
        level: "warning",
        deadline,
      })
    }
    // Alerte si expire
    else if (deadline.isExpired) {
      alerts.push({
        workspaceId: workspace.id,
        title: ` Delai expire - ${workspace.title}`,
        message: `Le delai est depasse. Verifier les options de recours.`,
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
 * Calcule la date limite a partir du type de procedure et de la date de notification
 */
export function autoCalculateDeadline(
  procedureType: ProcedureType,
  notificationDate: Date,
  metadata?: any
): Date {
  const calc = calculateDeadline(procedureType, notificationDate, metadata)
  return calc.deadlineDate
}
