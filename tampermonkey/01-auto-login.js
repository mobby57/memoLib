// ==UserScript==
// @name         IAPosteManager - Auto Login
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Auto-login pour IAPosteManager
// @author       You
// @match        https://iapostemanager.onrender.com/*
// @match        http://localhost:5000/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
    if (window.location.pathname === '/login') {
        setTimeout(() => {
            const emailField = document.querySelector('input[type="email"]');
            const passwordField = document.querySelector('input[type="password"]');
            const loginBtn = document.querySelector('button[type="submit"]');
            
            if (emailField && passwordField) {
                emailField.value = 'admin@iaposte.com';
                passwordField.value = 'admin123';
                if (loginBtn) loginBtn.click();
            }
        }, 500);
    }
})();