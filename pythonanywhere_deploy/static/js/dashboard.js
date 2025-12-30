// Dashboard JavaScript
async function loadDashboardStats() {
    try {
        const response = await fetch('/api/stats');
        const data = await response.json();
        
        document.getElementById('emailCount').textContent = data.envois?.total || 0;
        document.getElementById('aiCount').textContent = data.ia?.total || 0;
    } catch (error) {
        console.error('Erreur chargement stats:', error);
    }
}

async function sendTestEmail() {
    const email = prompt('Email de test:');
    if (!email) return;
    
    try {
        const response = await fetch('/api/email/send', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                to: email,
                subject: 'Test SecureVault',
                body: 'Ceci est un email de test depuis SecureVault Dashboard'
            })
        });
        
        if (response.ok) {
            showNotification('Email envoyé avec succès', 'success');
        } else {
            throw new Error('Erreur envoi');
        }
    } catch (error) {
        showNotification('Erreur: ' + error.message, 'error');
    }
}

async function generateAIEmail() {
    const context = prompt('Contexte de l\'email:');
    if (!context) return;
    
    try {
        const response = await fetch('/api/ai/generate', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({context, tone: 'professionnel'})
        });
        
        const data = await response.json();
        if (response.ok) {
            alert('Email généré:\\n\\n' + data.email);
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        showNotification('Erreur: ' + error.message, 'error');
    }
}

async function checkSystem() {
    try {
        const response = await fetch('/api/health');
        const data = await response.json();
        
        if (data.status === 'ok') {
            showNotification('Système opérationnel - v' + data.version, 'success');
        }
    } catch (error) {
        showNotification('Système hors ligne', 'error');
    }
}

async function viewAudit() {
    try {
        const response = await fetch('/api/audit/logs');
        const data = await response.json();
        alert('Logs audit:\\n' + JSON.stringify(data, null, 2));
    } catch (error) {
        showNotification('Erreur chargement audit', 'error');
    }
}

async function restartSystem() {
    if (!confirm('Redémarrer le système?')) return;
    
    try {
        await fetch('/api/system/restart', {method: 'POST'});
        showNotification('Redémarrage en cours...', 'success');
        setTimeout(() => location.reload(), 3000);
    } catch (error) {
        showNotification('Erreur redémarrage', 'error');
    }
}

// Forms
document.getElementById('sendEmailForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const data = {
        to: document.getElementById('emailTo').value,
        subject: document.getElementById('emailSubject').value,
        body: document.getElementById('emailBody').value
    };
    
    try {
        const response = await fetch('/api/email/send', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            showNotification('Email envoyé', 'success');
            e.target.reset();
            loadDashboardStats();
        }
    } catch (error) {
        showNotification('Erreur envoi', 'error');
    }
});

document.getElementById('aiGenerateForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const context = document.getElementById('aiContext').value;
    const tone = document.getElementById('aiTone').value;
    
    try {
        const response = await fetch('/api/ai/generate', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({context, tone})
        });
        
        const data = await response.json();
        if (response.ok) {
            document.getElementById('aiResult').innerHTML = `
                <div class="transcription-box">
                    <strong>Email généré:</strong>
                    <p>${data.email}</p>
                </div>
            `;
        }
    } catch (error) {
        showNotification('Erreur génération', 'error');
    }
});

// Init
loadDashboardStats();
setInterval(loadDashboardStats, 30000);
