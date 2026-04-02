// ==UserScript==
// @name         MemoLib - Productivity Shortcuts
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Raccourcis clavier pour navigation rapide dans MemoLib
// @author       MemoLib
// @match        http://localhost:5078/*
// @match        https://memolib.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const SHORTCUTS = {
        'ctrl+n': () => showTab('cases'),
        'ctrl+e': () => showTab('ingest'),
        'ctrl+f': () => focusSearch(),
        'ctrl+d': () => showTab('dashboard'),
        'ctrl+c': () => showTab('client'),
        'ctrl+s': () => saveCurrentForm(),
        'escape': () => closeModals(),
        '?': () => showShortcutsHelp()
    };

    document.addEventListener('keydown', (e) => {
        const key = getKeyCombo(e);
        const action = SHORTCUTS[key];
        
        if (action && !isInputFocused()) {
            e.preventDefault();
            action();
        }
    });

    function getKeyCombo(e) {
        const parts = [];
        if (e.ctrlKey) parts.push('ctrl');
        if (e.altKey) parts.push('alt');
        if (e.shiftKey) parts.push('shift');
        parts.push(e.key.toLowerCase());
        return parts.join('+');
    }

    function isInputFocused() {
        const active = document.activeElement;
        return active.tagName === 'INPUT' || active.tagName === 'TEXTAREA';
    }

    function focusSearch() {
        const search = document.getElementById('search-text') || 
                      document.querySelector('input[type="search"]');
        if (search) search.focus();
    }

    function saveCurrentForm() {
        const saveBtn = document.querySelector('button[type="submit"]');
        if (saveBtn) saveBtn.click();
    }

    function closeModals() {
        const modals = document.querySelectorAll('.modal, [role="dialog"]');
        modals.forEach(m => m.style.display = 'none');
    }

    function showShortcutsHelp() {
        const help = document.createElement('div');
        help.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            z-index: 10000;
            max-width: 400px;
        `;
        help.innerHTML = `
            <h3 style="margin-top:0">⌨️ Raccourcis Clavier</h3>
            <ul style="list-style:none;padding:0">
                <li><kbd>Ctrl+N</kbd> Nouveau dossier</li>
                <li><kbd>Ctrl+E</kbd> Ingestion email</li>
                <li><kbd>Ctrl+F</kbd> Recherche</li>
                <li><kbd>Ctrl+D</kbd> Dashboard</li>
                <li><kbd>Ctrl+C</kbd> Clients</li>
                <li><kbd>Ctrl+S</kbd> Sauvegarder</li>
                <li><kbd>Esc</kbd> Fermer</li>
                <li><kbd>?</kbd> Aide</li>
            </ul>
            <button onclick="this.parentElement.remove()" style="
                width:100%;
                padding:10px;
                background:#667eea;
                color:white;
                border:none;
                border-radius:4px;
                cursor:pointer;
            ">Fermer</button>
        `;
        document.body.appendChild(help);
    }

    // Indicateur visuel
    const indicator = document.createElement('div');
    indicator.textContent = '⌨️';
    indicator.title = 'Raccourcis actifs (? pour aide)';
    indicator.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 40px;
        height: 40px;
        background: #667eea;
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        cursor: pointer;
        z-index: 9999;
    `;
    indicator.onclick = showShortcutsHelp;
    document.body.appendChild(indicator);
})();
