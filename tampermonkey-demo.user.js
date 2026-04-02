// ==UserScript==
// @name         MemoLib Auto Demo
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Démo automatique complète de MemoLib
// @author       MemoLib
// @match        http://localhost:5078/demo.html*
// @match        http://127.0.0.1:5078/demo.html*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Attendre que la page soit chargée
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        // Créer le bouton de démo
        const demoButton = document.createElement('button');
        demoButton.textContent = '🎬 DÉMO AUTOMATIQUE';
        demoButton.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 10000;
            padding: 15px 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            transition: transform 0.2s;
        `;
        demoButton.onmouseover = () => demoButton.style.transform = 'scale(1.05)';
        demoButton.onmouseout = () => demoButton.style.transform = 'scale(1)';
        demoButton.onclick = startDemo;
        document.body.appendChild(demoButton);

        // Créer le panneau de progression
        const progressPanel = document.createElement('div');
        progressPanel.id = 'demo-progress';
        progressPanel.style.cssText = `
            position: fixed;
            top: 70px;
            right: 10px;
            z-index: 9999;
            background: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            max-width: 300px;
            display: none;
        `;
        document.body.appendChild(progressPanel);
    }

    async function startDemo() {
        const progress = document.getElementById('demo-progress');
        progress.style.display = 'block';
        
        try {
            await step('🔐 Connexion automatique...', async () => {
                document.getElementById('login-email').value = 'sarraboudjellal57@gmail.com';
                document.getElementById('login-password').value = 'SecurePass123!';
                await login();
                await wait(2000);
            });

            await step('📧 Ingestion d\'emails de test...', async () => {
                showTab('ingest');
                await wait(1000);
                
                const emails = [
                    { from: 'client.divorce@example.com', subject: 'Demande divorce urgent', body: 'Je souhaite entamer une procédure de divorce. Situation urgente.', type: 'divorce' },
                    { from: 'client.travail@example.com', subject: 'Licenciement abusif', body: 'Mon employeur m\'a licencié sans motif valable. Besoin d\'aide.', type: 'travail' },
                    { from: 'client.immobilier@example.com', subject: 'Litige propriétaire', body: 'Conflit avec mon propriétaire sur les charges.', type: 'immobilier' }
                ];

                for (const email of emails) {
                    document.getElementById('email-from').value = email.from;
                    document.getElementById('email-subject').value = email.subject;
                    document.getElementById('email-body').value = email.body;
                    document.getElementById('email-external').value = `DEMO-${email.type.toUpperCase()}-${Date.now()}`;
                    await ingestEmail();
                    await wait(1500);
                }
            });

            await step('📊 Affichage Dashboard Avancé...', async () => {
                showAdvancedDashboard();
                await wait(3000);
            });

            await step('🔍 Recherche intelligente...', async () => {
                showTab('search');
                await wait(1000);
                document.getElementById('search-text').value = 'divorce urgent';
                await searchEvents();
                await wait(2000);
            });

            await step('📝 Génération template IA...', async () => {
                const firstEmail = document.querySelector('.event-item');
                if (firstEmail) {
                    firstEmail.click();
                    await wait(1000);
                }
            });

            await step('📁 Affichage dossiers...', async () => {
                showTab('cases');
                await wait(1000);
                await listCases();
                await wait(2000);
            });

            await step('👥 Gestion clients...', async () => {
                showTab('client');
                await wait(1000);
                await listClients();
                await wait(2000);
            });

            await step('📊 Statistiques...', async () => {
                showTab('stats');
                await wait(1000);
                await loadStats();
                await wait(2000);
            });

            await step('✅ Démo terminée!', async () => {
                showNotification('🎉 Démo Complète', 'Toutes les fonctionnalités ont été démontrées avec succès!', 'success');
                await wait(3000);
                progress.style.display = 'none';
            });

        } catch (error) {
            await step('❌ Erreur: ' + error.message, async () => {
                await wait(3000);
                progress.style.display = 'none';
            });
        }
    }

    async function step(message, action) {
        const progress = document.getElementById('demo-progress');
        progress.innerHTML = `
            <div style="margin-bottom: 10px;">
                <strong style="color: #667eea;">Démo en cours...</strong>
            </div>
            <div style="padding: 10px; background: #f0f0f0; border-radius: 5px; margin-bottom: 10px;">
                ${message}
            </div>
            <div style="width: 100%; height: 4px; background: #e0e0e0; border-radius: 2px; overflow: hidden;">
                <div style="width: 100%; height: 100%; background: linear-gradient(90deg, #667eea, #764ba2); animation: progress 1s ease-in-out infinite;"></div>
            </div>
        `;
        
        await action();
    }

    function wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function showNotification(title, message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 10001;
            min-width: 300px;
            border-left: 4px solid ${type === 'success' ? '#28a745' : '#667eea'};
        `;
        notification.innerHTML = `
            <strong style="display: block; margin-bottom: 5px; color: #333;">${title}</strong>
            <p style="margin: 0; color: #666;">${message}</p>
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    // Ajouter les styles d'animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes progress {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
    `;
    document.head.appendChild(style);
})();