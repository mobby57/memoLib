// ==UserScript==
// @name         IAPosteManager - Auto Save
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Sauvegarde automatique des brouillons
// @author       You
// @match        https://iapostemanager.onrender.com/*
// @match        http://localhost:5000/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
    let saveInterval;
    
    function autoSave() {
        const subjectField = document.querySelector('input[name="subject"], #subject');
        const bodyField = document.querySelector('textarea[name="body"], #message, #content');
        const recipientField = document.querySelector('input[name="to"], #recipient');
        
        if (subjectField || bodyField || recipientField) {
            const draft = {
                subject: subjectField?.value || '',
                body: bodyField?.value || '',
                recipient: recipientField?.value || '',
                timestamp: Date.now()
            };
            
            localStorage.setItem('iaposte_draft', JSON.stringify(draft));
            showSaveIndicator();
        }
    }
    
    function showSaveIndicator() {
        let indicator = document.getElementById('save-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'save-indicator';
            indicator.style.cssText = `
                position: fixed; top: 50px; right: 10px; z-index: 9999;
                background: #28a745; color: white; padding: 5px 10px;
                border-radius: 3px; font-size: 12px; opacity: 0;
                transition: opacity 0.3s;
            `;
            document.body.appendChild(indicator);
        }
        
        indicator.textContent = '✓ Sauvegardé';
        indicator.style.opacity = '1';
        setTimeout(() => indicator.style.opacity = '0', 2000);
    }
    
    function restoreDraft() {
        const draft = localStorage.getItem('iaposte_draft');
        if (!draft) return;
        
        const data = JSON.parse(draft);
        const subjectField = document.querySelector('input[name="subject"], #subject');
        const bodyField = document.querySelector('textarea[name="body"], #message, #content');
        const recipientField = document.querySelector('input[name="to"], #recipient');
        
        if (confirm('Restaurer le brouillon sauvegardé ?')) {
            if (subjectField && data.subject) subjectField.value = data.subject;
            if (bodyField && data.body) bodyField.value = data.body;
            if (recipientField && data.recipient) recipientField.value = data.recipient;
        }
    }
    
    function startAutoSave() {
        if (saveInterval) clearInterval(saveInterval);
        saveInterval = setInterval(autoSave, 10000); // Sauvegarde toutes les 10 secondes
    }
    
    // Observer pour détecter les formulaires d'email
    const observer = new MutationObserver(() => {
        const emailForm = document.querySelector('.email-composer, #compose-form, form[action*="send"]');
        if (emailForm && !emailForm.dataset.autoSaveEnabled) {
            emailForm.dataset.autoSaveEnabled = 'true';
            startAutoSave();
            
            // Proposer de restaurer un brouillon
            setTimeout(restoreDraft, 1000);
            
            // Sauvegarder à l'envoi
            const sendBtn = emailForm.querySelector('button[type="submit"]');
            if (sendBtn) {
                sendBtn.addEventListener('click', () => {
                    localStorage.removeItem('iaposte_draft');
                });
            }
        }
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
})();