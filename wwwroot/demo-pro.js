const API_URL = 'http://localhost:5078/api';
let token = localStorage.getItem('token') || '';
let currentCaseId = localStorage.getItem('caseId') || '';
let userId = localStorage.getItem('userId') || '';

function showTab(tabName) {
    document.querySelectorAll('.content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
}

function showResult(elementId, message, type = 'success') {
    const result = document.getElementById(elementId);
    result.className = `result show ${type}`;
    result.innerHTML = message;
}

async function apiCall(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };
    
    if (body) options.body = JSON.stringify(body);
    
    try {
        const response = await fetch(`${API_URL}${endpoint}`, options);
        const data = await response.json();
        return { success: response.ok, data, status: response.status };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// AUTH
async function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    const result = await apiCall('/auth/login', 'POST', { email, password });
    
    if (result.success) {
        token = result.data.token;
        userId = result.data.userId;
        localStorage.setItem('token', token);
        localStorage.setItem('userId', userId);
        showResult('authResult', `✅ Connexion réussie !<br>Token: ${token.substring(0, 20)}...<br>User ID: ${userId}`, 'success');
        
        // Créer un dossier de test
        await createTestCase();
    } else {
        showResult('authResult', `❌ Erreur: ${result.error || 'Connexion échouée'}`, 'error');
    }
}

async function createTestCase() {
    const result = await apiCall('/cases', 'POST', {
        title: 'Dossier Test Démo',
        status: 'OPEN',
        priority: 3
    });
    
    if (result.success) {
        currentCaseId = result.data.id;
        localStorage.setItem('caseId', currentCaseId);
        console.log('Dossier test créé:', currentCaseId);
    }
}

// EMAIL
async function sendEmail() {
    const to = document.getElementById('emailTo').value;
    const subject = document.getElementById('emailSubject').value;
    const body = document.getElementById('emailBody').value;
    
    const result = await apiCall('/email/send', 'POST', { to, subject, body });
    
    if (result.success) {
        showResult('emailResult', `✅ Email envoyé avec succès !<br>À: ${to}<br>Sujet: ${subject}`, 'success');
    } else {
        showResult('emailResult', `❌ Erreur: ${result.error}`, 'error');
    }
}

// NOTES
async function createNote() {
    if (!currentCaseId) {
        showResult('notesResult', '❌ Veuillez vous connecter d\'abord', 'error');
        return;
    }
    
    const content = document.getElementById('noteContent').value;
    const isPrivate = document.getElementById('notePrivate').checked;
    
    const result = await apiCall(`/cases/${currentCaseId}/notes`, 'POST', {
        content,
        isPrivate,
        mentions: []
    });
    
    if (result.success) {
        showResult('notesResult', `✅ Note créée !<br>ID: ${result.data.id}<br>Contenu: ${content}`, 'success');
        loadNotes();
    } else {
        showResult('notesResult', `❌ Erreur: ${result.error}`, 'error');
    }
}

async function loadNotes() {
    if (!currentCaseId) return;
    
    const result = await apiCall(`/cases/${currentCaseId}/notes`);
    
    if (result.success) {
        const list = document.getElementById('notesList');
        list.innerHTML = result.data.map(note => `
            <div class="list-item">
                <strong>${note.content}</strong><br>
                <small>${new Date(note.createdAt).toLocaleString('fr-FR')}</small>
                ${note.isPrivate ? '<span class="badge warning">Privé</span>' : ''}
            </div>
        `).join('');
    }
}

// TASKS
async function createTask() {
    if (!currentCaseId) {
        showResult('tasksResult', '❌ Veuillez vous connecter d\'abord', 'error');
        return;
    }
    
    const title = document.getElementById('taskTitle').value;
    const description = document.getElementById('taskDesc').value;
    const priority = parseInt(document.getElementById('taskPriority').value);
    const dueDate = document.getElementById('taskDue').value;
    
    const result = await apiCall(`/cases/${currentCaseId}/tasks`, 'POST', {
        title,
        description,
        priority,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null
    });
    
    if (result.success) {
        showResult('tasksResult', `✅ Tâche créée !<br>Titre: ${title}<br>Priorité: ${priority}`, 'success');
        loadTasks();
    } else {
        showResult('tasksResult', `❌ Erreur: ${result.error}`, 'error');
    }
}

async function loadTasks() {
    if (!currentCaseId) return;
    
    const result = await apiCall(`/cases/${currentCaseId}/tasks`);
    
    if (result.success) {
        const list = document.getElementById('tasksList');
        list.innerHTML = result.data.map(task => `
            <div class="list-item">
                <strong>${task.title}</strong><br>
                ${task.description || ''}<br>
                <span class="badge ${task.priority <= 2 ? 'warning' : 'info'}">Priorité: ${task.priority}</span>
                ${task.isCompleted ? '<span class="badge success">✅ Complété</span>' : ''}
            </div>
        `).join('');
    }
}

// DOCUMENTS
async function uploadDocument() {
    if (!currentCaseId) {
        showResult('docsResult', '❌ Veuillez vous connecter d\'abord', 'error');
        return;
    }
    
    const file = document.getElementById('docFile').files[0];
    const category = document.getElementById('docCategory').value;
    const tags = document.getElementById('docTags').value;
    
    if (!file) {
        showResult('docsResult', '❌ Veuillez sélectionner un fichier', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    formData.append('tags', tags);
    
    try {
        const response = await fetch(`${API_URL}/cases/${currentCaseId}/documents`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        
        if (response.ok) {
            const data = await response.json();
            showResult('docsResult', `✅ Document uploadé !<br>Nom: ${file.name}<br>Taille: ${(file.size / 1024).toFixed(2)} KB`, 'success');
            loadDocuments();
        } else {
            showResult('docsResult', '❌ Erreur lors de l\'upload', 'error');
        }
    } catch (error) {
        showResult('docsResult', `❌ Erreur: ${error.message}`, 'error');
    }
}

async function loadDocuments() {
    if (!currentCaseId) return;
    
    const result = await apiCall(`/cases/${currentCaseId}/documents`);
    
    if (result.success) {
        const list = document.getElementById('docsList');
        list.innerHTML = result.data.map(doc => `
            <div class="list-item">
                <strong>${doc.fileName}</strong><br>
                Taille: ${(doc.fileSize / 1024).toFixed(2)} KB<br>
                Version: ${doc.version}<br>
                ${doc.category ? `<span class="badge info">${doc.category}</span>` : ''}
            </div>
        `).join('');
    }
}

// CALLS
async function logCall() {
    if (!currentCaseId) {
        showResult('callsResult', '❌ Veuillez vous connecter d\'abord', 'error');
        return;
    }
    
    const phoneNumber = document.getElementById('callPhone').value;
    const direction = document.getElementById('callDirection').value;
    const notes = document.getElementById('callNotes').value;
    
    const result = await apiCall(`/cases/${currentCaseId}/calls`, 'POST', {
        phoneNumber,
        direction,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 600000).toISOString(),
        notes
    });
    
    if (result.success) {
        showResult('callsResult', `✅ Appel enregistré !<br>Numéro: ${phoneNumber}<br>Direction: ${direction}`, 'success');
        loadCalls();
    } else {
        showResult('callsResult', `❌ Erreur: ${result.error}`, 'error');
    }
}

async function loadCalls() {
    if (!currentCaseId) return;
    
    const result = await apiCall(`/cases/${currentCaseId}/calls`);
    
    if (result.success) {
        const list = document.getElementById('callsList');
        list.innerHTML = result.data.map(call => `
            <div class="list-item">
                <strong>${call.phoneNumber}</strong><br>
                ${call.direction === 'OUTBOUND' ? '📞 Sortant' : '📱 Entrant'}<br>
                Durée: ${call.durationSeconds}s<br>
                ${call.notes || ''}
            </div>
        `).join('');
    }
}

// FORMS
async function createForm() {
    const name = document.getElementById('formName').value;
    const description = document.getElementById('formDesc').value;
    
    const result = await apiCall('/forms', 'POST', {
        name,
        description,
        fields: [
            { name: 'nom', label: 'Nom complet', type: 'TEXT', isRequired: true },
            { name: 'email', label: 'Email', type: 'EMAIL', isRequired: true },
            { name: 'message', label: 'Message', type: 'TEXT', isRequired: true }
        ]
    });
    
    if (result.success) {
        showResult('formsResult', `✅ Formulaire créé !<br>Nom: ${name}<br>ID: ${result.data.id}`, 'success');
        loadForms();
    } else {
        showResult('formsResult', `❌ Erreur: ${result.error}`, 'error');
    }
}

async function loadForms() {
    const result = await apiCall('/forms');
    
    if (result.success) {
        const list = document.getElementById('formsList');
        list.innerHTML = result.data.map(form => `
            <div class="list-item">
                <strong>${form.name}</strong><br>
                ${form.description}<br>
                ${form.isActive ? '<span class="badge success">Actif</span>' : '<span class="badge">Inactif</span>'}
            </div>
        `).join('');
    }
}

// AUTOMATIONS
async function createAutomation() {
    const name = document.getElementById('autoName').value;
    const triggerType = document.getElementById('autoTrigger').value;
    const actionType = document.getElementById('autoAction').value;
    
    const result = await apiCall('/automations', 'POST', {
        name,
        triggerType,
        triggerConditions: { subject_contains: 'URGENT' },
        actionType,
        actionParams: { priority: '1' },
        isActive: true
    });
    
    if (result.success) {
        showResult('autosResult', `✅ Automatisation créée !<br>Nom: ${name}<br>Déclencheur: ${triggerType}`, 'success');
        loadAutomations();
    } else {
        showResult('autosResult', `❌ Erreur: ${result.error}`, 'error');
    }
}

async function loadAutomations() {
    const result = await apiCall('/automations');
    
    if (result.success) {
        const list = document.getElementById('autosList');
        list.innerHTML = result.data.map(auto => `
            <div class="list-item">
                <strong>${auto.name}</strong><br>
                Déclencheur: ${auto.triggerType}<br>
                Action: ${auto.actionType}<br>
                ${auto.isActive ? '<span class="badge success">Actif</span>' : '<span class="badge">Inactif</span>'}
            </div>
        `).join('');
    }
}

// REPORTS
async function generateReport() {
    const reportType = document.getElementById('reportType').value;
    const startDate = document.getElementById('reportStart').value;
    const endDate = document.getElementById('reportEnd').value;
    
    const result = await apiCall('/reports/generate', 'POST', {
        name: `Rapport ${reportType}`,
        reportType,
        startDate: startDate ? new Date(startDate).toISOString() : null,
        endDate: endDate ? new Date(endDate).toISOString() : null,
        filters: {}
    });
    
    if (result.success) {
        showResult('reportsResult', `✅ Rapport généré !<br>Type: ${reportType}<br>Données: ${JSON.stringify(result.data.data)}`, 'success');
        loadReports();
    } else {
        showResult('reportsResult', `❌ Erreur: ${result.error}`, 'error');
    }
}

async function loadReports() {
    const result = await apiCall('/reports');
    
    if (result.success) {
        const list = document.getElementById('reportsList');
        list.innerHTML = result.data.map(report => `
            <div class="list-item">
                <strong>${report.name}</strong><br>
                Type: ${report.reportType}<br>
                Généré: ${new Date(report.generatedAt).toLocaleString('fr-FR')}
            </div>
        `).join('');
    }
}

// INTEGRATIONS
async function createIntegration() {
    const provider = document.getElementById('integProvider').value;
    const accessToken = document.getElementById('integToken').value;
    
    const result = await apiCall('/integrations', 'POST', {
        provider,
        accessToken,
        settings: { sync_enabled: 'true' },
        isActive: true
    });
    
    if (result.success) {
        showResult('integsResult', `✅ Intégration connectée !<br>Provider: ${provider}`, 'success');
        loadIntegrations();
    } else {
        showResult('integsResult', `❌ Erreur: ${result.error}`, 'error');
    }
}

async function loadIntegrations() {
    const result = await apiCall('/integrations');
    
    if (result.success) {
        const list = document.getElementById('integsList');
        list.innerHTML = result.data.map(integ => `
            <div class="list-item">
                <strong>${integ.provider}</strong><br>
                ${integ.isActive ? '<span class="badge success">Connecté</span>' : '<span class="badge">Déconnecté</span>'}
            </div>
        `).join('');
    }
}

// CHAT
async function sendMessage() {
    const toUserId = document.getElementById('chatTo').value;
    const content = document.getElementById('chatContent').value;
    
    const result = await apiCall('/messages', 'POST', {
        toUserId,
        content,
        caseId: currentCaseId
    });
    
    if (result.success) {
        showResult('chatResult', `✅ Message envoyé !<br>À: ${toUserId}`, 'success');
        loadMessages();
    } else {
        showResult('chatResult', `❌ Erreur: ${result.error}`, 'error');
    }
}

async function loadMessages() {
    const result = await apiCall('/messages');
    
    if (result.success) {
        const list = document.getElementById('chatList');
        list.innerHTML = result.data.map(msg => `
            <div class="list-item">
                <strong>${msg.content}</strong><br>
                ${new Date(msg.sentAt).toLocaleString('fr-FR')}<br>
                ${msg.isRead ? '<span class="badge success">Lu</span>' : '<span class="badge warning">Non lu</span>'}
            </div>
        `).join('');
    }
}

// SHARE
async function createShare() {
    if (!currentCaseId) {
        showResult('shareResult', '❌ Veuillez vous connecter d\'abord', 'error');
        return;
    }
    
    const recipientEmail = document.getElementById('shareEmail').value;
    const password = document.getElementById('sharePassword').value;
    const expiresAt = document.getElementById('shareExpiry').value;
    const allowDownload = document.getElementById('shareDownload').checked;
    
    const result = await apiCall('/share', 'POST', {
        caseId: currentCaseId,
        recipientEmail,
        password: password || null,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        documentIds: [],
        allowDownload
    });
    
    if (result.success) {
        showResult('shareResult', `✅ Partage créé !<br>Email: ${recipientEmail}<br>Lien: ${result.data.shareUrl}`, 'success');
        loadShares();
    } else {
        showResult('shareResult', `❌ Erreur: ${result.error}`, 'error');
    }
}

async function loadShares() {
    if (!currentCaseId) return;
    
    const result = await apiCall(`/share/case/${currentCaseId}`);
    
    if (result.success) {
        const list = document.getElementById('sharesList');
        list.innerHTML = result.data.map(share => `
            <div class="list-item">
                <strong>${share.recipientEmail}</strong><br>
                Token: ${share.shareToken}<br>
                ${share.expiresAt ? `Expire: ${new Date(share.expiresAt).toLocaleString('fr-FR')}` : 'Pas d\'expiration'}
            </div>
        `).join('');
    }
}

// Auto-load data when tabs are opened
document.addEventListener('DOMContentLoaded', () => {
    if (token) {
        console.log('Token trouvé, chargement des données...');
    }
});
