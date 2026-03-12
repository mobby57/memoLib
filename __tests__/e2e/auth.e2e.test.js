// Tests E2E - Flux Authentification
const API_URL = process.env.API_URL || 'http://localhost:5078';
const describeE2E = process.env.RUN_E2E === '1' ? describe : describe.skip;

describeE2E('E2E - Authentification', () => {
    let testUser = {
        email: `test-${Date.now()}@example.com`,
        password: 'Test123!@#',
        name: 'Test User'
    };
    let authToken = null;

    test('Inscription nouveau compte', async () => {
        const response = await fetch(`${API_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testUser)
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.token).toBeDefined();
    });

    test('Connexion avec identifiants valides', async () => {
        const response = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: testUser.email,
                password: testUser.password
            })
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        authToken = data.token;
        expect(authToken).toBeDefined();
    });

    test('Accès ressource protégée avec token', async () => {
        const response = await fetch(`${API_URL}/api/cases`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        expect(response.status).toBe(200);
    });

    test('Rejet sans token', async () => {
        const response = await fetch(`${API_URL}/api/cases`);
        expect(response.status).toBe(401);
    });
});
