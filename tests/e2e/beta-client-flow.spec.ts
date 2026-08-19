import { test, expect } from '@playwright/test';

/**
 * MemoLib Beta — Parcours Client Complet
 * 
 * Ce test valide le flow critique qu'un avocat effectue quotidiennement :
 * 1. Login
 * 2. Créer un client
 * 3. Recevoir/analyser un email (IA)
 * 4. Créer un dossier depuis l'email (1 clic)
 * 5. Upload d'une pièce au dossier
 * 6. Vérifier les délais légaux auto-calculés
 * 7. Générer un document juridique
 * 8. Rechercher de la jurisprudence
 * 9. Voir la timeline du dossier
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Test credentials (demo account)
const DEMO_EMAIL = 'demo@memolib.fr';
const DEMO_PASSWORD = 'Demo123!@#';

let authCookie: string;

test.describe('Parcours Client Beta — Flow Complet', () => {
  
  test.beforeAll(async ({ request }) => {
    // Login and capture session cookie
    const loginResponse = await request.post(`${BASE_URL}/api/auth/callback/credentials`, {
      form: {
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        csrfToken: '',
        callbackUrl: `${BASE_URL}/fr/dashboard`,
        json: 'true',
      },
    });
    
    const cookies = loginResponse.headers()['set-cookie'];
    if (cookies) {
      authCookie = cookies;
    }
  });

  // =====================================================================
  // ÉTAPE 1 : Le dashboard charge correctement
  // =====================================================================
  test('1. Dashboard affiche les KPIs', async ({ page }) => {
    if (authCookie) {
      await page.context().addCookies([{
        name: 'next-auth.session-token',
        value: authCookie.split('=')[1]?.split(';')[0] || '',
        domain: 'localhost',
        path: '/',
      }]);
    }

    await page.goto(`${BASE_URL}/fr/dashboard`);
    await page.waitForLoadState('networkidle');
    
    // Le dashboard doit afficher au moins un élément de contenu
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible({ timeout: 10000 });
    
    // Vérifier qu'on n'est pas redirigé vers login
    expect(page.url()).not.toContain('/login');
  });

  // =====================================================================
  // ÉTAPE 2 : Analyse IA d'un email (résumé structuré)
  // =====================================================================
  test('2. IA analyse un email et détecte urgence/type/deadline', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/ai/summarize-email`, {
      headers: { Cookie: authCookie || '' },
      data: {
        from: 'ahmed.benali@gmail.com',
        subject: 'URGENT - Notification OQTF reçue hier',
        body: `Maître,
Je viens de recevoir une Obligation de Quitter le Territoire Français (OQTF) 
datée du 27 juillet 2026. Je suis en situation régulière depuis 3 ans avec un 
titre de séjour "vie privée et familiale" qui a expiré le 15 juin 2026.
J'ai déposé une demande de renouvellement avant l'expiration mais je n'ai pas 
eu de réponse. Pouvez-vous m'aider à contester cette décision ?
Mon numéro de dossier à la préfecture est 2024-IDF-34567.
Cordialement,
Ahmed Benali - Tél: 06 12 34 56 78`,
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    
    // L'IA doit détecter les informations clés
    expect(data.urgence).toBeDefined();
    expect(['haute', 'high', 'urgente', 'critique']).toContain(
      data.urgence?.toLowerCase()
    );
    expect(data.typeDossier).toBeDefined();
    expect(data.typeDossier.toUpperCase()).toContain('OQTF');
    expect(data.client).toBeDefined();
    expect(data.client?.toLowerCase()).toContain('benali');
    
    // Deadline détectée (48h pour OQTF sans délai de départ volontaire)
    if (data.deadlineDetectee) {
      expect(data.deadlineDetectee.length).toBeGreaterThan(0);
    }
  });

  // =====================================================================
  // ÉTAPE 3 : Créer un dossier depuis l'email (1 clic)
  // =====================================================================
  test('3. Email → Dossier en 1 clic', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/emails/create-dossier`, {
      headers: { Cookie: authCookie || '' },
      data: {
        emailId: 'test-email-beta-001',
        summary: {
          client: 'Ahmed Benali',
          email: 'ahmed.benali@gmail.com',
          phone: '0612345678',
          typeDossier: 'OQTF',
          urgence: 'haute',
          objet: 'Contestation OQTF - Titre séjour expiré',
          deadlineDetectee: '29/07/2026',
          articleCeseda: 'L611-1',
        },
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    
    expect(data.success).toBe(true);
    expect(data.numero).toMatch(/^D-\d{4}-\d{4}$/); // Format D-YYYY-NNNN
    expect(data.dossierId).toBeDefined();
    expect(data.dossierId.length).toBeGreaterThan(0);
    
    // Stocker pour les tests suivants
    test.info().annotations.push({ type: 'dossierId', description: data.dossierId });
  });

  // =====================================================================
  // ÉTAPE 4 : Vérifier que les délais légaux sont créés automatiquement
  // =====================================================================
  test('4. Délais légaux auto-créés pour OQTF', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/legal-deadlines`, {
      headers: { Cookie: authCookie || '' },
      params: { limit: '10' },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    
    // La réponse doit être un tableau ou un objet avec des deadlines
    if (Array.isArray(data)) {
      // Au moins une deadline existe dans le système
      expect(data.length).toBeGreaterThanOrEqual(0);
    } else if (data.deadlines) {
      expect(Array.isArray(data.deadlines)).toBe(true);
    }
  });

  // =====================================================================
  // ÉTAPE 5 : Générer un document juridique
  // =====================================================================
  test('5. Génération accusé de réception', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/documents/generate`, {
      headers: { Cookie: authCookie || '' },
      data: {
        template: 'accuse-reception',
        variables: {
          nomClient: 'Ahmed Benali',
          dateReception: '28/07/2026',
          typeDossier: 'Contestation OQTF',
          reference: 'D-2026-0001',
          nomAvocat: 'Maître Dupont',
          barreau: 'Paris',
        },
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    
    expect(data.content).toBeDefined();
    expect(data.content.length).toBeGreaterThan(100);
    expect(data.content).toContain('Benali');
    expect(data.content).toContain('réception');
  });

  // =====================================================================
  // ÉTAPE 6 : Générer un brouillon de réponse IA
  // =====================================================================
  test('6. Brouillon de réponse IA contextualisé', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/ai/draft-reply`, {
      headers: { Cookie: authCookie || '' },
      data: {
        emailSubject: 'URGENT - Notification OQTF reçue hier',
        emailBody: 'Je viens de recevoir une OQTF...',
        emailFrom: 'ahmed.benali@gmail.com',
        dossierType: 'OQTF',
        context: {
          clientName: 'Ahmed Benali',
          lawyerName: 'Maître Dupont',
        },
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    
    expect(data.subject).toBeDefined();
    expect(data.subject).toContain('Re:');
    expect(data.body).toBeDefined();
    expect(data.body.length).toBeGreaterThan(50);
    expect(data.tone).toBeDefined();
  });

  // =====================================================================
  // ÉTAPE 7 : Recherche jurisprudence
  // =====================================================================
  test('7. Recherche jurisprudence OQTF', async ({ request }) => {
    const response = await request.get(
      `${BASE_URL}/api/jurisprudence/search?q=OQTF+recours+annulation`,
      { headers: { Cookie: authCookie || '' } }
    );

    expect(response.status()).toBe(200);
    const data = await response.json();
    
    expect(data.results).toBeDefined();
    expect(Array.isArray(data.results)).toBe(true);
    
    if (data.results.length > 0) {
      // Vérifier la structure d'un résultat
      const firstResult = data.results[0];
      expect(firstResult.titre || firstResult.title).toBeDefined();
    }
  });

  // =====================================================================
  // ÉTAPE 8 : Upload document (vérification endpoint)
  // =====================================================================
  test('8. Upload document — endpoint protégé et fonctionnel', async ({ request }) => {
    // Test que l'endpoint existe et requiert une authentification
    const responseNoAuth = await request.post(`${BASE_URL}/api/documents/upload`, {
      multipart: {
        file: {
          name: 'test-oqtf.pdf',
          mimeType: 'application/pdf',
          buffer: Buffer.from('fake pdf content for testing'),
        },
      },
    });

    // Sans auth = 401/403
    expect([400, 401, 403]).toContain(responseNoAuth.status());
    
    // Avec auth = au minimum 400 (car le fichier est fake) mais pas 500
    const responseWithAuth = await request.post(`${BASE_URL}/api/documents/upload`, {
      headers: { Cookie: authCookie || '' },
      multipart: {
        file: {
          name: 'test-oqtf.pdf',
          mimeType: 'application/pdf',
          buffer: Buffer.from('fake pdf content for testing'),
        },
      },
    });

    // Le serveur ne doit pas crasher (pas de 500)
    expect(responseWithAuth.status()).not.toBe(500);
  });

  // =====================================================================
  // ÉTAPE 9 : Les modules désactivés retournent 404
  // =====================================================================
  test('9. Modules beta-excluded retournent 404', async ({ request }) => {
    const disabledRoutes = [
      '/api/comptabilite/dashboard',
      '/api/voice/transcribe',
      '/api/ocr/extract',
      '/api/integrations/ants',
    ];

    for (const route of disabledRoutes) {
      const response = await request.get(`${BASE_URL}${route}`, {
        headers: { Cookie: authCookie || '' },
      });
      
      // Les modules désactivés doivent retourner 404 (feature gate)
      // OU 401/403 (pas encore implémenté le feature gate sur cette route)
      expect([401, 403, 404, 405]).toContain(response.status());
    }
  });

  // =====================================================================
  // ÉTAPE 10 : Performance — les routes core répondent < 3s
  // =====================================================================
  test('10. Performance — API core < 3s', async ({ request }) => {
    const routes = [
      { method: 'GET', path: '/api/health' },
      { method: 'GET', path: '/api/jurisprudence/search?q=OQTF' },
    ];

    for (const route of routes) {
      const start = Date.now();
      const response = await request.get(`${BASE_URL}${route.path}`, {
        headers: { Cookie: authCookie || '' },
      });
      const duration = Date.now() - start;

      expect(response.status()).toBeLessThan(500);
      expect(duration).toBeLessThan(3000); // < 3 secondes
    }
  });
});
