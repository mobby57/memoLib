/**
 * Toast Notification System for SecureVault
 * Usage:
 *   showToast('Success!', 'Your email was sent successfully', 'success');
 *   showToast('Error!', 'Failed to send email', 'error');
 *   showToast('Warning!', 'Please check your credentials', 'warning');
 *   showToast('Info', 'Email scheduled for later', 'info');
 */

class ToastNotification {
    constructor() {
        this.container = null;
        this.toasts = [];
        this.init();
    }

    init() {
        // Create toast container if it doesn't exist
        if (!document.querySelector('.toast-container')) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        } else {
            this.container = document.querySelector('.toast-container');
        }
    }

    show(title, message, type = 'info', duration = 3000) {
        const toast = this.createToast(title, message, type);
        this.container.appendChild(toast);
        this.toasts.push(toast);

        // Animate in
        setTimeout(() => toast.classList.add('show'), 10);

        // Auto remove
        if (duration > 0) {
            setTimeout(() => this.remove(toast), duration);
        }

        return toast;
    }

    createToast(title, message, type) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        toast.innerHTML = `
            <div class="toast-icon">${icons[type] || icons.info}</div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                ${message ? `<div class="toast-message">${message}</div>` : ''}
            </div>
            <button class="toast-close" onclick="toastNotification.remove(this.parentElement)">×</button>
            <div class="toast-progress"></div>
        `;

        return toast;
    }

    remove(toast) {
        if (!toast || !toast.parentElement) return;

        toast.classList.add('closing');
        setTimeout(() => {
            if (toast.parentElement) {
                toast.parentElement.removeChild(toast);
            }
            const index = this.toasts.indexOf(toast);
            if (index > -1) {
                this.toasts.splice(index, 1);
            }
        }, 300);
    }

    removeAll() {
        this.toasts.forEach(toast => this.remove(toast));
    }

    success(title, message, duration) {
        return this.show(title, message, 'success', duration);
    }

    error(title, message, duration) {
        return this.show(title, message, 'error', duration);
    }

    warning(title, message, duration) {
        return this.show(title, message, 'warning', duration);
    }

    info(title, message, duration) {
        return this.show(title, message, 'info', duration);
    }
}

// Initialize global toast notification instance
const toastNotification = new ToastNotification();

// Global helper functions
function showToast(title, message, type = 'info', duration = 3000) {
    return toastNotification.show(title, message, type, duration);
}

function showSuccess(title, message, duration) {
    return toastNotification.success(title, message, duration);
}

function showError(title, message, duration) {
    return toastNotification.error(title, message, duration);
}

function showWarning(title, message, duration) {
    return toastNotification.warning(title, message, duration);
}

function showInfo(title, message, duration) {
    return toastNotification.info(title, message, duration);
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ToastNotification, showToast, showSuccess, showError, showWarning, showInfo };
}
