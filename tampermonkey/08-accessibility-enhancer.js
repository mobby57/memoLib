// ==UserScript==
// @name         IAPosteManager - Accessibility Enhancer
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Améliorations d'accessibilité pour IAPosteManager
// @author       You
// @match        https://iapostemanager.onrender.com/*
// @match        http://localhost:5000/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
    function addAccessibilityToolbar() {
        const toolbar = document.createElement('div');
        toolbar.id = 'accessibility-toolbar';
        toolbar.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; z-index: 10000;
            background: #333; color: white; padding: 5px 10px;
            display: flex; gap: 10px; align-items: center;
            font-size: 14px; transform: translateY(-100%);
            transition: transform 0.3s;
        `;
        
        toolbar.innerHTML = `
            <span>♿ Accessibilité:</span>
            <button onclick="increaseFontSize()">A+</button>
            <button onclick="decreaseFontSize()">A-</button>
            <button onclick="toggleHighContrast()">Contraste</button>
            <button onclick="toggleFocusMode()">Focus</button>
            <button onclick="readPage()">🔊 Lire</button>
            <button onclick="toggleKeyboardNav()">⌨️ Navigation</button>
            <span style="margin-left: auto; cursor: pointer;" onclick="toggleAccessibilityToolbar()">×</span>
        `;
        
        document.body.appendChild(toolbar);
        
        // Bouton pour afficher la barre
        const toggleBtn = document.createElement('button');
        toggleBtn.innerHTML = '♿';
        toggleBtn.style.cssText = `
            position: fixed; top: 10px; left: 10px; z-index: 9999;
            background: #007cba; color: white; border: none;
            border-radius: 50%; width: 40px; height: 40px;
            cursor: pointer; font-size: 16px;
        `;
        toggleBtn.onclick = () => toggleAccessibilityToolbar();
        document.body.appendChild(toggleBtn);
    }
    
    window.toggleAccessibilityToolbar = function() {
        const toolbar = document.getElementById('accessibility-toolbar');
        const isVisible = toolbar.style.transform === 'translateY(0px)';
        toolbar.style.transform = isVisible ? 'translateY(-100%)' : 'translateY(0px)';
    };
    
    window.increaseFontSize = function() {
        document.body.style.fontSize = (parseFloat(getComputedStyle(document.body).fontSize) + 2) + 'px';
    };
    
    window.decreaseFontSize = function() {
        const currentSize = parseFloat(getComputedStyle(document.body).fontSize);
        if (currentSize > 12) {
            document.body.style.fontSize = (currentSize - 2) + 'px';
        }
    };
    
    window.toggleHighContrast = function() {
        const contrastCSS = `
            * { background: black !important; color: yellow !important; }
            input, textarea, select { background: white !important; color: black !important; }
            button { background: yellow !important; color: black !important; }
        `;
        
        const existingStyle = document.getElementById('high-contrast');
        if (existingStyle) {
            existingStyle.remove();
        } else {
            const style = document.createElement('style');
            style.id = 'high-contrast';
            style.textContent = contrastCSS;
            document.head.appendChild(style);
        }
    };
    
    window.toggleFocusMode = function() {
        const focusCSS = `
            * { outline: 3px solid #ff0000 !important; }
            *:focus { outline: 5px solid #00ff00 !important; }
        `;
        
        const existingStyle = document.getElementById('focus-mode');
        if (existingStyle) {
            existingStyle.remove();
        } else {
            const style = document.createElement('style');
            style.id = 'focus-mode';
            style.textContent = focusCSS;
            document.head.appendChild(style);
        }
    };
    
    window.readPage = function() {
        if ('speechSynthesis' in window) {
            const text = document.body.innerText;
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'fr-FR';
            utterance.rate = 0.8;
            speechSynthesis.speak(utterance);
        } else {
            alert('Synthèse vocale non supportée par ce navigateur');
        }
    };
    
    window.toggleKeyboardNav = function() {
        const elements = document.querySelectorAll('div, span, p, h1, h2, h3, h4, h5, h6');
        elements.forEach((el, index) => {
            if (!el.hasAttribute('tabindex')) {
                el.setAttribute('tabindex', index + 100);
                el.style.outline = '1px dashed #ccc';
            } else {
                el.removeAttribute('tabindex');
                el.style.outline = '';
            }
        });
    };
    
    function addSkipLinks() {
        const skipLinks = document.createElement('div');
        skipLinks.style.cssText = `
            position: absolute; top: -40px; left: 0; z-index: 10001;
            background: #000; color: white; padding: 8px;
        `;
        skipLinks.innerHTML = `
            <a href="#main-content" style="color: white;">Aller au contenu principal</a> |
            <a href="#navigation" style="color: white;">Aller à la navigation</a>
        `;
        
        skipLinks.addEventListener('focus', () => {
            skipLinks.style.top = '0';
        });
        
        skipLinks.addEventListener('blur', () => {
            skipLinks.style.top = '-40px';
        });
        
        document.body.insertBefore(skipLinks, document.body.firstChild);
    }
    
    function improveFormAccessibility() {
        const inputs = document.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            if (!input.getAttribute('aria-label') && !input.getAttribute('aria-labelledby')) {
                const label = input.previousElementSibling;
                if (label && label.tagName === 'LABEL') {
                    const id = 'input-' + Math.random().toString(36).substr(2, 9);
                    input.id = id;
                    label.setAttribute('for', id);
                } else {
                    input.setAttribute('aria-label', input.placeholder || input.name || 'Champ de saisie');
                }
            }
        });
    }
    
    function addLandmarks() {
        // Ajouter des rôles ARIA aux éléments principaux
        const main = document.querySelector('main, .main-content, #main');
        if (main) main.setAttribute('role', 'main');
        
        const nav = document.querySelector('nav, .navigation, .navbar');
        if (nav) nav.setAttribute('role', 'navigation');
        
        const header = document.querySelector('header, .header');
        if (header) header.setAttribute('role', 'banner');
        
        const footer = document.querySelector('footer, .footer');
        if (footer) footer.setAttribute('role', 'contentinfo');
    }
    
    // Initialiser les améliorations d'accessibilité
    setTimeout(() => {
        addAccessibilityToolbar();
        addSkipLinks();
        improveFormAccessibility();
        addLandmarks();
    }, 1000);
    
    // Observer pour améliorer les nouveaux éléments
    const observer = new MutationObserver(() => {
        improveFormAccessibility();
        addLandmarks();
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    
    console.log('♿ Améliorations d\'accessibilité activées');
})();