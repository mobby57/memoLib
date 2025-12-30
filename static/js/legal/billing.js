// Configuration
const API_BASE_URL = '/api/legal';

// État
let timeEntries = [];
let invoices = [];
let unpaidInvoices = [];
let currentTab = 'temps';
let currentFactureNum = null;

// Taux horaires par défaut
const TAUX_DEFAUT = {
    'consultation': 200,
    'audience': 250,
    'plaidoirie': 300,
    'redaction': 150,
    'recherche': 100,
    'autre': 150
};

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    loadAllData();
    setDefaultDate();
    setupTimeCalculation();
});

// Chargement de toutes les données
async function loadAllData() {
    await Promise.all([
        loadTimeEntries(),
        loadInvoices(),
        loadUnpaidInvoices()
    ]);
    updateStats();
}

// Chargement des temps
async function loadTimeEntries() {
    try {
        const response = await fetch(`${API_BASE_URL}/billing/time-entries`);
        const data = await response.json();
        if (data.success) {
            timeEntries = data.time_entries || [];
            renderTimeEntries();
        }
    } catch (error) {
        console.error('Erreur chargement temps:', error);
    }
}

// Chargement des factures
async function loadInvoices() {
    try {
        const response = await fetch(`${API_BASE_URL}/billing/invoices`);
        const data = await response.json();
        if (data.success) {
            invoices = data.factures || [];
            renderInvoices();
        }
    } catch (error) {
        console.error('Erreur chargement factures:', error);
    }
}

// Chargement des impayés
async function loadUnpaidInvoices() {
    try {
        const response = await fetch(`${API_BASE_URL}/billing/unpaid`);
        const data = await response.json();
        if (data.success) {
            unpaidInvoices = data.factures_impayees || [];
            renderUnpaid();
        }
    } catch (error) {
        console.error('Erreur chargement impayés:', error);
    }
}

// Mise à jour des statistiques
function updateStats() {
    // Chiffre d'affaires mensuel
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyRevenue = invoices
        .filter(inv => inv.date_emission && inv.date_emission.startsWith(currentMonth) && inv.statut === 'payee')
        .reduce((sum, inv) => sum + inv.montant_total, 0);
    document.getElementById('totalRevenue').textContent = formatMontant(monthlyRevenue);

    // Temps non facturé
    const unbilledEntries = timeEntries.filter(t => !t.facture);
    const unbilledMinutes = unbilledEntries.reduce((sum, t) => sum + (t.duree || 0), 0);
    const unbilledAmount = unbilledEntries.reduce((sum, t) => sum + (t.montant || 0), 0);
    document.getElementById('unbilledHours').textContent = formatDuree(unbilledMinutes);
    document.getElementById('unbilledAmount').textContent = formatMontant(unbilledAmount);

    // Factures impayées
    document.getElementById('unpaidInvoices').textContent = unpaidInvoices.length;
    const unpaidAmount = unpaidInvoices.reduce((sum, inv) => sum + inv.montant_total, 0);
    document.getElementById('unpaidAmount').textContent = formatMontant(unpaidAmount);

    // Taux horaire moyen
    if (timeEntries.length > 0) {
        const avgRate = timeEntries.reduce((sum, t) => sum + (t.taux_horaire || 0), 0) / timeEntries.length;
        document.getElementById('averageRate').textContent = Math.round(avgRate) + ' €/h';
    }
}

// Rendu des temps
function renderTimeEntries() {
    const container = document.getElementById('tempsList');
    const filter = document.getElementById('tempsFilter')?.value || 'tous';
    
    let filtered = timeEntries;
    if (filter === 'non_facture') {
        filtered = timeEntries.filter(t => !t.facture);
    } else if (filter === 'facture') {
        filtered = timeEntries.filter(t => t.facture);
    }

    if (filtered.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-light);">Aucun temps enregistré</div>';
        return;
    }

    container.innerHTML = filtered.map(time => `
        <div class="time-item ${time.facture ? 'facture' : 'non-facture'}">
            <div class="time-header">
                <div class="time-title">
                    <i class="fas fa-folder"></i> ${time.numero_dossier} - ${time.client}
                </div>
                <div>
                    <span class="status-badge ${time.facture ? 'facture' : 'non-facture'}">
                        ${time.facture ? 'Facturé' : 'Non facturé'}
                    </span>
                    <span class="time-amount">${formatMontant(time.montant)}</span>
                </div>
            </div>
            <div class="time-info">
                <div class="time-info-item">
                    <i class="fas fa-clock"></i>
                    <span>${formatDuree(time.duree)} - ${time.type_prestation}</span>
                </div>
                <div class="time-info-item">
                    <i class="fas fa-euro-sign"></i>
                    <span>${time.taux_horaire} €/h</span>
                </div>
                <div class="time-info-item">
                    <i class="fas fa-calendar"></i>
                    <span>${formatDate(time.date_prestation)}</span>
                </div>
            </div>
            <div class="time-description">${time.description}</div>
        </div>
    `).join('');
}

// Rendu des factures
function renderInvoices() {
    const container = document.getElementById('facturesList');
    const filter = document.getElementById('facturesFilter')?.value || 'tous';
    
    let filtered = invoices;
    if (filter !== 'tous') {
        filtered = invoices.filter(inv => inv.statut === filter);
    }

    if (filtered.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-light);">Aucune facture</div>';
        return;
    }

    container.innerHTML = filtered
        .sort((a, b) => b.numero_facture.localeCompare(a.numero_facture))
        .map(inv => `
            <div class="invoice-item ${inv.statut}" onclick="showFactureDetails('${inv.numero_facture}')">
                <div class="invoice-header">
                    <div class="invoice-number">
                        <i class="fas fa-file-invoice"></i> ${inv.numero_facture}
                    </div>
                    <div>
                        <span class="invoice-status ${inv.statut}">
                            ${getStatutLabel(inv.statut)}
                        </span>
                        <span class="invoice-amount">${formatMontant(inv.montant_total)}</span>
                    </div>
                </div>
                <div class="invoice-info">
                    <div class="invoice-info-item">
                        <i class="fas fa-user"></i>
                        <span>${inv.client}</span>
                    </div>
                    <div class="invoice-info-item">
                        <i class="fas fa-calendar"></i>
                        <span>Émise le ${formatDate(inv.date_emission)}</span>
                    </div>
                    <div class="invoice-info-item">
                        <i class="fas fa-clock"></i>
                        <span>${formatDuree(inv.temps_total || 0)}</span>
                    </div>
                </div>
            </div>
        `).join('');
}

// Rendu des impayés
function renderUnpaid() {
    const container = document.getElementById('impayesList');

    if (unpaidInvoices.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--success-color);"><i class="fas fa-check-circle" style="font-size:48px;margin-bottom:15px;"></i><p>Aucune facture impayée !</p></div>';
        return;
    }

    container.innerHTML = unpaidInvoices
        .sort((a, b) => b.jours_retard - a.jours_retard)
        .map(inv => `
            <div class="invoice-item impayee" onclick="showFactureDetails('${inv.numero_facture}')">
                <div class="invoice-header">
                    <div class="invoice-number">
                        <i class="fas fa-exclamation-triangle"></i> ${inv.numero_facture}
                    </div>
                    <div class="invoice-amount">${formatMontant(inv.montant_total)}</div>
                </div>
                <div class="invoice-info">
                    <div class="invoice-info-item">
                        <i class="fas fa-user"></i>
                        <span>${inv.client}</span>
                    </div>
                    <div class="invoice-info-item">
                        <i class="fas fa-calendar"></i>
                        <span>Émise le ${formatDate(inv.date_emission)}</span>
                    </div>
                </div>
                <div class="overdue-badge">
                    <i class="fas fa-clock"></i>
                    <strong>Retard: ${inv.jours_retard} jours</strong>
                </div>
            </div>
        `).join('');
}

// Changement d'onglet
function switchTab(tab) {
    currentTab = tab;
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tab + 'Tab').classList.add('active');
}

// Filtres
function filterTemps() {
    renderTimeEntries();
}

function filterFactures() {
    renderInvoices();
}

// Modal saisie temps
function openTimeEntryModal() {
    document.getElementById('timeEntryModal').classList.add('active');
}

function closeTimeEntryModal() {
    document.getElementById('timeEntryModal').classList.remove('active');
    document.getElementById('timeEntryForm').reset();
    setDefaultDate();
}

// Mise à jour taux horaire selon prestation
function updateTauxHoraire() {
    const type = document.getElementById('typePrestation').value;
    if (type && TAUX_DEFAUT[type]) {
        document.getElementById('tauxHoraire').value = TAUX_DEFAUT[type];
    }
    updateMontantPreview();
}

// Configuration du calcul automatique
function setupTimeCalculation() {
    ['heures', 'minutes', 'tauxHoraire'].forEach(id => {
        const elem = document.getElementById(id);
        if (elem) {
            elem.addEventListener('input', updateMontantPreview);
        }
    });
}

// Mise à jour montant prévisualisation
function updateMontantPreview() {
    const heures = parseInt(document.getElementById('heures')?.value || 0);
    const minutes = parseInt(document.getElementById('minutes')?.value || 0);
    const taux = parseFloat(document.getElementById('tauxHoraire')?.value || 0);
    
    const dureeHeures = heures + (minutes / 60);
    const montant = dureeHeures * taux;
    
    document.getElementById('montantPreview').textContent = formatMontant(montant);
}

// Date par défaut
function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    const dateElem = document.getElementById('datePrestation');
    if (dateElem) {
        dateElem.value = today;
    }
}

// Soumettre temps
async function submitTimeEntry(event) {
    event.preventDefault();
    
    const heures = parseInt(document.getElementById('heures').value);
    const minutes = parseInt(document.getElementById('minutes').value);
    
    const formData = {
        numero_dossier: document.getElementById('dossier').value,
        client: document.getElementById('client').value,
        type_prestation: document.getElementById('typePrestation').value,
        duree_heures: heures,
        duree_minutes: minutes,
        taux_horaire: parseFloat(document.getElementById('tauxHoraire').value),
        date_prestation: document.getElementById('datePrestation').value,
        description: document.getElementById('description').value
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/billing/time-entry`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess('Temps enregistré avec succès');
            closeTimeEntryModal();
            loadAllData();
        } else {
            showError(data.message || 'Erreur');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showError('Impossible d\'enregistrer le temps');
    }
}

// Modal génération facture
function openInvoiceModal() {
    loadClientsForInvoice();
    document.getElementById('invoiceModal').classList.add('active');
}

function closeInvoiceModal() {
    document.getElementById('invoiceModal').classList.remove('active');
    document.getElementById('invoiceForm').reset();
}

// Charger clients pour facture
function loadClientsForInvoice() {
    const clients = [...new Set(timeEntries.filter(t => !t.facture).map(t => t.client))];
    const select = document.getElementById('invoiceClient');
    
    select.innerHTML = '<option value="">-- Sélectionner un client --</option>' +
        clients.map(c => `<option value="${c}">${c}</option>`).join('');
}

// Charger temps du client
function loadClientTimeEntries() {
    const client = document.getElementById('invoiceClient').value;
    if (!client) return;
    
    const clientEntries = timeEntries.filter(t => t.client === client && !t.facture);
    const container = document.getElementById('timeEntriesForInvoice');
    
    if (clientEntries.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:var(--text-light);">Aucun temps non facturé pour ce client</p>';
        return;
    }
    
    container.innerHTML = clientEntries.map((t, idx) => `
        <div class="time-entry-checkbox">
            <input type="checkbox" id="time_${idx}" value="${t.id}" checked onchange="updateInvoiceSummary()">
            <label for="time_${idx}" style="flex:1;margin:0;">
                ${formatDate(t.date_prestation)} - ${t.type_prestation} - ${formatDuree(t.duree)} - ${formatMontant(t.montant)}
            </label>
        </div>
    `).join('');
    
    updateInvoiceSummary();
}

// Mise à jour résumé facture
function updateInvoiceSummary() {
    const checkboxes = document.querySelectorAll('#timeEntriesForInvoice input[type="checkbox"]:checked');
    let subtotal = 0;
    
    checkboxes.forEach(cb => {
        const entry = timeEntries.find(t => t.id === cb.value);
        if (entry) {
            subtotal += entry.montant;
        }
    });
    
    const total = subtotal + 40; // Frais de recouvrement
    
    document.getElementById('invoiceSubtotal').textContent = formatMontant(subtotal);
    document.getElementById('invoiceTotal').textContent = formatMontant(total);
}

// Générer facture
async function generateInvoice(event) {
    event.preventDefault();
    
    const client = document.getElementById('invoiceClient').value;
    const checkboxes = document.querySelectorAll('#timeEntriesForInvoice input[type="checkbox"]:checked');
    const timeEntryIds = Array.from(checkboxes).map(cb => cb.value);
    
    if (timeEntryIds.length === 0) {
        showError('Sélectionnez au moins un temps');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/billing/invoice`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client: client,
                time_entry_ids: timeEntryIds
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess('Facture générée: ' + data.facture.numero_facture);
            closeInvoiceModal();
            loadAllData();
        } else {
            showError(data.message || 'Erreur');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showError('Impossible de générer la facture');
    }
}

// Afficher détails facture
function showFactureDetails(numero) {
    currentFactureNum = numero;
    const facture = invoices.find(f => f.numero_facture === numero);
    
    if (!facture) return;
    
    const detailsHtml = `
        <div class="detail-section">
            <h4>Informations générales</h4>
            <div class="detail-row">
                <div class="detail-label">Numéro:</div>
                <div class="detail-value">${facture.numero_facture}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Client:</div>
                <div class="detail-value">${facture.client}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Date d'émission:</div>
                <div class="detail-value">${formatDate(facture.date_emission)}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Statut:</div>
                <div class="detail-value">
                    <span class="invoice-status ${facture.statut}">${getStatutLabel(facture.statut)}</span>
                </div>
            </div>
        </div>
        
        <div class="detail-section">
            <h4>Montants</h4>
            <table class="detail-table">
                <tr>
                    <td>Sous-total HT:</td>
                    <td style="text-align:right;font-weight:bold;">${formatMontant(facture.montant_total - 40)}</td>
                </tr>
                <tr>
                    <td>Frais de recouvrement:</td>
                    <td style="text-align:right;">40,00 €</td>
                </tr>
                <tr style="font-weight:bold;font-size:16px;">
                    <td>Total HT:</td>
                    <td style="text-align:right;">${formatMontant(facture.montant_total)}</td>
                </tr>
            </table>
        </div>
    `;
    
    document.getElementById('factureDetails').innerHTML = detailsHtml;
    document.getElementById('detailsFactureModal').classList.add('active');
}

function closeDetailsFactureModal() {
    document.getElementById('detailsFactureModal').classList.remove('active');
    currentFactureNum = null;
}

// Marquer facture payée
async function markFacturePaid() {
    if (!currentFactureNum) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/billing/invoice/${currentFactureNum}/paid`, {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess('Facture marquée comme payée');
            closeDetailsFactureModal();
            loadAllData();
        } else {
            showError(data.message || 'Erreur');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showError('Impossible de marquer la facture comme payée');
    }
}

// Relancer tous les impayés
async function sendReminderAll() {
    if (unpaidInvoices.length === 0) {
        showError('Aucune facture impayée');
        return;
    }
    
    if (!confirm(`Envoyer une relance pour ${unpaidInvoices.length} facture(s) impayée(s) ?`)) {
        return;
    }
    
    showSuccess(`${unpaidInvoices.length} relance(s) envoyée(s) (fonctionnalité à implémenter)`);
}

// Utilitaires
function getStatutLabel(statut) {
    const labels = {
        'payee': 'Payée',
        'impayee': 'Impayée',
        'en_cours': 'En cours'
    };
    return labels[statut] || statut;
}

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

function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function showSuccess(message) {
    alert('✅ ' + message);
}

function showError(message) {
    alert('❌ ' + message);
}
