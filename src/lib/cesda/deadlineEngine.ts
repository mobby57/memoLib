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
  metadata?: any,
  now: Date = new Date()
): DeadlineCalculation {
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

    case ProcedureType.REFERE_LIBERTE:
      // Refere-liberte : le juge statue sous 48h (L.521-2 CJA).
      deadlineDate = addHours(notificationDate, 48)
      break

    case ProcedureType.CONTENTIEUX:
      // Recours contentieux standard = 2 mois.
      deadlineDate = addMonths(notificationDate, 2)
      break

    default:
      // Delai par defaut
      deadlineDate = addDays(notificationDate, 60)
  }

  // Calculer le temps restant
  const diff = deadlineDate.getTime() - now.getTime()
  const hoursRemaining = Math.max(0, diff / (1000 * 60 * 60))
  const daysRemaining = Math.max(0, hoursRemaining / 24)

  // Determiner le niveau d'urgence.
  // Gravite finale = max(gravite metier de base, urgence temporelle).
  // Ce principe respecte l'approche protectrice recommandee par l'avis
  // juridique : un dossier faible sur le fond mais dont l'echeance est
  // imminente devient urgent ; un dossier grave sur le fond (OQTF sans delai,
  // IRTF, retention...) ne peut jamais etre classe "faible" meme si l'echeance
  // est lointaine. La gravite de base est deterministe (independante de now),
  // ce qui rend la classification stable dans le temps.
  const temporalUrgency = calculateUrgencyLevel(hoursRemaining, procedureType)
  const baseGravity = getBaseGravity(procedureType, metadata)
  const urgencyLevel = maxUrgency(baseGravity, temporalUrgency)

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
 * Ordre de severite des niveaux d'urgence (croissant).
 */
const URGENCY_SEVERITY: Record<UrgencyLevel, number> = {
  [UrgencyLevel.FAIBLE]: 0,
  [UrgencyLevel.MOYEN]: 1,
  [UrgencyLevel.ELEVE]: 2,
  [UrgencyLevel.CRITIQUE]: 3,
}

/**
 * Retourne le niveau d'urgence le plus severe des deux.
 */
export function maxUrgency(a: UrgencyLevel, b: UrgencyLevel): UrgencyLevel {
  return URGENCY_SEVERITY[a] >= URGENCY_SEVERITY[b] ? a : b
}

/**
 * Gravite METIER de base d'une procedure, INDEPENDANTE du temps restant.
 *
 * Bareme valide par avis juridique (droit des etrangers). La gravite reflete
 * l'enjeu intrinseque de la procedure et ses facteurs aggravants (portes par
 * les metadata), avant toute consideration de delai :
 *
 *  - OQTF sans delai, IRTF, retention, refere-liberte : CRITIQUE/ELEVE
 *  - OQTF simple, asile en procedure acceleree             : ELEVE
 *  - Asile (regime normal), recours contentieux            : MOYEN
 *  - Refus/retrait de titre simple, naturalisation, RF     : FAIBLE
 *
 * La gravite finale renvoyee par calculateDeadline est ensuite
 * max(baseGravity, urgence temporelle) — approche protectrice.
 */
export function getBaseGravity(
  procedureType: ProcedureType,
  metadata?: any
): UrgencyLevel {
  switch (procedureType) {
    case ProcedureType.OQTF: {
      // OQTF sans delai (48h) ou IRTF associee = situation critique par nature.
      if (metadata?.oqtfType === "sans_delai") return UrgencyLevel.CRITIQUE
      if (metadata?.irtfAssociee) return UrgencyLevel.CRITIQUE
      // OQTF avec delai de depart volontaire = eleve.
      return UrgencyLevel.ELEVE
    }

    case ProcedureType.ASILE: {
      // Procedure acceleree ou Dublin = delais serres, enjeu renforce.
      if (metadata?.procedureAcceleree || metadata?.procedureDublin) {
        return UrgencyLevel.ELEVE
      }
      // CNDA accelere (retention / assignation, delais tres courts) = ELEVE.
      if (metadata?.stade === "CNDA_accelere") return UrgencyLevel.ELEVE
      // Recours CNDA = contentieux a delai (30 jours) -> moyen.
      if (metadata?.stade === "CNDA") return UrgencyLevel.MOYEN
      // Asile en regime normal (OFPRA) -> moyen (enjeu fort mais delai large).
      return UrgencyLevel.MOYEN
    }

    case ProcedureType.REFERE_LIBERTE:
      // Refere-liberte (L.521-2 CJA) : urgence absolue (48h) -> critique.
      return UrgencyLevel.CRITIQUE

    case ProcedureType.CONTENTIEUX:
      // Contentieux administratif standard (recours 2-3 mois) -> moyen.
      return UrgencyLevel.MOYEN

    case ProcedureType.RETRAIT_TITRE:
      // Le retrait d'un titre existant est plus grave qu'un simple refus.
      return UrgencyLevel.MOYEN

    case ProcedureType.REFUS_TITRE:
      // Refus/renouvellement simple : gravite de base faible (recours 2 mois).
      return UrgencyLevel.FAIBLE

    case ProcedureType.REGROUPEMENT_FAMILIAL:
    case ProcedureType.NATURALISATION:
      // Instructions longues, pas de delai client strict : gravite de base faible.
      return UrgencyLevel.FAIBLE

    default:
      return UrgencyLevel.FAIBLE
  }
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
        title: ` Delai critique - ${workspace.title}`,
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
