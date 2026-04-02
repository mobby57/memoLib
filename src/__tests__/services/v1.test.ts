jest.mock('@/lib/services/auth.service', () => ({
  authService: { id: 'auth' },
}));

jest.mock('@/lib/services/cases.service', () => ({
  casesService: { id: 'cases' },
}));

jest.mock('@/lib/services/clients.service', () => ({
  clientsService: { id: 'clients' },
}));

jest.mock('@/lib/services/emails.service', () => ({
  emailsService: { id: 'emails' },
}));

jest.mock('@/lib/services/search.service', () => ({
  searchService: { id: 'search' },
}));

jest.mock('@/lib/services/dashboard.service', () => ({
  dashboardService: { id: 'dashboard' },
}));

import {
  authService,
  casesService,
  clientsService,
  emailsService,
  searchService,
  dashboardService,
} from '@/lib/services/v1';

describe('services v1 facade', () => {
  it('re-exports all expected services', () => {
    expect(authService).toEqual({ id: 'auth' });
    expect(casesService).toEqual({ id: 'cases' });
    expect(clientsService).toEqual({ id: 'clients' });
    expect(emailsService).toEqual({ id: 'emails' });
    expect(searchService).toEqual({ id: 'search' });
    expect(dashboardService).toEqual({ id: 'dashboard' });
  });
});
