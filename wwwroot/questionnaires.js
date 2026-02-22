// Questionnaires dynamiques - Interface JavaScript
class QuestionnaireManager {
    constructor(apiBase, token) {
        this.apiBase = apiBase;
        this.token = token;
    }

    async getQuestionnaires(eventId) {
        const response = await fetch(`${this.apiBase}/api/questionnaire/for-event/${eventId}`, {
            headers: { 'Authorization': `Bearer ${this.token}` }
        });
        return await response.json();
    }

    async submitResponse(questionnaireId, caseId, eventId, answers) {
        const response = await fetch(`${this.apiBase}/api/questionnaire/response`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`
            },
            body: JSON.stringify({ questionnaireId, caseId, eventId, answers })
        });
        return await response.json();
    }

    renderQuestionnaire(questionnaire, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const html = `
            <div class="questionnaire-card" data-id="${questionnaire.id}">
                <h3>${questionnaire.name}</h3>
                <p>${questionnaire.description || ''}</p>
                ${questionnaire.isCompleted ? '<span class="badge-success">✓ Complété</span>' : '<span class="badge-warning">À compléter</span>'}
                
                <form class="questionnaire-form" data-questionnaire-id="${questionnaire.id}">
                    ${questionnaire.questions.map(q => this.renderQuestion(q)).join('')}
                    <button type="submit" ${questionnaire.isCompleted ? 'disabled' : ''}>
                        ${questionnaire.isCompleted ? 'Déjà complété' : 'Soumettre'}
                    </button>
                </form>
            </div>
        `;
        
        container.innerHTML += html;
        this.attachFormHandler(questionnaire.id);
    }

    renderQuestion(question) {
        const required = question.isRequired ? 'required' : '';
        const requiredMark = question.isRequired ? '*' : '';

        switch (question.type) {
            case 'TEXT':
                return `
                    <div class="form-group">
                        <label>${question.text}${requiredMark}</label>
                        <textarea name="${question.id}" ${required}></textarea>
                    </div>
                `;
            case 'CHOICE':
                const options = question.options || [];
                return `
                    <div class="form-group">
                        <label>${question.text}${requiredMark}</label>
                        <select name="${question.id}" ${required}>
                            <option value="">-- Choisir --</option>
                            ${options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
                        </select>
                    </div>
                `;
            case 'BOOLEAN':
                return `
                    <div class="form-group">
                        <label>
                            <input type="checkbox" name="${question.id}" value="true" ${required}>
                            ${question.text}${requiredMark}
                        </label>
                    </div>
                `;
            case 'NUMBER':
                return `
                    <div class="form-group">
                        <label>${question.text}${requiredMark}</label>
                        <input type="number" name="${question.id}" ${required}>
                    </div>
                `;
            case 'DATE':
                return `
                    <div class="form-group">
                        <label>${question.text}${requiredMark}</label>
                        <input type="date" name="${question.id}" ${required}>
                    </div>
                `;
            default:
                return `
                    <div class="form-group">
                        <label>${question.text}${requiredMark}</label>
                        <input type="text" name="${question.id}" ${required}>
                    </div>
                `;
        }
    }

    attachFormHandler(questionnaireId) {
        const form = document.querySelector(`form[data-questionnaire-id="${questionnaireId}"]`);
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            const answers = {};
            
            for (const [key, value] of formData.entries()) {
                answers[key] = value;
            }

            // Gérer les checkboxes non cochées
            const checkboxes = form.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(cb => {
                if (!cb.checked) {
                    answers[cb.name] = 'false';
                }
            });

            try {
                const caseId = form.dataset.caseId;
                const eventId = form.dataset.eventId;
                
                await this.submitResponse(questionnaireId, caseId, eventId, answers);
                
                // Marquer comme complété
                const card = form.closest('.questionnaire-card');
                card.querySelector('.badge-warning')?.classList.replace('badge-warning', 'badge-success');
                card.querySelector('.badge-success').textContent = '✓ Complété';
                form.querySelector('button').disabled = true;
                form.querySelector('button').textContent = 'Déjà complété';
                
                showNotification('Questionnaire complété avec succès', 'success');
            } catch (error) {
                showNotification('Erreur lors de la soumission', 'error');
                console.error(error);
            }
        });
    }
}

// Intégration dans l'interface existante
function showEventQuestionnaires(eventId, caseId) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Questionnaires de clôture</h2>
                <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">×</button>
            </div>
            <div class="modal-body">
                <div id="questionnaires-container"></div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const qm = new QuestionnaireManager('http://localhost:5078', localStorage.getItem('token'));
    
    qm.getQuestionnaires(eventId).then(questionnaires => {
        questionnaires.forEach(q => {
            qm.renderQuestionnaire(q, 'questionnaires-container');
            // Ajouter les IDs nécessaires aux formulaires
            const form = document.querySelector(`form[data-questionnaire-id="${q.id}"]`);
            if (form) {
                form.dataset.caseId = caseId;
                form.dataset.eventId = eventId;
            }
        });
    });
}

// CSS pour les questionnaires
const questionnaireStyles = `
<style>
.questionnaire-card {
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 20px;
    margin: 10px 0;
    background: white;
}

.questionnaire-card h3 {
    margin: 0 0 10px 0;
    color: #333;
}

.badge-success {
    background: #28a745;
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
}

.badge-warning {
    background: #ffc107;
    color: #212529;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
}

.form-group {
    margin: 15px 0;
}

.form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
}

.form-group input,
.form-group select,
.form-group textarea {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
}

.form-group textarea {
    height: 80px;
    resize: vertical;
}

.questionnaire-form button {
    background: #007bff;
    color: white;
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    margin-top: 15px;
}

.questionnaire-form button:disabled {
    background: #6c757d;
    cursor: not-allowed;
}

.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.modal-content {
    background: white;
    border-radius: 8px;
    max-width: 600px;
    max-height: 80vh;
    overflow-y: auto;
    width: 90%;
}

.modal-header {
    padding: 20px;
    border-bottom: 1px solid #ddd;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.modal-body {
    padding: 20px;
}

.close-btn {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
}
</style>
`;

// Ajouter les styles
document.head.insertAdjacentHTML('beforeend', questionnaireStyles);