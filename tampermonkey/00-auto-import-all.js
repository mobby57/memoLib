// ==UserScript==
// @name         IAPosteManager - Auto Import All Scripts
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Import automatique de tous les scripts Tampermonkey
// @author       You
// @match        https://iapostemanager.onrender.com/*
// @match        http://localhost:5000/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
    const scripts = [
        {
            name: 'Auto Login',
            code: `// Auto-login pour IAPosteManager
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
}`
        },
        {
            name: 'Email Templates',
            code: `// Templates d'emails rapides
const templates = {
    'urgent': { subject: 'URGENT - Demande prioritaire', body: 'Bonjour,\\n\\nJe vous contacte en urgence concernant...\\n\\nCordialement' },
    'rdv': { subject: 'Demande de rendez-vous', body: 'Bonjour,\\n\\nJe souhaiterais prendre rendez-vous...\\n\\nCordialement' },
    'info': { subject: 'Demande d\\'information', body: 'Bonjour,\\n\\nPourriez-vous me renseigner sur...\\n\\nCordialement' }
};

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
        btn.onclick = () => {
            const template = templates[key];
            const subjectField = document.querySelector('input[name="subject"], #subject');
            const bodyField = document.querySelector('textarea[name="body"], #message, #content');
            if (subjectField) subjectField.value = template.subject;
            if (bodyField) bodyField.value = template.body;
        };
        buttonContainer.appendChild(btn);
    });
    
    composer.insertBefore(buttonContainer, composer.firstChild);
}

const observer = new MutationObserver(() => addTemplateButtons());
observer.observe(document.body, { childList: true, subtree: true });
addTemplateButtons();`
        },
        {
            name: 'Keyboard Shortcuts',
            code: `// Raccourcis clavier
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        const composeBtn = document.querySelector('button[onclick*="compose"], .compose-btn, #new-email');
        if (composeBtn) composeBtn.click();
    }
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        const sendBtn = document.querySelector('button[type="submit"], .send-btn, #send-email');
        if (sendBtn) sendBtn.click();
    }
    if (e.ctrlKey && e.key === 'g') {
        e.preventDefault();
        const aiBtn = document.querySelector('.ai-generate, #generate-ai, button[onclick*="generate"]');
        if (aiBtn) aiBtn.click();
    }
    if (e.ctrlKey && e.key === 'h') {
        e.preventDefault();
        window.location.href = '/history';
    }
    if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        window.location.href = '/dashboard';
    }
    if (e.key === 'F1') {
        e.preventDefault();
        alert('Raccourcis IAPosteManager:\\n• Ctrl+N : Nouveau message\\n• Ctrl+S : Envoyer\\n• Ctrl+G : Générer avec IA\\n• Ctrl+H : Historique\\n• Ctrl+D : Dashboard\\n• F1 : Cette aide');
    }
});`
        },
        {
            name: 'Dark Mode',
            code: `// Mode sombre
const darkCSS = \`body { background: #1a1a1a !important; color: #e0e0e0 !important; }
.container, .card, .form-group { background: #2d2d2d !important; color: #e0e0e0 !important; }
input, textarea, select { background: #3d3d3d !important; color: #e0e0e0 !important; border: 1px solid #555 !important; }
button { background: #007cba !important; color: white !important; }
.navbar, .header { background: #2d2d2d !important; }
.sidebar { background: #1a1a1a !important; }
.email-item { background: #2d2d2d !important; border-bottom: 1px solid #555 !important; }
.email-item:hover { background: #3d3d3d !important; }
a { color: #4da6ff !important; }\`;

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

const button = document.createElement('button');
button.innerHTML = '🌙';
button.style.cssText = 'position: fixed; top: 10px; right: 10px; z-index: 9999; background: #007cba; color: white; border: none; border-radius: 50%; width: 40px; height: 40px; cursor: pointer; font-size: 16px;';
button.onclick = toggleDarkMode;
document.body.appendChild(button);

if (localStorage.getItem('darkMode') === 'true') {
    const style = document.createElement('style');
    style.id = 'dark-mode-style';
    style.textContent = darkCSS;
    document.head.appendChild(style);
}`
        },
        {
            name: 'Auto Save',
            code: `// Sauvegarde automatique
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
        
        let indicator = document.getElementById('save-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'save-indicator';
            indicator.style.cssText = 'position: fixed; top: 50px; right: 10px; z-index: 9999; background: #28a745; color: white; padding: 5px 10px; border-radius: 3px; font-size: 12px; opacity: 0; transition: opacity 0.3s;';
            document.body.appendChild(indicator);
        }
        
        indicator.textContent = '✓ Sauvegardé';
        indicator.style.opacity = '1';
        setTimeout(() => indicator.style.opacity = '0', 2000);
    }
}

const observer = new MutationObserver(() => {
    const emailForm = document.querySelector('.email-composer, #compose-form, form[action*="send"]');
    if (emailForm && !emailForm.dataset.autoSaveEnabled) {
        emailForm.dataset.autoSaveEnabled = 'true';
        if (saveInterval) clearInterval(saveInterval);
        saveInterval = setInterval(autoSave, 10000);
        
        setTimeout(() => {
            const draft = localStorage.getItem('iaposte_draft');
            if (draft && confirm('Restaurer le brouillon sauvegardé ?')) {
                const data = JSON.parse(draft);
                const subjectField = document.querySelector('input[name="subject"], #subject');
                const bodyField = document.querySelector('textarea[name="body"], #message, #content');
                const recipientField = document.querySelector('input[name="to"], #recipient');
                if (subjectField && data.subject) subjectField.value = data.subject;
                if (bodyField && data.body) bodyField.value = data.body;
                if (recipientField && data.recipient) recipientField.value = data.recipient;
            }
        }, 1000);
    }
});

observer.observe(document.body, { childList: true, subtree: true });`
        }
    ];
    
    // Exécuter tous les scripts
    scripts.forEach(script => {
        try {
            eval(script.code);
            console.log(`✅ ${script.name} activé`);
        } catch (error) {
            console.error(`❌ Erreur ${script.name}:`, error);
        }
    });
    
    // Afficher notification d'activation
    setTimeout(() => {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 10000;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; padding: 15px 25px; border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3); font-weight: bold;
        `;
        notification.innerHTML = `🚀 IAPosteManager Scripts Activés! (${scripts.length} fonctionnalités)`;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transition = 'opacity 0.5s';
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }, 1000);
    
    console.log('🚀 IAPosteManager - Tous les scripts importés automatiquement!');
})();