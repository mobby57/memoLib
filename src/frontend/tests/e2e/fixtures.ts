import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

class AuthPage {
  constructor(private page: Page) {}
  async login(email: string, password: string) {
    await this.page.goto('/auth/signin');
    await Promise.all([
      this.page.fill('input[name="email"]', email),
      this.page.fill('input[name="password"]', password),
    ]);
    await this.page.click('button[type="submit"]');
    await this.page.waitForURL(/\/dashboard/, { timeout: 5000 });
  }
}

class DossiersPage {
  constructor(private page: Page) {}
  async goto() { await this.page.goto('/dossiers', { waitUntil: 'domcontentloaded' }); }
  async create(data: { title: string; clientName: string; description?: string }) {
    await this.page.click('button:has-text("Nouveau dossier")');
    await this.page.fill('input[name="title"]', data.title);
    await this.page.fill('input[name="clientName"]', data.clientName);
    if (data.description) await this.page.fill('textarea[name="description"]', data.description);
    await this.page.click('button[type="submit"]');
  }
}

class InvoicesPage {
  constructor(private page: Page) {}
  async goto() { await this.page.goto('/invoices', { waitUntil: 'domcontentloaded' }); }
  async create(data: { clientName: string; amount: number }) {
    await this.page.click('button:has-text("Nouvelle facture")');
    await this.page.fill('input[name="clientName"]', data.clientName);
    await this.page.fill('input[name="amount"]', data.amount.toString());
    await this.page.click('button[type="submit"]');
  }
}

type Fixtures = {
  authPage: AuthPage;
  dossiersPage: DossiersPage;
  invoicesPage: InvoicesPage;
  authenticatedPage: Page;
};

export const test = base.extend<Fixtures>({
  authPage: async ({ page }, use) => await use(new AuthPage(page)),
  dossiersPage: async ({ page }, use) => await use(new DossiersPage(page)),
  invoicesPage: async ({ page }, use) => await use(new InvoicesPage(page)),
  authenticatedPage: async ({ page, authPage }, use) => {
    await authPage.login('test@example.com', 'password123');
    await use(page);
  },
});

export { expect };
