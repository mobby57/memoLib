# -*- coding: utf-8 -*-
import logging
from services.email_service import envoyer_email_hotmail

logger = logging.getLogger(__name__)

def notifier_envoi_reussi(email_expediteur, app_password, email_utilisateur, sujet_original, destinataire):
    """Étape 8: Notification utilisateur"""
    sujet = "✅ Votre email a été envoyé avec succès"
    message = f"""
    <html>
        <body style="font-family: Arial, sans-serif;">
            <h2>✅ Confirmation d'envoi</h2>
            <p>Votre email a été envoyé avec succès.</p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Objet:</strong> {sujet_original}</p>
                <p><strong>Destinataire:</strong> {destinataire}</p>
                <p><strong>Date:</strong> {datetime.now().strftime('%d/%m/%Y %H:%M')}</p>
            </div>
            <p>Vous pouvez consulter l'historique dans votre tableau de bord.</p>
        </body>
    </html>
    """
    
    try:
        success, msg = envoyer_email_hotmail(email_expediteur, app_password, email_utilisateur, sujet, message)
        return success
    except Exception as e:
        logger.error(f"Erreur notification: {type(e).__name__}")
        return False

from datetime import datetime
