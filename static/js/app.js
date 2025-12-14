// Gestion du thème
const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;

const savedTheme = localStorage.getItem('theme') || 'dark';
html.setAttribute('data-theme', savedTheme);
themeToggle.querySelector('.icon').textContent = savedTheme === 'dark' ? '🌙' : '☀️';

themeToggle.addEventListener('click', () => {
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    themeToggle.querySelector('.icon').textContent = newTheme === 'dark' ? '🌙' : '☀️';
});

// Gestion des onglets
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const targetTab = tab.dataset.tab;
        
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        tab.classList.add('active');
        document.getElementById(targetTab).classList.add('active');
    });
});

// Notifications
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification show ${type}`;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

function showStatus(elementId, message, type = 'success') {
    const status = document.getElementById(elementId);
    status.textContent = message;
    status.className = `status show ${type}`;
    
    setTimeout(() => {
        status.classList.remove('show');
    }, 5000);
}

// Validation de la force du mot de passe
function checkPasswordStrength(password, elementId) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    
    element.className = 'password-strength';
    if (strength <= 2) element.classList.add('weak');
    else if (strength <= 4) element.classList.add('medium');
    else element.classList.add('strong');
}

// Toggle visibility password
document.querySelectorAll('.toggle-password').forEach(btn => {
    btn.addEventListener('click', () => {
        const targetId = btn.dataset.target;
        const input = document.getElementById(targetId);
        if (input.type === 'password') {
            input.type = 'text';
            btn.textContent = '🙈';
        } else {
            input.type = 'password';
            btn.textContent = '👁️';
        }
    });
});

// Vérification des credentials au chargement
async function checkCredentials() {
    try {
        const response = await fetch('/api/check-credentials');
        
        if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
            console.warn('API check-credentials non disponible');
            return;
        }
        
        const data = await response.json();
        
        const gmailEl = document.getElementById('gmailConfigured');
        const openaiEl = document.getElementById('openaiConfigured');
        
        if (gmailEl) gmailEl.textContent = data.gmail_exists ? '✅' : '❌';
        if (openaiEl) openaiEl.textContent = data.openai_exists ? '✅' : '❌';
        
        // Afficher les métadonnées
        if (data.metadata?.gmail) {
            const date = new Date(data.metadata.gmail.created_at).toLocaleDateString('fr-FR');
            const dateEl = document.getElementById('gmailDateValue');
            const containerEl = document.getElementById('gmailDate');
            if (dateEl) dateEl.textContent = date;
            if (containerEl) containerEl.style.display = 'flex';
        }
        if (data.metadata?.openai) {
            const date = new Date(data.metadata.openai.created_at).toLocaleDateString('fr-FR');
            const dateEl = document.getElementById('openaiDateValue');
            const containerEl = document.getElementById('openaiDate');
            if (dateEl) dateEl.textContent = date;
            if (containerEl) containerEl.style.display = 'flex';
        }
    } catch (error) {
        console.warn('Erreur chargement credentials:', error.message);
    }
}

// Écoute de la force du mot de passe
document.getElementById('gmailMaster')?.addEventListener('input', (e) => {
    checkPasswordStrength(e.target.value, 'gmailStrength');
});

document.getElementById('openaiMaster')?.addEventListener('input', (e) => {
    checkPasswordStrength(e.target.value, 'openaiStrength');
});

// Cache pour les données en attente de validation
let pendingGmailData = null;
let pendingOpenaiData = null;
let pendingRecipientData = null;

// Formulaire Gmail
document.getElementById('gmailForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const appPassword = document.getElementById('gmailPassword').value;
    const masterPassword = document.getElementById('gmailMaster').value;
    const email = document.getElementById('gmailEmail').value;
    
    pendingGmailData = { appPassword, masterPassword, email };
    
    document.getElementById('gmailPreviewContent').innerHTML = `
        <p><strong>Email:</strong> ${email || 'Non spécifié'}</p>
        <p><strong>App Password:</strong> ${'*'.repeat(appPassword.length)}</p>
    `;
    document.getElementById('gmailPreview').style.display = 'block';
});

document.getElementById('validateGmailBtn')?.addEventListener('click', async () => {
    if (!pendingGmailData) return;
    
    const btn = document.getElementById('validateGmailBtn');
    btn.disabled = true;
    btn.textContent = '⏳ Sauvegarde...';
    
    try {
        const response = await fetch('/api/save-gmail', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                app_password: pendingGmailData.appPassword,
                master_password: pendingGmailData.masterPassword,
                email: pendingGmailData.email
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            captureMasterPassword(pendingGmailData.masterPassword);
            showNotification('✅ Gmail configuré avec succès!', 'success');
            document.getElementById('gmailForm').reset();
            document.getElementById('gmailPreview').style.display = 'none';
            pendingGmailData = null;
            checkCredentials();
            autoFillMasterPassword();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        showNotification('❌ ' + error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<span class="icon">✅</span> Valider';
    }
});

document.getElementById('retryGmailBtn')?.addEventListener('click', () => {
    document.getElementById('gmailPreview').style.display = 'none';
    pendingGmailData = null;
});

// Formulaire OpenAI
document.getElementById('openaiForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const apiKey = document.getElementById('apiKey').value;
    const orgId = document.getElementById('orgId').value;
    const masterPassword = document.getElementById('openaiMaster').value;
    
    pendingOpenaiData = { apiKey, orgId, masterPassword };
    
    document.getElementById('openaiPreviewContent').innerHTML = `
        <p><strong>API Key:</strong> ${apiKey.substring(0, 10)}...${'*'.repeat(20)}</p>
        <p><strong>Organization ID:</strong> ${orgId || 'Non spécifié'}</p>
    `;
    document.getElementById('openaiPreview').style.display = 'block';
});

document.getElementById('validateOpenaiBtn')?.addEventListener('click', async () => {
    if (!pendingOpenaiData) return;
    
    const btn = document.getElementById('validateOpenaiBtn');
    btn.disabled = true;
    btn.textContent = '⏳ Sauvegarde...';
    
    try {
        const response = await fetch('/api/save-openai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                api_key: pendingOpenaiData.apiKey,
                org_id: pendingOpenaiData.orgId,
                master_password: pendingOpenaiData.masterPassword
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            captureMasterPassword(pendingOpenaiData.masterPassword);
            showNotification('✅ OpenAI configuré avec succès!', 'success');
            document.getElementById('openaiForm').reset();
            document.getElementById('openaiPreview').style.display = 'none';
            pendingOpenaiData = null;
            checkCredentials();
            autoFillMasterPassword();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        showNotification('❌ ' + error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<span class="icon">✅</span> Valider';
    }
});

document.getElementById('retryOpenaiBtn')?.addEventListener('click', () => {
    document.getElementById('openaiPreview').style.display = 'none';
    pendingOpenaiData = null;
});

// Suppression des credentials
document.getElementById('deleteBtn').addEventListener('click', async () => {
    if (!confirm('⚠️ Êtes-vous sûr de vouloir supprimer toutes les credentials?')) {
        return;
    }
    
    try {
        const response = await fetch('/api/delete-credentials', {
            method: 'POST'
        });
        
        if (response.ok) {
            clearMasterPassword();
            showNotification('✅ Credentials supprimées', 'success');
            checkCredentials();
        } else {
            throw new Error('Erreur lors de la suppression');
        }
    } catch (error) {
        showNotification('❌ Erreur lors de la suppression', 'error');
    }
});

// Export backup
document.getElementById('exportBtn')?.addEventListener('click', async () => {
    const masterPassword = prompt('🔐 Entrez votre mot de passe maître pour exporter:');
    if (!masterPassword) return;
    
    try {
        const response = await fetch('/api/export-backup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ master_password: masterPassword })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            const dataStr = JSON.stringify(result.backup, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `securevault-backup-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            showNotification('✅ Backup exporté avec succès!', 'success');
        } else {
            throw new Error(result.error || 'Erreur lors de l\'export');
        }
    } catch (error) {
        showNotification('❌ ' + error.message, 'error');
    }
});

// Gestion du modal d'aide
const helpModal = document.getElementById('helpModal');
const helpBtn = document.getElementById('helpGmail');
const closeModalBtn = document.getElementById('closeModal');

helpBtn?.addEventListener('click', () => {
    helpModal.classList.add('show');
});

closeModalBtn?.addEventListener('click', () => {
    helpModal.classList.remove('show');
});

// Fermer le modal en cliquant en dehors
helpModal?.addEventListener('click', (e) => {
    if (e.target === helpModal) {
        helpModal.classList.remove('show');
    }
});

// Fermer avec la touche Échap
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && helpModal.classList.contains('show')) {
        helpModal.classList.remove('show');
    }
});

// Gestion des destinataires
let recipients = [];

async function loadRecipients() {
    try {
        const response = await fetch('/api/destinataires');
        
        if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
            console.warn('API destinataires non disponible');
            return;
        }
        
        const data = await response.json();
        if (data.success) {
            recipients = data.destinataires || [];
            renderRecipientsTable();
            renderCalendar();
        }
    } catch (error) {
        console.warn('Erreur chargement destinataires:', error.message);
    }
}

function renderRecipientsTable() {
    const tbody = document.getElementById('recipientsBody');
    if (!tbody) return;
    
    if (recipients.length === 0) {
        tbody.innerHTML = '<tr class="empty-state"><td colspan="5">Aucun destinataire. Ajoutez-en un ci-dessus.</td></tr>';
        return;
    }
    
    tbody.innerHTML = recipients.map(r => `
        <tr>
            <td>${r.nom}</td>
            <td>${r.email}</td>
            <td><span class="badge badge-${r.type}">${r.type.toUpperCase()}</span></td>
            <td>${r.date_envoi ? new Date(r.date_envoi).toLocaleString('fr-FR') : '-'}</td>
            <td>
                <button class="btn-icon" onclick="editRecipient(${r.id})" title="Modifier">✏️</button>
                <button class="btn-icon" onclick="deleteRecipient(${r.id})" title="Supprimer">🗑️</button>
            </td>
        </tr>
    `).join('');
}

function renderCalendar() {
    const container = document.getElementById('calendarContainer');
    if (!container) return;
    
    const scheduled = recipients.filter(r => r.date_envoi);
    if (scheduled.length === 0) {
        container.innerHTML = '<p class="empty-calendar">Aucun envoi planifié</p>';
        return;
    }
    
    container.innerHTML = scheduled.map(r => {
        const date = new Date(r.date_envoi);
        return `
            <div class="calendar-item">
                <div class="calendar-date">
                    <div class="day">${date.getDate()}</div>
                    <div class="month">${date.toLocaleDateString('fr-FR', {month: 'short'})}</div>
                </div>
                <div class="calendar-info">
                    <div class="calendar-name">${r.nom}</div>
                    <div class="calendar-email">${r.email}</div>
                    <div class="calendar-time">🕐 ${date.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}</div>
                </div>
                <span class="badge badge-${r.type}">${r.type.toUpperCase()}</span>
            </div>
        `;
    }).join('');
}

document.getElementById('recipientForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nom = document.getElementById('recipientName').value;
    const email = document.getElementById('recipientEmail').value;
    const type = document.getElementById('recipientType').value;
    const date = document.getElementById('recipientDate').value;
    
    pendingRecipientData = { nom, email, type, date };
    
    const typeLabel = type === 'to' ? 'À (TO)' : type === 'cc' ? 'CC' : 'CCI (BCC)';
    document.getElementById('recipientPreviewContent').innerHTML = `
        <p><strong>Nom:</strong> ${nom}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Type:</strong> ${typeLabel}</p>
        <p><strong>Date d'envoi:</strong> ${date ? new Date(date).toLocaleString('fr-FR') : 'Non spécifiée'}</p>
    `;
    document.getElementById('recipientPreview').style.display = 'block';
});

document.getElementById('validateRecipientBtn')?.addEventListener('click', async () => {
    if (!pendingRecipientData) return;
    
    const btn = document.getElementById('validateRecipientBtn');
    btn.disabled = true;
    btn.textContent = '⏳ Ajout...';
    
    try {
        const response = await fetch('/api/destinataires', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                nom: pendingRecipientData.nom, 
                email: pendingRecipientData.email, 
                type: pendingRecipientData.type, 
                date_envoi: pendingRecipientData.date || null 
            })
        });
        
        const result = await response.json();
        if (response.ok) {
            showNotification('✅ Destinataire ajouté', 'success');
            document.getElementById('recipientForm').reset();
            document.getElementById('recipientPreview').style.display = 'none';
            pendingRecipientData = null;
            loadRecipients();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        showNotification('❌ ' + error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<span class="icon">✅</span> Valider';
    }
});

document.getElementById('retryRecipientBtn')?.addEventListener('click', () => {
    document.getElementById('recipientPreview').style.display = 'none';
    pendingRecipientData = null;
});

window.editRecipient = function(id) {
    const recipient = recipients.find(r => r.id === id);
    if (!recipient) return;
    
    document.getElementById('editRecipientId').value = recipient.id;
    document.getElementById('editRecipientName').value = recipient.nom;
    document.getElementById('editRecipientEmail').value = recipient.email;
    document.getElementById('editRecipientType').value = recipient.type;
    if (recipient.date_envoi) {
        const date = new Date(recipient.date_envoi);
        document.getElementById('editRecipientDate').value = date.toISOString().slice(0, 16);
    }
    
    document.getElementById('editRecipientModal').classList.add('show');
};

window.deleteRecipient = async function(id) {
    if (!confirm('Supprimer ce destinataire ?')) return;
    
    try {
        const response = await fetch(`/api/destinataires/${id}`, { method: 'DELETE' });
        if (response.ok) {
            showNotification('✅ Destinataire supprimé', 'success');
            loadRecipients();
        }
    } catch (error) {
        showNotification('❌ Erreur de suppression', 'error');
    }
};

document.getElementById('editRecipientForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('editRecipientId').value;
    const nom = document.getElementById('editRecipientName').value;
    const email = document.getElementById('editRecipientEmail').value;
    const type = document.getElementById('editRecipientType').value;
    const date = document.getElementById('editRecipientDate').value;
    
    try {
        const response = await fetch(`/api/destinataires/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nom, email, type, date_envoi: date || null })
        });
        
        if (response.ok) {
            showNotification('✅ Destinataire modifié', 'success');
            document.getElementById('editRecipientModal').classList.remove('show');
            loadRecipients();
        }
    } catch (error) {
        showNotification('❌ Erreur de modification', 'error');
    }
});

document.getElementById('closeEditModal')?.addEventListener('click', () => {
    document.getElementById('editRecipientModal').classList.remove('show');
});

// Gestion de la synthèse vocale
let currentAudio = null;

document.getElementById('ttsForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<span class="icon">⏳</span> Génération...';
    
    const texte = document.getElementById('ttsText').value;
    const voice = document.getElementById('ttsVoice').value;
    const masterPassword = document.getElementById('ttsMaster').value || getMasterPassword();
    
    try {
        const response = await fetch('/api/text-to-speech', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ texte, voice, master_password: masterPassword })
        });
        
        if (response.ok) {
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            
            const audioPlayer = document.getElementById('audioPlayer');
            audioPlayer.src = audioUrl;
            audioPlayer.style.display = 'block';
            document.getElementById('audioValidation').style.display = 'flex';
            showNotification('✅ Audio généré avec succès', 'success');
        } else {
            const error = await response.json();
            throw new Error(error.error);
        }
    } catch (error) {
        showNotification('❌ ' + error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<span class="icon">🔊</span> Générer la voix';
    }
});

document.getElementById('validateAudioBtn')?.addEventListener('click', () => {
    const audioPlayer = document.getElementById('audioPlayer');
    audioPlayer.play();
    document.getElementById('voiceIndicator').classList.add('show');
    audioPlayer.onended = () => {
        document.getElementById('voiceIndicator').classList.remove('show');
    };
    document.getElementById('audioValidation').style.display = 'none';
    showNotification('✅ Lecture de l\'audio', 'success');
});

document.getElementById('retryAudioBtn')?.addEventListener('click', () => {
    document.getElementById('audioPlayer').style.display = 'none';
    document.getElementById('audioValidation').style.display = 'none';
    document.getElementById('ttsText').value = '';
});

// Gestion de la reconnaissance vocale
let mediaRecorder;
let audioChunks = [];

document.getElementById('recordBtn')?.addEventListener('click', async () => {
    const btn = document.getElementById('recordBtn');
    const status = document.getElementById('recordingStatus');
    
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];
            
            mediaRecorder.ondataavailable = (e) => {
                audioChunks.push(e.data);
            };
            
            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                const masterPassword = document.getElementById('sttMaster').value || getMasterPassword();
                
                if (!masterPassword) {
                    showNotification('❌ Mot de passe maître requis', 'error');
                    return;
                }
                
                const formData = new FormData();
                formData.append('audio', audioBlob, 'recording.webm');
                formData.append('master_password', masterPassword);
                
                try {
                    const response = await fetch('/api/speech-to-text', {
                        method: 'POST',
                        body: formData
                    });
                    
                    const result = await response.json();
                    if (response.ok) {
                        document.getElementById('transcriptionResult').innerHTML = `
                            <div class="transcription-box">
                                <strong>📝 Transcription :</strong>
                                <p>${result.texte}</p>
                            </div>
                        `;
                        document.getElementById('transcriptionValidation').style.display = 'flex';
                        showNotification('✅ Transcription réussie', 'success');
                    } else {
                        throw new Error(result.error);
                    }
                } catch (error) {
                    showNotification('❌ ' + error.message, 'error');
                }
            };
            
            mediaRecorder.start();
            btn.innerHTML = '<span class="icon">⏹</span> Arrêter l\'enregistrement';
            btn.classList.remove('btn-danger');
            btn.classList.add('btn-success');
            status.textContent = '🔴 Enregistrement en cours...';
            status.style.display = 'block';
        } catch (error) {
            showNotification('❌ Erreur d\'accès au microphone', 'error');
        }
    } else {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
        btn.innerHTML = '<span class="icon">⏺</span> Commencer l\'enregistrement';
        btn.classList.remove('btn-success');
        btn.classList.add('btn-danger');
        status.textContent = '⏳ Transcription en cours...';
    }
});

document.getElementById('validateTranscriptionBtn')?.addEventListener('click', () => {
    document.getElementById('transcriptionValidation').style.display = 'none';
    showNotification('✅ Transcription validée', 'success');
});

document.getElementById('retryTranscriptionBtn')?.addEventListener('click', () => {
    document.getElementById('transcriptionResult').innerHTML = '';
    document.getElementById('transcriptionValidation').style.display = 'none';
    document.getElementById('recordingStatus').style.display = 'none';
});



// Gestion du mot de passe maître en session
let cachedMasterPassword = sessionStorage.getItem('master_password') || '';

function saveMasterPassword(password) {
    cachedMasterPassword = password;
    sessionStorage.setItem('master_password', password);
}

function getMasterPassword() {
    return cachedMasterPassword || sessionStorage.getItem('master_password') || '';
}

function clearMasterPassword() {
    cachedMasterPassword = '';
    sessionStorage.removeItem('master_password');
}

// Auto-remplir les champs mot de passe maître
function autoFillMasterPassword() {
    const pwd = getMasterPassword();
    if (pwd) {
        const fields = ['gmailMaster', 'openaiMaster', 'ttsMaster', 'sttMaster'];
        fields.forEach(id => {
            const field = document.getElementById(id);
            if (field) field.value = pwd;
        });
    }
}

// Sauvegarder le mot de passe lors de la première utilisation
function captureMasterPassword(password) {
    if (password && !getMasterPassword()) {
        saveMasterPassword(password);
        autoFillMasterPassword();
        showNotification('🔐 Mot de passe mémorisé pour cette session', 'success');
    }
}

// Gestion du suivi des workflows
async function loadWorkflows() {
    try {
        const response = await fetch('/api/workflows');
        
        if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
            console.warn('API workflows non disponible');
            return;
        }
        
        const data = await response.json();
        if (data.success) {
            renderWorkflows(data.workflows || []);
        }
    } catch (error) {
        console.warn('Erreur workflows:', error.message);
    }
}

function renderWorkflows(workflows) {
    const total = workflows.length;
    const envoyes = workflows.filter(w => w.envoye).length;
    const enCours = workflows.filter(w => !w.envoye).length;
    
    document.getElementById('totalWorkflows').textContent = total;
    document.getElementById('envoyesWorkflows').textContent = envoyes;
    document.getElementById('enCoursWorkflows').textContent = enCours;
    
    const container = document.getElementById('workflowHistory');
    if (!container) return;
    
    if (workflows.length === 0) {
        container.innerHTML = '<p class="empty-state">Aucun workflow</p>';
        return;
    }
    
    container.innerHTML = workflows.slice(-10).reverse().map(w => `
        <div class="workflow-item">
            <div class="workflow-header">
                <span class="workflow-id">#${w.id}</span>
                <span class="workflow-status status-${w.statut}">${w.statut}</span>
            </div>
            <div class="workflow-info">
                <p><strong>Etape:</strong> ${w.etape_actuelle}/9</p>
                <p><strong>Date:</strong> ${new Date(w.cree_le).toLocaleString('fr-FR')}</p>
                ${w.mail_genere ? `<p><strong>Objet:</strong> ${w.mail_genere.subject}</p>` : ''}
            </div>
        </div>
    `).join('');
}

// Filtres et recherche workflows
function filterWorkflows(statut = 'tous') {
    const items = document.querySelectorAll('.workflow-item');
    items.forEach(item => {
        if (statut === 'tous' || item.querySelector('.workflow-status').textContent === statut) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

function searchWorkflows(query) {
    const items = document.querySelectorAll('.workflow-item');
    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(query.toLowerCase()) ? 'block' : 'none';
    });
}

document.getElementById('workflowFilter')?.addEventListener('change', (e) => {
    filterWorkflows(e.target.value);
});

document.getElementById('workflowSearch')?.addEventListener('input', (e) => {
    searchWorkflows(e.target.value);
});

// Pagination workflows
let currentPage = 1;
const itemsPerPage = 10;

function paginateWorkflows(workflows) {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return workflows.slice(start, end);
}

function renderPagination(total) {
    const pages = Math.ceil(total / itemsPerPage);
    const container = document.getElementById('workflowPagination');
    if (!container || pages <= 1) return;
    
    container.innerHTML = `
        <button onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>◀</button>
        <span>Page ${currentPage} / ${pages}</span>
        <button onclick="changePage(${currentPage + 1})" ${currentPage === pages ? 'disabled' : ''}>▶</button>
    `;
}

window.changePage = function(page) {
    currentPage = page;
    loadWorkflows();
};

// Initialisation
checkCredentials();
loadRecipients();
loadWorkflows();
autoFillMasterPassword();

// Health check périodique
setInterval(async () => {
    try {
        await fetch('/api/health');
    } catch (error) {
        console.warn('Health check failed:', error);
    }
}, 60000); // Toutes les minutes
