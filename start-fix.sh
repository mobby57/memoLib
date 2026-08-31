#!/bin/bash
set -euo pipefail

# ─── Couleurs ──────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_step() { echo -e "${BLUE}▶ $1${NC}"; }
print_ok() { echo -e "${GREEN}✅ $1${NC}"; }
print_warn() { echo -e "${YELLOW}⚠️ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }

cd ~/projects/memoLib || exit 1

# Vérifier l'état
if git status --porcelain | grep -q .; then
  print_warn "Des modifications non commitées sont présentes. Veuillez les commit/stash."
  git status --short
  read -p "Continuer quand même ? (o/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Oo]$ ]]; then
    exit 1
  fi
fi

echo ""
echo "📋 Choisis l'issue à traiter :"
echo "  1) #13 - Jours fériés et ouvrés (P0)"
echo "  2) #14 - Validation des dates (P0)"
echo "  3) #15 - Fallback IA (P1)"
echo "  4) #16 - Audit trail IA (P1)"
echo "  5) #17 - Matrice de scénarios (P2)"
echo "  6) #18 - Documentation règles (P2)"
echo "  7) Tout (créer une branche pour chaque issue)"
read -p "👉 Choix (1-7) : " choice

case $choice in
  1) ISSUE="13"; BRANCH="feature/working-days" ;;
  2) ISSUE="14"; BRANCH="feature/validate-dates" ;;
  3) ISSUE="15"; BRANCH="feature/fallback-ia" ;;
  4) ISSUE="16"; BRANCH="feature/audit-trail-ia" ;;
  5) ISSUE="17"; BRANCH="feature/matrice-scenarios" ;;
  6) ISSUE="18"; BRANCH="feature/docs-regles" ;;
  7)
    print_step "Création de toutes les branches..."
    for i in 13 14 15 16 17 18; do
      case $i in
        13) b="feature/working-days" ;;
        14) b="feature/validate-dates" ;;
        15) b="feature/fallback-ia" ;;
        16) b="feature/audit-trail-ia" ;;
        17) b="feature/matrice-scenarios" ;;
        18) b="feature/docs-regles" ;;
      esac
      git checkout -b "$b" main 2>/dev/null || git checkout "$b"
      print_ok "Branche $b créée."
    done
    git checkout main
    print_ok "Toutes les branches sont créées. Retour sur main."
    exit 0
    ;;
  *)
    print_error "Choix invalide."
    exit 1
    ;;
esac

print_step "Création de la branche $BRANCH..."
git checkout -b "$BRANCH" main 2>/dev/null || git checkout "$BRANCH"
print_ok "Branche $BRANCH active."

if [ "$ISSUE" = "13" ]; then
  print_step "Génération du squelette pour les jours fériés/ouvrés..."
  mkdir -p src/lib/legal
  cat > src/lib/legal/workingDays.ts << 'EOF'
export function isFrenchHoliday(date: Date): boolean {
  const holidays = ['2026-01-01', '2026-04-06', '2026-05-01', '2026-05-08', '2026-05-14', '2026-05-25', '2026-07-14', '2026-08-15', '2026-11-01', '2026-11-11', '2026-12-25'];
  return holidays.includes(date.toISOString().split('T')[0]);
}
export function isWorkingDay(date: Date): boolean {
  return date.getDay() !== 0 && date.getDay() !== 6 && !isFrenchHoliday(date);
}
export function addWorkingDays(date: Date, days: number): Date {
  let d = new Date(date);
  for (let i = 0; i < days; i++) {
    do { d.setDate(d.getDate() + 1); } while (!isWorkingDay(d));
  }
  return d;
}
EOF
  print_ok "src/lib/legal/workingDays.ts créé."
  mkdir -p src/__tests__/lib/legal
  cat > src/__tests__/lib/legal/workingDays.test.ts << 'EOF'
import { describe, it, expect } from 'vitest';
import { isWorkingDay, addWorkingDays } from '@/lib/legal/workingDays';
describe('workingDays', () => {
  it('should detect weekend', () => {
    expect(isWorkingDay(new Date('2026-08-29'))).toBe(false);
    expect(isWorkingDay(new Date('2026-08-30'))).toBe(false);
  });
  it('should detect working day', () => {
    expect(isWorkingDay(new Date('2026-08-31'))).toBe(true);
  });
  it('should add working days', () => {
    const start = new Date('2026-08-28');
    const result = addWorkingDays(start, 3);
    expect(result.toISOString().split('T')[0]).toBe('2026-09-02');
  });
});
EOF
  print_ok "Tests créés."
fi

if [ "$ISSUE" = "14" ]; then
  print_step "Génération du squelette pour la validation des dates..."
  mkdir -p src/lib/legal
  cat > src/lib/legal/dateValidator.ts << 'EOF'
export interface ValidatedDates { decisionDate?: Date; notificationDate?: Date; deadlineDate?: Date; }
export interface ValidationError { field: string; issue: string; }
export function validateDeadline(dates: ValidatedDates): ValidationError[] {
  const errors: ValidationError[] = [];
  if (dates.decisionDate && dates.notificationDate && dates.notificationDate < dates.decisionDate) {
    errors.push({ field: 'notificationDate', issue: 'La date de notification ne peut pas être antérieure à la date de décision.' });
  }
  if (dates.deadlineDate && dates.notificationDate && dates.deadlineDate < dates.notificationDate) {
    errors.push({ field: 'deadlineDate', issue: 'La date limite ne peut pas être antérieure à la date de notification.' });
  }
  if (dates.deadlineDate && dates.deadlineDate < new Date()) {
    errors.push({ field: 'deadlineDate', issue: 'La date limite est dans le passé.' });
  }
  return errors;
}
EOF
  print_ok "src/lib/legal/dateValidator.ts créé."
  mkdir -p src/__tests__/lib/legal
  cat > src/__tests__/lib/legal/dateValidator.test.ts << 'EOF'
import { describe, it, expect } from 'vitest';
import { validateDeadline } from '@/lib/legal/dateValidator';
describe('dateValidator', () => {
  it('should detect notification before decision', () => {
    const errors = validateDeadline({ decisionDate: new Date('2026-08-10'), notificationDate: new Date('2026-08-05') });
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe('notificationDate');
  });
});
EOF
  print_ok "Tests créés."
fi

if [ "$ISSUE" != "13" ] && [ "$ISSUE" != "14" ]; then
  print_warn "Issue #$ISSUE : pas de génération automatique. Crée les fichiers manuellement selon l'issue."
fi

npm test -- --run --reporter=verbose || print_warn "Des tests ont échoué."

echo ""
print_ok "✅ Branche $BRANCH prête."
echo "📝 Fichiers créés/modifiés :"
git status --short
echo ""
echo "🚀 Prochaines étapes :"
echo "  1. Ouvre les fichiers et implémente la logique."
echo "  2. Commit : git add . && git commit -m 'fix(legal): ...'"
echo "  3. Push : git push origin $BRANCH"
echo "  4. Ouvre une PR en liant l'issue #$ISSUE."
echo "🔗 Issue : https://github.com/mobby57/memoLib/issues/$ISSUE"
