/**
 * Alertes délais — J-3 / J-1 et non-duplication (P2, complète les PARTIAL).
 *
 * Importe le code de production réel (checkDeadlineAlerts) et couvre les seuils
 * J-3 et J-1 (jamais assertés) ainsi que l'anti-doublon (jamais testé
 * négativement).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    legalDeadline: { findMany: vi.fn(), update: vi.fn().mockResolvedValue({}) },
    deadlineAlert: { findFirst: vi.fn(), create: vi.fn().mockResolvedValue({}) },
    notification: { findFirst: vi.fn(), create: vi.fn().mockResolvedValue({}) },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import { checkDeadlineAlerts } from '@/lib/cron/deadline-alerts';

function deadline(id: string, dueInDays: number): Record<string, unknown> {
  return {
    id,
    tenantId: 't1',
    label: `Échéance ${id}`,
    dueDate: new Date(Date.now() + dueInDays * 86_400_000),
    createdBy: 'user-1',
    Dossier: { numero: 'D-2026-0001', responsableId: 'user-1' },
  };
}

// findMany est appelé dans l'ordre: [J7, J3, J1, overdue, suspended]
function setupFindMany({ j7 = [], j3 = [], j1 = [], overdue = [], suspended = [] }: Record<string, unknown[]>) {
  mockPrisma.legalDeadline.findMany
    .mockResolvedValueOnce(j7)
    .mockResolvedValueOnce(j3)
    .mockResolvedValueOnce(j1)
    .mockResolvedValueOnce(overdue)
    .mockResolvedValueOnce(suspended);
}

describe('[P2] checkDeadlineAlerts — J-3 / J-1 / anti-doublon', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.deadlineAlert.findFirst.mockResolvedValue(null); // pas d'alerte récente par défaut
    mockPrisma.notification.findFirst.mockResolvedValue(null);
  });

  it('J-3 : envoie un email + notif in-app et positionne alertJ3Sent', async () => {
    setupFindMany({ j3: [deadline('dl-j3', 3)] });

    const result = await checkDeadlineAlerts();

    expect(result.j3).toBe(1);
    expect(mockPrisma.deadlineAlert.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ alertType: 'J-3', channel: 'email' }) })
    );
    expect(mockPrisma.notification.create).toHaveBeenCalled();
    expect(mockPrisma.legalDeadline.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'dl-j3' }, data: expect.objectContaining({ alertJ3Sent: true }) })
    );
  });

  it('J-1 : envoie email + SMS et positionne alertJ1Sent + alertSmsSent', async () => {
    setupFindMany({ j1: [deadline('dl-j1', 1)] });

    const result = await checkDeadlineAlerts();

    expect(result.j1).toBe(1);
    const channels = mockPrisma.deadlineAlert.create.mock.calls.map((c) => c[0].data.channel);
    expect(channels).toContain('email');
    expect(channels).toContain('sms');
    expect(mockPrisma.legalDeadline.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'dl-j1' },
        data: expect.objectContaining({ alertJ1Sent: true, alertSmsSent: true }),
      })
    );
  });

  it('anti-doublon : une alerte identique récente (<2h) supprime le nouvel envoi', async () => {
    setupFindMany({ j3: [deadline('dl-dup', 3)] });
    // Simule une alerte J-3 email déjà envoyée récemment
    mockPrisma.deadlineAlert.findFirst.mockResolvedValue({ id: 'existing-alert' });

    await checkDeadlineAlerts();

    // sendAlert doit retourner tôt : AUCUNE nouvelle alerte créée
    expect(mockPrisma.deadlineAlert.create).not.toHaveBeenCalled();
  });
});
