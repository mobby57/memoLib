// Démo automatique améliorée avec scénarios réalistes
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
        demoBtn.innerHTML = '🎬 DÉMO CABINET';
        demoBtn.className = 'btn';
        demoBtn.style.cssText = 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); position: fixed; top: 10px; right: 10px; z-index: 10000; font-size: 18px; padding: 15px 30px; color: white; border: none; border-radius: 8px; cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.3);';
        demoBtn.onclick = () => showDemoMenu();
        document.body.appendChild(demoBtn);
        console.log('Bouton démo créé');
    }

    function showDemoMenu() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 700px;">
                <div class="modal-header">
                    <h2>🎬 Démonstrations Multi-Secteurs</h2>
                    <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                <div class="modal-body">
                    <div class="demo-categories">
                        <div class="demo-category">
                            <h3>⚖️ Secteur Juridique</h3>
                            <div class="demo-scenarios">
                                <div class="demo-card" onclick="runScenario('startup')">
                                    <h4>🚀 Cabinet Startup</h4>
                                    <p>Premier jour d'un nouveau cabinet</p>
                                    <div class="demo-stats">3 clients • 8 emails • 4 dossiers</div>
                                </div>
                                <div class="demo-card" onclick="runScenario('growth')">
                                    <h4>📈 Cabinet Établi</h4>
                                    <p>Gestion équipe et workflow avancé</p>
                                    <div class="demo-stats">15 clients • 25 emails • 12 dossiers</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="demo-category">
                            <h3>🏥 Secteur Médical</h3>
                            <div class="demo-scenarios">
                                <div class="demo-card" onclick="runScenario('clinic')">
                                    <h4>🏥 Clinique Privée</h4>
                                    <p>Gestion patients et rendez-vous</p>
                                    <div class="demo-stats">50 patients • 30 emails • 20 dossiers</div>
                                </div>
                                <div class="demo-card" onclick="runScenario('hospital')">
                                    <h4>🏥 Hôpital</h4>
                                    <p>Coordination services et urgences</p>
                                    <div class="demo-stats">200+ patients • 100+ emails</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="demo-category">
                            <h3>🏢 Secteur Corporate</h3>
                            <div class="demo-scenarios">
                                <div class="demo-card" onclick="runScenario('consulting')">
                                    <h4>💼 Cabinet Conseil</h4>
                                    <p>Gestion projets et clients</p>
                                    <div class="demo-stats">25 projets • 40 emails • 15 clients</div>
                                </div>
                                <div class="demo-card" onclick="runScenario('finance')">
                                    <h4>💰 Services Financiers</h4>
                                    <p>Compliance et gestion risques</p>
                                    <div class="demo-stats">100+ dossiers • Audit • Reporting</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="demo-category">
                            <h3>🎓 Secteur Éducation</h3>
                            <div class="demo-scenarios">
                                <div class="demo-card" onclick="runScenario('university')">
                                    <h4>🎓 Université</h4>
                                    <p>Administration et étudiants</p>
                                    <div class="demo-stats">500+ étudiants • 200+ emails</div>
                                </div>
                                <div class="demo-card" onclick="runScenario('school')">
                                    <h4>🏫 École Privée</h4>
                                    <p>Communication parents-école</p>
                                    <div class="demo-stats">300 élèves • 150 familles</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="demo-category">
                            <h3>🚨 Situations Spéciales</h3>
                            <div class="demo-scenarios">
                                <div class="demo-card" onclick="runScenario('crisis')">
                                    <h4>🚨 Gestion de Crise</h4>
                                    <p>Situation d'urgence multi-secteur</p>
                                    <div class="demo-stats">Alertes • Anomalies • Actions</div>
                                </div>
                                <div class="demo-card" onclick="runScenario('enterprise')">
                                    <h4>🏢 Enterprise</h4>
                                    <p>Fonctionnalités avancées</p>
                                    <div class="demo-stats">Analytics • IA • Compliance</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    async function runScenario(type) {
        document.querySelector('.modal-overlay')?.remove();
        
        const scenarios = {
            startup: {
                name: '🚀 Cabinet Startup',
                description: 'Découverte de MemoLib pour un nouveau cabinet',
                steps: [
                    { name: '🔐 Inscription Cabinet', action: () => demoRegistration() },
                    { name: '📧 Premiers Emails', action: () => demoFirstEmails() },
                    { name: '👥 Création Clients', action: () => demoClientCreation() },
                    { name: '📁 Organisation Dossiers', action: () => demoCaseOrganization() },
                    { name: '🔍 Recherche Intelligente', action: () => demoSmartSearch() },
                    { name: '📊 Premiers Insights', action: () => demoBasicStats() }
                ]
            },
            growth: {
                name: '📈 Cabinet en Croissance',
                description: 'Optimisation pour un cabinet établi',
                steps: [
                    { name: '🔐 Connexion Rapide', action: () => demoQuickLogin() },
                    { name: '⚖️ Gestion Équipe', action: () => demoTeamManagement() },
                    { name: '📧 Volume d\'Emails', action: () => demoHighVolumeEmails() },
                    { name: '🌟 Clients VIP', action: () => demoVipClients() },
                    { name: '📋 Workflow Avancé', action: () => demoAdvancedWorkflow() },
                    { name: '📊 Analytics Métier', action: () => demoBusinessAnalytics() },
                    { name: '🔔 Notifications', action: () => demoNotifications() }
                ]
            },
            enterprise: {
                name: '🏢 Grand Cabinet',
                description: 'Fonctionnalités enterprise pour grands cabinets',
                steps: [
                    { name: '🔐 SSO Enterprise', action: () => demoEnterpriseLogin() },
                    { name: '📊 Dashboard Exécutif', action: () => demoExecutiveDashboard() },
                    { name: '🤖 Automatisation IA', action: () => demoAIAutomation() },
                    { name: '📈 Analytics Avancés', action: () => demoAdvancedAnalytics() },
                    { name: '🔒 Compliance & Audit', action: () => demoCompliance() },
                    { name: '🌍 Multi-Juridictions', action: () => demoMultiJurisdiction() },
                    { name: '📤 Intégrations', action: () => demoIntegrations() }
                ]
            },
            crisis: {
                name: '🚨 Gestion de Crise',
                description: 'Réaction rapide aux situations urgentes',
                steps: [
                    { name: '🔐 Accès Urgence', action: () => demoEmergencyLogin() },
                    { name: '🚨 Alertes Critiques', action: () => demoCriticalAlerts() },
                    { name: '⚠️ Centre Anomalies', action: () => demoAnomalyCenter() },
                    { name: '🔍 Recherche Urgente', action: () => demoUrgentSearch() },
                    { name: '📞 Actions Immédiates', action: () => demoImmediateActions() }
                ]
            }
        };

        const scenario = scenarios[type];
        if (!scenario) return;

        await runDemoScenario(scenario);
    }

    async function runDemoScenario(scenario) {
        const progressDiv = document.getElementById('demo-progress');
        
        const renderProgress = (currentIndex, status, detail = '') => {
            const items = scenario.steps.map((s, idx) => {
                const n = idx + 1;
                if (idx < currentIndex) return `<li style="color:#1f8f3a;">✅ ${n}. ${s.name}</li>`;
                if (idx === currentIndex) return `<li style="color:#d97706;">⏳ ${n}. ${s.name}${detail ? ` — ${detail}` : ''}</li>`;
                return `<li style="color:#666;">• ${n}. ${s.name}</li>`;
            }).join('');

            const percent = Math.round((Math.max(currentIndex, 0) / scenario.steps.length) * 100);
            progressDiv.innerHTML = `
                <div style="padding:15px; border-radius:8px; background:${status === 'error' ? '#f8d7da' : '#f4f6ff'}; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                    <div style="font-weight:600; margin-bottom:12px; color:#667eea;">${scenario.name} (${percent}%)</div>
                    <div style="font-size:13px; color:#666; margin-bottom:10px;">${scenario.description}</div>
                    <ul style="margin:0; padding-left:18px; line-height:1.6;">${items}</ul>
                </div>
            `;
        };

        for (let i = 0; i < scenario.steps.length; i++) {
            const step = scenario.steps[i];
            renderProgress(i, 'running', 'en cours...');
            try {
                await step.action();
                renderProgress(i + 1, 'running', 'terminé');
                await wait(1500);
            } catch (err) {
                console.error(`Erreur ${step.name}:`, err);
                renderProgress(i, 'error', `erreur: ${err.message || 'inconnue'}`);
                await wait(2000);
            }
        }
        
        progressDiv.innerHTML = `
            <div style="padding: 15px; background: linear-gradient(135deg, #28a745, #20c997); color: white; border-radius: 8px; font-weight: bold; text-align: center; box-shadow: 0 4px 12px rgba(40,167,69,0.3);">
                🎉 ${scenario.name} terminé !<br>
                <small style="opacity:0.9;">Explorez maintenant l'interface librement</small>
            </div>
        `;
        await wait(4000);
        progressDiv.innerHTML = '';
    }

    // Actions de démonstration spécialisées
    async function demoRegistration() {
        openTab('auth');
        await wait(500);
        document.getElementById('reg-email').value = 'cabinet.martin@avocat-demo.fr';
        document.getElementById('reg-password').value = 'CabinetSecure2024!';
        document.getElementById('reg-name').value = 'Maître Sophie Martin';
        await wait(1000);
        await simulateRegistration();
    }

    async function demoQuickLogin() {
        openTab('auth');
        await wait(300);
        if (!getAuthToken()) {
            await simulateLogin();
        }
    }

    async function demoFirstEmails() {
        openTab('ingest');
        await wait(500);
        const startupEmails = [
            { from: 'nouveau.client@entreprise.fr', subject: 'Création SARL - Demande de devis', body: 'Bonjour Maître, nous souhaitons créer une SARL. Pouvez-vous nous accompagner ?', type: 'CREATION_SOCIETE' },
            { from: 'marie.dubois@particulier.fr', subject: 'Divorce par consentement mutuel', body: 'Nous souhaitons divorcer à l\'amiable. Quelles sont les démarches ?', type: 'FAMILLE' },
            { from: 'contact@startup-tech.com', subject: 'Contrats de travail startup', body: 'Nous recrutons 5 développeurs. Besoin de contrats adaptés.', type: 'TRAVAIL' }
        ];
        
        for (const email of startupEmails) {
            await ingestDemoEmail(email);
            await wait(1200);
        }
    }

    async function demoHighVolumeEmails() {
        openTab('ingest');
        await wait(500);
        const volumeEmails = [
            { from: 'client1@corp.fr', subject: 'Fusion acquisition - Urgent', body: 'Dossier prioritaire fusion', type: 'CORPORATE' },
            { from: 'client2@pme.fr', subject: 'Litige commercial', body: 'Conflit avec fournisseur', type: 'COMMERCIAL' },
            { from: 'client3@assoc.org', subject: 'Statuts association', body: 'Modification statuts', type: 'ASSOCIATIF' },
            { from: 'client4@immo.fr', subject: 'Vente immobilière', body: 'Compromis de vente', type: 'IMMOBILIER' },
            { from: 'client5@tech.com', subject: 'Propriété intellectuelle', body: 'Dépôt de brevet', type: 'PI' }
        ];
        
        for (const email of volumeEmails) {
            await ingestDemoEmail(email);
            await wait(800);
        }
    }

    async function demoClientCreation() {
        openTab('client');
        await wait(500);
        if (typeof window.generateTwentyClientsBase === 'function') {
            await window.generateTwentyClientsBase();
        }
    }

    async function demoVipClients() {
        openTab('client');
        await wait(500);
        const vipClients = [
            { name: '[VIP] Groupe Financier International', email: 'legal@groupe-fi.com', phone: '+33 1 42 00 00 00', address: 'La Défense, Paris' },
            { name: '[VIP] Ministère Justice', email: 'cabinet@justice.gouv.fr', phone: '+33 1 44 77 60 60', address: 'Place Vendôme, Paris' }
        ];
        
        for (const client of vipClients) {
            await createDemoClient(client);
            await wait(1000);
        }
    }

    async function demoCaseOrganization() {
        openTab('cases');
        await wait(500);
        if (typeof window.loadSmartOverview === 'function') {
            await window.loadSmartOverview();
        }
        await wait(2000);
    }

    async function demoSmartSearch() {
        openTab('search');
        await wait(500);
        document.getElementById('search-text').value = 'création société';
        await wait(500);
        if (typeof window.searchEvents === 'function') {
            await window.searchEvents();
        }
        await wait(1500);
    }

    async function demoTeamManagement() {
        openTab('team');
        await wait(1000);
        // Simuler ajout membre équipe
        const emailField = document.getElementById('teamInviteEmail');
        const roleField = document.getElementById('teamInviteRole');
        if (emailField && roleField) {
            emailField.value = 'associe@cabinet-martin.fr';
            roleField.value = 'PARTNER';
            await wait(1000);
        }
    }

    async function demoAdvancedWorkflow() {
        openTab('alerts');
        await wait(500);
        if (typeof window.loadAlerts === 'function') {
            await window.loadAlerts();
        }
        await wait(2000);
    }

    async function demoBasicStats() {
        openTab('stats');
        await wait(500);
        if (typeof window.loadStats === 'function') {
            await window.loadStats();
        }
    }

    async function demoBusinessAnalytics() {
        if (typeof window.showAdvancedDashboard === 'function') {
            window.showAdvancedDashboard();
        }
        await wait(3000);
    }

    async function demoExecutiveDashboard() {
        if (typeof window.showAdvancedDashboard === 'function') {
            window.showAdvancedDashboard();
        }
        await wait(2000);
    }

    async function demoAIAutomation() {
        openTab('search');
        await wait(500);
        document.getElementById('search-text').value = 'contrat travail';
        if (typeof window.semanticSearch === 'function') {
            await window.semanticSearch();
        }
        await wait(2000);
    }

    async function demoAdvancedAnalytics() {
        openTab('export');
        await wait(500);
        if (typeof window.exportEventsText === 'function') {
            await window.exportEventsText();
        }
    }

    async function demoCompliance() {
        openTab('audit');
        await wait(500);
        if (typeof window.loadAudit === 'function') {
            await window.loadAudit();
        }
        await wait(2000);
    }

    async function demoMultiJurisdiction() {
        openTab('client');
        await wait(500);
        const intlClients = [
            { name: 'Cabinet Londres Ltd', email: 'legal@london-firm.co.uk', address: 'City of London, UK' },
            { name: 'Studio Legale Milano', email: 'info@milano-legal.it', address: 'Milano, Italia' }
        ];
        
        for (const client of intlClients) {
            await createDemoClient(client);
            await wait(800);
        }
    }

    async function demoIntegrations() {
        openTab('export');
        await wait(1000);
        // Simuler export pour intégration
    }

    async function demoEmergencyLogin() {
        openTab('auth');
        await wait(200);
        if (!getAuthToken()) {
            await simulateLogin();
        }
    }

    async function demoCriticalAlerts() {
        if (typeof window.testCriticalAlert === 'function') {
            window.testCriticalAlert();
        }
        await wait(2000);
    }

    async function demoAnomalyCenter() {
        if (typeof window.openAnomalyCenter === 'function') {
            window.openAnomalyCenter();
        }
        await wait(2000);
    }

    async function demoUrgentSearch() {
        openTab('search');
        await wait(300);
        document.getElementById('search-text').value = 'urgent';
        if (typeof window.searchEvents === 'function') {
            await window.searchEvents();
        }
    }

    async function demoImmediateActions() {
        openTab('cases');
        await wait(500);
        if (typeof window.listCases === 'function') {
            await window.listCases();
        }
    }

    async function demoNotifications() {
        if (typeof window.testCriticalAlert === 'function') {
            window.testCriticalAlert();
        }
        await wait(1500);
    }

    async function demoEnterpriseLogin() {
        await demoQuickLogin();
    }

    // Fonctions utilitaires
    async function simulateLogin() {
        const authToken = getAuthToken();
        if (authToken) return;
        
        const loginRes = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'sarraboudjellal57@gmail.com',
                password: 'SecurePass123!'
            })
        });
        
        if (loginRes.ok) {
            const loginData = await loginRes.json();
            window.token = loginData.token;
            localStorage.setItem('authToken', loginData.token);
            if (typeof window.updateCurrentUserDisplay === 'function') {
                window.updateCurrentUserDisplay('sarraboudjellal57@gmail.com');
            }
        }
    }

    async function simulateRegistration() {
        // Simuler inscription puis connexion
        await simulateLogin();
    }

    async function ingestDemoEmail(email) {
        const authToken = getAuthToken();
        if (!authToken) return;
        
        await fetch(`${API_BASE}/api/ingest/email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                from: email.from,
                subject: email.subject,
                body: email.body,
                externalId: `DEMO-${email.type}-${Date.now()}`,
                occurredAt: new Date().toISOString()
            })
        });
    }

    async function createDemoClient(client) {
        const authToken = getAuthToken();
        if (!authToken) return;
        
        await fetch(`${API_BASE}/api/client`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(client)
        });
    }

    function wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Créer le panneau de progression
    const demoResult = document.createElement('div');
    demoResult.id = 'demo-progress';
    demoResult.style.cssText = 'position: fixed; top: 70px; right: 10px; z-index: 9999; background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.2); max-width: 350px; min-width: 300px;';
    document.body.appendChild(demoResult);

    // Styles pour le menu de démo
    const demoStyles = `
        <style>
        .demo-scenarios {
            display: grid;
            gap: 15px;
        }
        .demo-card {
            border: 2px solid #e9ecef;
            border-radius: 12px;
            padding: 20px;
            cursor: pointer;
            transition: all 0.3s ease;
            background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
        }
        .demo-card:hover {
            border-color: #667eea;
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.15);
        }
        .demo-card h3 {
            margin: 0 0 10px 0;
            color: #333;
            font-size: 18px;
        }
        .demo-card p {
            margin: 0 0 12px 0;
            color: #666;
            font-size: 14px;
            line-height: 1.4;
        }
        .demo-stats {
            font-size: 12px;
            color: #667eea;
            font-weight: 600;
            background: #eef2ff;
            padding: 6px 12px;
            border-radius: 20px;
            display: inline-block;
        }
        </style>
    `;
    document.head.insertAdjacentHTML('beforeend', demoStyles);

    // Exposer la fonction globalement
    window.runScenario = runScenario;

    // Initialiser au chargement
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createDemoButton);
    } else {
        createDemoButton();
    }
})();