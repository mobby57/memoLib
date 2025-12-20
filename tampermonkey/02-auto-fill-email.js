// ==UserScript==
// @name         IAPosteManager - Auto Fill Email
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Auto-remplissage des emails
// @author       You
// @match        https://iapostemanager.onrender.com/*
// @match        http://localhost:5000/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
    // Templates d'emails rapides
    const templates = {
        'urgent': {
            subject: 'URGENT - Demande prioritaire',
            body: 'Bonjour,\n\nJe vous contacte en urgence concernant...\n\nCordialement'
        },
        'rdv': {
            subject: 'Demande de rendez-vous',
            body: 'Bonjour,\n\nJe souhaiterais prendre rendez-vous...\n\nCordialement'
        },
        'info': {
            subject: 'Demande d\'information',
            body: 'Bonjour,\n\nPourriez-vous me renseigner sur...\n\nCordialement'
        }
    };
    
    // Ajouter boutons de template
    function addTemplateButtons() {
        const composer = document.querySelector('.email-composer, #compose-form');
        if (!composer || document.querySelector('.template-buttons')) return;
        
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'template-buttons';
        buttonContainer.style.cssText = 'margin: 10px 0; display: flex; gap: 10px;';
        
        Object.keys(templates).forEach(key => {
            const btn = document.createElement('button');
            btn.textContent = key.toUpperCase();
            btn.style.cssText = 'padding: 5px 10px; background: #007cba; color: white; border: none; border-radius: 3px; cursor: pointer;';
            btn.onclick = () => fillTemplate(key);
            buttonContainer.appendChild(btn);
        });
        
        composer.insertBefore(buttonContainer, composer.firstChild);
    }
    
    function fillTemplate(templateKey) {
        const template = templates[templateKey];
        const subjectField = document.querySelector('input[name="subject"], #subject');
        const bodyField = document.querySelector('textarea[name="body"], #message, #content');
        
        if (subjectField) subjectField.value = template.subject;
        if (bodyField) bodyField.value = template.body;
    }
    
    // Observer pour détecter les changements de page
    const observer = new MutationObserver(() => {
        addTemplateButtons();
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    addTemplateButtons();
})();