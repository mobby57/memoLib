/**
 * Gestion des jours ouvrés et fériés pour le calcul des délais juridiques
 * 
 * Cette version est conçue pour la maintenance à long terme :
 * - Jours fériés stockés en data (facile à mettre à jour)
 * - Support multi‑années
 * - Fonctions robustes avec gestion des erreurs
 * - Cache pour les appels fréquents
 * - Prêt pour une future base de données
 */

// ─── Données : jours fériés français (métropole) ────────────
// Source : https://www.service-public.fr/particuliers/vosdroits/F2294
// Mis à jour : 2026-08-31

const HOLIDAYS_BY_YEAR: Record<number, string[]> = {
  2024: [
    '2024-01-01', // Nouvel An
    '2024-04-01', // Lundi de Pâques
    '2024-05-01', // Fête du Travail
    '2024-05-08', // Victoire 1945
    '2024-05-09', // Ascension
    '2024-05-20', // Lundi de Pentecôte
    '2024-07-14', // Fête Nationale
    '2024-08-15', // Assomption
    '2024-11-01', // Toussaint
    '2024-11-11', // Armistice
    '2024-12-25', // Noël
  ],
  2025: [
    '2025-01-01',
    '2025-04-21',
    '2025-05-01',
    '2025-05-08',
    '2025-05-29',
    '2025-06-09',
    '2025-07-14',
    '2025-08-15',
    '2025-11-01',
    '2025-11-11',
    '2025-12-25',
  ],
  2026: [
    '2026-01-01',
    '2026-04-06',
    '2026-05-01',
    '2026-05-08',
    '2026-05-14',
    '2026-05-25',
    '2026-07-14',
    '2026-08-15',
    '2026-11-01',
    '2026-11-11',
    '2026-12-25',
  ],
  2027: [
    '2027-01-01',
    '2027-03-29',
    '2027-05-01',
    '2027-05-08',
    '2027-05-13',
    '2027-05-24',
    '2027-07-14',
    '2027-08-15',
    '2027-11-01',
    '2027-11-11',
    '2027-12-25',
  ],
  2028: [
    '2028-01-01',
    '2028-04-17', // Lundi de Pâques
    '2028-05-01',
    '2028-05-08',
    '2028-05-25', // Ascension
    '2028-06-05', // Pentecôte
    '2028-07-14',
    '2028-08-15',
    '2028-11-01',
    '2028-11-11',
    '2028-12-25',
  ],
};

// ─── Cache des jours fériés (pour éviter recalculs) ────────
const holidayCache = new Map<string, Set<string>>();

function getHolidaysForYear(year: number): string[] {
  return HOLIDAYS_BY_YEAR[year] ?? [];
}

/**
 * Récupère tous les jours fériés pour une année donnée (avec cache)
 */
function getCachedHolidaysForYear(year: number): Set<string> {
  const key = `holidays-${year}`;
  if (!holidayCache.has(key)) {
    const holidays = getHolidaysForYear(year);
    holidayCache.set(key, new Set(holidays));
  }
  return holidayCache.get(key)!;
}

/**
 * Vérifie si une date est un jour férié en France métropolitaine
 */
export function isFrenchHoliday(date: Date): boolean {
  const year = date.getFullYear();
  const dateStr = date.toISOString().split('T')[0];
  const holidays = getCachedHolidaysForYear(year);
  return holidays.has(dateStr);
}

/**
 * Vérifie si une date est un jour ouvré (lundi‑vendredi, hors jours fériés)
 */
export function isWorkingDay(date: Date): boolean {
  const day = date.getDay();
  if (day === 0 || day === 6) return false; // Week-end
  return !isFrenchHoliday(date);
}

/**
 * Ajoute un nombre de jours ouvrés à une date (saut week‑ends et fériés)
 * 
 * @param date - Date de départ
 * @param days - Nombre de jours ouvrés à ajouter (doit être ≥ 0)
 * @returns Nouvelle date (ne modifie pas l'original)
 * @throws Si days est négatif
 */
export function addWorkingDays(date: Date, days: number): Date {
  if (days < 0) {
    throw new Error('addWorkingDays : le nombre de jours doit être ≥ 0');
  }
  if (days === 0) return new Date(date);

  const result = new Date(date);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    if (isWorkingDay(result)) {
      added++;
    }
  }
  return result;
}

/**
 * Compte le nombre de jours ouvrés entre deux dates (excluant la date de début)
 * 
 * @param from - Date de début
 * @param to - Date de fin (doit être ≥ from)
 * @returns Nombre de jours ouvrés entre les deux dates
 * @throws Si from > to
 */
export function getWorkingDaysBetween(from: Date, to: Date): number {
  if (from > to) {
    throw new Error('getWorkingDaysBetween : la date de début doit être antérieure à la date de fin');
  }
  let count = 0;
  const current = new Date(from);
  while (current < to) {
    current.setDate(current.getDate() + 1);
    if (isWorkingDay(current)) {
      count++;
    }
  }
  return count;
}

/**
 * Vérifie si une date est dans le passé (par rapport à maintenant)
 */
export function isPast(date: Date): boolean {
  return date < new Date();
}

/**
 * Vérifie si une date est aujourd'hui
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return date.getFullYear() === today.getFullYear() &&
         date.getMonth() === today.getMonth() &&
         date.getDate() === today.getDate();
}

/**
 * Retourne le prochain jour ouvré après une date donnée (inclus)
 */
export function nextWorkingDay(date: Date): Date {
  const next = new Date(date);
  while (!isWorkingDay(next)) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

// ─── Export d'un objet pour faciliter l'import ─────────────
export const workingDays = {
  isFrenchHoliday,
  isWorkingDay,
  addWorkingDays,
  getWorkingDaysBetween,
  isPast,
  isToday,
  nextWorkingDay,
};

export default workingDays;
