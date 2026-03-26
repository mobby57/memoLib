import { test, expect } from './fixtures';

const MOCK_DOSSIER = {
  id: 'dossier-1',
  numero: 'DOS-2024-001',
  typeDossier: 'Contentieux civil',
  description: 'Affaire de test e2e',
  priorite: 'HAUTE',
  statut: 'EN_COURS',
  dateCreation: new Date().toISOString(),
  dateEcheance: new Date(Date.now() + 86400000 * 30).toISOString(),
  updatedAt: new Date().toISOString(),
  client: { id: 'client-1', firstName: 'Jean', lastName: 'Dupont', email: 'jean@example.com' },
  documents: [],
  legalDeadlines: [],
  emails: [],
  factures: [],
};

test.describe('Dossiers', () => {
  test('should display dossiers page', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/fr/dossiers', { waitUntil: 'domcontentloaded' });
    await expect(authenticatedPage.locator('h1')).toBeVisible({ timeout: 3000 });
  });

  test('shows success toast after dossier creation redirect', async ({ authenticatedPage }) => {
    await authenticatedPage.route('**/api/v1/dossiers/dossier-1', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_DOSSIER),
      })
    );

    await authenticatedPage.goto('/fr/dossiers/dossier-1?created=1', {
      waitUntil: 'domcontentloaded',
    });

    await expect(
      authenticatedPage.locator('[role="alert"]', { hasText: 'Dossier cree avec succes' })
    ).toBeVisible({ timeout: 5000 });
  });

  test('does not show creation toast without created=1 param', async ({ authenticatedPage }) => {
    await authenticatedPage.route('**/api/v1/dossiers/dossier-1', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_DOSSIER),
      })
    );

    await authenticatedPage.goto('/fr/dossiers/dossier-1', { waitUntil: 'domcontentloaded' });

    await expect(
      authenticatedPage.locator('[role="alert"]', { hasText: 'Dossier cree avec succes' })
    ).not.toBeVisible({ timeout: 3000 });
  });
});
