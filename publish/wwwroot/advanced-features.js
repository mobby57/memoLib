// Dashboard temps réel et notifications
class RealtimeDashboard {
    constructor(apiBase, token) {
        this.apiBase = apiBase;
        this.token = token;
        this.connection = null;
        this.initSignalR();
    }

    async initSignalR() {
        if (typeof signalR === 'undefined') {
            console.warn('SignalR non disponible');
            return;
        }

        this.connection = new signalR.HubConnectionBuilder()
            .withUrl(`${this.apiBase}/notificationHub`, {
                accessTokenFactory: () => this.token
            })
            .build();

        this.connection.on("NewEmail", (data) => {
            this.showNotification(`📧 Nouvel email de ${data.from}`, data.subject);
            this.updateEmailCounter();
        });

        this.connection.on("Anomaly", (data) => {
            this.showNotification(`⚠️ ${data.type}`, data.message, 'warning');
            this.updateAnomalyCounter();
        });

        this.connection.on("QuestionnaireCompleted", (data) => {
            this.showNotification(`✅ Questionnaire complété`, data.questionnaireName, 'success');
        });

        try {
            await this.connection.start();
            await this.connection.invoke("JoinUserGroup");
            console.log('SignalR connecté');
        } catch (err) {
            console.error('Erreur SignalR:', err);
        }
    }

    showNotification(title, message, type = 'info') {
        // Notification navigateur
        if (Notification.permission === 'granted') {
            new Notification(title, { body: message, icon: '/favicon.ico' });
        }

        // Notification dans l'interface
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <strong>${title}</strong>
                <p>${message}</p>
                <button onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 5000);
    }

    async updateEmailCounter() {
        try {
            const response = await fetch(`${this.apiBase}/api/dashboard/realtime-stats`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            if (!response.ok) {
                return;
            }

            const text = await response.text();
            if (!text || !text.trim()) {
                return;
            }

            const data = JSON.parse(text);
            
            const counter = document.getElementById('emails-today-counter');
            if (counter) counter.textContent = data.emailsToday;
        } catch (err) {
            console.error('Erreur mise à jour compteur:', err);
        }
    }

    async updateAnomalyCounter() {
        const el = document.getElementById('anomalyCountText');
        if (el) {
            const current = parseInt(el.textContent) || 0;
            el.textContent = current + 1;
        }
    }

    async loadDashboardMetrics() {
        const container = document.getElementById('dashboard-metrics');
        try {
            const response = await fetch(`${this.apiBase}/api/dashboard/metrics`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            if (!response.ok) {
                const errorText = await response.text();
                if (container) {
                    container.innerHTML = `<div class="result error">❌ Impossible de charger les métriques (${response.status}). ${errorText || ''}</div>`;
                }
                return;
            }

            const text = await response.text();
            if (!text || !text.trim()) {
                if (container) {
                    container.innerHTML = `<div class="result">ℹ️ Aucune métrique disponible pour le moment.</div>`;
                }
                return;
            }

            const metrics = JSON.parse(text);
            
            this.renderMetrics(metrics);
        } catch (err) {
            console.error('Erreur chargement métriques:', err);
            if (container) {
                container.innerHTML = `<div class="result error">❌ Erreur dashboard: ${err.message}</div>`;
            }
        }
    }

    renderMetrics(metrics) {
        const container = document.getElementById('dashboard-metrics');
        if (!container) return;

        const html = `
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-number">${metrics.emailsToday}</div>
                    <div class="metric-label">Emails aujourd'hui</div>
                </div>
                <div class="metric-card">
                    <div class="metric-number">${metrics.totalCases}</div>
                    <div class="metric-label">Dossiers actifs</div>
                </div>
                <div class="metric-card ${metrics.openAnomalies > 0 ? 'metric-warning' : ''}">
                    <div class="metric-number">${metrics.openAnomalies}</div>
                    <div class="metric-label">Anomalies ouvertes</div>
                </div>
                <div class="metric-card">
                    <div class="metric-number">${metrics.averageResponseTimeHours.toFixed(1)}h</div>
                    <div class="metric-label">Temps de réponse moyen</div>
                </div>
            </div>
            
            <div class="charts-section">
                <div class="chart-container">
                    <h3>Tendance hebdomadaire</h3>
                    <div class="trend-chart">
                        ${metrics.weeklyTrend.map(item => `
                            <div class="trend-bar" style="height: ${item.count * 10}px" title="${item.date}: ${item.count} emails">
                                <span>${item.count}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="top-clients">
                    <h3>Top clients</h3>
                    ${metrics.topClients.map(client => `
                        <div class="client-item">
                            <span>${client.clientName}</span>
                            <span class="case-count">${client.caseCount} dossiers</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        container.innerHTML = html;
    }
}

// Gestionnaire de templates
class TemplateManager {
    constructor(apiBase, token) {
        this.apiBase = apiBase;
        this.token = token;
    }

    async generateResponse(clientContext, subject, caseType = 'general') {
        const response = await fetch(`${this.apiBase}/api/templates/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`
            },
            body: JSON.stringify({ clientContext, subject, caseType })
        });
        
        const data = await response.json();
        return data.generatedResponse;
    }

    async getTemplates() {
        const response = await fetch(`${this.apiBase}/api/templates`, {
            headers: { 'Authorization': `Bearer ${this.token}` }
        });
        return await response.json();
    }

    async createTemplate(name, category, subject, body) {
        const response = await fetch(`${this.apiBase}/api/templates`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`
            },
            body: JSON.stringify({ name, category, subject, body })
        });
        return await response.json();
    }

    showTemplateModal(eventId, clientContext, subject) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Générer une réponse</h2>
                    <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Type de dossier</label>
                        <select id="template-case-type">
                            <option value="general">Général</option>
                            <option value="divorce">Divorce</option>
                            <option value="travail">Droit du travail</option>
                            <option value="immobilier">Immobilier</option>
                            <option value="penal">Pénal</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Contexte client</label>
                        <textarea id="template-context" rows="3">${clientContext}</textarea>
                    </div>
                    <div class="form-group">
                        <label>Sujet original</label>
                        <input type="text" id="template-subject" value="${subject}" readonly>
                    </div>
                    <button class="btn" onclick="generateTemplateResponse('${eventId}')">Générer la réponse</button>
                    <div id="template-result"></div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
}

// Fonctions globales
async function generateTemplateResponse(eventId) {
    const caseType = document.getElementById('template-case-type').value;
    const context = document.getElementById('template-context').value;
    const subject = document.getElementById('template-subject').value;
    
    const tm = new TemplateManager(resolveApiBase(), resolveAuthToken());
    
    try {
        const response = await tm.generateResponse(context, subject, caseType);
        
        document.getElementById('template-result').innerHTML = `
            <div class="result success">
                <h3>Réponse proposée :</h3>
                <div class="generated-response">
                    <pre>${response}</pre>
                </div>
                <button class="btn" onclick="copyToClipboard('${response.replace(/'/g, "\\'")}')">Copier</button>
                <button class="btn" onclick="sendGeneratedEmail('${eventId}', '${response.replace(/'/g, "\\'")}')">Envoyer</button>
            </div>
        `;
    } catch (err) {
        document.getElementById('template-result').innerHTML = `
            <div class="result error">Erreur génération : ${err.message}</div>
        `;
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('✅ Copié', 'Réponse copiée dans le presse-papiers', 'success');
    });
}

async function sendGeneratedEmail(eventId, response) {
    // Intégration avec le système d'envoi d'emails existant
    alert('Fonctionnalité d\'envoi à implémenter avec le système SMTP existant');
}

function showAdvancedDashboard() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content dashboard-modal">
            <div class="modal-header">
                <h2>📊 Vue d'activité</h2>
                <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">×</button>
            </div>
            <div class="modal-body">
                <div id="dashboard-metrics">Chargement des indicateurs...</div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);

    const apiBase = resolveApiBase();
    const authToken = resolveAuthToken();
    const metricsContainer = document.getElementById('dashboard-metrics');

    if (!authToken) {
        if (metricsContainer) {
            metricsContainer.innerHTML = `<div class="result error">❌ Session non connectée. Connectez-vous puis réessayez.</div>`;
        }
        return;
    }

    const dashboard = new RealtimeDashboard(apiBase, authToken);
    dashboard.loadDashboardMetrics();
}

function resolveApiBase() {
    if (typeof API_URL === 'string' && API_URL.startsWith('http')) return API_URL;
    if (window.location && window.location.origin && window.location.origin.startsWith('http')) return window.location.origin;
    return 'http://localhost:8091';
}

function resolveAuthToken() {
    return localStorage.getItem('authToken')
        || localStorage.getItem('memolibAuthToken')
        || localStorage.getItem('token')
        || null;
}

// Demander permission notifications
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}

// CSS pour les nouvelles fonctionnalités
const advancedStyles = `
<style>
.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    max-width: 300px;
}

.notification-info { border-left: 4px solid #007bff; }
.notification-warning { border-left: 4px solid #ffc107; }
.notification-success { border-left: 4px solid #28a745; }

.notification-content {
    padding: 15px;
    position: relative;
}

.notification-content button {
    position: absolute;
    top: 5px;
    right: 10px;
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
}

.metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
}

.metric-card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 20px;
    border-radius: 10px;
    text-align: center;
}

.metric-card.metric-warning {
    background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
}

.metric-number {
    font-size: 2.5em;
    font-weight: bold;
    margin-bottom: 5px;
}

.metric-label {
    font-size: 0.9em;
    opacity: 0.9;
}

.charts-section {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 30px;
}

.trend-chart {
    display: flex;
    align-items: end;
    gap: 5px;
    height: 100px;
    padding: 10px 0;
}

.trend-bar {
    background: #667eea;
    width: 30px;
    min-height: 5px;
    border-radius: 3px;
    display: flex;
    align-items: end;
    justify-content: center;
    color: white;
    font-size: 12px;
    padding-bottom: 2px;
}

.client-item {
    display: flex;
    justify-content: space-between;
    padding: 10px 0;
    border-bottom: 1px solid #eee;
}

.case-count {
    color: #667eea;
    font-weight: bold;
}

.dashboard-modal .modal-content {
    max-width: 1000px;
    max-height: 90vh;
}

.generated-response {
    background: #f8f9fa;
    padding: 15px;
    border-radius: 5px;
    margin: 10px 0;
    white-space: pre-wrap;
    max-height: 300px;
    overflow-y: auto;
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', advancedStyles);