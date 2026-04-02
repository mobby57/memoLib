// ==UserScript==
// @name         MemoLib - Gmail Integration
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Envoie des emails Gmail vers MemoLib en 1 clic
// @author       MemoLib
// @match        https://mail.google.com/*
// @grant        GM_xmlhttpRequest
// @connect      localhost
// ==/UserScript==

(function() {
    'use strict';

    const CONFIG = {
        API_BASE: 'http://localhost:5078',
        BUTTON_TEXT: '📧 → MemoLib'
    };

    function init() {
        addMemoLibButton();
        observeGmailChanges();
    }

    function addMemoLibButton() {
        const toolbar = document.querySelector('[role="toolbar"]');
        if (!toolbar || document.getElementById('memolib-btn')) return;

        const btn = document.createElement('button');
        btn.id = 'memolib-btn';
        btn.textContent = CONFIG.BUTTON_TEXT;
        btn.style.cssText = `
            margin: 0 8px;
            padding: 8px 16px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 500;
        `;
        btn.onclick = sendToMemoLib;
        toolbar.appendChild(btn);
    }

    async function sendToMemoLib() {
        try {
            const email = extractEmailData();
            if (!email) {
                alert('❌ Impossible d\'extraire l\'email');
                return;
            }

            const token = prompt('Token JWT MemoLib:');
            if (!token) return;

            GM_xmlhttpRequest({
                method: 'POST',
                url: `${CONFIG.API_BASE}/api/ingest/email`,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                data: JSON.stringify(email),
                onload: (response) => {
                    if (response.status === 200) {
                        alert('✅ Email envoyé à MemoLib !');
                    } else {
                        alert('❌ Erreur: ' + response.statusText);
                    }
                },
                onerror: () => alert('❌ Erreur de connexion')
            });
        } catch (error) {
            alert('❌ Erreur: ' + error.message);
        }
    }

    function extractEmailData() {
        const subject = document.querySelector('h2')?.textContent || '';
        const from = document.querySelector('[email]')?.getAttribute('email') || '';
        const body = document.querySelector('[data-message-id]')?.textContent || '';
        
        return { from, subject, body, externalId: `GMAIL-${Date.now()}` };
    }

    function observeGmailChanges() {
        const observer = new MutationObserver(() => addMemoLibButton());
        observer.observe(document.body, { childList: true, subtree: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
