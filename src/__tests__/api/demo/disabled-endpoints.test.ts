import { describe, expect, it } from 'vitest';
import { POST as seedDemo } from '@/app/api/demo/seed/route';
import { POST as simulateEmail } from '@/app/api/emails/simulate/route';

describe('demo endpoints', () => {
  it.each([
    ['database seeding', seedDemo],
    ['email injection', simulateEmail],
  ])('%s is disabled', async (_name, post) => {
    const response = await post();

    expect(response.status).toBe(410);
    expect(await response.json()).toHaveProperty('error');
  });
});
