/**
 * MemoLib Widgets Component
 * Système de widgets réutilisables pour dashboard
 */

class WidgetManager {
    constructor() {
        this.widgets = new Map();
        this.updateIntervals = new Map();
    }

    /**
     * Crée un widget de statistique
     */
    createStatWidget(containerId, config) {
        const container = document.getElementById(containerId);
        if (!container) return null;

        const widget = document.createElement('div');
        widget.className = 'stat-widget';
        widget.innerHTML = `
            <div class="stat-widget-icon" style="background: ${config.color || '#667eea'}">
                ${config.icon || '📊'}
            </div>
            <div class="stat-widget-content">
                <div class="stat-widget-value" data-value="${config.value || 0}">
                    ${this._formatNumber(config.value || 0)}
                </div>
                <div class="stat-widget-label">${config.label || 'Statistique'}</div>
                ${config.trend ? `<div class="stat-widget-trend ${config.trend > 0 ? 'up' : 'down'}">
                    ${config.trend > 0 ? '↑' : '↓'} ${Math.abs(config.trend)}%
                </div>` : ''}
            </div>
        `;

        container.appendChild(widget);
        this.widgets.set(containerId, { element: widget, config });

        // Animation d'entrée
        this._animateCounter(widget.querySelector('.stat-widget-value'), config.value || 0);

        return widget;
    }

    /**
     * Crée un widget de progression
     */
    createProgressWidget(containerId, config) {
        const container = document.getElementById(containerId);
        if (!container) return null;

        const percentage = Math.min(100, Math.max(0, config.percentage || 0));
        const widget = document.createElement('div');
        widget.className = 'progress-widget';
        widget.innerHTML = `
            <div class="progress-widget-header">
                <span class="progress-widget-label">${config.label || 'Progression'}</span>
                <span class="progress-widget-value">${percentage}%</span>
            </div>
            <div class="progress-widget-bar">
                <div class="progress-widget-fill" style="width: 0%; background: ${config.color || '#667eea'}"></div>
            </div>
            ${config.subtitle ? `<div class="progress-widget-subtitle">${config.subtitle}</div>` : ''}
        `;

        container.appendChild(widget);
        this.widgets.set(containerId, { element: widget, config });

        // Animation de la barre
        setTimeout(() => {
            widget.querySelector('.progress-widget-fill').style.width = `${percentage}%`;
        }, 100);

        return widget;
    }

    /**
     * Crée un widget de liste d'activités
     */
    createActivityWidget(containerId, config) {
        const container = document.getElementById(containerId);
        if (!container) return null;

        const widget = document.createElement('div');
        widget.className = 'activity-widget';
        
        const activities = (config.activities || []).map(activity => `
            <div class="activity-item">
                <div class="activity-icon" style="background: ${activity.color || '#667eea'}">
                    ${activity.icon || '📌'}
                </div>
                <div class="activity-content">
                    <div class="activity-title">${activity.title || 'Activité'}</div>
                    <div class="activity-description">${activity.description || ''}</div>
                    <div class="activity-time">${activity.time || ''}</div>
                </div>
            </div>
        `).join('');

        widget.innerHTML = `
            <div class="activity-widget-header">
                <h3>${config.title || 'Activités récentes'}</h3>
                ${config.showViewAll ? '<a href="#" class="activity-view-all">Voir tout</a>' : ''}
            </div>
            <div class="activity-widget-list">
                ${activities || '<div class="activity-empty">Aucune activité</div>'}
            </div>
        `;

        container.appendChild(widget);
        this.widgets.set(containerId, { element: widget, config });

        return widget;
    }

    /**
     * Crée un widget de métrique avec sparkline
     */
    createSparklineWidget(containerId, config) {
        const container = document.getElementById(containerId);
        if (!container) return null;

        const widget = document.createElement('div');
        widget.className = 'sparkline-widget';
        
        const canvasId = `sparkline-${Date.now()}`;
        widget.innerHTML = `
            <div class="sparkline-widget-header">
                <div class="sparkline-widget-value">${this._formatNumber(config.value || 0)}</div>
                <div class="sparkline-widget-label">${config.label || 'Métrique'}</div>
            </div>
            <canvas id="${canvasId}" height="60"></canvas>
        `;

        container.appendChild(widget);
        this.widgets.set(containerId, { element: widget, config, canvasId });

        // Créer le mini graphique
        setTimeout(() => {
            this._createSparkline(canvasId, config.data || [], config.color || '#667eea');
        }, 100);

        return widget;
    }

    /**
     * Crée un widget de tableau de bord compact
     */
    createCompactDashboard(containerId, config) {
        const container = document.getElementById(containerId);
        if (!container) return null;

        const metrics = (config.metrics || []).map(metric => `
            <div class="compact-metric">
                <div class="compact-metric-icon" style="color: ${metric.color || '#667eea'}">
                    ${metric.icon || '📊'}
                </div>
                <div class="compact-metric-data">
                    <div class="compact-metric-value">${this._formatNumber(metric.value || 0)}</div>
                    <div class="compact-metric-label">${metric.label || ''}</div>
                </div>
            </div>
        `).join('');

        const widget = document.createElement('div');
        widget.className = 'compact-dashboard-widget';
        widget.innerHTML = `
            <div class="compact-dashboard-header">
                <h3>${config.title || 'Dashboard'}</h3>
            </div>
            <div class="compact-dashboard-grid">
                ${metrics}
            </div>
        `;

        container.appendChild(widget);
        this.widgets.set(containerId, { element: widget, config });

        return widget;
    }

    /**
     * Met à jour un widget
     */
    updateWidget(containerId, newData) {
        const widget = this.widgets.get(containerId);
        if (!widget) return false;

        const { element, config } = widget;

        if (element.classList.contains('stat-widget')) {
            const valueEl = element.querySelector('.stat-widget-value');
            if (valueEl && newData.value !== undefined) {
                this._animateCounter(valueEl, newData.value);
            }
        } else if (element.classList.contains('progress-widget')) {
            const fillEl = element.querySelector('.progress-widget-fill');
            const valueEl = element.querySelector('.progress-widget-value');
            if (fillEl && newData.percentage !== undefined) {
                fillEl.style.width = `${newData.percentage}%`;
                valueEl.textContent = `${newData.percentage}%`;
            }
        }

        return true;
    }

    /**
     * Active l'auto-refresh d'un widget
     */
    enableAutoRefresh(containerId, callback, interval = 5000) {
        this.disableAutoRefresh(containerId);
        
        const intervalId = setInterval(() => {
            callback(containerId);
        }, interval);

        this.updateIntervals.set(containerId, intervalId);
    }

    /**
     * Désactive l'auto-refresh
     */
    disableAutoRefresh(containerId) {
        const intervalId = this.updateIntervals.get(containerId);
        if (intervalId) {
            clearInterval(intervalId);
            this.updateIntervals.delete(containerId);
        }
    }

    /**
     * Supprime un widget
     */
    removeWidget(containerId) {
        const widget = this.widgets.get(containerId);
        if (widget) {
            this.disableAutoRefresh(containerId);
            widget.element.remove();
            this.widgets.delete(containerId);
            return true;
        }
        return false;
    }

    /**
     * Supprime tous les widgets
     */
    removeAll() {
        this.updateIntervals.forEach((_, id) => this.disableAutoRefresh(id));
        this.widgets.forEach(widget => widget.element.remove());
        this.widgets.clear();
    }

    /**
     * Animation de compteur
     */
    _animateCounter(element, target, duration = 1000) {
        const start = parseInt(element.dataset.value || 0);
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const current = Math.floor(start + (target - start) * this._easeOutQuad(progress));
            
            element.textContent = this._formatNumber(current);
            element.dataset.value = current;

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    /**
     * Crée un mini graphique sparkline
     */
    _createSparkline(canvasId, data, color) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width = canvas.offsetWidth;
        const height = canvas.height;

        const max = Math.max(...data, 1);
        const min = Math.min(...data, 0);
        const range = max - min || 1;

        ctx.clearRect(0, 0, width, height);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        data.forEach((value, i) => {
            const x = (i / (data.length - 1)) * width;
            const y = height - ((value - min) / range) * height;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();

        // Remplissage
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fillStyle = this._hexToRgba(color, 0.1);
        ctx.fill();
    }

    /**
     * Formate un nombre
     */
    _formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }

    /**
     * Fonction d'easing
     */
    _easeOutQuad(t) {
        return t * (2 - t);
    }

    /**
     * Convertit hex en rgba
     */
    _hexToRgba(hex, alpha = 1) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
}

// Instance globale
window.widgetManager = new WidgetManager();
