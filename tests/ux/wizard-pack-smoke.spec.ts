import { test, expect } from '@playwright/test'

test('wizard shows pack preview', async ({ page }) => {
  await page.goto('/fr/dossiers/nouveau')

  // Cible le label qui encapsule l'input radio TITRE_SEJOUR
  await page.locator('label:has(input[value="TITRE_SEJOUR"])').click()

  await expect(page.getByText('Pack juridique appliqué')).toBeVisible()
  await expect(page.getByText(/Titre de Séjour/).first()).toBeVisible()
})
