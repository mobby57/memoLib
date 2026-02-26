// Bouton de démo automatique intégré
(function() {
    'use strict';

    const API_BASE = (() => {
        const origin = window.location.origin;
        if (origin && origin.startsWith('http')) return origin;
        return 'http://localhost:5078';
    })();

    function getAuthToken() {
        return window.token
            || localStorage.getItem('authToken')
            || localStorage.getItem('memolibAuthToken')
            || null;
    }

    function openTab(tabName) {
        if (typeof window.showTab === 'function') {
            window.showTab(tabName);
        }
    }
    
    function createDemoButton() {
        const demoBtn = document.createElement('button');
        demoBtn.id = 'auto-demo-btn';
        demoBtn.innerHTML = '🎬 DÉMO AUTO';
        demoBtn.className = 'btn';
        demoBtn.style.cssText = 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); position: fixed; top: 10px; right: 10px; z-index: 10000; font-size: 18px; padding: 15px 30px; color: white; border: none; border-radius: 8px; cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.3);';
        demoBtn.onclick = runAutoDemo;
        document.body.appendChild(demoBtn);
        console.log('Bouton démo créé');
    }

    async function runAutoDemo() {
        console.log('Démo lancée');
        const progressDiv = document.getElementById('demo-progress');
        
        const steps = [
            { name: '🔐 Connexion', action: async () => {
                openTab('auth');
                await wait(500);
                document.getElementById('login-email').value = 'sarraboudjellal57@gmail.com';
                document.getElementById('login-password').value = 'SecurePass123!';
                await wait(500);
                
                // Vérifier si déjà connecté
                if (getAuthToken()) {
                    console.log('Déjà connecté');
                    return;
                }
                
                // Connexion manuelle
                const loginRes = await fetch(`${API_BASE}/api/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: 'sarraboudjellal57@gmail.com',
                        password: 'SecurePass123!'
                    })
                });
                
                if (!loginRes.ok) {
                    throw new Error('Connexion échouée');
                }
                
                const loginData = await loginRes.json();
                window.token = loginData.token;
                localStorage.setItem('authToken', loginData.token);
                localStorage.setItem('memolibAuthToken', loginData.token);
                if (typeof window.persistSession === 'function') {
                    window.persistSession('sarraboudjellal57@gmail.com', loginData.token);
                }
                updateCurrentUserDisplay('sarraboudjellal57@gmail.com');
                
                // Initialiser les services avancés
                if (typeof RealtimeDashboard !== 'undefined') {
                    window.realtimeDashboard = new RealtimeDashboard(API_BASE, getAuthToken());
                }
                if (typeof TemplateManager !== 'undefined') {
                    window.templateManager = new TemplateManager(API_BASE, getAuthToken());
                }
            }},
            { name: '📧 Ingestion emails', action: async () => {
                const authToken = getAuthToken();
                if (!authToken) {
                    throw new Error('Non connecté');
                }
                
                openTab('ingest');
                await wait(1000);
                const emails = [
                    { from: 'client.divorce@example.com', subject: 'Demande divorce urgent', body: 'Je souhaite entamer une procédure de divorce. Situation urgente.', ext: 'DEMO-DIV-001' },
                    { from: 'client.travail@example.com', subject: 'Licenciement abusif', body: 'Mon employeur m\'a licencié sans motif valable.', ext: 'DEMO-TRA-001' },
                    { from: 'client.immobilier@example.com', subject: 'Litige propriétaire', body: 'Conflit avec mon propriétaire sur les charges.', ext: 'DEMO-IMM-001' }
                ];
                for (const e of emails) {
                    const ingestRes = await fetch(`${API_BASE}/api/ingest/email`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${authToken}`
                        },
                        body: JSON.stringify({
                            from: e.from,
                            subject: e.subject,
                            body: e.body,
                            externalId: e.ext,
                            occurredAt: new Date().toISOString()
                        })
                    });
                    
                    if (ingestRes.ok) {
                        console.log(`Email ingéré: ${e.subject}`);
                    }
                    await wait(1500);
                }
            }},
            { name: '📊 Dashboard', action: async () => { 
                if (typeof window.showAdvancedDashboard === 'function') {
                    window.showAdvancedDashboard();
                }
                await wait(3000);
            }},
            { name: '🔍 Recherche', action: async () => {
                const authToken = getAuthToken();
                if (!authToken) return;
                openTab('search'); 
                await wait(500);
                document.getElementById('search-text').value = 'divorce urgent';
                
                const searchRes = await fetch(`${API_BASE}/api/search/events`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify({ text: 'divorce urgent' })
                });
                
                if (searchRes.ok) {
                    const results = await searchRes.json();
                    console.log(`${results.length} résultats trouvés`);
                }
            }},
            { name: '📁 Dossiers', action: async () => {
                const authToken = getAuthToken();
                if (!authToken) return;
                openTab('cases'); 
                await wait(500);
                
                const casesRes = await fetch(`${API_BASE}/api/cases`, {
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });
                
                if (casesRes.ok) {
                    const cases = await casesRes.json();
                    console.log(`${cases.length} dossiers`);
                }
            }},
            { name: '👥 Clients', action: async () => {
                const authToken = getAuthToken();
                if (!authToken) return;
                openTab('client'); 
                await wait(500);
                
                const clientsRes = await fetch(`${API_BASE}/api/client`, {
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });
                
                if (clientsRes.ok) {
                    const clients = await clientsRes.json();
                    console.log(`${clients.length} clients`);
                }
            }},
            { name: '📊 Stats', action: async () => { 
                openTab('stats'); 
                await wait(500);
                if (typeof window.loadStats === 'function') {
                    await window.loadStats();
                }
            }}
        ];

        const renderProgress = (currentIndex, status, detail = '') => {
            const items = steps.map((s, idx) => {
                const n = idx + 1;
                if (idx < currentIndex) return `<li style="color:#1f8f3a;">✅ ${n}. ${s.name}</li>`;
                if (idx === currentIndex) return `<li style="color:#d97706;">⏳ ${n}. ${s.name}${detail ? ` — ${detail}` : ''}</li>`;
                return `<li style="color:#666;">• ${n}. ${s.name}</li>`;
            }).join('');

            const percent = Math.round((Math.max(currentIndex, 0) / steps.length) * 100);
            progressDiv.innerHTML = `
                <div style="padding:10px; border-radius:6px; background:${status === 'error' ? '#f8d7da' : '#f4f6ff'};">
                    <div style="font-weight:600; margin-bottom:8px;">🎬 Démo auto en cours (${percent}%)</div>
                    <ul style="margin:0; padding-left:18px; line-height:1.5;">${items}</ul>
                </div>
            `;
        };

        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            renderProgress(i, 'running', 'exécution');
            try {
                await step.action();
                renderProgress(i + 1, 'running', 'terminée');
                await wait(1000);
            } catch (err) {
                console.error(`Erreur ${step.name}:`, err);
                renderProgress(i, 'error', `erreur: ${err.message || 'inconnue'}`);
                await wait(2000);
            }
        }
        
        progressDiv.innerHTML = '<div style="padding: 10px; background: #d4edda; border-radius: 5px; font-weight: bold;">🎉 Démo terminée!</div>';
        await wait(3000);
        progressDiv.innerHTML = '';
    }

    function wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Créer le panneau de progression
    const demoResult = document.createElement('div');
    demoResult.id = 'demo-progress';
    demoResult.style.cssText = 'position: fixed; top: 70px; right: 10px; z-index: 9999; background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.2); max-width: 300px; min-width: 250px;';
    document.body.appendChild(demoResult);

    // Initialiser au chargement
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createDemoButton);
    } else {
        createDemoButton();
    }
})();