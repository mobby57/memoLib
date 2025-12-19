// Gestion de session pour mot de passe maitre
class SessionManager {
    constructor() {
        this.masterPassword = null;
        this.checkSession();
    }

    async checkSession() {
        try {
            const response = await fetch('/api/get-session-password');
            const data = await response.json();
            
            if (data.has_password) {
                this.masterPassword = 'SESSION_STORED';
                this.showSessionIndicator();
            }
        } catch (error) {
            console.error('Erreur verification session:', error);
        }
    }

    async getMasterPassword() {
        if (this.masterPassword === 'SESSION_STORED') {
            return 'SESSION_STORED';
        }
        return null;
    }

    async clearSession() {
        try {
            await fetch('/api/clear-session', { method: 'POST' });
            this.masterPassword = null;
            localStorage.removeItem('remember_password');
            this.hideSessionIndicator();
        } catch (error) {
            console.error('Erreur effacement session:', error);
        }
    }

    showSessionIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'sessionIndicator';
        indicator.innerHTML = `
            <div style="position: fixed; top: 10px; right: 10px; background: #10b981; color: white; 
                        padding: 10px 15px; border-radius: 8px; font-size: 0.9em; z-index: 1000;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.1); display: flex; align-items: center; gap: 10px;">
                <span>🔓 Session active</span>
                <button onclick="sessionManager.clearSession()" 
                        style="background: rgba(255,255,255,0.2); border: none; color: white; 
                               padding: 5px 10px; border-radius: 5px; cursor: pointer; font-size: 0.85em;">
                    Déconnexion
                </button>
            </div>
        `;
        document.body.appendChild(indicator);
    }

    hideSessionIndicator() {
        const indicator = document.getElementById('sessionIndicator');
        if (indicator) {
            indicator.remove();
        }
    }
}

// Instance globale
const sessionManager = new SessionManager();

// Helper pour obtenir le mot de passe (session ou demander)
async function getMasterPasswordOrAsk() {
    const sessionPassword = await sessionManager.getMasterPassword();
    if (sessionPassword) {
        return sessionPassword;
    }
    
    return prompt('Mot de passe maître:');
}
