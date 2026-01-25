import { checkDeadlineAlerts } from '@/lib/cron/deadline-alerts';
import prisma from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    legalDeadline: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    deadlineAlert: {
      create: jest.fn(),
    },
  },
}));

describe('Deadline Alerts Cron', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should check J-7 deadlines', async () => {
    const mockDeadlines = [{ id: '1', label: 'Test', createdBy: 'user-1' }];
    (prisma.legalDeadline.findMany as jest.Mock).mockResolvedValue(mockDeadlines);
    (prisma.deadlineAlert.create as jest.Mock).mockResolvedValue({});
    (prisma.legalDeadline.update as jest.Mock).mockResolvedValue({});

    const result = await checkDeadlineAlerts();
    expect(result.j7).toBe(1);
  });

  it('should check overdue deadlines', async () => {
    (prisma.legalDeadline.findMany as jest.Mock)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: '3' }]);
    (prisma.legalDeadline.update as jest.Mock).mockResolvedValue({});

    const result = await checkDeadlineAlerts();
    expect(result.overdue).toBe(1);
  });
});
