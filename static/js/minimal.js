/**
 * IAPosteManager Minimal - JavaScript simplifié
 */

class MinimalApp {
    constructor() {
        this.currentView = 'composer';
        this.credentials = null;
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadCredentials();
        this.setupTheme();
        this.loadEmailHistory();
    }
    
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                this.switchView(view);
            });
        });
        
        // Theme toggle
        document.getElementById('themeToggle')?.addEventListener('click', () => {
            this.toggleTheme();
        });
        
        // Composer IA
        document.getElementById('generateBtn')?.addEventListener('click', () => {
            this.generateEmail();
        });
        
        document.getElementById('sendBtn')?.addEventListener('click', () => {
            this.sendGeneratedEmail();
        });
        
        // Envoi rapide
        document.getElementById('quickSendBtn')?.addEventListener('click', () => {
            this.sendQuickEmail();
        });
        
        // Settings
        document.getElementById('saveGmailBtn')?.addEventListener('click', () => {
            this.saveGmailSettings();
        });
    }
    
    switchView(viewName) {
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-view="${viewName}"]`).classList.add('active');
        
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });
        document.getElementById(`${viewName}-view`).classList.add('active');
        
        this.currentView = viewName;
        
        if (viewName === 'history') {
            this.loadEmailHistory();
        } else if (viewName === 'settings') {
            this.loadSettings();
        }
    }
    
    async generateEmail() {
        const context = document.getElementById('contextInput').value;
        const tone = document.getElementById('toneSelect').value;
        const generateBtn = document.getElementById('generateBtn');
        
        if (!context.trim()) {
            this.showNotification('Veuillez décrire votre contexte', 'error');
            return;
        }
        
        generateBtn.disabled = true;
        generateBtn.innerHTML = '⏳ Génération...';
        
        try {
            const response = await fetch('/api/generate-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ context, tone })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.displayGeneratedEmail(data.subject, data.body);
                this.showNotification('Email généré ✨', 'success');
            } else {
                this.showNotification(data.error || 'Erreur génération', 'error');
            }
        } catch (error) {
            this.showNotification('Erreur de connexion', 'error');
        } finally {
            generateBtn.disabled = false;
            generateBtn.innerHTML = '✨ Générer avec IA';
        }
    }
    
    displayGeneratedEmail(subject, body) {
        const preview = document.getElementById('emailPreview');
        const actions = document.getElementById('emailActions');
        
        preview.innerHTML = `
            <div class="email-subject">${subject}</div>
            <div class="email-body">${body}</div>
        `;
        
        actions.style.display = 'flex';
    }
    
    async sendGeneratedEmail() {
        const recipient = document.getElementById('recipientInput').value;
        const subject = document.querySelector('.email-subject')?.textContent;
        const body = document.querySelector('.email-body')?.textContent;
        const sendBtn = document.getElementById('sendBtn');
        
        if (!recipient || !subject || !body) {
            this.showNotification('Données manquantes', 'error');
            return;
        }
        
        if (!this.isValidEmail(recipient)) {
            this.showNotification('Email destinataire invalide', 'error');
            return;
        }
        
        if (!confirm(`Envoyer cet email à ${recipient} ?`)) {
            return;
        }
        
        sendBtn.disabled = true;
        sendBtn.innerHTML = '⏳ Envoi...';
        
        try {
            const response = await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ recipient, subject, body })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showNotification('Email envoyé avec succès ! 🎉', 'success');
                this.clearComposer();
                this.loadEmailHistory();
            } else {
                this.showNotification(data.error || 'Erreur envoi', 'error');
            }
        } catch (error) {
            this.showNotification('Erreur de connexion', 'error');
        } finally {
            sendBtn.disabled = false;
            sendBtn.innerHTML = '📤 Envoyer';
        }
    }
    
    async sendQuickEmail() {
        const recipient = document.getElementById('quickRecipient').value;
        const subject = document.getElementById('quickSubject').value;
        const body = document.getElementById('quickBody').value;
        const sendBtn = document.getElementById('quickSendBtn');
        
        if (!recipient || !subject || !body) {
            this.showNotification('Tous les champs sont requis', 'error');
            return;
        }
        
        if (!this.isValidEmail(recipient)) {
            this.showNotification('Email destinataire invalide', 'error');
            return;
        }
        
        if (!confirm(`Envoyer cet email à ${recipient} ?`)) {
            return;
        }
        
        sendBtn.disabled = true;
        sendBtn.innerHTML = '⏳ Envoi...';
        
        try {
            const response = await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ recipient, subject, body })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showNotification('Email envoyé avec succès ! 🎉', 'success');
                this.clearQuickForm();
                this.loadEmailHistory();
            } else {
                this.showNotification(data.error || 'Erreur envoi', 'error');
            }
        } catch (error) {
            this.showNotification('Erreur de connexion', 'error');
        } finally {
            sendBtn.disabled = false;
            sendBtn.innerHTML = '📤 Envoyer';
        }
    }
    
    async loadEmailHistory() {
        const emailList = document.getElementById('emailList');
        const totalEmails = document.getElementById('totalEmails');
        
        if (!emailList) return;
        
        emailList.innerHTML = '<div class="loading">Chargement...</div>';
        
        try {
            const response = await fetch('/api/email-history');
            const data = await response.json();
            
            if (data.success && data.emails.length > 0) {
                emailList.innerHTML = data.emails.map(email => `
                    <div class="email-item">
                        <div class="email-header">
                            <span class="email-recipient">${email.recipient}</span>
                            <span class="email-date">${new Date(email.created_at).toLocaleDateString('fr-FR')}</span>
                        </div>
                        <div class="email-subject-item">${email.subject}</div>
                        <div class="email-preview-text">${email.body.substring(0, 100)}...</div>
                    </div>
                `).join('');
                
                if (totalEmails) {
                    totalEmails.textContent = data.emails.length;
                }
            } else {
                emailList.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">📭</div>
                        <p>Aucun email envoyé pour le moment</p>
                    </div>
                `;
            }
        } catch (error) {
            emailList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">❌</div>
                    <p>Erreur de chargement</p>
                </div>
            `;
        }
    }
    
    async loadCredentials() {
        try {
            const response = await fetch('/api/credentials');
            const data = await response.json();
            
            if (data.success) {
                this.credentials = data;
                this.updateCredentialsStatus(data);
            }
        } catch (error) {
            console.error('Erreur chargement credentials:', error);
        }
    }
    
    async loadSettings() {
        if (this.credentials) {
            const gmailEmail = document.getElementById('gmailEmail');
            if (gmailEmail && this.credentials.email) {
                gmailEmail.value = this.credentials.email;
            }
        }
    }
    
    updateCredentialsStatus(data) {
        const gmailStatus = document.getElementById('gmailStatus');
        
        if (gmailStatus) {
            gmailStatus.textContent = data.has_gmail ? '✅ Configuré' : '❌ Non configuré';
            gmailStatus.style.color = data.has_gmail ? 'var(--success)' : 'var(--danger)';
        }
    }
    
    async saveGmailSettings() {
        const email = document.getElementById('gmailEmail').value;
        const password = document.getElementById('gmailPassword').value;
        const saveBtn = document.getElementById('saveGmailBtn');
        
        if (!email || !password) {
            this.showNotification('Email et mot de passe requis', 'error');
            return;
        }
        
        if (!this.isValidEmail(email)) {
            this.showNotification('Email invalide', 'error');
            return;
        }
        
        if (!confirm('Sauvegarder les identifiants Gmail ?')) {
            return;
        }
        
        saveBtn.disabled = true;
        saveBtn.innerHTML = '⏳ Sauvegarde...';
        
        try {
            const response = await fetch('/api/credentials', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email, 
                    app_password: password
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showNotification('Configuration Gmail sauvegardée ! ✅', 'success');
                document.getElementById('gmailPassword').value = '';
                this.loadCredentials();
            } else {
                this.showNotification(data.error || 'Erreur sauvegarde', 'error');
            }
        } catch (error) {
            this.showNotification('Erreur de connexion', 'error');
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '💾 Sauvegarder Gmail';
        }
    }
    
    setupTheme() {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeToggle(savedTheme);
    }
    
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        this.updateThemeToggle(newTheme);
        
        this.showNotification(`Mode ${newTheme === 'dark' ? 'sombre' : 'clair'} activé`, 'info');
    }
    
    updateThemeToggle(theme) {
        const toggle = document.getElementById('themeToggle');
        if (toggle) {
            toggle.textContent = theme === 'dark' ? '☀️' : '🌙';
        }
    }
    
    clearComposer() {
        document.getElementById('contextInput').value = '';
        document.getElementById('recipientInput').value = '';
        document.getElementById('emailPreview').innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🤖</div>
                <p>Décrivez votre contexte et cliquez sur "Générer avec IA"</p>
            </div>
        `;
        document.getElementById('emailActions').style.display = 'none';
    }
    
    clearQuickForm() {
        document.getElementById('quickRecipient').value = '';
        document.getElementById('quickSubject').value = '';
        document.getElementById('quickBody').value = '';
    }
    
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        const icon = notification.querySelector('.notification-icon');
        const messageEl = notification.querySelector('.notification-message');
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        icon.textContent = icons[type] || icons.info;
        messageEl.textContent = message;
        
        notification.className = `notification ${type}`;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 4000);
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    window.minimalApp = new MinimalApp();
});