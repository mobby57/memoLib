// Configuration
const API_BASE_URL = '/api/legal';

// Charts instances
let revenueChart = null;
let timeDistributionChart = null;
let deadlinesChart = null;
let invoicesChart = null;

// Data
let reportData = {};

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    setDefaultDates();
    loadAllReports();
});

// Définir les dates par défaut
function setDefaultDates() {
    const end = new Date();
    const start = new Date();
    start.setFullYear(start.getFullYear() - 1);
    
    if (document.getElementById('startDate')) {
        document.getElementById('startDate').value = start.toISOString().split('T')[0];
    }
    if (document.getElementById('endDate')) {
        document.getElementById('endDate').value = end.toISOString().split('T')[0];
    }
}

// Mise à jour de la période
function updatePeriod() {
    const period = document.getElementById('periodFilter').value;
    const customRange = document.getElementById('customDateRange');
    const customRangeEnd = document.getElementById('customDateRangeEnd');
    
    if (period === 'custom') {
        customRange.style.display = 'block';
        customRangeEnd.style.display = 'block';
    } else {
        customRange.style.display = 'none';
        customRangeEnd.style.display = 'none';
        loadAllReports();
    }
}

// Chargement de tous les rapports
async function loadAllReports() {
    try {
        const period = document.getElementById('periodFilter').value;
        let params = `?period=${period}`;
        
        if (period === 'custom') {
            const start = document.getElementById('startDate').value;
            const end = document.getElementById('endDate').value;
            params = `?start_date=${start}&end_date=${end}`;
        }
        
        const response = await fetch(`${API_BASE_URL}/billing/report${params}`);
        const data = await response.json();
        
        if (data.success) {
            reportData = data.report;
            updateSummaryCards();
            updateCharts();
            updateTables();
            updateKPIs();
        }
    } catch (error) {
        console.error('Erreur chargement rapports:', error);
        showError('Impossible de charger les rapports');
    }
}

// Mise à jour des cartes résumé
function updateSummaryCards() {
    // Chiffre d'affaires
    const revenue = reportData.total_facture || 0;
    document.getElementById('totalRevenue').textContent = formatMontant(revenue);
    
    // Heures facturées
    const hours = reportData.temps_total_minutes || 0;
    document.getElementById('totalHours').textContent = formatDuree(hours);
    
    // Dossiers actifs (estimation basée sur les temps uniques)
    const cases = reportData.nombre_dossiers || 0;
    document.getElementById('totalCases').textContent = cases;
    
    // Taux de recouvrement
    const paid = reportData.total_paye || 0;
    const total = reportData.total_facture || 1;
    const recoveryRate = Math.round((paid / total) * 100);
    document.getElementById('recoveryRate').textContent = recoveryRate + '%';
    
    // Tendances (simulées - à améliorer avec données historiques)
    updateTrend('revenueTrend', 15);
    updateTrend('hoursTrend', 8);
    updateTrend('recoveryTrend', recoveryRate > 80 ? 'good' : 'bad');
}

// Mise à jour des tendances
function updateTrend(elementId, value) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    if (typeof value === 'string') {
        if (value === 'good') {
            element.innerHTML = '<i class="fas fa-check-circle"></i> Bon';
            element.className = 'card-trend positive';
        } else {
            element.innerHTML = '<i class="fas fa-exclamation-triangle"></i> À améliorer';
            element.className = 'card-trend negative';
        }
    } else {
        const icon = value >= 0 ? 'arrow-up' : 'arrow-down';
        const className = value >= 0 ? 'positive' : 'negative';
        element.innerHTML = `<i class="fas fa-${icon}"></i> ${value > 0 ? '+' : ''}${value}%`;
        element.className = `card-trend ${className}`;
    }
}

// Mise à jour des graphiques
function updateCharts() {
    updateRevenueChart();
    updateTimeDistributionChart();
    updateDeadlinesChart();
    updateInvoicesChart();
}

// Graphique évolution CA
function updateRevenueChart() {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;
    
    // Données simulées par mois (à remplacer par vraies données API)
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const data = Array(12).fill(0).map(() => Math.random() * 10000 + 5000);
    
    if (revenueChart) {
        revenueChart.destroy();
    }
    
    revenueChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [{
                label: 'Chiffre d\'affaires',
                data: data,
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString('fr-FR') + ' €';
                        }
                    }
                }
            }
        }
    });
}

// Graphique répartition du temps
function updateTimeDistributionChart() {
    const ctx = document.getElementById('timeDistributionChart');
    if (!ctx) return;
    
    const prestations = reportData.par_type_prestation || {};
    const labels = Object.keys(prestations).map(k => formatTypePrestation(k));
    const data = Object.values(prestations).map(p => p.duree_minutes);
    
    if (timeDistributionChart) {
        timeDistributionChart.destroy();
    }
    
    timeDistributionChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#3498db',
                    '#27ae60',
                    '#f39c12',
                    '#e74c3c',
                    '#8e44ad',
                    '#1abc9c'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Graphique état des délais
async function updateDeadlinesChart() {
    const ctx = document.getElementById('deadlinesChart');
    if (!ctx) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/deadlines`);
        const data = await response.json();
        
        if (data.success) {
            const delais = data.delais || [];
            const stats = {
                critique: 0,
                urgent: 0,
                attention: 0,
                normal: 0
            };
            
            delais.forEach(d => {
                if (d.statut !== 'complete') {
                    stats[d.urgence] = (stats[d.urgence] || 0) + 1;
                }
            });
            
            if (deadlinesChart) {
                deadlinesChart.destroy();
            }
            
            deadlinesChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Critique', 'Urgent', 'Attention', 'Normal'],
                    datasets: [{
                        label: 'Nombre de délais',
                        data: [stats.critique, stats.urgent, stats.attention, stats.normal],
                        backgroundColor: [
                            '#e74c3c',
                            '#f39c12',
                            '#3498db',
                            '#27ae60'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1
                            }
                        }
                    }
                }
            });
        }
    } catch (error) {
        console.error('Erreur chargement délais:', error);
    }
}

// Graphique état des factures
async function updateInvoicesChart() {
    const ctx = document.getElementById('invoicesChart');
    if (!ctx) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/billing/invoices`);
        const data = await response.json();
        
        if (data.success) {
            const factures = data.factures || [];
            const stats = {
                payee: 0,
                impayee: 0,
                en_cours: 0
            };
            
            factures.forEach(f => {
                stats[f.statut] = (stats[f.statut] || 0) + 1;
            });
            
            if (invoicesChart) {
                invoicesChart.destroy();
            }
            
            invoicesChart = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: ['Payées', 'Impayées', 'En cours'],
                    datasets: [{
                        data: [stats.payee, stats.impayee, stats.en_cours],
                        backgroundColor: [
                            '#27ae60',
                            '#e74c3c',
                            '#f39c12'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }
    } catch (error) {
        console.error('Erreur chargement factures:', error);
    }
}

// Mise à jour des tableaux
function updateTables() {
    updateTopClientsTable();
    updatePrestationsTable();
}

// Tableau top clients
function updateTopClientsTable() {
    const tbody = document.querySelector('#topClientsTable tbody');
    if (!tbody) return;
    
    const clients = reportData.par_client || {};
    const sortedClients = Object.entries(clients)
        .sort((a, b) => b[1].montant - a[1].montant)
        .slice(0, 10);
    
    if (sortedClients.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">Aucune donnée</td></tr>';
        return;
    }
    
    tbody.innerHTML = sortedClients.map(([client, stats]) => `
        <tr>
            <td><strong>${client}</strong></td>
            <td>${formatDuree(stats.duree_minutes)}</td>
            <td class="text-success"><strong>${formatMontant(stats.montant)}</strong></td>
            <td>${stats.nombre_factures || 0}</td>
            <td>${Math.round(stats.taux_moyen || 0)} €/h</td>
        </tr>
    `).join('');
}

// Tableau prestations
function updatePrestationsTable() {
    const tbody = document.querySelector('#prestationsTable tbody');
    if (!tbody) return;
    
    const prestations = reportData.par_type_prestation || {};
    const total = reportData.total_facture || 1;
    
    if (Object.keys(prestations).length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">Aucune donnée</td></tr>';
        return;
    }
    
    tbody.innerHTML = Object.entries(prestations)
        .sort((a, b) => b[1].montant - a[1].montant)
        .map(([type, stats]) => {
            const percent = ((stats.montant / total) * 100).toFixed(1);
            return `
                <tr>
                    <td><strong>${formatTypePrestation(type)}</strong></td>
                    <td>${formatDuree(stats.duree_minutes)}</td>
                    <td class="text-success"><strong>${formatMontant(stats.montant)}</strong></td>
                    <td>${percent}%</td>
                </tr>
            `;
        }).join('');
}

// Mise à jour des KPIs
function updateKPIs() {
    // Taux horaire moyen
    const avgRate = reportData.taux_horaire_moyen || 0;
    document.getElementById('avgRate').textContent = Math.round(avgRate) + ' €/h';
    
    // Délai moyen de paiement (simulé)
    document.getElementById('avgPaymentDelay').textContent = '15 jours';
    
    // Taux de facturation
    const billingRate = 85; // Simulé
    document.getElementById('billingRate').textContent = billingRate + '%';
    
    // Nouveaux clients (simulé)
    const newClients = Object.keys(reportData.par_client || {}).length;
    document.getElementById('newClients').textContent = newClients;
    
    // Délais respectés (simulé)
    document.getElementById('deadlinesRespected').textContent = '95%';
    
    // Correspondances (à charger depuis l'API compliance)
    loadCorrespondancesCount();
}

// Charger le nombre de correspondances
async function loadCorrespondancesCount() {
    try {
        const response = await fetch(`${API_BASE_URL}/compliance/register`);
        const data = await response.json();
        
        if (data.success) {
            const currentYear = new Date().getFullYear();
            const thisYear = (data.registre || []).filter(c => 
                c.numero_chrono && c.numero_chrono.includes(`-${currentYear}-`)
            );
            document.getElementById('totalCorrespondances').textContent = thisYear.length;
        }
    } catch (error) {
        console.error('Erreur:', error);
    }
}

// Export de toutes les données
function exportAllData() {
    const csvData = generateCSVReport();
    const blob = new Blob(['\ufeff' + csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `rapport_complet_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    showSuccess('Données exportées avec succès');
}

// Générer CSV
function generateCSVReport() {
    const sections = [];
    
    // En-tête
    sections.push('RAPPORT COMPLET - CABINET AVOCAT');
    sections.push(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`);
    sections.push('');
    
    // Résumé
    sections.push('RÉSUMÉ');
    sections.push('Indicateur;Valeur');
    sections.push(`Chiffre d'affaires;${reportData.total_facture || 0} €`);
    sections.push(`Temps total;${formatDuree(reportData.temps_total_minutes || 0)}`);
    sections.push(`Taux horaire moyen;${Math.round(reportData.taux_horaire_moyen || 0)} €/h`);
    sections.push('');
    
    // Top clients
    sections.push('TOP CLIENTS');
    sections.push('Client;Heures;CA généré;Taux moyen');
    const clients = reportData.par_client || {};
    Object.entries(clients)
        .sort((a, b) => b[1].montant - a[1].montant)
        .slice(0, 10)
        .forEach(([client, stats]) => {
            sections.push(`${client};${formatDuree(stats.duree_minutes)};${stats.montant} €;${Math.round(stats.taux_moyen || 0)} €/h`);
        });
    
    return sections.join('\n');
}

// Générer PDF (à implémenter avec bibliothèque comme jsPDF)
function generatePDF() {
    alert('📄 Génération PDF\n\nCette fonctionnalité nécessite une bibliothèque PDF (jsPDF).\nPour l\'instant, utilisez "Exporter tout" pour obtenir les données en CSV.');
}

// Utilitaires
function formatMontant(montant) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
    }).format(montant || 0);
}

function formatDuree(minutes) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h${m.toString().padStart(2, '0')}`;
}

function formatTypePrestation(type) {
    const labels = {
        'consultation': 'Consultation',
        'audience': 'Audience',
        'plaidoirie': 'Plaidoirie',
        'redaction': 'Rédaction',
        'recherche': 'Recherche',
        'autre': 'Autre'
    };
    return labels[type] || type;
}

function showSuccess(message) {
    alert('✅ ' + message);
}

function showError(message) {
    alert('❌ ' + message);
}
