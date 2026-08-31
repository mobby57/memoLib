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
    const mode = scenario.input.metadata?.mode || 'calendar';
    const result = calculateDeadline(
      scenario.input.procedureType as ProcedureType,
      new Date(scenario.input.notificationDate),
      scenario.input.metadata || {},
      mode
    );

    // Vérifier la date limite
    const expectedDeadline = scenario.expected.expectedDeadline;
    const actualDeadline = result.deadlineDate.toISOString().split('T')[0];
    expect(actualDeadline).toBe(expectedDeadline);

    // Vérifier l'urgence
    if (scenario.expected.urgency) {
      expect(result.urgencyLevel).toBe(scenario.expected.urgency);
    }

    // Vérifier humanReviewRequired
    if (scenario.expected.humanReviewRequired !== undefined) {
      expect(result.humanReviewRequired ?? false).toBe(scenario.expected.humanReviewRequired);
    }
  });
});
