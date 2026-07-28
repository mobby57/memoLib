const mockPrisma = {
  legalDeadline: {
    findMany: jest.fn(),
    update: jest.fn(),
  },
  deadlineAlert: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  notification: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
};

jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

const { checkDeadlineAlerts } = require('@/lib/cron/deadline-alerts') as typeof import('@/lib/cron/deadline-alerts');

describe('Deadline Alerts Cron', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.deadlineAlert.findFirst.mockResolvedValue(null);
    mockPrisma.notification.findFirst.mockResolvedValue(null);
    mockPrisma.deadlineAlert.create.mockResolvedValue({});
    mockPrisma.notification.create.mockResolvedValue({});
  });

  it('should check J-7 deadlines', async () => {
    const mockDeadlines = [{ id: '1', label: 'Test', createdBy: 'user-1', tenantId: 't1', dueDate: new Date() }];
    mockPrisma.legalDeadline.findMany
      .mockResolvedValueOnce(mockDeadlines)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    mockPrisma.legalDeadline.update.mockResolvedValue({});

    const result = await checkDeadlineAlerts();
    expect(result.j7).toBe(1);
  });

  it('should check overdue deadlines', async () => {
    mockPrisma.legalDeadline.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: '3' }])
      .mockResolvedValueOnce([]);
    mockPrisma.legalDeadline.update.mockResolvedValue({});

    const result = await checkDeadlineAlerts();
    expect(result.overdue).toBe(1);
  });
});
