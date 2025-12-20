// ==UserScript==
// @name         IAPosteManager - Dark Mode
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Mode sombre pour IAPosteManager
// @author       You
// @match        https://iapostemanager.onrender.com/*
// @match        http://localhost:5000/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
    const darkCSS = `
        body { background: #1a1a1a !important; color: #e0e0e0 !important; }
        .container, .card, .form-group { background: #2d2d2d !important; color: #e0e0e0 !important; }
        input, textarea, select { background: #3d3d3d !important; color: #e0e0e0 !important; border: 1px solid #555 !important; }
        button { background: #007cba !important; color: white !important; }
        .navbar, .header { background: #2d2d2d !important; }
        .sidebar { background: #1a1a1a !important; }
        .email-item { background: #2d2d2d !important; border-bottom: 1px solid #555 !important; }
        .email-item:hover { background: #3d3d3d !important; }
        a { color: #4da6ff !important; }
        .table { background: #2d2d2d !important; color: #e0e0e0 !important; }
        .table th, .table td { border-color: #555 !important; }
    `;
    
    function toggleDarkMode() {
        const existingStyle = document.getElementById('dark-mode-style');
        if (existingStyle) {
            existingStyle.remove();
            localStorage.setItem('darkMode', 'false');
        } else {
            const style = document.createElement('style');
            style.id = 'dark-mode-style';
            style.textContent = darkCSS;
            document.head.appendChild(style);
            localStorage.setItem('darkMode', 'true');
        }
    }
    
    // Ajouter bouton toggle
    function addDarkModeButton() {
        if (document.getElementById('dark-mode-toggle')) return;
        
        const button = document.createElement('button');
        button.id = 'dark-mode-toggle';
        button.innerHTML = '🌙';
        button.style.cssText = `
            position: fixed; top: 10px; right: 10px; z-index: 9999;
            background: #007cba; color: white; border: none;
            border-radius: 50%; width: 40px; height: 40px;
            cursor: pointer; font-size: 16px;
        `;
        button.onclick = toggleDarkMode;
        document.body.appendChild(button);
    }
    
    // Appliquer le mode sombre si activé
    if (localStorage.getItem('darkMode') === 'true') {
        const style = document.createElement('style');
        style.id = 'dark-mode-style';
        style.textContent = darkCSS;
        document.head.appendChild(style);
    }
    
    // Ajouter le bouton au chargement
    setTimeout(addDarkModeButton, 1000);
})();