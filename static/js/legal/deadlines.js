// Configuration
const API_BASE_URL = '/api/legal';

// État
let delais = [];
let currentFilter = 'tous';
let currentDelaiId = null;
let currentMonth = new Date();

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    loadDelais();
    setDefaultDate();
});

// Chargement des délais
async function loadDelais() {
    try {
        const response = await fetch(`${API_BASE_URL}/deadlines`);
        const data = await response.json();
        
        if (data.success) {
            delais = data.delais || [];
            updateStats();
            renderDelais();
        } else {
            showError('Erreur lors du chargement des délais');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showError('Impossible de charger les délais');
    }
}

// Mise à jour des statistiques
function updateStats() {
    const stats = {
        critique: 0,
        urgent: 0,
        attention: 0,
        normal: 0
    };

    delais.forEach(delai => {
        if (delai.statut !== 'complete') {
            stats[delai.urgence] = (stats[delai.urgence] || 0) + 1;
        }
    });

    document.getElementById('statCritique').textContent = stats.critique || 0;
    document.getElementById('statUrgent').textContent = stats.urgent || 0;
    document.getElementById('statAttention').textContent = stats.attention || 0;
    document.getElementById('statNormal').textContent = stats.normal || 0;
}

// Rendu de la liste des délais
function renderDelais() {
    const listeView = document.getElementById('listeView');
    const delaisFiltered = getFilteredDelais();

    if (delaisFiltered.length === 0) {
        listeView.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-light);">
                <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 15px;"></i>
                <p>Aucun délai à afficher</p>
            </div>
        `;
        return;
    }

    listeView.innerHTML = delaisFiltered.map(delai => `
        <div class="delai-item ${delai.urgence}" onclick="showDelaiDetails('${delai.id}')">
            <div class="delai-header">
                <div class="delai-title">
                    <i class="fas fa-folder"></i> ${delai.numero_dossier}
                </div>
                <span class="urgence-badge ${delai.urgence}">
                    ${getUrgenceLabel(delai.urgence)}
                </span>
            </div>
            <div class="delai-info">
                <div class="delai-info-item">
                    <i class="fas fa-calendar"></i>
                    <span><strong>Échéance:</strong> ${formatDate(delai.date_echeance)}</span>
                </div>
                <div class="delai-info-item">
                    <i class="fas fa-clock"></i>
                    <span><strong>Jours restants:</strong> ${delai.jours_restants}</span>
                </div>
                <div class="delai-info-item">
                    <i class="fas fa-file-alt"></i>
                    <span><strong>Type:</strong> ${delai.type_document}</span>
                </div>
                ${delai.parties ? `
                    <div class="delai-info-item">
                        <i class="fas fa-users"></i>
                        <span><strong>Parties:</strong> ${delai.parties}</span>
                    </div>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// Filtrage des délais
function getFilteredDelais() {
    let filtered = delais.filter(d => d.statut !== 'complete');

    if (currentFilter !== 'tous') {
        filtered = filtered.filter(d => d.urgence === currentFilter);
    }

    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase();
    if (searchTerm) {
        filtered = filtered.filter(d => 
            d.numero_dossier.toLowerCase().includes(searchTerm) ||
            (d.parties && d.parties.toLowerCase().includes(searchTerm)) ||
            (d.juridiction && d.juridiction.toLowerCase().includes(searchTerm))
        );
    }

    return filtered.sort((a, b) => a.jours_restants - b.jours_restants);
}

// Filtrer par urgence
function filterByUrgence(urgence) {
    currentFilter = urgence;
    
    // Mise à jour UI
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-filter="${urgence}"]`).classList.add('active');
    
    renderDelais();
}

// Recherche
function searchDelais() {
    renderDelais();
}

// Changer de vue
function switchView(view) {
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-view="${view}"]`).classList.add('active');

    if (view === 'liste') {
        document.getElementById('listeView').style.display = 'block';
        document.getElementById('calendrierView').style.display = 'none';
    } else {
        document.getElementById('listeView').style.display = 'none';
        document.getElementById('calendrierView').style.display = 'block';
        renderCalendar();
    }
}

// Rendu du calendrier
function renderCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    const monthLabel = document.getElementById('calendarMonth');
    
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    monthLabel.textContent = currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    let html = '';
    
    // Jours de la semaine
    ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].forEach(day => {
        html += `<div style="font-weight: bold; text-align: center; padding: 10px;">${day}</div>`;
    });
    
    // Jours vides au début
    const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    for (let i = 0; i < startDay; i++) {
        html += '<div></div>';
    }
    
    // Jours du mois
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateStr = date.toISOString().split('T')[0];
        const delaisForDay = delais.filter(d => d.date_echeance === dateStr && d.statut !== 'complete');
        const hasCritique = delaisForDay.some(d => d.urgence === 'critique');
        
        const classes = [];
        if (delaisForDay.length > 0) {
            classes.push(hasCritique ? 'has-critique' : 'has-delai');
        }
        
        html += `
            <div class="calendar-day ${classes.join(' ')}" onclick="showDayDelais('${dateStr}')">
                <div class="day-number">${day}</div>
                ${delaisForDay.length > 0 ? `<div class="day-delais-count">${delaisForDay.length}</div>` : ''}
            </div>
        `;
    }
    
    calendarGrid.innerHTML = html;
}

// Navigation calendrier
function previousMonth() {
    currentMonth.setMonth(currentMonth.getMonth() - 1);
    renderCalendar();
}

function nextMonth() {
    currentMonth.setMonth(currentMonth.getMonth() + 1);
    renderCalendar();
}

// Afficher les délais d'un jour
function showDayDelais(date) {
    const delaisForDay = delais.filter(d => d.date_echeance === date && d.statut !== 'complete');
    if (delaisForDay.length === 0) return;
    
    alert(`Délais pour le ${formatDate(date)}:\n\n` + 
        delaisForDay.map(d => `- ${d.numero_dossier} (${d.type_document})`).join('\n'));
}

// Modal nouveau délai
function openNewDelaiModal() {
    document.getElementById('newDelaiModal').classList.add('active');
}

function closeNewDelaiModal() {
    document.getElementById('newDelaiModal').classList.remove('active');
    document.getElementById('newDelaiForm').reset();
}

// Mettre à jour le type de délai selon le document
function updateDelaiType() {
    const typeDoc = document.getElementById('typeDocument').value;
    const typeDelai = document.getElementById('typeDelai');
    
    const mapping = {
        'appel': 'appel',
        'pourvoi_cassation': 'pourvoi',
        'prescription': 'prescription'
    };
    
    if (mapping[typeDoc]) {
        typeDelai.value = mapping[typeDoc];
    }
}

// Définir la date par défaut (aujourd'hui)
function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    const dateRef = document.getElementById('dateReference');
    if (dateRef) {
        dateRef.value = today;
    }
}

// Soumettre nouveau délai
async function submitNewDelai(event) {
    event.preventDefault();
    
    const formData = {
        numero_dossier: document.getElementById('numeroDossier').value,
        type_document: document.getElementById('typeDocument').value,
        type_delai: document.getElementById('typeDelai').value,
        date_reference: document.getElementById('dateReference').value,
        parties: document.getElementById('parties').value,
        juridiction: document.getElementById('juridiction').value,
        notes: document.getElementById('notes').value
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/deadlines`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess('Délai enregistré avec succès');
            closeNewDelaiModal();
            loadDelais();
        } else {
            showError(data.message || 'Erreur lors de l\'enregistrement');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showError('Impossible d\'enregistrer le délai');
    }
}

// Afficher les détails d'un délai
function showDelaiDetails(delaiId) {
    currentDelaiId = delaiId;
    const delai = delais.find(d => d.id === delaiId);
    
    if (!delai) return;
    
    const detailsHtml = `
        <div class="detail-row">
            <div class="detail-label">Numéro de dossier:</div>
            <div class="detail-value">${delai.numero_dossier}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Type de document:</div>
            <div class="detail-value">${delai.type_document}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Type de délai:</div>
            <div class="detail-value">${delai.type_delai}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Date de référence:</div>
            <div class="detail-value">${formatDate(delai.date_reference)}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Date d'échéance:</div>
            <div class="detail-value">${formatDate(delai.date_echeance)}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Jours restants:</div>
            <div class="detail-value">${delai.jours_restants}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Niveau d'urgence:</div>
            <div class="detail-value">
                <span class="urgence-badge ${delai.urgence}">${getUrgenceLabel(delai.urgence)}</span>
            </div>
        </div>
        ${delai.parties ? `
            <div class="detail-row">
                <div class="detail-label">Parties:</div>
                <div class="detail-value">${delai.parties}</div>
            </div>
        ` : ''}
        ${delai.juridiction ? `
            <div class="detail-row">
                <div class="detail-label">Juridiction:</div>
                <div class="detail-value">${delai.juridiction}</div>
            </div>
        ` : ''}
        ${delai.notes ? `
            <div class="detail-row">
                <div class="detail-label">Notes:</div>
                <div class="detail-value">${delai.notes}</div>
            </div>
        ` : ''}
    `;
    
    document.getElementById('delaiDetails').innerHTML = detailsHtml;
    document.getElementById('detailsDelaiModal').classList.add('active');
}

function closeDetailsModal() {
    document.getElementById('detailsDelaiModal').classList.remove('active');
    currentDelaiId = null;
}

// Marquer comme complété
async function markDelaiComplete() {
    if (!currentDelaiId) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/deadlines/${currentDelaiId}/complete`, {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess('Délai marqué comme complété');
            closeDetailsModal();
            loadDelais();
        } else {
            showError(data.message || 'Erreur');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showError('Impossible de marquer le délai comme complété');
    }
}

// Utilitaires
function getUrgenceLabel(urgence) {
    const labels = {
        'critique': 'Critique',
        'urgent': 'Urgent',
        'attention': 'Attention',
        'normal': 'Normal'
    };
    return labels[urgence] || urgence;
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
