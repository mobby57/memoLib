import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { calculateDeadline } from '@/lib/cesda/deadlineEngine';
import { ProcedureType } from '@/types/cesda';

function loadScenarios(): any[] {
  const dir = path.join(__dirname, 'scenarios');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  const all: any[] = [];
  for (const file of files) {
    const content = fs.readFileSync(path.join(dir, file), 'utf-8');
    all.push(...JSON.parse(content));
  }
  return all;
}

describe('Matrice juridique – Scénarios CESEDA', () => {
  const scenarios = loadScenarios();

  it('tous les IDs doivent être uniques', () => {
    const ids = scenarios.map(s => s.id);
    expect(ids.length).toBe(new Set(ids).size);
  });

  it.each(scenarios)('$id – $description', (scenario) => {
    const notificationDate = new Date(scenario.input.notificationDate);
    // Évaluation déterministe : on fige "maintenant" à la date de notification.
    // L'urgence redevient reproductible (indépendante de l'horloge réelle) et
    // reflète la gravité au moment où le dossier est reçu — ce que les
    // scénarios figent. La gravité finale = max(gravité métier de base,
    // urgence temporelle).
    const result = calculateDeadline(
      scenario.input.procedureType as ProcedureType,
      notificationDate,
      scenario.input.metadata || {},
      notificationDate
    );

    // Vérifier la date limite
    const expectedDeadline = scenario.expected.expectedDeadline;
    const actualDeadline = result.deadlineDate.toISOString().split('T')[0];
    expect(actualDeadline).toBe(expectedDeadline);

    // Vérifier l'urgence (déterministe car "now" est figé à la notification).
    if (scenario.expected.urgency) {
      expect(result.urgencyLevel).toBe(scenario.expected.urgency);
    }

    // Vérifier humanReviewRequired
    if (scenario.expected.humanReviewRequired !== undefined) {
      expect(result.humanReviewRequired ?? false).toBe(scenario.expected.humanReviewRequired);
    }
  });
});
