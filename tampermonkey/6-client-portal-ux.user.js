// ==UserScript==
// @name         MemoLib - Client Portal UX
// @version      1.0.0
// @description  Améliore UX avec auto-save et tooltips
// @match        http://localhost:5078/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
    // Auto-save brouillons
    let saveTimer;
    document.querySelectorAll('textarea, input[type="text"]').forEach(input => {
        input.addEventListener('input', () => {
            clearTimeout(saveTimer);
            saveTimer = setTimeout(() => {
                const key = `draft_${input.id || input.name}`;
                localStorage.setItem(key, input.value);
                showToast('💾 Brouillon sauvegardé');
            }, 2000);
        });
        
        // Restaurer brouillon
        const key = `draft_${input.id || input.name}`;
        const draft = localStorage.getItem(key);
        if (draft && !input.value) input.value = draft;
    });
    
    // Tooltips contextuels
    const tooltips = {
        'email-from': 'Email de l\'expéditeur',
        'email-subject': 'Objet du message',
        'case-title': 'Titre du dossier',
        'client-name': 'Nom complet du client'
    };
    
    Object.entries(tooltips).forEach(([id, text]) => {
        const el = document.getElementById(id);
        if (el) {
            el.title = text;
            el.style.cursor = 'help';
        }
    });
    
    // Toast notifications
    function showToast(msg) {
        const toast = document.createElement('div');
        toast.textContent = msg;
        toast.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#333;color:white;padding:12px 24px;border-radius:8px;z-index:10000;animation:fadeIn 0.3s';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    }
    
    // Indicateur
    const indicator = document.createElement('div');
    indicator.textContent = '✨';
    indicator.title = 'UX améliorée active';
    indicator.style.cssText = 'position:fixed;bottom:200px;right:20px;width:40px;height:40px;background:#fbbc04;color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;z-index:9999';
    document.body.appendChild(indicator);
})();
