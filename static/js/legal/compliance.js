// Configuration
const API_BASE_URL = '/api/legal';

// État
let correspondances = [];
let currentTab = 'registre';
let currentCorresId = null;

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    loadCorrespondances();
    setDefaultDate();
    loadNextChrono();
});

// Chargement des correspondances
async function loadCorrespondances() {
    try {
        const response = await fetch(`${API_BASE_URL}/compliance/register`);
        const data = await response.json();
        
        if (data.success) {
            correspondances = data.registre || [];
            updateStats();
            renderRegistre();
            renderArchive();
        }
    } catch (error) {
        console.error('Erreur chargement correspondances:', error);
        showError('Impossible de charger le registre');
    }
}

// Mise à jour des statistiques
function updateStats() {
    const currentYear = new Date().getFullYear();
    
    // Total cette année
    const thisYear = correspondances.filter(c => 
        c.numero_chrono && c.numero_chrono.includes(`-${currentYear}-`)
    );
    document.getElementById('totalCorrespondances').textContent = thisYear.length;
    
    // Dernier numéro chrono
    if (correspondances.length > 0) {
        const sorted = [...correspondances].sort((a, b) => 
            b.numero_chrono.localeCompare(a.numero_chrono)
        );
        document.getElementById('lastChrono').textContent = sorted[0].numero_chrono;
    }
    
    // Conflits détectés (à implémenter)
    document.getElementById('conflictsDetected').textContent = '0';
    
    // À archiver (>5 ans)
    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
    const toArchive = correspondances.filter(c => {
        const date = new Date(c.date + 'T00:00:00');
        return date < fiveYearsAgo;
    });
    document.getElementById('toArchive').textContent = toArchive.length;
}

// Rendu du registre
function renderRegistre() {
    const container = document.getElementById('registreList');
    const searchTerm = document.getElementById('searchRegistre')?.value.toLowerCase() || '';
    
    let filtered = correspondances;
    if (searchTerm) {
        filtered = correspondances.filter(c => 
            c.numero_chrono.toLowerCase().includes(searchTerm) ||
            c.client.toLowerCase().includes(searchTerm) ||
            c.destinataire.toLowerCase().includes(searchTerm) ||
            (c.objet && c.objet.toLowerCase().includes(searchTerm))
        );
    }
    
    if (filtered.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-light);">Aucune correspondance</div>';
        return;
    }
    
    container.innerHTML = filtered
        .sort((a, b) => b.numero_chrono.localeCompare(a.numero_chrono))
        .map(corres => `
            <div class="corres-item" onclick="showCorresDetails('${corres.id}')">
                <div class="corres-header">
                    <div class="corres-chrono">
                        <i class="fas fa-hashtag"></i> ${corres.numero_chrono}
                    </div>
                    <span class="corres-type-badge">${getTypeLabel(corres.type)}</span>
                </div>
                <div class="corres-info">
                    <div class="corres-info-item">
                        <i class="fas fa-user"></i>
                        <span><strong>Client:</strong> ${corres.client}</span>
                    </div>
                    <div class="corres-info-item">
                        <i class="fas fa-envelope"></i>
                        <span><strong>Destinataire:</strong> ${corres.destinataire}</span>
                    </div>
                    <div class="corres-info-item">
                        <i class="fas fa-calendar"></i>
                        <span>${formatDate(corres.date)}</span>
                    </div>
                    ${corres.numero_dossier ? `
                        <div class="corres-info-item">
                            <i class="fas fa-folder"></i>
                            <span>${corres.numero_dossier}</span>
                        </div>
                    ` : ''}
                </div>
                ${corres.objet ? `<div class="corres-objet">${corres.objet}</div>` : ''}
            </div>
        `).join('');
}

// Rendu des archives
function renderArchive() {
    const container = document.getElementById('archiveList');
    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
    
    const toArchive = correspondances.filter(c => {
        const date = new Date(c.date + 'T00:00:00');
        return date < fiveYearsAgo;
    });
    
    if (toArchive.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--success-color);"><i class="fas fa-check-circle" style="font-size:48px;margin-bottom:15px;"></i><p>Toutes les correspondances sont dans les délais de conservation</p></div>';
        return;
    }
    
    container.innerHTML = toArchive
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .map(corres => {
            const date = new Date(corres.date + 'T00:00:00');
            const yearsOld = Math.floor((new Date() - date) / (365.25 * 24 * 60 * 60 * 1000));
            
            return `
                <div class="archive-item">
                    <div class="archive-header">
                        <div>
                            <strong>${corres.numero_chrono}</strong> - ${corres.client}
                        </div>
                        <span class="retention-badge">${yearsOld} ans</span>
                    </div>
                    <div class="archive-info">
                        Date: ${formatDate(corres.date)} | Destinataire: ${corres.destinataire}
                        ${corres.date_suppression ? `<br>Suppression autorisée après le: ${formatDate(corres.date_suppression)}` : ''}
                    </div>
                </div>
            `;
        }).join('');
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

// Recherche dans le registre
function searchRegistre() {
    renderRegistre();
}

// Exporter le registre
function exportRegistre() {
    const csv = [
        ['Numéro chrono', 'Date', 'Type', 'Client', 'Destinataire', 'Objet', 'Dossier'].join(';'),
        ...correspondances.map(c => [
            c.numero_chrono,
            formatDate(c.date),
            getTypeLabel(c.type),
            c.client,
            c.destinataire,
            c.objet || '',
            c.numero_dossier || ''
        ].join(';'))
    ].join('\n');
    
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `registre_correspondances_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    showSuccess('Registre exporté avec succès');
}

// Vérifier conflit d'intérêts
async function verifierConflit() {
    const nouveauClient = document.getElementById('nouveauClient').value.trim();
    const partieAdverse = document.getElementById('partieAdverse').value.trim();
    
    if (!nouveauClient) {
        showError('Veuillez saisir le nom du nouveau client');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/compliance/conflict-check`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nouveau_client: nouveauClient,
                partie_adverse: partieAdverse || null
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            displayConflictResults(data.verification);
        } else {
            showError(data.message || 'Erreur lors de la vérification');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showError('Impossible de vérifier les conflits');
    }
}

// Afficher les résultats de vérification
function displayConflictResults(verification) {
    const container = document.getElementById('conflictResults');
    
    if (!verification.conflit_detecte) {
        container.innerHTML = `
            <div class="conflict-alert success">
                <div class="conflict-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <div class="conflict-content">
                    <h4>Aucun conflit détecté</h4>
                    <p>Le client <strong>${verification.nouveau_client}</strong> peut être accepté.</p>
                    <p style="margin-top:10px;color:var(--text-light);font-size:14px;">
                        Vérification effectuée le ${formatDate(verification.date_verification)}
                    </p>
                </div>
            </div>
        `;
        return;
    }
    
    // Conflit détecté
    const typeLabels = {
        'direct': 'Conflit direct',
        'indirect': 'Conflit indirect',
        'historique': 'Conflit historique'
    };
    
    let html = `
        <div class="conflict-alert danger">
            <div class="conflict-icon">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <div class="conflict-content">
                <h4>⚠️ Conflit d'intérêts détecté !</h4>
                <p><strong>Type:</strong> ${typeLabels[verification.type_conflit]}</p>
                <p><strong>Raison:</strong> ${verification.raison}</p>
    `;
    
    if (verification.clients_concernes && verification.clients_concernes.length > 0) {
        html += `
            <div class="conflict-details">
                <strong>Clients concernés:</strong>
                ${verification.clients_concernes.map(c => `
                    <div class="conflict-item">
                        <i class="fas fa-user"></i> ${c}
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    html += `
                <p style="margin-top:15px;color:var(--danger-color);font-weight:600;">
                    ⛔ L'acceptation de ce client pourrait violer les règles déontologiques.
                </p>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

// Révision des délais de conservation
function reviewRetention() {
    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
    
    const toArchive = correspondances.filter(c => {
        const date = new Date(c.date + 'T00:00:00');
        return date < fiveYearsAgo;
    });
    
    if (toArchive.length === 0) {
        showSuccess('Aucune correspondance à archiver pour le moment');
    } else {
        showSuccess(`${toArchive.length} correspondance(s) à archiver (>5 ans)`);
        switchTab('archive');
    }
}

// Modal nouvelle correspondance
function openNewCorrespondanceModal() {
    document.getElementById('newCorrespondanceModal').classList.add('active');
    loadNextChrono();
}

function closeNewCorrespondanceModal() {
    document.getElementById('newCorrespondanceModal').classList.remove('active');
    document.getElementById('newCorrespondanceForm').reset();
    setDefaultDate();
}

// Charger le prochain numéro chrono
async function loadNextChrono() {
    try {
        // Générer un numéro temporaire basé sur l'année
        const year = new Date().getFullYear();
        const thisYear = correspondances.filter(c => 
            c.numero_chrono && c.numero_chrono.includes(`-${year}-`)
        );
        const nextNum = (thisYear.length + 1).toString().padStart(5, '0');
        const nextChrono = `SOR-${year}-${nextNum}`;
        
        document.getElementById('nextChrono').textContent = nextChrono;
    } catch (error) {
        console.error('Erreur:', error);
    }
}

// Date par défaut
function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    const dateElem = document.getElementById('dateCorres');
    if (dateElem) {
        dateElem.value = today;
    }
}

// Soumettre nouvelle correspondance
async function submitNewCorrespondance(event) {
    event.preventDefault();
    
    const formData = {
        type: document.getElementById('typeCorrespondance').value,
        client: document.getElementById('clientCorres').value,
        numero_dossier: document.getElementById('dossierCorres').value || null,
        destinataire: document.getElementById('destinataire').value,
        objet: document.getElementById('objet').value,
        date: document.getElementById('dateCorres').value,
        notes: document.getElementById('notesCorres').value || null
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/compliance/correspondence`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess(`Correspondance enregistrée: ${data.correspondance.numero_chrono}`);
            closeNewCorrespondanceModal();
            loadCorrespondances();
        } else {
            showError(data.message || 'Erreur lors de l\'enregistrement');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showError('Impossible d\'enregistrer la correspondance');
    }
}

// Afficher les détails d'une correspondance
function showCorresDetails(corresId) {
    currentCorresId = corresId;
    const corres = correspondances.find(c => c.id === corresId);
    
    if (!corres) return;
    
    const detailsHtml = `
        <div class="detail-row">
            <div class="detail-label">Numéro chrono:</div>
            <div class="detail-value"><strong>${corres.numero_chrono}</strong></div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Type:</div>
            <div class="detail-value">${getTypeLabel(corres.type)}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Date:</div>
            <div class="detail-value">${formatDate(corres.date)}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Client:</div>
            <div class="detail-value">${corres.client}</div>
        </div>
        ${corres.numero_dossier ? `
            <div class="detail-row">
                <div class="detail-label">Numéro de dossier:</div>
                <div class="detail-value">${corres.numero_dossier}</div>
            </div>
        ` : ''}
        <div class="detail-row">
            <div class="detail-label">Destinataire:</div>
            <div class="detail-value">${corres.destinataire}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Objet:</div>
            <div class="detail-value">${corres.objet || '-'}</div>
        </div>
        ${corres.notes ? `
            <div class="detail-row">
                <div class="detail-label">Notes:</div>
                <div class="detail-value">${corres.notes}</div>
            </div>
        ` : ''}
        ${corres.hash_integrite ? `
            <div class="detail-row">
                <div class="detail-label">Hash d'intégrité:</div>
                <div class="detail-value hash-value">${corres.hash_integrite}</div>
            </div>
        ` : ''}
        ${corres.date_suppression ? `
            <div class="detail-row">
                <div class="detail-label">Suppression autorisée:</div>
                <div class="detail-value">${formatDate(corres.date_suppression)}</div>
            </div>
        ` : ''}
    `;
    
    document.getElementById('corresDetails').innerHTML = detailsHtml;
    document.getElementById('detailsCorresModal').classList.add('active');
}

function closeDetailsCorresModal() {
    document.getElementById('detailsCorresModal').classList.remove('active');
    currentCorresId = null;
}

// Utilitaires
function getTypeLabel(type) {
    const labels = {
        'sortant': 'Sortant',
        'entrant': 'Entrant',
        'email': 'Email',
        'fax': 'Fax',
        'autre': 'Autre'
    };
    return labels[type] || type;
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
