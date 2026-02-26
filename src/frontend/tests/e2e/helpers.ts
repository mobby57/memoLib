import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

// API Mocking helpers
export class ApiMocker {
  constructor(private page: Page) {}

  async mockSuccess(endpoint: string, data: any) {
    await this.page.route(endpoint, route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify(data)
      });
    });
  }

  async mockError(endpoint: string, status: number, error: string) {
    await this.page.route(endpoint, route => {
      route.fulfill({
        status,
        body: JSON.stringify({ error })
      });
    });
  }

  async mockDelay(endpoint: string, delayMs: number) {
    await this.page.route(endpoint, route => {
      setTimeout(() => route.continue(), delayMs);
    });
  }
}

// Wait helpers
export async function waitForApiCall(page: Page, urlPattern: string | RegExp) {
  return page.waitForRequest(req => {
    const url = req.url();
    return typeof urlPattern === 'string' 
      ? url.includes(urlPattern)
      : urlPattern.test(url);
  });
}

export async function waitForToast(page: Page, message: string) {
  const toast = page.locator('[role="alert"]', { hasText: message });
  await expect(toast).toBeVisible();
  return toast;
}

// Form helpers
export async function fillForm(page: Page, data: Record<string, string>) {
  for (const [name, value] of Object.entries(data)) {
    await page.fill(`[name="${name}"]`, value);
  }
}

export async function submitForm(page: Page) {
  await page.click('button[type="submit"]');
}

// Table helpers
export async function getTableRows(page: Page, tableSelector = 'table') {
  return page.locator(`${tableSelector} tbody tr`);
}

export async function clickTableRow(page: Page, rowIndex: number) {
  await page.click(`table tbody tr:nth-child(${rowIndex + 1})`);
}

// Storage helpers
export async function setLocalStorage(page: Page, key: string, value: any) {
  await page.evaluate(
    ({ key, value }) => localStorage.setItem(key, JSON.stringify(value)),
    { key, value }
  );
}

export async function getLocalStorage(page: Page, key: string) {
  return page.evaluate(
    key => JSON.parse(localStorage.getItem(key) || 'null'),
    key
  );
}

// Performance helpers
export async function measureLoadTime(page: Page, url: string) {
  const startTime = Date.now();
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  return Date.now() - startTime;
}

export async function getWebVitals(page: Page) {
  return page.evaluate(() => {
    return new Promise(resolve => {
      const vitals: any = {};
      
      new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          vitals[entry.name] = entry;
        }
      }).observe({ entryTypes: ['paint', 'largest-contentful-paint'] });
      
      setTimeout(() => resolve(vitals), 3000);
    });
  });
}

// Accessibility helpers
export async function checkA11y(page: Page, selector?: string) {
  const locator = selector ? page.locator(selector) : page;
  
  // Check for basic a11y issues
  const issues = await page.evaluate((sel) => {
    const element = sel ? document.querySelector(sel) : document.body;
    const issues: string[] = [];
    
    // Check for images without alt
    element?.querySelectorAll('img:not([alt])').forEach(() => {
      issues.push('Image without alt attribute');
    });
    
    // Check for buttons without accessible name
    element?.querySelectorAll('button:not([aria-label]):not(:has(*))').forEach(btn => {
      if (!btn.textContent?.trim()) {
        issues.push('Button without accessible name');
      }
    });
    
    return issues;
  }, selector);
  
  return issues;
}

// Screenshot helpers
export async function takeFullPageScreenshot(page: Page, name: string) {
  await page.screenshot({
    path: `test-results/screenshots/${name}.png`,
    fullPage: true
  });
}

// Network helpers
export async function interceptAndModify(
  page: Page,
  urlPattern: string | RegExp,
  modifier: (data: any) => any
) {
  await page.route(urlPattern, async route => {
    const response = await route.fetch();
    const json = await response.json();
    const modified = modifier(json);
    
    await route.fulfill({
      response,
      body: JSON.stringify(modified)
    });
  });
}
