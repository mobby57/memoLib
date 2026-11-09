// Manual mock for 'stripe' to prevent real API calls during tests

const createFn = jest.fn(async (params: any) => ({ id: 'mock_id', ...params }));

class MockStripe {
  customers = { create: createFn };
  subscriptions = {
    create: createFn,
    cancel: jest.fn(async (id: string) => ({ id, status: 'canceled' })),
    retrieve: jest.fn(async (id: string) => ({ id, items: { data: [{ id: 'si_mock' }] } })),
    update: jest.fn(async (id: string, params: any) => ({ id, ...params })),
  };
  checkout = { sessions: { create: createFn } };
  billingPortal = { sessions: { create: createFn } };
  invoices = { list: jest.fn(async ({ customer, limit }: any) => ({ data: [], customer, limit })) };
  prices = { create: createFn };
  products = { create: createFn };
}

export default MockStripe as any;
