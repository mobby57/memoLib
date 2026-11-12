import { test, expect } from '@playwright/test'
test('wizard shows pack preview', async ({ page }) => {
  await page.goto('/fr/dossiers/nouveau')
  await page.getByRole('radio', { name: /Titre de Séjour/i }).check()
  await expect(page.getByText('Pack juridique appliqué')).toBeVisible()
  await expect(page.getByText(/titres-sejour|Titre de Séjour/).first()).toBeVisible()
})
