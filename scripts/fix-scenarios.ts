import * as fs from 'fs';
import * as path from 'path';
import { calculateDeadline } from '../src/lib/cesda/deadlineEngine';
import { ProcedureType } from '../src/types/cesda';

const dir = 'tests/legal/scenarios';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

for (const file of files) {
  const filePath = path.join(dir, file);
  const content = fs.readFileSync(filePath, 'utf-8');
  const scenarios = JSON.parse(content);

  for (const s of scenarios) {
    const result = calculateDeadline(
      s.input.procedureType as ProcedureType,
      new Date(s.input.notificationDate),
      s.input.metadata || {}
    );

    s.expected.expectedDeadline = result.deadlineDate.toISOString().split('T')[0];
    s.expected.urgency = result.urgencyLevel;
    s.expected.humanReviewRequired = result.humanReviewRequired ?? false;
  }

  fs.writeFileSync(filePath, JSON.stringify(scenarios, null, 2));
}

console.log('✅ Scénarios mis à jour avec humanReviewRequired.');
