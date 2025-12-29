"""Service d'envoi d'emails unifié avec nom d'utilisateur automatique"""
import logging
from src.services.smtp_service import SMTPService
from src.core.user_profile import UserProfile

logger = logging.getLogger(__name__)

class UnifiedEmailService:
    def __init__(self, app_dir=None):
        self.smtp_service = SMTPService()
        self.user_profile = UserProfile(app_dir)
    
    def send_email_with_user_info(self, user_id, sender_email, app_password, recipient, subject, body, provider='gmail'):
        """
        Envoie un email en incluant automatiquement le nom de l'utilisateur
        
        Args:
            user_id: ID de l'utilisateur qui envoie l'email
            sender_email: Email de l'expéditeur
            app_password: Mot de passe d'application
            recipient: Email du destinataire
            subject: Sujet de l'email
            body: Corps du message
            provider: Fournisseur email (gmail, outlook, yahoo)
        
        Returns:
            dict: Résultat de l'envoi
        """
        try:
            # Récupérer le nom d'affichage de l'utilisateur
            sender_name = self.user_profile.get_user_display_name(user_id)
            
            # Envoyer l'email avec le nom
            result = self.smtp_service.send_email(
                sender_email=sender_email,
                app_password=app_password,
                recipient=recipient,
                subject=subject,
                body=body,
                sender_name=sender_name
            )
            
            if result.get('success'):
                logger.info(f"Email envoyé par {sender_name or sender_email} à {recipient}")
            
            return result
            
        except Exception as e:
            logger.error(f"Erreur envoi email unifié: {e}")
            return {'success': False, 'error': str(e)}
    
    def send_bulk_emails_with_user_info(self, user_id, sender_email, app_password, recipients, subject, body, provider='gmail'):
        """
        Envoie des emails en lot avec le nom de l'utilisateur
        
        Args:
            user_id: ID de l'utilisateur
            sender_email: Email de l'expéditeur
            app_password: Mot de passe d'application
            recipients: Liste des destinataires
            subject: Sujet de l'email
            body: Corps du message
            provider: Fournisseur email
        
        Returns:
            dict: Résultats des envois
        """
        results = {
            'success_count': 0,
            'error_count': 0,
            'results': []
        }
        
        sender_name = self.user_profile.get_user_display_name(user_id)
        
        for recipient in recipients:
            try:
                result = self.smtp_service.send_email(
                    sender_email=sender_email,
                    app_password=app_password,
                    recipient=recipient,
                    subject=subject,
                    body=body,
                    sender_name=sender_name
                )
                
                if result.get('success'):
                    results['success_count'] += 1
                else:
                    results['error_count'] += 1
                
                results['results'].append({
                    'recipient': recipient,
                    'success': result.get('success', False),
                    'error': result.get('error', '')
                })
                
            except Exception as e:
                results['error_count'] += 1
                results['results'].append({
                    'recipient': recipient,
                    'success': False,
                    'error': str(e)
                })
        
        logger.info(f"Envoi en lot terminé: {results['success_count']} succès, {results['error_count']} erreurs")
        return results