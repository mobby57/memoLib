/**
 * MemoLib Charts Component
 * Système de graphiques réutilisables avec Chart.js
 */

class ChartManager {
    constructor() {
        this.charts = new Map();
        this.defaultColors = {
            primary: '#667eea',
            success: '#10b981',
            warning: '#f59e0b',
            danger: '#ef4444',
            info: '#3b82f6',
            purple: '#764ba2'
        };
    }

    /**
     * Crée un graphique en ligne
     */
    createLineChart(canvasId, data, options = {}) {
        const ctx = document.getElementById(canvasId)?.getContext('2d');
        if (!ctx) return null;

        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels || [],
                datasets: [{
                    label: data.label || 'Données',
                    data: data.values || [],
                    borderColor: options.color || this.defaultColors.primary,
                    backgroundColor: this._hexToRgba(options.color || this.defaultColors.primary, 0.1),
                    tension: options.tension || 0.4,
                    fill: options.fill !== false,
                    borderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: options.showLegend !== false },
                    tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        padding: 12,
                        cornerRadius: 8
                    }
                },
                scales: {
                    y: { 
                        beginAtZero: true,
                        grid: { color: 'rgba(0,0,0,0.05)' }
                    },
                    x: {
                        grid: { display: false }
                    }
                },
                ...options.chartOptions
            }
        });

        this.charts.set(canvasId, chart);
        return chart;
    }

    /**
     * Crée un graphique en barres
     */
    createBarChart(canvasId, data, options = {}) {
        const ctx = document.getElementById(canvasId)?.getContext('2d');
        if (!ctx) return null;

        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels || [],
                datasets: [{
                    label: data.label || 'Données',
                    data: data.values || [],
                    backgroundColor: options.color || this.defaultColors.primary,
                    borderRadius: 8,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: options.showLegend !== false }
                },
                scales: {
                    y: { 
                        beginAtZero: true,
                        grid: { color: 'rgba(0,0,0,0.05)' }
                    },
                    x: {
                        grid: { display: false }
                    }
                },
                ...options.chartOptions
            }
        });

        this.charts.set(canvasId, chart);
        return chart;
    }

    /**
     * Crée un graphique en donut
     */
    createDoughnutChart(canvasId, data, options = {}) {
        const ctx = document.getElementById(canvasId)?.getContext('2d');
        if (!ctx) return null;

        const colors = options.colors || [
            this.defaultColors.primary,
            this.defaultColors.success,
            this.defaultColors.warning,
            this.defaultColors.danger,
            this.defaultColors.info
        ];

        const chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.labels || [],
                datasets: [{
                    data: data.values || [],
                    backgroundColor: colors,
                    borderWidth: 0,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: { 
                        position: options.legendPosition || 'bottom',
                        labels: {
                            padding: 15,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        padding: 12,
                        cornerRadius: 8
                    }
                },
                ...options.chartOptions
            }
        });

        this.charts.set(canvasId, chart);
        return chart;
    }

    /**
     * Crée un graphique radar
     */
    createRadarChart(canvasId, data, options = {}) {
        const ctx = document.getElementById(canvasId)?.getContext('2d');
        if (!ctx) return null;

        const chart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: data.labels || [],
                datasets: [{
                    label: data.label || 'Performance',
                    data: data.values || [],
                    borderColor: options.color || this.defaultColors.primary,
                    backgroundColor: this._hexToRgba(options.color || this.defaultColors.primary, 0.2),
                    pointBackgroundColor: options.color || this.defaultColors.primary,
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: options.color || this.defaultColors.primary
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: options.max || 100
                    }
                },
                plugins: {
                    legend: { display: options.showLegend !== false }
                },
                ...options.chartOptions
            }
        });

        this.charts.set(canvasId, chart);
        return chart;
    }

    /**
     * Met à jour les données d'un graphique
     */
    updateChart(canvasId, newData) {
        const chart = this.charts.get(canvasId);
        if (!chart) return false;

        if (newData.labels) {
            chart.data.labels = newData.labels;
        }
        if (newData.values) {
            chart.data.datasets[0].data = newData.values;
        }

        chart.update('active');
        return true;
    }

    /**
     * Détruit un graphique
     */
    destroyChart(canvasId) {
        const chart = this.charts.get(canvasId);
        if (chart) {
            chart.destroy();
            this.charts.delete(canvasId);
            return true;
        }
        return false;
    }

    /**
     * Détruit tous les graphiques
     */
    destroyAll() {
        this.charts.forEach(chart => chart.destroy());
        this.charts.clear();
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
window.chartManager = new ChartManager();
