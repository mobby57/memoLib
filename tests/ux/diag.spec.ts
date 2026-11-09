import { test, expect } from '@playwright/test';

test('DIAG - état réel du <html> après hydratation', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('/fr');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // 1) Combien de <html> dans la page ?
  const htmlCount = await page.locator('html').count();
  console.log('HTML count:', htmlCount);

  // 2) Attributs du premier <html>
  const htmlAttrs = await page.evaluate(() => {
    const h = document.documentElement;
    return {
      lang: h.lang,
      outerHTMLStart: h.outerHTML.substring(0, 200),
    };
  });
  console.log('HTML attrs:', JSON.stringify(htmlAttrs, null, 2));

  // 3) Titre du document
  const title = await page.title();
  console.log('document.title:', JSON.stringify(title));

  // 4) Combien d'iframes ?
  const iframeCount = await page.locator('iframe').count();
  console.log('iframes:', iframeCount);

  // 5) Le <html> du main frame est-il accessible via documentElement ?
  const fromEvaluate = await page.evaluate(() => ({
    docLang: document.documentElement.getAttribute('lang'),
    docTitle: document.querySelector('title')?.textContent,
  }));
  console.log('From evaluate:', JSON.stringify(fromEvaluate));
});
