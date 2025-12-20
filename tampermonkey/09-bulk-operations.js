// ==UserScript==
// @name         IAPosteManager - Bulk Operations
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Opérations en lot pour IAPosteManager
// @author       You
// @match        https://iapostemanager.onrender.com/*
// @match        http://localhost:5000/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
    function addBulkOperationsPanel() {
        const panel = document.createElement('div');
        panel.id = 'bulk-operations-panel';
        panel.style.cssText = `
            position: fixed; top: 100px; right: 10px; z-index: 9999;
            background: white; border: 1px solid #ddd; border-radius: 5px;
            width: 350px; padding: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            display: none;
        `;
        
        panel.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3 style="margin: 0;">📦 Opérations en lot</h3>
                <span style="cursor: pointer; font-size: 20px;" onclick="toggleBulkPanel()">×</span>
            </div>
            
            <div style="margin-bottom: 15px;">
                <label>📧 Envoi en masse:</label>
                <textarea id="bulk-recipients" placeholder="email1@example.com&#10;email2@example.com&#10;..." 
                    style="width: 100%; height: 80px; margin: 5px 0;"></textarea>
                <input type="text" id="bulk-subject" placeholder="Sujet de l'email" style="width: 100%; margin: 5px 0;">
                <textarea id="bulk-message" placeholder="Message..." style="width: 100%; height: 60px; margin: 5px 0;"></textarea>
                <button onclick="sendBulkEmails()" style="background: #007cba; color: white; border: none; padding: 8px 15px; border-radius: 3px;">
                    Envoyer à tous
                </button>
            </div>
            
            <div style="margin-bottom: 15px;">
                <label>📋 Import CSV:</label>
                <input type="file" id="csv-file" accept=".csv" style="margin: 5px 0;">
                <button onclick="importCSV()" style="background: #28a745; color: white; border: none; padding: 8px 15px; border-radius: 3px;">
                    Importer CSV
                </button>
            </div>
            
            <div style="margin-bottom: 15px;">
                <label>🔄 Actions rapides:</label><br>
                <button onclick="selectAllEmails()" style="margin: 2px; padding: 5px 10px;">Tout sélectionner</button>
                <button onclick="markAllAsRead()" style="margin: 2px; padding: 5px 10px;">Marquer lu</button>
                <button onclick="deleteSelected()" style="margin: 2px; padding: 5px 10px; background: #dc3545; color: white;">Supprimer</button>
            </div>
            
            <div id="bulk-status" style="margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 3px; display: none;"></div>
        `;
        
        document.body.appendChild(panel);
    }
    
    function addBulkToggleButton() {
        const button = document.createElement('button');
        button.innerHTML = '📦';
        button.style.cssText = `
            position: fixed; top: 100px; right: 10px; z-index: 9999;
            background: #007cba; color: white; border: none;
            border-radius: 50%; width: 50px; height: 50px;
            cursor: pointer; font-size: 20px;
        `;
        button.onclick = () => toggleBulkPanel();
        document.body.appendChild(button);
    }
    
    window.toggleBulkPanel = function() {
        const panel = document.getElementById('bulk-operations-panel');
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    };
    
    window.sendBulkEmails = async function() {
        const recipients = document.getElementById('bulk-recipients').value.split('\n').filter(email => email.trim());
        const subject = document.getElementById('bulk-subject').value;
        const message = document.getElementById('bulk-message').value;
        const status = document.getElementById('bulk-status');
        
        if (!recipients.length || !subject || !message) {
            alert('Veuillez remplir tous les champs');
            return;
        }
        
        status.style.display = 'block';
        status.innerHTML = '🔄 Envoi en cours...';
        
        let sent = 0;
        let failed = 0;
        
        for (const recipient of recipients) {
            try {
                const response = await fetch('/api/send-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to: recipient.trim(),
                        subject: subject,
                        body: message
                    })
                });
                
                if (response.ok) {
                    sent++;
                } else {
                    failed++;
                }
                
                status.innerHTML = `📧 Envoyés: ${sent} | ❌ Échecs: ${failed} | 🔄 Restants: ${recipients.length - sent - failed}`;
                
                // Pause pour éviter le spam
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (error) {
                failed++;
                console.error('Erreur envoi:', error);
            }
        }
        
        status.innerHTML = `✅ Terminé! Envoyés: ${sent} | Échecs: ${failed}`;
        setTimeout(() => status.style.display = 'none', 5000);
    };
    
    window.importCSV = function() {
        const fileInput = document.getElementById('csv-file');
        const file = fileInput.files[0];
        
        if (!file) {
            alert('Veuillez sélectionner un fichier CSV');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const csv = e.target.result;
            const lines = csv.split('\n');
            const emails = [];
            
            lines.forEach(line => {
                const columns = line.split(',');
                // Chercher une colonne qui ressemble à un email
                columns.forEach(col => {
                    if (col.includes('@')) {
                        emails.push(col.trim().replace(/"/g, ''));
                    }
                });
            });
            
            document.getElementById('bulk-recipients').value = emails.join('\n');
            alert(`${emails.length} emails importés depuis le CSV`);
        };
        
        reader.readAsText(file);
    };
    
    window.selectAllEmails = function() {
        const checkboxes = document.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => cb.checked = true);
        
        // Ajouter des checkboxes si elles n'existent pas
        const emailItems = document.querySelectorAll('.email-item, .message-item, tr');
        emailItems.forEach((item, index) => {
            if (!item.querySelector('input[type="checkbox"]')) {
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.style.marginRight = '10px';
                checkbox.checked = true;
                item.insertBefore(checkbox, item.firstChild);
            }
        });
    };
    
    window.markAllAsRead = function() {
        const selectedItems = getSelectedItems();
        selectedItems.forEach(item => {
            item.style.opacity = '0.7';
            item.style.fontWeight = 'normal';
        });
        alert(`${selectedItems.length} emails marqués comme lus`);
    };
    
    window.deleteSelected = function() {
        const selectedItems = getSelectedItems();
        if (selectedItems.length === 0) {
            alert('Aucun email sélectionné');
            return;
        }
        
        if (confirm(`Supprimer ${selectedItems.length} emails sélectionnés ?`)) {
            selectedItems.forEach(item => {
                item.style.transition = 'opacity 0.3s';
                item.style.opacity = '0';
                setTimeout(() => item.remove(), 300);
            });
        }
    };
    
    function getSelectedItems() {
        const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
        return Array.from(checkboxes).map(cb => cb.closest('.email-item, .message-item, tr')).filter(item => item);
    }
    
    function addQuickActions() {
        // Ajouter des actions rapides aux emails existants
        const emailItems = document.querySelectorAll('.email-item, .message-item');
        emailItems.forEach(item => {
            if (!item.querySelector('.quick-actions')) {
                const actions = document.createElement('div');
                actions.className = 'quick-actions';
                actions.style.cssText = 'float: right; margin-left: 10px;';
                actions.innerHTML = `
                    <button onclick="quickReply(this)" style="font-size: 12px; padding: 2px 5px; margin: 0 2px;">↩️</button>
                    <button onclick="quickForward(this)" style="font-size: 12px; padding: 2px 5px; margin: 0 2px;">➡️</button>
                    <button onclick="quickDelete(this)" style="font-size: 12px; padding: 2px 5px; margin: 0 2px;">🗑️</button>
                `;
                item.appendChild(actions);
            }
        });
    }
    
    window.quickReply = function(button) {
        const emailItem = button.closest('.email-item, .message-item');
        // Logique de réponse rapide
        alert('Fonction de réponse rapide - À implémenter');
    };
    
    window.quickForward = function(button) {
        const emailItem = button.closest('.email-item, .message-item');
        // Logique de transfert rapide
        alert('Fonction de transfert rapide - À implémenter');
    };
    
    window.quickDelete = function(button) {
        const emailItem = button.closest('.email-item, .message-item');
        if (confirm('Supprimer cet email ?')) {
            emailItem.style.transition = 'opacity 0.3s';
            emailItem.style.opacity = '0';
            setTimeout(() => emailItem.remove(), 300);
        }
    };
    
    // Initialiser
    setTimeout(() => {
        addBulkOperationsPanel();
        addBulkToggleButton();
        addQuickActions();
    }, 2000);
    
    // Observer pour ajouter les actions aux nouveaux emails
    const observer = new MutationObserver(() => {
        addQuickActions();
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    
    console.log('📦 Opérations en lot activées');
})();