// ==UserScript==
// @name         IAPosteManager - Keyboard Shortcuts
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Raccourcis clavier pour IAPosteManager
// @author       You
// @match        https://iapostemanager.onrender.com/*
// @match        http://localhost:5000/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
    document.addEventListener('keydown', function(e) {
        // Ctrl+N - Nouveau message
        if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            const composeBtn = document.querySelector('button[onclick*="compose"], .compose-btn, #new-email');
            if (composeBtn) composeBtn.click();
        }
        
        // Ctrl+S - Envoyer
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            const sendBtn = document.querySelector('button[type="submit"], .send-btn, #send-email');
            if (sendBtn) sendBtn.click();
        }
        
        // Ctrl+G - Générer avec IA
        if (e.ctrlKey && e.key === 'g') {
            e.preventDefault();
            const aiBtn = document.querySelector('.ai-generate, #generate-ai, button[onclick*="generate"]');
            if (aiBtn) aiBtn.click();
        }
        
        // Ctrl+H - Historique
        if (e.ctrlKey && e.key === 'h') {
            e.preventDefault();
            window.location.href = '/history';
        }
        
        // Ctrl+D - Dashboard
        if (e.ctrlKey && e.key === 'd') {
            e.preventDefault();
            window.location.href = '/dashboard';
        }
        
        // F1 - Aide
        if (e.key === 'F1') {
            e.preventDefault();
            showShortcutsHelp();
        }
    });
    
    function showShortcutsHelp() {
        const help = `
Raccourcis IAPosteManager:
• Ctrl+N : Nouveau message
• Ctrl+S : Envoyer
• Ctrl+G : Générer avec IA
• Ctrl+H : Historique
• Ctrl+D : Dashboard
• F1 : Cette aide
        `;
        alert(help);
    }
    
    // Afficher les raccourcis au chargement
    console.log('🚀 IAPosteManager Shortcuts activés - Appuyez sur F1 pour l\'aide');
})();