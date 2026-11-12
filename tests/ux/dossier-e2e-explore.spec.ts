import { test } from '@playwright/test'
import fs from 'fs'
import path from 'path'

const ART = 'test-results/wizard-explore'
fs.mkdirSync(ART, { recursive: true })

test('explore wizard', async ({ page }) => {
  test.setTimeout(180_000)
  page.setDefaultTimeout(8_000)

  page.on('pageerror', e => console.log(`[PAGEERROR] ${e.message}`))
  page.on('console', m => { if (m.type() === 'error') console.log(`[CONSOLE.error] ${m.text()}`) })

  await page.goto('/fr/dossiers/nouveau', { waitUntil: 'domcontentloaded', timeout: 20_000 })
  await page.waitForTimeout(2000)
  await page.addStyleTag({ content: `.fixed.bottom-0, .fixed.top-0 { display: none !important; }` })

  // Étape 1
  await page.locator('label:has(input[value="TITRE_SEJOUR"])').click()
  await page.locator('textarea[name="objetDemande"]').fill(
    'Première demande de titre de séjour salarié, contrat CDI signé le 01/09/2026.'
  )
  await page.locator('label:has(input[value="NORMALE"])').click()

  let prevTitle = ''
  for (let step = 2; step <= 8; step++) {
    const title = (await page.locator('h2').first().textContent({ timeout: 3000 }).catch(() => '(aucun)'))?.trim() || '(aucun)'
    console.log(`\n── ÉTAPE ${step} — "${title}"`)

    if (step > 2 && title === prevTitle) {
      console.log(`   ⛔ BLOQUÉ (même titre)`)
      // Diag : cherche erreurs Zod rendues
      const errs = await page.locator('.text-red-500.text-xs, p.text-red-500, p.text-red-600').allTextContents()
      console.log(`   Erreurs visibles: ${errs.filter(e => e && e.length > 3).join(' | ') || '(aucune)'}`)
      await page.screenshot({ path: `${ART}/0${step}-blocked.png`, fullPage: true })
      break
    }
    prevTitle = title
    await page.screenshot({ path: `${ART}/0${step}-before.png`, fullPage: true })

    // Remplissage texte/select/date
    const inputs = page.locator('input:not([type="hidden"]):visible, select:visible, textarea:visible')
    const n = await inputs.count()
    for (let j = 0; j < n; j++) {
      const el = inputs.nth(j)
      const type = await el.evaluate(e => (e as HTMLInputElement).type)
      const name = await el.evaluate(e => (e as HTMLInputElement).name)
      if (['radio', 'checkbox', 'password'].includes(type)) continue
      const v = await el.inputValue().catch(() => '')
      if (v?.trim()) continue
      try {
        const tag = await el.evaluate(e => e.tagName)
        const lname = name.toLowerCase()
        if (tag === 'SELECT') { if (await el.locator('option').count() > 1) await el.selectOption({ index: 1 }) }
        else if (type === 'email' || lname.includes('email')) await el.fill('test@example.com')
        else if (lname.includes('téléphone') || lname.includes('telephone') || type === 'tel') await el.fill('0612345678')
        else if (lname.includes('codepostal')) await el.fill('75001')
        else if (lname.includes('montantloyer')) await el.fill('800')
        else if (lname.includes('date') || type === 'date') await el.fill('1990-05-15')
        else if (type === 'number') await el.fill('1')
        else if (lname === 'nom' || lname === 'nomnaissance') await el.fill('Dupont')
        else if (lname === 'prenom') await el.fill('Jean')
        else if (lname.includes('ville')) await el.fill('Paris')
        else if (lname.includes('pays') || lname.includes('nationalite')) await el.fill('France')
        else if (lname.includes('lieu')) await el.fill('Paris')
        else if (lname.includes('adresse')) await el.fill('12 rue de la Paix')
        else await el.fill('Valeur test suffisamment longue')
      } catch {}
    }

    // Radios / checkboxes
    const groups = new Set<string>()
    const rc = page.locator('input[type="radio"]:visible, input[type="checkbox"]:visible')
    const rcN = await rc.count()
    for (let j = 0; j < rcN; j++) {
      const el = rc.nth(j)
      const name = await el.getAttribute('name').catch(() => null)
      if (!name || groups.has(name)) continue
      groups.add(name)
      if (await page.locator(`input[name="${name}"]:checked`).count() === 0)
        await el.evaluate((e: HTMLInputElement) => e.click()).catch(() => {})
    }

    const next = page.getByRole('button', { name: /^Suivant$|^Valider$|^Créer$|^Enregistrer$|^Terminer$/ }).last()
    if (!(await next.isVisible().catch(() => false))) { console.log(`   ⛔ pas de bouton`); break }
    console.log(`   → Suivant`)
    try { await next.click({ timeout: 8000 }) }
    catch { await next.click({ force: true, timeout: 8000 }) }
    await page.waitForTimeout(1200)

    if (!page.url().endsWith('/nouveau')) {
      console.log(`\n🎉 Redirection: ${page.url()}`)
      await page.screenshot({ path: `${ART}/99-success.png`, fullPage: true })
      break
    }
  }
  console.log(`\nURL FINALE: ${page.url()}`)
})
