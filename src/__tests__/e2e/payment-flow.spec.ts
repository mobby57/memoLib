/**
 * End-to-End Payment Flow Tests
 * Uses Playwright to test complete user journey
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('@payments Payment Flow E2E', () => {
    test.beforeEach(async ({ page }) => {
        // Login before each test
        await page.goto(`${BASE_URL}/auth/signin`);
        await page.fill('input[name="email"]', 'test@memolib.com');
        await page.fill('input[name="password"]', 'testpassword123');
        await page.click('button[type="submit"]');
        await page.waitForURL(`${BASE_URL}/dashboard`);
    });

    test('should display pricing plans', async ({ page }) => {
        await page.goto(`${BASE_URL}/billing`);

        // Verify all 3 tiers are displayed
        await expect(page.locator('text=FREE')).toBeVisible();
        await expect(page.locator('text=PRO')).toBeVisible();
        await expect(page.locator('text=ENTERPRISE')).toBeVisible();

        // Verify PRO pricing
        await expect(page.locator('text=$9.99')).toBeVisible();
    });

    test('should toggle between monthly and yearly billing', async ({ page }) => {
        await page.goto(`${BASE_URL}/billing`);

        // Initially on monthly
        await expect(page.locator('text=$9.99')).toBeVisible();

        // Toggle to yearly
        await page.click('button[aria-label="Toggle billing cycle"]');

        // Verify yearly price
        await expect(page.locator('text=$95.90')).toBeVisible();
        await expect(page.locator('text=Save 20%')).toBeVisible();
    });

    test('should complete successful payment with test card', async ({ page }) => {
        await page.goto(`${BASE_URL}/billing`);

        // Click upgrade to PRO
        await page.click('text=Select >> nth=1'); // PRO plan

        // Wait for payment form
        await expect(page.locator('iframe[name^="__privateStripeFrame"]')).toBeVisible();

        // Fill Stripe Elements (need to switch to iframe context)
        const stripeFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]');

        // Fill card number
        await stripeFrame.locator('input[name="cardnumber"]').fill('4242424242424242');
        await stripeFrame.locator('input[name="exp-date"]').fill('1228');
        await stripeFrame.locator('input[name="cvc"]').fill('123');
        await stripeFrame.locator('input[name="postal"]').fill('12345');

        // Submit payment
        await page.click('button:has-text("Pay")');

        // Wait for success
        await page.waitForURL(`${BASE_URL}/payment/success`, { timeout: 10000 });
        await expect(page.locator('text=Payment successful')).toBeVisible();
    });

    test('should handle declined card', async ({ page }) => {
        await page.goto(`${BASE_URL}/billing`);

        await page.click('text=Select >> nth=1'); // PRO plan

        const stripeFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]');

        // Use declined card
        await stripeFrame.locator('input[name="cardnumber"]').fill('4000000000000002');
        await stripeFrame.locator('input[name="exp-date"]').fill('1228');
        await stripeFrame.locator('input[name="cvc"]').fill('123');
        await stripeFrame.locator('input[name="postal"]').fill('12345');

        await page.click('button:has-text("Pay")');

        // Wait for error message
        await expect(page.locator('text=Your card was declined')).toBeVisible({ timeout: 10000 });
    });

    test('should display current subscription', async ({ page }) => {
        // Assume user already has PRO subscription
        await page.goto(`${BASE_URL}/billing`);

        // Check current plan section
        await expect(page.locator('text=Current Plan')).toBeVisible();
        await expect(page.locator('text=PRO Plan')).toBeVisible();
        await expect(page.locator('text=Status: active')).toBeVisible();
    });

    test('should cancel subscription', async ({ page }) => {
        await page.goto(`${BASE_URL}/billing`);

        // Click cancel
        await page.click('button:has-text("Cancel Subscription")');

        // Confirm dialog
        page.on('dialog', dialog => dialog.accept());

        // Wait for success message
        await expect(page.locator('text=Subscription cancelled successfully')).toBeVisible();

        // Verify warning message
        await expect(page.locator('text=will be cancelled at the end of the current billing period')).toBeVisible();
    });

    test('should display payment methods', async ({ page }) => {
        await page.goto(`${BASE_URL}/billing`);

        // Scroll to payment methods section
        await page.locator('text=Payment Methods').scrollIntoViewIfNeeded();

        // Should show at least the section
        await expect(page.locator('text=Payment Methods')).toBeVisible();
    });

    test('should display invoice history', async ({ page }) => {
        await page.goto(`${BASE_URL}/billing`);

        // Scroll to invoices
        await page.locator('text=Invoice History').scrollIntoViewIfNeeded();

        await expect(page.locator('text=Invoice History')).toBeVisible();
    });

    test('should support currency switching', async ({ page }) => {
        await page.goto(`${BASE_URL}/billing`);

        // Select EUR currency
        await page.selectOption('select[name="currency"]', 'EUR');

        // Verify price updated
        await expect(page.locator('text=€')).toBeVisible();
    });

    test('should handle 3D Secure authentication', async ({ page }) => {
        await page.goto(`${BASE_URL}/billing`);

        await page.click('text=Select >> nth=1'); // PRO plan

        const stripeFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]');

        // Use 3DS card
        await stripeFrame.locator('input[name="cardnumber"]').fill('4000002500003155');
        await stripeFrame.locator('input[name="exp-date"]').fill('1228');
        await stripeFrame.locator('input[name="cvc"]').fill('123');
        await stripeFrame.locator('input[name="postal"]').fill('12345');

        await page.click('button:has-text("Pay")');

        // Wait for 3DS modal
        await expect(page.locator('iframe[name="__privateStripeFrame3DS"]')).toBeVisible({ timeout: 10000 });

        // In test mode, click "Authorize Test Payment"
        const authFrame = page.frameLocator('iframe[name="__privateStripeFrame3DS"]');
        await authFrame.locator('button:has-text("Complete")').click();

        // Should redirect to success
        await page.waitForURL(`${BASE_URL}/payment/success`, { timeout: 15000 });
    });
});

test.describe('Multi-Currency Support', () => {
    const currencies = [
        { code: 'USD', symbol: '$', price: '9.99' },
        { code: 'EUR', symbol: '€', price: '9.20' },
        { code: 'GBP', symbol: '£', price: '7.90' },
        { code: 'JPY', symbol: '¥', price: '1,495' }
    ];

    currencies.forEach(({ code, symbol, price }) => {
        test(`should display correct price in ${code}`, async ({ page }) => {
            await page.goto(`${BASE_URL}/billing`);

            // Select currency
            await page.selectOption('select[name="currency"]', code);

            // Verify symbol and price
            await expect(page.locator(`text=${symbol}`)).toBeVisible();
            await expect(page.locator(`text=${price}`).first()).toBeVisible();
        });
    });
});

test.describe('Subscription Tiers', () => {
    test('FREE tier should have limited features', async ({ page }) => {
        await page.goto(`${BASE_URL}/billing`);

        const freeCard = page.locator('div:has-text("FREE")').first();
        await expect(freeCard.locator('text=1 workspace')).toBeVisible();
        await expect(freeCard.locator('text=Basic email')).toBeVisible();
    });

    test('PRO tier should show all features', async ({ page }) => {
        await page.goto(`${BASE_URL}/billing`);

        const proCard = page.locator('div:has-text("PRO")').first();
        await expect(proCard.locator('text=Unlimited workspaces')).toBeVisible();
        await expect(proCard.locator('text=Advanced AI')).toBeVisible();
        await expect(proCard.locator('text=Most Popular')).toBeVisible();
    });

    test('ENTERPRISE tier should show custom features', async ({ page }) => {
        await page.goto(`${BASE_URL}/billing`);

        const enterpriseCard = page.locator('div:has-text("ENTERPRISE")').first();
        await expect(enterpriseCard.locator('text=Dedicated support')).toBeVisible();
        await expect(enterpriseCard.locator('text=Custom integrations')).toBeVisible();
    });
});
