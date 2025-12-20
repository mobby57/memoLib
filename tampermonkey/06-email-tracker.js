// ==UserScript==
// @name         IAPosteManager - Email Tracker
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Suivi des emails envoyés
// @author       You
// @match        https://iapostemanager.onrender.com/*
// @match        http://localhost:5000/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
    function trackEmail(emailData) {
        const tracking = JSON.parse(localStorage.getItem('email_tracking') || '[]');
        const trackingEntry = {
            id: Date.now(),
            subject: emailData.subject,
            recipient: emailData.recipient,
            sentAt: new Date().toISOString(),
            status: 'sent',
            opens: 0,
            clicks: 0
        };
        
        tracking.push(trackingEntry);
        localStorage.setItem('email_tracking', JSON.stringify(tracking));
        showTrackingNotification(trackingEntry);
    }
    
    function showTrackingNotification(entry) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 10000;
            background: #28a745; color: white; padding: 15px;
            border-radius: 5px; max-width: 300px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        `;
        notification.innerHTML = `
            <strong>📧 Email suivi</strong><br>
            À: ${entry.recipient}<br>
            Sujet: ${entry.subject}<br>
            <small>ID: ${entry.id}</small>
        `;
        
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 5000);
    }
    
    function addTrackingPanel() {
        if (document.getElementById('tracking-panel')) return;
        
        const panel = document.createElement('div');
        panel.id = 'tracking-panel';
        panel.style.cssText = `
            position: fixed; bottom: 20px; right: 20px; z-index: 9999;
            background: white; border: 1px solid #ddd; border-radius: 5px;
            width: 300px; max-height: 400px; overflow-y: auto;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1); display: none;
        `;
        
        const header = document.createElement('div');
        header.style.cssText = 'background: #007cba; color: white; padding: 10px; font-weight: bold;';
        header.innerHTML = '📊 Suivi des emails <span style="float:right; cursor:pointer;" onclick="this.parentElement.parentElement.style.display=\'none\'">×</span>';
        
        const content = document.createElement('div');
        content.id = 'tracking-content';
        content.style.padding = '10px';
        
        panel.appendChild(header);
        panel.appendChild(content);
        document.body.appendChild(panel);
        
        updateTrackingPanel();
    }
    
    function updateTrackingPanel() {
        const content = document.getElementById('tracking-content');
        if (!content) return;
        
        const tracking = JSON.parse(localStorage.getItem('email_tracking') || '[]');
        
        if (tracking.length === 0) {
            content.innerHTML = '<p>Aucun email suivi</p>';
            return;
        }
        
        content.innerHTML = tracking.slice(-10).reverse().map(entry => `
            <div style="border-bottom: 1px solid #eee; padding: 8px 0;">
                <strong>${entry.subject}</strong><br>
                <small>À: ${entry.recipient}</small><br>
                <small>Envoyé: ${new Date(entry.sentAt).toLocaleString()}</small><br>
                <span style="color: #28a745;">✓ ${entry.status}</span>
            </div>
        `).join('');
    }
    
    function addTrackingButton() {
        if (document.getElementById('tracking-toggle')) return;
        
        const button = document.createElement('button');
        button.id = 'tracking-toggle';
        button.innerHTML = '📊';
        button.style.cssText = `
            position: fixed; bottom: 20px; right: 20px; z-index: 9999;
            background: #007cba; color: white; border: none;
            border-radius: 50%; width: 50px; height: 50px;
            cursor: pointer; font-size: 20px;
        `;
        button.onclick = () => {
            const panel = document.getElementById('tracking-panel');
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
            updateTrackingPanel();
        };
        document.body.appendChild(button);
    }
    
    // Intercepter les envois d'emails
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        const [url, options] = args;
        
        if (url.includes('/send-email') || url.includes('/api/send')) {
            const result = originalFetch.apply(this, args);
            
            if (options && options.body) {
                try {
                    const data = JSON.parse(options.body);
                    if (data.subject && data.recipient) {
                        trackEmail(data);
                    }
                } catch (e) {}
            }
            
            return result;
        }
        
        return originalFetch.apply(this, args);
    };
    
    // Initialiser
    setTimeout(() => {
        addTrackingPanel();
        addTrackingButton();
    }, 2000);
})();