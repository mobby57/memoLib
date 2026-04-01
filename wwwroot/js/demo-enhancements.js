// 🚀 MemoLib - Améliorations Interface Démo

// Système de Notifications Toast
class ToastNotification {
    constructor() {
        this.container = this.createContainer();
    }

    createContainer() {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;';
            document.body.appendChild(container);
        }
        return container;
    }

    show(message, type = 'info', duration = 4000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = this.getIcon(type);
        toast.innerHTML = `
            <div style="display:flex;align-items:center;gap:12px;">
                <span style="font-size:24px;">${icon}</span>
                <div>
                    <strong style="display:block;margin-bottom:4px;">${this.getTitle(type)}</strong>
                    <span style="color:#6b7280;font-size:14px;">${message}</span>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" style="background:none;border:none;font-size:20px;cursor:pointer;color:#9ca3af;margin-left:auto;">×</button>
            </div>
        `;

        this.container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.4s ease-out';
            setTimeout(() => toast.remove(), 400);
        }, duration);
    }

    getIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    }

    getTitle(type) {
        const titles = {
            success: 'Succès',
            error: 'Erreur',
            warning: 'Attention',
            info: 'Information'
        };
        return titles[type] || titles.info;
    }
}

// Compteurs Animés
function animateCounter(element, target, duration = 1000) {
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);
}

// Loading Overlay
class LoadingOverlay {
    show(message = 'Chargement...') {
        let overlay = document.getElementById('loading-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'loading-overlay';
            overlay.style.cssText = `
                position:fixed;top:0;left:0;width:100%;height:100%;
                background:rgba(0,0,0,0.7);backdrop-filter:blur(4px);
                display:flex;align-items:center;justify-content:center;
                z-index:10000;animation:fadeIn 0.3s ease-out;
            `;
            overlay.innerHTML = `
                <div style="background:white;padding:40px;border-radius:20px;text-align:center;box-shadow:0 20px 25px -5px rgba(0,0,0,0.3);">
                    <div class="spinner" style="width:40px;height:40px;border-width:4px;margin:0 auto 20px;"></div>
                    <p style="font-size:18px;font-weight:600;color:#374151;">${message}</p>
                </div>
            `;
            document.body.appendChild(overlay);
        }
        return overlay;
    }

    hide() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => overlay.remove(), 300);
        }
    }
}

// Ajouter animations CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOutRight {
        from { opacity: 1; transform: translateX(0); }
        to { opacity: 0; transform: translateX(100%); }
    }
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
`;
document.head.appendChild(style);

// Initialisation globale
window.toast = new ToastNotification();
window.loading = new LoadingOverlay();
window.animateCounter = animateCounter;

// Auto-init
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.stat-box .number').forEach(el => {
        const target = parseInt(el.textContent) || 0;
        if (target > 0) {
            el.textContent = '0';
            setTimeout(() => animateCounter(el, target), 300);
        }
    });
});
