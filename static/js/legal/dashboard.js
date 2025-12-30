/**
 * DASHBOARD JURIDIQUE - IA POSTE MANAGER AVOCAT
 * Gestion complète du tableau de bord juridique
 */

// Configuration
const API_BASE_URL = '/api/legal';
let dashboardData = null;
let refreshInterval = null;

// ================================================
// INITIALIZATION
// ================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard Juridique initialisé');
    loadDashboard();
    startAutoRefresh();
});

// ================================================
// DASHBOARD LOADING
// ================================================

async function loadDashboard() {
    try {
        showLoading();
        
        const response = await fetch(`${API_BASE_URL}/dashboard`);
        const data = await response.json();
        
        if (data.success) {
            dashboardData = data.dashboard;
            updateUI(dashboardData);
            updateLastUpdateTime();
        } else {
            showError('Erreur lors du chargement du dashboard');
        }
    } catch (error) {
        console.error('Erreur dashboard:', error);
        showError('Impossible de charger le dashboard');
    }
}

function refreshDashboard() {
    const btn = document.querySelector('.btn-refresh i');
    btn.classList.add('fa-spin');
    
    loadDashboard().then(() => {
        setTimeout(() => {
            btn.classList.remove('fa-spin');
        }, 500);
    });
}

function startAutoRefresh() {
    // Refresh toutes les 2 minutes
    refreshInterval = setInterval(() => {
        loadDashboard();
    }, 120000);
}

// ================================================
// UI UPDATE
// ================================================

function updateUI(data) {
    updateStatsCards(data);
    updateDelaisList(data.delais_critiques);
    updateFacturesList(data.factures_impayees);
    updateAlertsBanner(data.alertes);
    updateTodayStats();
}

function updateStatsCards(data) {
    // Délais critiques
    document.getElementById('delaisCritiquesCount').textContent = 
        data.delais_critiques.count || 0;
    
    // Factures impayées
    document.getElementById('facturesImpayeesCount').textContent = 
        data.factures_impayees.count || 0;
    document.getElementById('facturesImpayeesMontant').textContent = 
        formatMontant(data.factures_impayees.montant_total || 0);
    
    // Temps non facturé
    document.getElementById('tempsNonFactureHeures').textContent = 
        formatHeures(data.temps_non_facture.heures || 0);
    document.getElementById('tempsNonFactureMontant').textContent = 
        formatMontant(data.temps_non_facture.montant || 0);
    
    // Alertes
    document.getElementById('alertesCount').textContent = 
        data.alertes.count || 0;
}

function updateDelaisList(delaisData) {
    const container = document.getElementById('delaisList');
    
    if (!delaisData.delais || delaisData.delais.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-check-circle"></i>
                <p>Aucun délai critique actuellement</p>
                <small>Tous vos délais sont sous contrôle</small>
            </div>
        `;
        return;
    }
    
    const html = delaisData.delais.map(delai => `
        <div class="delai-item urgence-${delai.urgence} fade-in">
            <div class="delai-header">
                <span class="delai-badge badge-${delai.urgence}">
                    ${delai.urgence.toUpperCase()}
                </span>
                <span class="delai-badge" style="background: #34495e; color: white;">
                    ${delai.jours_restants} jour${delai.jours_restants > 1 ? 's' : ''} restant${delai.jours_restants > 1 ? 's' : ''}
                </span>
            </div>
            <div class="delai-info">
                <p><strong>${delai.reference_dossier}</strong> - ${delai.client}</p>
                <p>
                    <i class="fas fa-file-alt"></i> ${delai.type_delai} suite à ${delai.type_document}
                </p>
                <p>
                    <i class="fas fa-calendar"></i> 
                    Date limite: ${formatDate(delai.date_limite)}
                </p>
                <p style="margin-top: 8px;">
                    <i class="fas fa-info-circle"></i> ${delai.description || 'Aucune description'}
                </p>
            </div>
            <div style="margin-top: 12px; display: flex; gap: 10px;">
                <button class="btn btn-sm" style="background: var(--success-color); color: white;" 
                        onclick="completeDelai('${delai.id}')">
                    <i class="fas fa-check"></i> Marquer complété
                </button>
                <button class="btn btn-sm btn-outline" style="border-color: var(--primary-color); color: var(--primary-color);"
                        onclick="viewDelaiDetails('${delai.id}')">
                    <i class="fas fa-eye"></i> Détails
                </button>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

function updateFacturesList(facturesData) {
    const container = document.getElementById('facturesList');
    
    if (!facturesData.factures || facturesData.factures.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-check-circle"></i>
                <p>Aucune facture impayée</p>
                <small>Toutes vos factures sont à jour !</small>
            </div>
        `;
        return;
    }
    
    const html = facturesData.factures.map(facture => {
        const isEnRetard = facture.statut === 'en_retard';
        
        return `
            <div class="facture-item ${isEnRetard ? 'en-retard' : ''} fade-in">
                <div class="facture-header">
                    <span class="facture-numero">
                        <i class="fas fa-file-invoice"></i> ${facture.numero}
                    </span>
                    <span class="facture-montant">
                        ${formatMontant(facture.total_ttc)} €
                    </span>
                </div>
                <div class="facture-info">
                    <p><strong>${facture.client}</strong></p>
                    <p>
                        <i class="fas fa-folder"></i> ${facture.reference_dossier}
                    </p>
                    <p>
                        <i class="fas fa-calendar"></i> 
                        Émise le ${formatDate(facture.date_emission)}
                    </p>
                    <p>
                        <i class="fas fa-clock"></i> 
                        Échéance: ${formatDate(facture.date_limite_paiement)}
                        ${isEnRetard ? `<span style="color: var(--danger-color); font-weight: bold;"> (${facture.jours_retard}j de retard)</span>` : ''}
                    </p>
                </div>
                <div style="margin-top: 12px; display: flex; gap: 10px;">
                    <button class="btn btn-sm" style="background: var(--success-color); color: white;"
                            onclick="markFacturePaid('${facture.numero}')">
                        <i class="fas fa-check-circle"></i> Marquer payée
                    </button>
                    <button class="btn btn-sm btn-outline" style="border-color: var(--primary-color); color: var(--primary-color);"
                            onclick="viewFacture('${facture.numero}')">
                        <i class="fas fa-eye"></i> Voir facture
                    </button>
                    ${isEnRetard ? `
                        <button class="btn btn-sm" style="background: var(--danger-color); color: white;"
                                onclick="sendRelance('${facture.numero}')">
                            <i class="fas fa-paper-plane"></i> Relancer
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

function updateAlertsBanner(alertesData) {
    const banner = document.getElementById('alertsBanner');
    const count = document.getElementById('alertsCount');
    
    if (alertesData.count > 0) {
        banner.style.display = 'block';
        count.textContent = alertesData.count;
    } else {
        banner.style.display = 'none';
    }
}

function updateTodayStats() {
    // Ces valeurs viendraient normalement d'une API séparée
    // Pour l'instant, valeurs simulées
    document.getElementById('todayHours').textContent = '0h';
    document.getElementById('todayInvoices').textContent = '0';
    document.getElementById('todayCorrespondence').textContent = '0';
}

function updateLastUpdateTime() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    document.getElementById('lastUpdate').textContent = timeStr;
}

// ================================================
// ACTIONS
// ================================================

async function completeDelai(delaiId) {
    if (!confirm('Marquer ce délai comme complété ?')) return;
    
    try {
        const note = prompt('Note optionnelle:');
        
        const response = await fetch(`${API_BASE_URL}/deadlines/${delaiId}/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ note: note || '' })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess('Délai marqué comme complété !');
            refreshDashboard();
        } else {
            showError('Erreur lors de la mise à jour');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showError('Erreur de communication avec le serveur');
    }
}

async function markFacturePaid(numero) {
    if (!confirm('Marquer cette facture comme payée ?')) return;
    
    try {
        const datePaiement = prompt('Date de paiement (JJ/MM/AAAA):', 
            new Date().toLocaleDateString('fr-FR'));
        
        const response = await fetch(`${API_BASE_URL}/billing/invoice/${numero}/paid`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                date_paiement: convertToISO(datePaiement) 
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess('Facture marquée comme payée !');
            refreshDashboard();
        } else {
            showError('Erreur lors de la mise à jour');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showError('Erreur de communication avec le serveur');
    }
}

function viewDelaiDetails(delaiId) {
    alert('Fonctionnalité à venir: Vue détaillée du délai ' + delaiId);
    // TODO: Implémenter modal de détails
}

function viewFacture(numero) {
    window.open(`${API_BASE_URL}/billing/invoice/${numero}/format`, '_blank');
}

function sendRelance(numero) {
    alert('Envoi de relance pour facture ' + numero);
    // TODO: Implémenter envoi relance automatique
}

// ================================================
// MODALS (À IMPLÉMENTER)
// ================================================

function openModal(modalType) {
    switch(modalType) {
        case 'newDeadline':
            alert('Modal: Nouveau délai\n\nFonctionnalité à venir...');
            break;
        case 'newTimeEntry':
            alert('Modal: Saisie temps\n\nFonctionnalité à venir...');
            break;
        case 'newInvoice':
            alert('Modal: Créer facture\n\nFonctionnalité à venir...');
            break;
        case 'conflictCheck':
            alert('Modal: Vérification conflit\n\nFonctionnalité à venir...');
            break;
        case 'generateDocument':
            alert('Modal: Générer document\n\nFonctionnalité à venir...');
            break;
    }
}

// ================================================
// UTILS
// ================================================

function formatMontant(montant) {
    return new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(montant);
}

function formatHeures(heures) {
    const h = Math.floor(heures);
    const m = Math.round((heures - h) * 60);
    return m > 0 ? `${h}h${m}` : `${h}h`;
}

function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function convertToISO(dateStr) {
    // Convertit DD/MM/YYYY en YYYY-MM-DD
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month}-${day}`;
}

function scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function showLoading() {
    // Animation de chargement déjà présente dans le HTML
}

function showSuccess(message) {
    // TODO: Implémenter système de notifications toast
    alert('✅ ' + message);
}

function showError(message) {
    // TODO: Implémenter système de notifications toast
    alert('❌ ' + message);
}

// ================================================
// CLEANUP
// ================================================

window.addEventListener('beforeunload', function() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
});
