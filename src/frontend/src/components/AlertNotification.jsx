import { Bell, X } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function AlertNotification({ alert, onDismiss }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Auto-dismiss après 10 secondes pour les alertes non-urgentes
    if (alert.urgency !== 'high') {
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onDismiss, 300); // Animation de sortie
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [alert, onDismiss]);

  if (!visible) return null;

  const urgencyStyles = {
    high: 'bg-red-500/20 border-red-400/50 text-red-200',
    medium: 'bg-yellow-500/20 border-yellow-400/50 text-yellow-200',
    low: 'bg-blue-500/20 border-blue-400/50 text-blue-200'
  };

  const urgencyIcons = {
    high: '🚨',
    medium: '⚠️',
    low: 'ℹ️'
  };

  return (
    <div className={`fixed top-20 right-4 max-w-md p-4 rounded-xl border backdrop-blur-lg shadow-2xl z-50 transition-all duration-300 ${
      urgencyStyles[alert.urgency] || urgencyStyles.medium
    } ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}>
      <div className="flex items-start gap-3">
        <div className="text-2xl flex-shrink-0">
          {urgencyIcons[alert.urgency] || '📧'}
        </div>
        
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <h4 className="font-bold text-white mb-1">
              {alert.title}
            </h4>
            <button
              onClick={() => {
                setVisible(false);
                setTimeout(onDismiss, 300);
              }}
              className="text-white/60 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <p className="text-sm mb-3">
            {alert.message}
          </p>
          
          {alert.actions && alert.actions.length > 0 && (
            <div className="flex gap-2">
              {alert.actions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (action.onClick) action.onClick();
                    setVisible(false);
                    setTimeout(onDismiss, 300);
                  }}
                  className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-semibold transition-colors"
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Gestionnaire global des alertes
export class AlertManager {
  static listeners = [];

  static subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  static notify(alert) {
    this.listeners.forEach(listener => listener(alert));
  }

  static checkEmailDeadline(email) {
    if (!email.analysis?.deadline) return;

    const deadline = this.parseDeadline(email.analysis.deadline);
    if (!deadline) return;

    const daysLeft = Math.ceil((deadline - Date.now()) / (1000 * 60 * 60 * 24));

    if (daysLeft <= 0) {
      this.notify({
        urgency: 'high',
        title: '🚨 Délai dépassé!',
        message: `Le délai pour "${email.subject}" est dépassé. Action immédiate requise.`,
        actions: [
          { label: 'Voir l\'email', onClick: () => window.location.href = '/history' }
        ]
      });
    } else if (daysLeft <= 3) {
      this.notify({
        urgency: 'high',
        title: '⏰ Délai dans ' + daysLeft + ' jour' + (daysLeft > 1 ? 's' : ''),
        message: `"${email.subject}" - ${email.analysis.requiredActions?.[0] || 'Action requise'}`,
        actions: [
          { label: 'Répondre maintenant', onClick: () => window.location.href = '/compose' }
        ]
      });
    } else if (daysLeft <= 7) {
      this.notify({
        urgency: 'medium',
        title: '📅 Rappel',
        message: `"${email.subject}" - Délai dans ${daysLeft} jours`,
        actions: [
          { label: 'Planifier', onClick: () => window.location.href = '/history' }
        ]
      });
    }
  }

  static checkUrgentEmail(email) {
    if (email.analysis?.urgency === 'high') {
      this.notify({
        urgency: 'high',
        title: '🚨 Courrier urgent détecté',
        message: `${email.analysis.sender}: ${email.analysis.type}`,
        actions: [
          { label: 'Voir maintenant', onClick: () => window.location.href = '/history' }
        ]
      });
    }
  }

  static parseDeadline(deadlineStr) {
    try {
      const parts = deadlineStr.split('/');
      if (parts.length === 3) {
        return new Date(parts[2], parts[1] - 1, parts[0]);
      }
    } catch (e) {
      return null;
    }
    return null;
  }
}
