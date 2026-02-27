// 🔔 SYSTÈME DE NOTIFICATIONS PAR RÔLE
// À ajouter dans demo.html

// Charger les notifications au démarrage
async function loadNotifications() {
    try {
        const response = await fetch('/api/notifications/unread', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();
        
        displayNotifications(data.notifications);
        updateNotificationBadge(data.count);
    } catch (error) {
        console.error('Erreur chargement notifications:', error);
    }
}

// Afficher les notifications
function displayNotifications(notifications) {
    const container = document.getElementById('notifications-container');
    if (!container) return;
    
    if (notifications.length === 0) {
        container.innerHTML = '<p class="text-muted">Aucune notification</p>';
        return;
    }
    
    container.innerHTML = notifications.map(n => `
        <div class="notification-item ${getSeverityClass(n.severity)}" data-id="${n.id}">
            <div class="notification-header">
                <strong>${n.title}</strong>
                <span class="notification-time">${formatTime(n.createdAt)}</span>
            </div>
            <div class="notification-body">${n.message}</div>
            ${n.caseId ? `<a href="#" onclick="openCase(${n.caseId}); markAsRead(${n.id}); return false;">Voir le dossier →</a>` : ''}
            <button onclick="markAsRead(${n.id})" class="btn-mark-read">✓</button>
        </div>
    `).join('');
}

// Mettre à jour le badge de compteur
function updateNotificationBadge(count) {
    const badge = document.getElementById('notification-badge');
    if (!badge) return;
    
    if (count > 0) {
        badge.textContent = count > 99 ? '99+' : count;
        badge.style.display = 'inline-block';
    } else {
        badge.style.display = 'none';
    }
}

// Marquer comme lu
async function markAsRead(notificationId) {
    try {
        await fetch(`/api/notifications/${notificationId}/read`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        // Recharger les notifications
        await loadNotifications();
    } catch (error) {
        console.error('Erreur marquage notification:', error);
    }
}

// Marquer toutes comme lues
async function markAllAsRead() {
    try {
        await fetch('/api/notifications/read-all', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        await loadNotifications();
    } catch (error) {
        console.error('Erreur marquage toutes notifications:', error);
    }
}

// Classes CSS selon la sévérité
function getSeverityClass(severity) {
    const classes = {
        'CRITICAL': 'notification-critical',
        'HIGH': 'notification-high',
        'MEDIUM': 'notification-medium',
        'LOW': 'notification-low'
    };
    return classes[severity] || 'notification-low';
}

// Formater le temps
function formatTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // secondes
    
    if (diff < 60) return 'À l\'instant';
    if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
    return `Il y a ${Math.floor(diff / 86400)} j`;
}

// Polling toutes les 30 secondes
setInterval(loadNotifications, 30000);

// Charger au démarrage
document.addEventListener('DOMContentLoaded', loadNotifications);

// CSS à ajouter
const notificationStyles = `
<style>
.notification-item {
    padding: 12px;
    margin-bottom: 8px;
    border-radius: 8px;
    border-left: 4px solid;
    background: white;
    position: relative;
}

.notification-critical {
    border-left-color: #dc3545;
    background: #fff5f5;
}

.notification-high {
    border-left-color: #fd7e14;
    background: #fff8f0;
}

.notification-medium {
    border-left-color: #ffc107;
    background: #fffbf0;
}

.notification-low {
    border-left-color: #6c757d;
    background: #f8f9fa;
}

.notification-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 4px;
}

.notification-time {
    font-size: 0.85em;
    color: #6c757d;
}

.notification-body {
    font-size: 0.95em;
    margin-bottom: 8px;
}

.btn-mark-read {
    position: absolute;
    top: 8px;
    right: 8px;
    background: #28a745;
    color: white;
    border: none;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    cursor: pointer;
    font-size: 12px;
}

#notification-badge {
    position: absolute;
    top: -8px;
    right: -8px;
    background: #dc3545;
    color: white;
    border-radius: 10px;
    padding: 2px 6px;
    font-size: 11px;
    font-weight: bold;
}
</style>
`;
