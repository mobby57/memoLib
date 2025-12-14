"""Service de notifications"""
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class NotificationService:
    def __init__(self):
        self.channels = ['email', 'webhook', 'log']
    
    def send_notification(self, event_type, message, data=None):
        """Envoyer notification multi-canal"""
        notification = {
            'timestamp': datetime.now().isoformat(),
            'event': event_type,
            'message': message,
            'data': data or {}
        }
        
        # Log toujours
        logger.info(f"Notification: {event_type} - {message}")
        
        # Webhook si configuré
        if event_type in ['email_sent', 'email_failed', 'system_error']:
            self._send_webhook(notification)
        
        return True
    
    def _send_webhook(self, notification):
        """Envoyer webhook (simulation)"""
        # En production: requests.post(webhook_url, json=notification)
        logger.info(f"Webhook sent: {notification['event']}")
    
    def notify_email_sent(self, recipient, subject):
        """Notification email envoyé"""
        self.send_notification('email_sent', 
            f'Email envoyé à {recipient}', 
            {'recipient': recipient, 'subject': subject}
        )
    
    def notify_email_failed(self, recipient, error):
        """Notification échec email"""
        self.send_notification('email_failed',
            f'Échec envoi à {recipient}: {error}',
            {'recipient': recipient, 'error': error}
        )
    
    def notify_system_error(self, component, error):
        """Notification erreur système"""
        self.send_notification('system_error',
            f'Erreur {component}: {error}',
            {'component': component, 'error': str(error)}
        )