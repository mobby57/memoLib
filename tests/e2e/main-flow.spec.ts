import { test, expect } from '@playwright/test';

/**
 * E2E — Smoke du flow principal MemoLib (post-migration Clerk).
 *
 * CE QUI EST TESTÉ ICI (sans secrets ni seed) :
 *   - l'application démarre et sert ses pages publiques ;
 *   - la page de connexion rend bien le composant Clerk (<SignIn>) ;
 *   - les endpoints protégés refusent correctement l'accès non authentifié (401/403).
 *
 * CE QUI N'EST PLUS TESTÉ ICI (déplacé, voir main-flow.authenticated.spec.ts) :
 *   - le flow authentifié complet (login → dashboard → IA → dossier → document).
 *     Il exige une vraie session Clerk (@clerk/testing + CLERK_SECRET_KEY), une
 *     base seedée (admin@memolib.local) et une IA (Ollama/mock). À exécuter en CI
 *     dédiée avec secrets — d'où le `test.skip` documenté dans ce fichier voisin.
 *
 * Contexte : l'ancien spec se connectait via /auth/login + input[name=email]
 * (formulaire NextAuth). La page rend désormais le composant Clerk <SignIn>, donc
 * ces sélecteurs n'existaient plus. Ce smoke rétablit un signal HONNÊTE : « le
 * build tourne et sert ses pages », sans faux PASS sur un flow auth indisponible.
 */

test.describe('MemoLib — smoke (app up + pages publiques + garde auth)', () => {
  test('la landing/homepage répond (app démarrée)', async ({ page }) => {
    const response = await page.goto('/');
    // L'app répond (pas de 5xx). Redirection vers une locale acceptée.
    expect(response, 'réponse HTTP reçue').not.toBeNull();
    expect(response!.status(), 'status < 500').toBeLessThan(500);
    // Un contenu rendu (title non vide).
    await expect(page).toHaveTitle(/.+/, { timeout: 15000 });
  });

  test('la page de connexion rend le composant Clerk', async ({ page }) => {
    await page.goto('/fr/sign-in');
    // Clerk monte un formulaire de connexion : champ identifiant OU widget Clerk.
    const clerkSignal = page.locator(
      'input[name="identifier"], .cl-rootBox, [data-clerk-loaded], form'
    );
    await expect(clerkSignal.first()).toBeVisible({ timeout: 15000 });
  });

  test('un endpoint protégé refuse l’accès non authentifié (résumé IA)', async ({ request }) => {
    const res = await request.post('/api/ai/summarize-email', {
      data: { subject: 'Test', body: 'Contenu de test suffisant.', from: 'a@b.co' },
    });
    // Sans session Clerk : la route doit refuser (401) ou gater (403),
    // jamais renvoyer un 200 authentifié.
    expect([401, 403]).toContain(res.status());
  });

  test('un endpoint protégé refuse l’accès non authentifié (création dossier)', async ({ request }) => {
    const res = await request.post('/api/emails/create-dossier', {
      data: { emailId: null, summary: { client: 'X', objet: 'Y', typeDossier: 'TITRE_SEJOUR' } },
    });
    expect([401, 403]).toContain(res.status());
  });
});
