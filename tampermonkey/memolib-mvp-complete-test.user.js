// ==UserScript==
// @name         MemoLib MVP - Test Complet Tous Services
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Test automatique de tous les services MemoLib (Auth, Cases, Clients, Emails, Notifications, Webhooks, Billing, Calendar, Search, Documents)
// @author       MemoLib Team
// @match        http://localhost:5078/*
// @match        http://127.0.0.1:5078/*
// @grant        GM_xmlhttpRequest
// @grant        GM_notification
// @grant        GM_setValue
// @grant        GM_getValue
// @connect      localhost
// @connect      127.0.0.1
// ==/UserScript==

(function() {
    'use strict';

    const API_BASE = 'http://localhost:5078/api';
    let authToken = null;
    let userId = null;
    let testResults = {
        total: 0,
        passed: 0,
        failed: 0,
        services: {}
    };

    // ============================================
    // UTILITIES
    // ============================================

    function log(message, type = 'info') {
        const colors = {
            info: '#2196F3',
            success: '#4CAF50',
            error: '#f44336',
            warning: '#ff9800'
        };
        console.log(`%c[MemoLib MVP] ${message}`, `color: ${colors[type]}; font-weight: bold`);
    }

    function notify(title, message, type = 'info') {
        GM_notification({
            title: `MemoLib MVP - ${title}`,
            text: message,
            timeout: 3000
        });
    }

    async function apiCall(endpoint, method = 'GET', data = null, requireAuth = true) {
        return new Promise((resolve, reject) => {
            const headers = {
                'Content-Type': 'application/json'
            };

            if (requireAuth && authToken) {
                headers['Authorization'] = `Bearer ${authToken}`;
            }

            GM_xmlhttpRequest({
                method: method,
                url: `${API_BASE}${endpoint}`,
                headers: headers,
                data: data ? JSON.stringify(data) : null,
                onload: (response) => {
                    try {
                        const result = response.responseText ? JSON.parse(response.responseText) : {};
                        resolve({ status: response.status, data: result });
                    } catch (e) {
                        resolve({ status: response.status, data: response.responseText });
                    }
                },
                onerror: (error) => reject(error)
            });
        });
    }

    function recordTest(service, testName, passed, details = '') {
        testResults.total++;
        if (passed) {
            testResults.passed++;
        } else {
            testResults.failed++;
        }

        if (!testResults.services[service]) {
            testResults.services[service] = { passed: 0, failed: 0, tests: [] };
        }

        testResults.services[service].tests.push({
            name: testName,
            passed: passed,
            details: details
        });

        if (passed) {
            testResults.services[service].passed++;
            log(`✅ ${service} - ${testName}`, 'success');
        } else {
            testResults.services[service].failed++;
            log(`❌ ${service} - ${testName}: ${details}`, 'error');
        }
    }

    // ============================================
    // SERVICE 1: AUTHENTIFICATION
    // ============================================

    async function testAuthService() {
        log('🔐 Test Service: Authentification', 'info');

        // Test 1: Register
        try {
            const registerData = {
                email: `test_${Date.now()}@memolib.local`,
                password: 'Test123!@#',
                role: 'Owner'
            };

            const registerRes = await apiCall('/auth/register', 'POST', registerData, false);
            recordTest('Auth', 'Register', registerRes.status === 200, `Status: ${registerRes.status}`);

            if (registerRes.status === 200) {
                authToken = registerRes.data.token;
                userId = registerRes.data.userId;
                GM_setValue('authToken', authToken);
                GM_setValue('userId', userId);
            }
        } catch (e) {
            recordTest('Auth', 'Register', false, e.message);
        }

        // Test 2: Login
        try {
            const loginData = {
                email: 'admin@memolib.local',
                password: 'Admin123!'
            };

            const loginRes = await apiCall('/auth/login', 'POST', loginData, false);
            recordTest('Auth', 'Login', loginRes.status === 200, `Status: ${loginRes.status}`);

            if (loginRes.status === 200 && loginRes.data.token) {
                authToken = loginRes.data.token;
                userId = loginRes.data.userId;
            }
        } catch (e) {
            recordTest('Auth', 'Login', false, e.message);
        }
    }

    // ============================================
    // SERVICE 2: CASES (DOSSIERS)
    // ============================================

    async function testCasesService() {
        log('📁 Test Service: Cases', 'info');

        let caseId = null;

        // Test 1: Create Case
        try {
            const caseData = {
                title: `Test Case ${Date.now()}`,
                priority: 5,
                tags: 'urgent,test'
            };

            const createRes = await apiCall('/case', 'POST', caseData);
            recordTest('Cases', 'Create Case', createRes.status === 201, `Status: ${createRes.status}`);

            if (createRes.status === 201) {
                caseId = createRes.data.id;
            }
        } catch (e) {
            recordTest('Cases', 'Create Case', false, e.message);
        }

        // Test 2: Get Cases
        try {
            const getRes = await apiCall('/case');
            recordTest('Cases', 'Get Cases', getRes.status === 200, `Status: ${getRes.status}`);
        } catch (e) {
            recordTest('Cases', 'Get Cases', false, e.message);
        }

        // Test 3: Update Status
        if (caseId) {
            try {
                const statusData = { status: 'IN_PROGRESS' };
                const statusRes = await apiCall(`/case/${caseId}/status`, 'PATCH', statusData);
                recordTest('Cases', 'Update Status', statusRes.status === 200, `Status: ${statusRes.status}`);
            } catch (e) {
                recordTest('Cases', 'Update Status', false, e.message);
            }
        }

        // Test 4: Get Timeline
        if (caseId) {
            try {
                const timelineRes = await apiCall(`/case/${caseId}/timeline`);
                recordTest('Cases', 'Get Timeline', timelineRes.status === 200, `Status: ${timelineRes.status}`);
            } catch (e) {
                recordTest('Cases', 'Get Timeline', false, e.message);
            }
        }
    }

    // ============================================
    // SERVICE 3: CLIENTS
    // ============================================

    async function testClientsService() {
        log('👥 Test Service: Clients', 'info');

        let clientId = null;

        // Test 1: Create Client
        try {
            const clientData = {
                name: `Test Client ${Date.now()}`,
                email: `client_${Date.now()}@example.com`,
                phoneNumber: '+33612345678',
                address: '123 Test Street, Paris'
            };

            const createRes = await apiCall('/client', 'POST', clientData);
            recordTest('Clients', 'Create Client', createRes.status === 201, `Status: ${createRes.status}`);

            if (createRes.status === 201) {
                clientId = createRes.data.id;
            }
        } catch (e) {
            recordTest('Clients', 'Create Client', false, e.message);
        }

        // Test 2: Get Clients
        try {
            const getRes = await apiCall('/client');
            recordTest('Clients', 'Get Clients', getRes.status === 200, `Status: ${getRes.status}`);
        } catch (e) {
            recordTest('Clients', 'Get Clients', false, e.message);
        }

        // Test 3: Get Client Detail
        if (clientId) {
            try {
                const detailRes = await apiCall(`/client/${clientId}/detail`);
                recordTest('Clients', 'Get Client Detail', detailRes.status === 200, `Status: ${detailRes.status}`);
            } catch (e) {
                recordTest('Clients', 'Get Client Detail', false, e.message);
            }
        }
    }

    // ============================================
    // SERVICE 4: EMAILS
    // ============================================

    async function testEmailsService() {
        log('📧 Test Service: Emails', 'info');

        // Test 1: Create Template
        try {
            const templateData = {
                name: `Test Template ${Date.now()}`,
                subject: 'Test Subject {{clientName}}',
                body: 'Hello {{clientName}}, this is a test email.'
            };

            const createRes = await apiCall('/email/templates', 'POST', templateData);
            recordTest('Emails', 'Create Template', createRes.status === 201, `Status: ${createRes.status}`);
        } catch (e) {
            recordTest('Emails', 'Create Template', false, e.message);
        }

        // Test 2: Get Templates
        try {
            const getRes = await apiCall('/email/templates');
            recordTest('Emails', 'Get Templates', getRes.status === 200, `Status: ${getRes.status}`);
        } catch (e) {
            recordTest('Emails', 'Get Templates', false, e.message);
        }

        // Test 3: Manual Scan
        try {
            const scanRes = await apiCall('/email-scan/manual', 'POST');
            recordTest('Emails', 'Manual Scan', scanRes.status === 200 || scanRes.status === 202, `Status: ${scanRes.status}`);
        } catch (e) {
            recordTest('Emails', 'Manual Scan', false, e.message);
        }
    }

    // ============================================
    // SERVICE 5: NOTIFICATIONS
    // ============================================

    async function testNotificationsService() {
        log('🔔 Test Service: Notifications', 'info');

        // Test 1: Get Notifications
        try {
            const getRes = await apiCall('/notifications');
            recordTest('Notifications', 'Get Notifications', getRes.status === 200, `Status: ${getRes.status}`);
        } catch (e) {
            recordTest('Notifications', 'Get Notifications', false, e.message);
        }

        // Test 2: Get Unread Count
        try {
            const countRes = await apiCall('/notifications/unread/count');
            recordTest('Notifications', 'Get Unread Count', countRes.status === 200, `Status: ${countRes.status}`);
        } catch (e) {
            recordTest('Notifications', 'Get Unread Count', false, e.message);
        }
    }

    // ============================================
    // SERVICE 6: DASHBOARD & STATS
    // ============================================

    async function testDashboardService() {
        log('📊 Test Service: Dashboard', 'info');

        // Test 1: Get Dashboard
        try {
            const dashRes = await apiCall('/dashboard');
            recordTest('Dashboard', 'Get Dashboard', dashRes.status === 200, `Status: ${dashRes.status}`);
        } catch (e) {
            recordTest('Dashboard', 'Get Dashboard', false, e.message);
        }

        // Test 2: Get Stats
        try {
            const statsRes = await apiCall('/stats');
            recordTest('Dashboard', 'Get Stats', statsRes.status === 200, `Status: ${statsRes.status}`);
        } catch (e) {
            recordTest('Dashboard', 'Get Stats', false, e.message);
        }

        // Test 3: Get Alerts
        try {
            const alertsRes = await apiCall('/alerts');
            recordTest('Dashboard', 'Get Alerts', alertsRes.status === 200, `Status: ${alertsRes.status}`);
        } catch (e) {
            recordTest('Dashboard', 'Get Alerts', false, e.message);
        }
    }

    // ============================================
    // SERVICE 7: SEARCH
    // ============================================

    async function testSearchService() {
        log('🔍 Test Service: Search', 'info');

        // Test 1: Text Search
        try {
            const searchData = {
                query: 'test',
                filters: { status: 'OPEN' }
            };

            const searchRes = await apiCall('/search/events', 'POST', searchData);
            recordTest('Search', 'Text Search', searchRes.status === 200, `Status: ${searchRes.status}`);
        } catch (e) {
            recordTest('Search', 'Text Search', false, e.message);
        }

        // Test 2: Semantic Search
        try {
            const semanticData = {
                query: 'urgent legal matter',
                topK: 5
            };

            const semanticRes = await apiCall('/semantic/search', 'POST', semanticData);
            recordTest('Search', 'Semantic Search', semanticRes.status === 200, `Status: ${semanticRes.status}`);
        } catch (e) {
            recordTest('Search', 'Semantic Search', false, e.message);
        }
    }

    // ============================================
    // SERVICE 8: CALENDAR
    // ============================================

    async function testCalendarService() {
        log('📅 Test Service: Calendar', 'info');

        // Test 1: Create Event
        try {
            const eventData = {
                title: `Test Event ${Date.now()}`,
                startTime: new Date().toISOString(),
                endTime: new Date(Date.now() + 3600000).toISOString(),
                description: 'Test calendar event'
            };

            const createRes = await apiCall('/calendar/events', 'POST', eventData);
            recordTest('Calendar', 'Create Event', createRes.status === 201, `Status: ${createRes.status}`);
        } catch (e) {
            recordTest('Calendar', 'Create Event', false, e.message);
        }

        // Test 2: Get Events
        try {
            const getRes = await apiCall('/calendar/events');
            recordTest('Calendar', 'Get Events', getRes.status === 200, `Status: ${getRes.status}`);
        } catch (e) {
            recordTest('Calendar', 'Get Events', false, e.message);
        }
    }

    // ============================================
    // SERVICE 9: BILLING
    // ============================================

    async function testBillingService() {
        log('💰 Test Service: Billing', 'info');

        // Test 1: Get Time Entries
        try {
            const getRes = await apiCall('/billing/time-entries');
            recordTest('Billing', 'Get Time Entries', getRes.status === 200, `Status: ${getRes.status}`);
        } catch (e) {
            recordTest('Billing', 'Get Time Entries', false, e.message);
        }

        // Test 2: Get Invoices
        try {
            const invoicesRes = await apiCall('/billing/invoices');
            recordTest('Billing', 'Get Invoices', invoicesRes.status === 200, `Status: ${invoicesRes.status}`);
        } catch (e) {
            recordTest('Billing', 'Get Invoices', false, e.message);
        }
    }

    // ============================================
    // SERVICE 10: WEBHOOKS
    // ============================================

    async function testWebhooksService() {
        log('🔗 Test Service: Webhooks', 'info');

        // Test 1: Get Webhooks
        try {
            const getRes = await apiCall('/webhooks');
            recordTest('Webhooks', 'Get Webhooks', getRes.status === 200, `Status: ${getRes.status}`);
        } catch (e) {
            recordTest('Webhooks', 'Get Webhooks', false, e.message);
        }

        // Test 2: Create Webhook
        try {
            const webhookData = {
                url: 'https://webhook.site/test',
                events: ['case.created', 'case.updated'],
                isActive: true
            };

            const createRes = await apiCall('/webhooks', 'POST', webhookData);
            recordTest('Webhooks', 'Create Webhook', createRes.status === 201, `Status: ${createRes.status}`);
        } catch (e) {
            recordTest('Webhooks', 'Create Webhook', false, e.message);
        }
    }

    // ============================================
    // DISPLAY RESULTS
    // ============================================

    function displayResults() {
        log('📊 RÉSULTATS DES TESTS MVP', 'info');
        log(`Total: ${testResults.total} | Passed: ${testResults.passed} | Failed: ${testResults.failed}`, 'info');

        const successRate = ((testResults.passed / testResults.total) * 100).toFixed(2);
        log(`Taux de réussite: ${successRate}%`, successRate >= 80 ? 'success' : 'warning');

        console.table(Object.entries(testResults.services).map(([service, data]) => ({
            Service: service,
            Passed: data.passed,
            Failed: data.failed,
            Total: data.passed + data.failed,
            Rate: `${((data.passed / (data.passed + data.failed)) * 100).toFixed(1)}%`
        })));

        // Create UI Panel
        createResultsPanel();

        notify('Tests Terminés', `${testResults.passed}/${testResults.total} tests réussis (${successRate}%)`, 
               successRate >= 80 ? 'success' : 'warning');
    }

    function createResultsPanel() {
        const panel = document.createElement('div');
        panel.id = 'memolib-test-panel';
        panel.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 400px;
            max-height: 80vh;
            overflow-y: auto;
            background: white;
            border: 2px solid #2196F3;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-family: Arial, sans-serif;
        `;

        const successRate = ((testResults.passed / testResults.total) * 100).toFixed(2);

        let html = `
            <div style="background: #2196F3; color: white; padding: 15px; border-radius: 6px 6px 0 0;">
                <h3 style="margin: 0;">🚀 MemoLib MVP - Tests</h3>
                <p style="margin: 5px 0 0 0; font-size: 14px;">
                    ${testResults.passed}/${testResults.total} tests réussis (${successRate}%)
                </p>
            </div>
            <div style="padding: 15px;">
        `;

        for (const [service, data] of Object.entries(testResults.services)) {
            const serviceRate = ((data.passed / (data.passed + data.failed)) * 100).toFixed(1);
            const color = serviceRate >= 80 ? '#4CAF50' : serviceRate >= 50 ? '#ff9800' : '#f44336';

            html += `
                <div style="margin-bottom: 15px; border-left: 4px solid ${color}; padding-left: 10px;">
                    <h4 style="margin: 0 0 5px 0;">${service}</h4>
                    <p style="margin: 0; font-size: 12px; color: #666;">
                        ✅ ${data.passed} | ❌ ${data.failed} | ${serviceRate}%
                    </p>
                    <ul style="margin: 5px 0; padding-left: 20px; font-size: 11px;">
            `;

            for (const test of data.tests) {
                html += `<li style="color: ${test.passed ? '#4CAF50' : '#f44336'};">
                    ${test.passed ? '✅' : '❌'} ${test.name}
                </li>`;
            }

            html += `</ul></div>`;
        }

        html += `
                <button id="close-test-panel" style="
                    width: 100%;
                    padding: 10px;
                    background: #2196F3;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                ">Fermer</button>
            </div>
        `;

        panel.innerHTML = html;
        document.body.appendChild(panel);

        document.getElementById('close-test-panel').addEventListener('click', () => {
            panel.remove();
        });
    }

    // ============================================
    // MAIN EXECUTION
    // ============================================

    async function runAllTests() {
        log('🚀 Démarrage des tests MVP MemoLib', 'info');
        notify('Tests MVP', 'Démarrage des tests de tous les services...', 'info');

        try {
            await testAuthService();
            await testCasesService();
            await testClientsService();
            await testEmailsService();
            await testNotificationsService();
            await testDashboardService();
            await testSearchService();
            await testCalendarService();
            await testBillingService();
            await testWebhooksService();

            displayResults();
        } catch (error) {
            log(`Erreur globale: ${error.message}`, 'error');
            notify('Erreur', 'Une erreur est survenue pendant les tests', 'error');
        }
    }

    // Add button to page
    function addTestButton() {
        const button = document.createElement('button');
        button.textContent = '🚀 Lancer Tests MVP';
        button.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 15px 25px;
            background: #2196F3;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 9999;
            transition: all 0.3s;
        `;

        button.addEventListener('mouseenter', () => {
            button.style.background = '#1976D2';
            button.style.transform = 'scale(1.05)';
        });

        button.addEventListener('mouseleave', () => {
            button.style.background = '#2196F3';
            button.style.transform = 'scale(1)';
        });

        button.addEventListener('click', runAllTests);

        document.body.appendChild(button);
    }

    // Auto-start on page load
    window.addEventListener('load', () => {
        setTimeout(() => {
            addTestButton();
            log('✅ Script Tampermonkey chargé - Cliquez sur le bouton pour lancer les tests', 'success');
        }, 1000);
    });

})();
