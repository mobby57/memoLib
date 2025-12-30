/**
 * IAPosteManager Unified v3.0 - JavaScript Principal
 * Interface moderne unifiée avec toutes les fonctionnalités
 */

class UnifiedApp {
    constructor() {
        this.currentView = 'composer';
        this.isRecording = false;
        this.socket = null;
        this.credentials = null;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupWebSocket();
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
        
        // Voice toggle
        document.getElementById('voiceToggle')?.addEventListener('click', () => {
            this.toggleVoiceMode();
        });
        
        // Sidebar toggle (mobile)
        document.getElementById('sidebarToggle')?.addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('open');
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
        
        // Voice recording
        document.getElementById('recordBtn')?.addEventListener('click', () => {
            this.toggleRecording();
        });
        
        document.getElementById('stopBtn')?.addEventListener('click', () => {
            this.stopRecording();
        });
        
        document.getElementById('transcribeBtn')?.addEventListener('click', () => {
            this.transcribeAudio();
        });
        
        document.getElementById('useTranscriptionBtn')?.addEventListener('click', () => {
            this.useTranscriptionForEmail();
        });
        
        // Settings
        document.getElementById('saveGmailBtn')?.addEventListener('click', () => {
            this.saveGmailSettings();
        });
        
        document.getElementById('saveOpenaiBtn')?.addEventListener('click', () => {
            this.saveOpenaiSettings();
        });
    }
    
    setupWebSocket() {
        try {
            this.socket = io();
            
            this.socket.on('recording_started', (data) => {
                this.showNotification('Enregistrement démarré 🎤', 'success');
            });
            
            this.socket.on('recording_stopped', (data) => {
                this.showNotification('Enregistrement arrêté ⏹️', 'info');
            });
            
            this.socket.on('transcription_update', (data) => {
                this.updateLiveTranscription(data.text);
            });
        } catch (error) {
            console.log('WebSocket non disponible');
        }
    }
    
    switchView(viewName) {
        // Update active menu item
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-view="${viewName}"]`).classList.add('active');
        
        // Switch views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });
        document.getElementById(`${viewName}-view`).classList.add('active');
        
        this.currentView = viewName;
        
        // Load view-specific data
        if (viewName === 'history') {
            this.loadEmailHistory();
        } else if (viewName === 'settings') {
            this.loadSettings();
        }
    }
    
    async generateEmail() {
        const context = document.getElementById('contextInput').value;
        const tone = document.getElementById('toneSelect').value;
        const type = document.getElementById('typeSelect').value;
        const generateBtn = document.getElementById('generateBtn');
        
        if (!context.trim()) {
            this.showNotification('Veuillez décrire votre contexte', 'error');
            return;
        }
        
        generateBtn.disabled = true;
        generateBtn.innerHTML = '<span class="icon">⏳</span> Génération...';
        
        try {
            const response = await fetch('/api/generate-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ context, tone, emailType: type })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.displayGeneratedEmail(data.subject, data.body, data.source);
                this.showNotification(`Email généré avec ${data.source === 'openai' ? 'OpenAI' : 'template'} ✨`, 'success');
            } else {
                this.showNotification(data.error || 'Erreur génération', 'error');
            }
        } catch (error) {
            this.showNotification('Erreur de connexion', 'error');
        } finally {
            generateBtn.disabled = false;
            generateBtn.innerHTML = '<span class="icon">✨</span> Générer avec IA';
        }
    }
    
    displayGeneratedEmail(subject, body, source) {
        const preview = document.getElementById('emailPreview');
        const actions = document.getElementById('emailActions');
        
        preview.innerHTML = `
            <div class="email-subject">${subject}</div>
            <div class="email-body">${body}</div>
            <div class="email-source" style="margin-top: 1rem; font-size: 0.9rem; color: var(--text-muted);">
                Généré avec: ${source === 'openai' ? '🤖 OpenAI GPT' : '📋 Template local'}
            </div>
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
        
        sendBtn.disabled = true;
        sendBtn.innerHTML = '<span class="icon">⏳</span> Envoi...';
        
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
                this.loadEmailHistory(); // Refresh history
            } else {
                this.showNotification(data.error || 'Erreur envoi', 'error');
            }
        } catch (error) {
            this.showNotification('Erreur de connexion', 'error');
        } finally {
            sendBtn.disabled = false;
            sendBtn.innerHTML = '<span class="icon">📤</span> Envoyer';
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
        
        sendBtn.disabled = true;
        sendBtn.innerHTML = '<span class="icon">⏳</span> Envoi...';
        
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
            sendBtn.innerHTML = '<span class="icon">📤</span> Envoyer';
        }
    }
    
    toggleRecording() {
        const recordBtn = document.getElementById('recordBtn');
        const stopBtn = document.getElementById('stopBtn');
        const status = document.getElementById('recordingStatus');
        
        if (!this.isRecording) {
            this.startRecording();
            recordBtn.classList.add('recording');
            recordBtn.innerHTML = '<div class="record-icon">🔴</div><span>Enregistrement...</span>';
            stopBtn.disabled = false;
            status.classList.add('active');
            this.isRecording = true;
            
            if (this.socket) {
                this.socket.emit('start_recording');
            }
        }
    }
    
    stopRecording() {
        const recordBtn = document.getElementById('recordBtn');
        const stopBtn = document.getElementById('stopBtn');
        const transcribeBtn = document.getElementById('transcribeBtn');
        const status = document.getElementById('recordingStatus');
        
        recordBtn.classList.remove('recording');
        recordBtn.innerHTML = '<div class="record-icon">🎤</div><span>Cliquer pour parler</span>';
        stopBtn.disabled = true;
        transcribeBtn.disabled = false;
        status.classList.remove('active');
        this.isRecording = false;
        
        if (this.socket) {
            this.socket.emit('stop_recording');
        }
        
        this.showNotification('Enregistrement terminé. Cliquez sur Transcrire.', 'info');
    }
    
    async transcribeAudio() {
        const transcribeBtn = document.getElementById('transcribeBtn');
        const transcriptionBox = document.getElementById('transcriptionBox');
        
        transcribeBtn.disabled = true;
        transcribeBtn.innerHTML = '<span class="icon">⏳</span> Transcription...';
        
        // Simulation de transcription (remplacer par vraie implémentation)
        setTimeout(() => {
            const mockTranscription = "Bonjour, je souhaiterais obtenir des informations concernant ma demande de remboursement. Pourriez-vous me tenir informé de l'avancement de mon dossier ? Merci beaucoup.";
            
            transcriptionBox.innerHTML = `
                <div class="transcription-result">
                    <strong>📝 Transcription:</strong>
                    <p>${mockTranscription}</p>
                </div>
            `;
            
            document.getElementById('transcriptionActions').style.display = 'block';
            this.currentTranscription = mockTranscription;
            
            transcribeBtn.disabled = false;
            transcribeBtn.innerHTML = '<span class="icon">📝</span> Transcrire';
            
            this.showNotification('Transcription terminée ! 🎉', 'success');
        }, 2000);
    }
    
    useTranscriptionForEmail() {
        if (this.currentTranscription) {
            document.getElementById('contextInput').value = this.currentTranscription;
            this.switchView('composer');
            this.showNotification('Transcription ajoutée au compositeur', 'success');
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
        const openaiStatus = document.getElementById('openaiStatus');
        
        if (gmailStatus) {
            gmailStatus.textContent = data.has_gmail ? '✅ Configuré' : '❌ Non configuré';
            gmailStatus.style.color = data.has_gmail ? 'var(--success)' : 'var(--danger)';
        }
        
        if (openaiStatus) {
            openaiStatus.textContent = data.has_openai ? '✅ Configuré' : '❌ Non configuré';
            openaiStatus.style.color = data.has_openai ? 'var(--success)' : 'var(--danger)';
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
        
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="icon">⏳</span> Sauvegarde...';
        
        try {
            const response = await fetch('/api/credentials', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email, 
                    app_password: password,
                    password: 'master-password' // À améliorer
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
            saveBtn.innerHTML = '<span class="icon">💾</span> Sauvegarder Gmail';
        }
    }
    
    async saveOpenaiSettings() {
        const apiKey = document.getElementById('openaiKey').value;
        const saveBtn = document.getElementById('saveOpenaiBtn');
        
        if (!apiKey) {
            this.showNotification('Clé API requise', 'error');
            return;
        }
        
        if (!apiKey.startsWith('sk-')) {
            this.showNotification('Clé API invalide (doit commencer par sk-)', 'error');
            return;
        }
        
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="icon">⏳</span> Sauvegarde...';
        
        try {
            const response = await fetch('/api/credentials', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    openai_key: apiKey,
                    password: 'master-password' // À améliorer
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showNotification('Configuration OpenAI sauvegardée ! ✅', 'success');
                document.getElementById('openaiKey').value = '';
                this.loadCredentials();
            } else {
                this.showNotification(data.error || 'Erreur sauvegarde', 'error');
            }
        } catch (error) {
            this.showNotification('Erreur de connexion', 'error');
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<span class="icon">💾</span> Sauvegarder OpenAI';
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
    
    toggleVoiceMode() {
        const indicator = document.getElementById('voiceIndicator');
        const isActive = indicator.classList.contains('show');
        
        if (isActive) {
            indicator.classList.remove('show');
            this.showNotification('Mode vocal désactivé', 'info');
        } else {
            indicator.classList.add('show');
            this.showNotification('Mode vocal activé 🎤', 'success');
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
    
    updateLiveTranscription(text) {
        const transcriptionBox = document.getElementById('transcriptionBox');
        if (transcriptionBox) {
            transcriptionBox.innerHTML = `
                <div class="live-transcript">
                    <h4>🎤 Transcription en temps réel</h4>
                    <p>${text}</p>
                </div>
            `;
        }
    }
    
    startRecording() {
        // Implémentation de l'enregistrement audio
        console.log('Démarrage enregistrement audio...');
    }
}

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', () => {
    window.unifiedApp = new UnifiedApp();
});

// Raccourcis clavier
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
            case '1':
                e.preventDefault();
                window.unifiedApp?.switchView('composer');
                break;
            case '2':
                e.preventDefault();
                window.unifiedApp?.switchView('send');
                break;
            case '3':
                e.preventDefault();
                window.unifiedApp?.switchView('history');
                break;
            case 'Enter':
                if (window.unifiedApp?.currentView === 'composer') {
                    e.preventDefault();
                    window.unifiedApp?.generateEmail();
                }
                break;
        }
    }
});