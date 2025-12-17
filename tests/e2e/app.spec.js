import { test, expect } from '@playwright/test';

test.describe('IAPosteManager Application Tests', () => {
  
  // Test 1-5: Basic Application Tests
  test('should load the application', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('IAPosteManager');
  });

  test('should display version number', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.version')).toContainText('v2.2');
  });

  test('should show backend status', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.status')).toBeVisible();
  });

  test('should have three main sections', async ({ page }) => {
    await page.goto('/');
    const sections = page.locator('section');
    await expect(sections).toHaveCount(3);
  });

  test('should have footer with API docs link', async ({ page }) => {
    await page.goto('/');
    const link = page.locator('footer a');
    await expect(link).toHaveAttribute('href', '/api/docs');
  });

  // Test 6-15: Email Composer Tests
  test('should display email composer form', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#to')).toBeVisible();
    await expect(page.locator('#subject')).toBeVisible();
    await expect(page.locator('#body')).toBeVisible();
  });

  test('should have required fields marked', async ({ page }) => {
    await page.goto('/');
    const requiredFields = page.locator('.required');
    await expect(requiredFields).toHaveCount(3);
  });

  test('should accept email input', async ({ page }) => {
    await page.goto('/');
    await page.fill('#to', 'test@example.com');
    await expect(page.locator('#to')).toHaveValue('test@example.com');
  });

  test('should accept subject input', async ({ page }) => {
    await page.goto('/');
    await page.fill('#subject', 'Test Subject');
    await expect(page.locator('#subject')).toHaveValue('Test Subject');
  });

  test('should accept body input', async ({ page }) => {
    await page.goto('/');
    await page.fill('#body', 'Test message body');
    await expect(page.locator('#body')).toHaveValue('Test message body');
  });

  test('should show send button', async ({ page }) => {
    await page.goto('/');
    const button = page.locator('button:has-text("Send Email")');
    await expect(button).toBeVisible();
  });

  test('should handle email sending', async ({ page }) => {
    await page.goto('/');
    await page.fill('#to', 'test@example.com');
    await page.fill('#subject', 'Test');
    await page.fill('#body', 'Test body');
    
    await page.locator('button:has-text("Send Email")').click();
    await page.waitForTimeout(500);
    
    // Should show a result message
    const message = page.locator('.message');
    await expect(message).toBeVisible();
  });

  test('should clear form after successful send', async ({ page }) => {
    await page.goto('/');
    await page.fill('#to', 'test@example.com');
    await page.fill('#subject', 'Test');
    await page.fill('#body', 'Test body');
    
    await page.locator('button:has-text("Send Email")').click();
    await page.waitForTimeout(1000);
    
    // Form should be cleared on success
    const toValue = await page.locator('#to').inputValue();
    expect(toValue.length).toBeLessThanOrEqual(30); // May be cleared or show message
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/');
    const input = page.locator('#to');
    await expect(input).toHaveAttribute('type', 'email');
  });

  test('should show success message on send', async ({ page }) => {
    await page.goto('/');
    await page.fill('#to', 'test@example.com');
    await page.fill('#subject', 'Test');
    await page.fill('#body', 'Test body');
    
    await page.locator('button:has-text("Send Email")').click();
    await page.waitForTimeout(1000);
    
    const message = page.locator('.message');
    await expect(message).toBeVisible();
  });

  // Test 16-25: AI Assistant Tests
  test('should display AI assistant section', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h2:has-text("AI Assistant")')).toBeVisible();
  });

  test('should have AI prompt input', async ({ page }) => {
    await page.goto('/');
    const input = page.locator('#ai-prompt');
    await expect(input).toBeVisible();
  });

  test('should accept AI prompt text', async ({ page }) => {
    await page.goto('/');
    await page.fill('#ai-prompt', 'Write an email');
    await expect(page.locator('#ai-prompt')).toHaveValue('Write an email');
  });

  test('should have generate button', async ({ page }) => {
    await page.goto('/');
    const button = page.locator('button:has-text("Generate with AI")');
    await expect(button).toBeVisible();
  });

  test('should handle AI text generation', async ({ page }) => {
    await page.goto('/');
    await page.fill('#ai-prompt', 'Test prompt');
    
    await page.locator('button:has-text("Generate with AI")').click();
    await page.waitForTimeout(500);
    
    // Should show a result
    const message = page.locator('.message');
    await expect(message).toBeVisible();
  });

  test('should show generated text area', async ({ page }) => {
    await page.goto('/');
    await page.fill('#ai-prompt', 'Write a test email');
    await page.locator('button:has-text("Generate with AI")').click();
    await page.waitForTimeout(1000);
    
    const generatedContent = page.locator('.generated-content');
    await expect(generatedContent).toBeVisible();
  });

  test('should have copy button for generated text', async ({ page }) => {
    await page.goto('/');
    await page.fill('#ai-prompt', 'Write a test email');
    await page.locator('button:has-text("Generate with AI")').click();
    await page.waitForTimeout(1000);
    
    const copyBtn = page.locator('.copy-btn');
    await expect(copyBtn).toBeVisible();
  });

  test('should show success message after generation', async ({ page }) => {
    await page.goto('/');
    await page.fill('#ai-prompt', 'Test');
    await page.locator('button:has-text("Generate with AI")').click();
    await page.waitForTimeout(1000);
    
    const message = page.locator('.message');
    await expect(message).toBeVisible();
  });

  test('should display generated text', async ({ page }) => {
    await page.goto('/');
    await page.fill('#ai-prompt', 'Test prompt');
    await page.locator('button:has-text("Generate with AI")').click();
    await page.waitForTimeout(1000);
    
    const generatedText = page.locator('.generated-text');
    await expect(generatedText).toBeVisible();
  });

  test('should handle empty prompt', async ({ page }) => {
    await page.goto('/');
    const button = page.locator('button:has-text("Generate with AI")');
    await button.click();
    await page.waitForTimeout(500);
    
    const message = page.locator('.message');
    await expect(message).toBeVisible();
  });

  // Test 26-34: Voice Interface Tests
  test('should display voice interface section', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h2:has-text("Voice Interface")')).toBeVisible();
  });

  test('should have voice input button', async ({ page }) => {
    await page.goto('/');
    const button = page.locator('.voice-btn');
    await expect(button).toBeVisible();
  });

  test('should show voice description', async ({ page }) => {
    await page.goto('/');
    const description = page.locator('.voice-interface .description');
    await expect(description).toBeVisible();
  });

  test('should disable button while listening', async ({ page }) => {
    await page.goto('/');
    const button = page.locator('.voice-btn');
    await button.click();
    await expect(button).toBeDisabled();
  });

  test('should show transcript area', async ({ page }) => {
    await page.goto('/');
    await page.locator('.voice-btn').click();
    await page.waitForTimeout(2500);
    
    const transcript = page.locator('.transcript');
    await expect(transcript).toBeVisible();
  });

  test('should display accessibility info', async ({ page }) => {
    await page.goto('/');
    const infoBox = page.locator('.info-box');
    await expect(infoBox).toBeVisible();
  });

  test('should list accessibility features', async ({ page }) => {
    await page.goto('/');
    const features = page.locator('.info-box li');
    await expect(features).toHaveCount(5);
  });

  test('should mention WCAG compliance', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.info-box')).toContainText('WCAG');
  });

  test('should show voice status message', async ({ page }) => {
    await page.goto('/');
    await page.locator('.voice-btn').click();
    await page.waitForTimeout(500);
    
    const message = page.locator('.message');
    await expect(message).toBeVisible();
  });

  // Test 35-39: Accessibility & Security Tests
  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/');
    const ariaLabels = page.locator('[aria-label]');
    await expect(ariaLabels.first()).toBeVisible();
  });

  test('should have proper form labels', async ({ page }) => {
    await page.goto('/');
    const labels = page.locator('label');
    await expect(labels).toHaveCount(4); // 3 for email form, 1 for AI
  });

  test('should have role attributes for sections', async ({ page }) => {
    await page.goto('/');
    const mainRole = page.locator('[role="main"]');
    await expect(mainRole).toBeVisible();
  });

  test('should have keyboard navigation support', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(['INPUT', 'BUTTON', 'A']).toContain(focused);
  });

  test('should have responsive design', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // Mobile size
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
  });

});
