// Tests E2E - CRUD Dossiers
const API_URL = process.env.API_URL || 'http://localhost:5078';
const describeE2E = process.env.RUN_E2E === '1' ? describe : describe.skip;

describeE2E('E2E - Dossiers', () => {
    let authToken = null;
    let caseId = null;

    beforeAll(async () => {
        const response = await fetch(`${API_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: `case-test-${Date.now()}@example.com`,
                password: 'Test123!@#',
                name: 'Case Test'
            })
        });
        const data = await response.json();
        authToken = data.token;
    });

    test('Créer dossier', async () => {
        const response = await fetch(`${API_URL}/api/cases`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                title: 'Test Case',
                description: 'Test Description'
            })
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        caseId = data.id;
        expect(caseId).toBeDefined();
    });

    test('Lire dossier', async () => {
        const response = await fetch(`${API_URL}/api/cases/${caseId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.title).toBe('Test Case');
    });

    test('Mettre à jour statut', async () => {
        const response = await fetch(`${API_URL}/api/cases/${caseId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ status: 'IN_PROGRESS' })
        });

        expect(response.status).toBe(200);
    });
});
