// Navigation stratégique pour app inclusive
class InclusiveNavigation {
    constructor() {
        this.currentPath = [];
        this.userSpeed = 'normal'; // slow, normal, fast
        this.userPreferences = {};
        this.sessionData = {};
        this.init();
    }
    
    init() {
        this.detectUserSpeed();
        this.setupBreadcrumbs();
        this.setupProgressTracking();
        this.setupEmergencyExit();
    }
    
    // Détection automatique de la vitesse utilisateur
    detectUserSpeed() {
        let clickTimes = [];
        document.addEventListener('click', (e) => {
            clickTimes.push(Date.now());
            if (clickTimes.length > 3) {
                const avgTime = this.calculateAverageTime(clickTimes.slice(-3));
                this.userSpeed = avgTime > 3000 ? 'slow' : avgTime < 1000 ? 'fast' : 'normal';
                this.adaptInterface();
            }
        });
    }
    
    calculateAverageTime(times) {
        const intervals = [];
        for (let i = 1; i < times.length; i++) {
            intervals.push(times[i] - times[i-1]);
        }
        return intervals.reduce((a, b) => a + b, 0) / intervals.length;
    }
    
    // Adaptation interface selon vitesse
    adaptInterface() {
        const delays = {
            slow: { transition: 800, feedback: 2000, autoNext: 5000 },
            normal: { transition: 400, feedback: 1500, autoNext: 3000 },
            fast: { transition: 200, feedback: 1000, autoNext: 2000 }
        };
        
        document.documentElement.style.setProperty('--transition-speed', delays[this.userSpeed].transition + 'ms');
        this.feedbackDuration = delays[this.userSpeed].feedback;
        this.autoNextDelay = delays[this.userSpeed].autoNext;
    }
    
    // Navigation par étapes logiques
    navigateToStep(step, data = {}) {
        this.currentPath.push({ step, data, timestamp: Date.now() });
        this.updateProgress();
        this.saveSession();
        
        const routes = {
            'home': () => this.showHome(),
            'choose-category': () => this.showCategories(),
            'choose-action': (data) => this.showActions(data.category),
            'input-details': (data) => this.showDetailsInput(data),
            'review-email': (data) => this.showEmailReview(data),
            'send-email': (data) => this.showSendConfirm(data),
            'success': () => this.showSuccess()
        };
        
        if (routes[step]) {
            routes[step](data);
        }
    }
    
    // Retour intelligent
    goBack() {
        if (this.currentPath.length > 1) {
            this.currentPath.pop();
            const previous = this.currentPath[this.currentPath.length - 1];
            this.navigateToStep(previous.step, previous.data);
        }
    }
    
    // Fil d'Ariane visuel
    setupBreadcrumbs() {
        const breadcrumbContainer = document.createElement('div');
        breadcrumbContainer.id = 'visual-breadcrumbs';
        breadcrumbContainer.innerHTML = `
            <div class="breadcrumb-trail">
                <div class="breadcrumb-step" data-step="home">🏠</div>
                <div class="breadcrumb-arrow">→</div>
                <div class="breadcrumb-step" data-step="category">📋</div>
                <div class="breadcrumb-arrow">→</div>
                <div class="breadcrumb-step" data-step="action">⚡</div>
                <div class="breadcrumb-arrow">→</div>
                <div class="breadcrumb-step" data-step="review">👀</div>
                <div class="breadcrumb-arrow">→</div>
                <div class="breadcrumb-step" data-step="send">📤</div>
            </div>
        `;
        document.body.prepend(breadcrumbContainer);
    }
    
    updateProgress() {
        const steps = ['home', 'category', 'action', 'review', 'send'];
        const currentIndex = Math.min(this.currentPath.length - 1, steps.length - 1);
        
        document.querySelectorAll('.breadcrumb-step').forEach((step, index) => {
            step.classList.toggle('active', index <= currentIndex);
            step.classList.toggle('completed', index < currentIndex);
        });
    }
    
    // Bouton d'urgence - retour accueil
    setupEmergencyExit() {
        const emergencyBtn = document.createElement('button');
        emergencyBtn.id = 'emergency-home';
        emergencyBtn.innerHTML = '🏠 ACCUEIL';
        emergencyBtn.onclick = () => this.emergencyHome();
        document.body.appendChild(emergencyBtn);
    }
    
    emergencyHome() {
        this.currentPath = [];
        this.sessionData = {};
        window.location.href = '/inclusive';
    }
    
    // Sauvegarde session
    saveSession() {
        sessionStorage.setItem('inclusiveSession', JSON.stringify({
            path: this.currentPath,
            preferences: this.userPreferences,
            data: this.sessionData
        }));
    }
    
    loadSession() {
        const saved = sessionStorage.getItem('inclusiveSession');
        if (saved) {
            const session = JSON.parse(saved);
            this.currentPath = session.path || [];
            this.userPreferences = session.preferences || {};
            this.sessionData = session.data || {};
        }
    }
    
    // Feedback visuel intelligent
    showFeedback(type, message, duration = null) {
        const feedback = document.createElement('div');
        feedback.className = `feedback feedback-${type}`;
        feedback.innerHTML = `
            <div class="feedback-icon">${this.getFeedbackIcon(type)}</div>
            <div class="feedback-message">${message}</div>
        `;
        
        document.body.appendChild(feedback);
        
        setTimeout(() => {
            feedback.remove();
        }, duration || this.feedbackDuration);
    }
    
    getFeedbackIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️',
            loading: '⏳'
        };
        return icons[type] || 'ℹ️';
    }
}

// Navigation par contexte
class ContextualNavigation {
    constructor() {
        this.contexts = {
            'document_request': {
                icon: '📄',
                color: '#2196F3',
                steps: ['category', 'document-type', 'details', 'review', 'send']
            },
            'money_question': {
                icon: '💰',
                color: '#4CAF50',
                steps: ['category', 'money-type', 'details', 'review', 'send']
            },
            'health_issue': {
                icon: '🏥',
                color: '#f44336',
                steps: ['category', 'health-type', 'urgency', 'details', 'review', 'send']
            },
            'housing_problem': {
                icon: '🏠',
                color: '#FF9800',
                steps: ['category', 'housing-type', 'details', 'review', 'send']
            }
        };
    }
    
    getContextualSteps(context) {
        return this.contexts[context]?.steps || ['category', 'details', 'review', 'send'];
    }
    
    adaptUIForContext(context) {
        const ctx = this.contexts[context];
        if (ctx) {
            document.documentElement.style.setProperty('--context-color', ctx.color);
            document.querySelector('.context-icon')?.textContent = ctx.icon;
        }
    }
}

// Initialisation globale
window.inclusiveNav = new InclusiveNavigation();
window.contextNav = new ContextualNavigation();