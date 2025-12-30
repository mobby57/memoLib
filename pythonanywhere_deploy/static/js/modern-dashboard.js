// IAPosteManager - Modern Dashboard JS
let allEmails = [];
let currentEmails = [];

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadSuggestions();
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('filterForm').addEventListener('submit', function(e) {
        e.preventDefault();
        applyFilters();
    });
}

// Modal Management
function fetchEmails() {
    document.getElementById('configModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('configModal').style.display = 'none';
}

function startFetch() {
    const config = {
        imap_server: document.getElementById('imapServer').value,
        email: document.getElementById('emailAddr').value,
        password: document.getElementById('emailPassword').value,
        limit: parseInt(document.getElementById('emailLimit').value),
        page: 1
    };

    showProgress('Connexion et récupération des emails...');

    fetch('/api/emails/fetch', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(config)
    })
    .then(response => response.json())
    .then(data => {
        hideProgress();
        if (data.success) {
            allEmails = data.emails;
            currentEmails = allEmails;
            displayEmails(currentEmails);
            updateStats(data.suggestions);
            
            if (data.has_more) {
                showNotification(`${data.count} emails chargés sur ${data.total} total`, 'info');
            }
            
            closeModal();
        } else {
            showNotification('Erreur: ' + data.error, 'error');
        }
    })
    .catch(error => {
        hideProgress();
        showNotification('Erreur de connexion: ' + error.message, 'error');
    });
}

// Display Functions
function displayEmails(emails) {
    const container = document.getElementById('emailsList');
    
    if (emails.length === 0) {
        container.innerHTML = `
            <div class="loading">
                <i class="fas fa-inbox fa-3x" style="color: #cbd5e1;"></i>
                <div style="margin-left: 1rem;">
                    <h4>Aucun email trouvé</h4>
                    <p>Essayez de modifier vos filtres</p>
                </div>
            </div>
        `;
        return;
    }

    let html = '';
    emails.forEach(email => {
        const priorityClass = getPriorityClass(email.priority);
        const categoryIcon = getCategoryIcon(email.category);
        
        html += `
            <div class="email-item">
                <div class="email-header">
                    <div>
                        <div class="email-subject">${categoryIcon} ${email.subject || 'Sans sujet'}</div>
                        <div class="email-meta">
                            <strong>${email.sender}</strong> • ${email.domain} • ${formatDate(email.date)}
                        </div>
                    </div>
                    <div>
                        <span class="priority-badge priority-${email.priority}">${getPriorityText(email.priority)}</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    document.getElementById('emailCount').textContent = emails.length;
}

function updateStats(suggestions) {
    document.getElementById('totalEmails').textContent = allEmails.length;
    document.getElementById('filteredEmails').textContent = currentEmails.length;
    
    const highPriority = allEmails.filter(e => e.priority === 'high').length;
    document.getElementById('highPriority').textContent = highPriority;
    
    if (suggestions && suggestions.top_domains && suggestions.top_domains.length > 0) {
        document.getElementById('topDomain').textContent = suggestions.top_domains[0][0];
    }
}

// Utility Functions
function getPriorityClass(priority) {
    const classes = {
        'high': 'priority-high',
        'medium': 'priority-medium',
        'low': 'priority-low'
    };
    return classes[priority] || 'priority-low';
}

function getPriorityText(priority) {
    const texts = {
        'high': '🔴 Haute',
        'medium': '🟡 Moyenne',
        'low': '🟢 Basse'
    };
    return texts[priority] || '🟢 Basse';
}

function getCategoryIcon(category) {
    const icons = {
        'finance': '💰',
        'meeting': '📅',
        'urgent': '🚨',
        'marketing': '📢',
        'general': '📝'
    };
    return icons[category] || '📝';
}

function formatDate(dateStr) {
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
        });
    } catch {
        return 'Date inconnue';
    }
}

// Progress & Notifications
function showProgress(message) {
    document.getElementById('emailsList').innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <div>
                <h4>Chargement...</h4>
                <p>${message}</p>
            </div>
        </div>
    `;
}

function hideProgress() {
    // Progress will be replaced by email list
}

function showNotification(message, type = 'info') {
    const colors = {
        'success': '#10b981',
        'error': '#ef4444',
        'warning': '#f59e0b',
        'info': '#2563eb'
    };
    
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type]};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        z-index: 1001;
        max-width: 400px;
        animation: slideIn 0.3s ease;
    `;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem;">
            <i class="fas fa-${type === 'error' ? 'exclamation-triangle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Filter Functions
function applyFilters() {
    const formData = new FormData(document.getElementById('filterForm'));
    const filters = Object.fromEntries(formData.entries());
    
    fetch('/api/emails/filter', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({filters})
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            currentEmails = data.emails;
            displayEmails(currentEmails);
            document.getElementById('filteredEmails').textContent = data.count;
            showNotification(`${data.count} emails trouvés`, 'success');
        } else {
            showNotification('Erreur de filtrage: ' + data.error, 'error');
        }
    })
    .catch(error => {
        showNotification('Erreur: ' + error.message, 'error');
    });
}

function loadSuggestions() {
    fetch('/api/emails/suggestions')
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            displaySuggestions(data.suggestions);
        }
    })
    .catch(error => {
        console.log('Suggestions non disponibles');
    });
}

function displaySuggestions(suggestions) {
    if (!suggestions || !suggestions.suggested_filters) return;
    
    const container = document.getElementById('suggestionsList');
    let html = '';
    
    suggestions.suggested_filters.forEach(filter => {
        html += `
            <div class="suggestion-item" onclick="applySuggestion('${JSON.stringify(filter.filter).replace(/"/g, '&quot;')}')">
                <span class="suggestion-text">${filter.name}</span>
                <span class="suggestion-count">${filter.count}</span>
            </div>
        `;
    });
    
    if (html) {
        container.innerHTML = html;
    }
}

function applySuggestion(filterDataStr) {
    try {
        const filterData = JSON.parse(filterDataStr.replace(/&quot;/g, '"'));
        
        Object.keys(filterData).forEach(key => {
            const elementId = key.replace('_', '');
            const element = document.getElementById(elementId);
            if (element) {
                if (key === 'date_from' && typeof filterData[key] === 'object') {
                    const days = filterData[key].days;
                    const date = new Date();
                    date.setDate(date.getDate() - days);
                    element.value = date.toISOString().split('T')[0];
                } else {
                    element.value = filterData[key];
                }
            }
        });
        
        applyFilters();
    } catch (error) {
        showNotification('Erreur lors de l\'application du filtre', 'error');
    }
}

// Action Functions
function createSmartFilters() {
    showProgress('Création des filtres intelligents...');
    
    fetch('/api/emails/smart-filters', {method: 'POST'})
    .then(response => response.json())
    .then(data => {
        hideProgress();
        if (data.success) {
            displaySuggestions(data);
            showNotification('Filtres intelligents créés!', 'success');
        } else {
            showNotification('Erreur: ' + data.error, 'error');
        }
    })
    .catch(error => {
        hideProgress();
        showNotification('Erreur: ' + error.message, 'error');
    });
}

function autoOrganize() {
    if (confirm('Organiser automatiquement tous les emails par IA ?')) {
        showProgress('Organisation automatique en cours...');
        
        fetch('/api/emails/auto-organize', {method: 'POST'})
        .then(response => response.json())
        .then(data => {
            hideProgress();
            if (data.success) {
                showNotification(`${data.organized_count} emails organisés en ${data.folders_created} dossiers`, 'success');
                setTimeout(() => location.reload(), 2000);
            } else {
                showNotification('Erreur: ' + data.error, 'error');
            }
        })
        .catch(error => {
            hideProgress();
            showNotification('Erreur: ' + error.message, 'error');
        });
    }
}

function checkHealth() {
    fetch('/api/emails/health')
    .then(response => response.json())
    .then(data => {
        displayHealthStatus(data);
    })
    .catch(error => {
        showNotification('Erreur lors de la vérification: ' + error.message, 'error');
    });
}

function displayHealthStatus(status) {
    const statusColors = {
        'healthy': 'success',
        'warning': 'warning',
        'unhealthy': 'error'
    };
    
    let message = `Système: ${status.overall_status.toUpperCase()}\n`;
    
    Object.entries(status.components || {}).forEach(([component, info]) => {
        const icon = info.status === 'healthy' ? '✅' : 
                   info.status === 'warning' ? '⚠️' : '❌';
        message += `${icon} ${component}: ${info.message}\n`;
    });
    
    showNotification(message, statusColors[status.overall_status] || 'info');
}

// CSS Animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);