# -*- coding: utf-8 -*-
"""
Module d'envoi d'emails avec support Hotmail/Outlook
"""

import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

logger = logging.getLogger(__name__)

# Configuration SMTP Hotmail/Outlook
HOTMAIL_SMTP = {
    'server': 'smtp-mail.outlook.com',
    'port': 587,
    'use_tls': True
}

def envoyer_email_hotmail(email_expediteur, app_password, email_destinataire, sujet, message):
    """
    Envoie un email via Hotmail/Outlook
    
    Args:
        email_expediteur: Votre adresse @hotmail.fr ou @outlook.com
        app_password: Mot de passe d'application (pas votre mot de passe normal)
        email_destinataire: Email du destinataire
        sujet: Sujet de l'email
        message: Corps du message (texte ou HTML)
    
    Returns:
        (bool, str): (succès, message)
    """
    try:
        # Créer le message
        msg = MIMEMultipart('alternative')
        msg['From'] = email_expediteur
        msg['To'] = email_destinataire
        msg['Subject'] = sujet
        msg['Date'] = datetime.now().strftime('%a, %d %b %Y %H:%M:%S %z')
        
        # Ajouter le corps du message
        if '<html>' in message.lower():
            msg.attach(MIMEText(message, 'html', 'utf-8'))
        else:
            msg.attach(MIMEText(message, 'plain', 'utf-8'))
        
        # Connexion au serveur SMTP
        with smtplib.SMTP(HOTMAIL_SMTP['server'], HOTMAIL_SMTP['port']) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(email_expediteur, app_password)
            server.send_message(msg)
        
        logger.info(f"Email envoyé avec succès à {email_destinataire}")
        return True, "Email envoyé avec succès"
        
    except smtplib.SMTPAuthenticationError:
        logger.error("Erreur d'authentification SMTP")
        return False, "Erreur d'authentification. Verifiez votre email et mot de passe d'application"
    except smtplib.SMTPException as e:
        logger.error(f"Erreur SMTP: {type(e).__name__}")
        return False, f"Erreur d'envoi: {type(e).__name__}"
    except Exception as e:
        logger.error(f"Erreur inattendue: {type(e).__name__}")
        return False, "Erreur lors de l'envoi de l'email"

def generer_email_bienvenue(nom_utilisateur):
    """Génère un email HTML de bienvenue"""
    return f"""
    <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #4CAF50;">🎉 Bienvenue sur SecureVault !</h2>
                <p>Bonjour <strong>{nom_utilisateur}</strong>,</p>
                <p>Votre inscription a été effectuée avec succès !</p>
                <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">✨ Fonctionnalités disponibles :</h3>
                    <ul>
                        <li>🔐 Stockage sécurisé de vos credentials</li>
                        <li>🔒 Chiffrement AES-256</li>
                        <li>📧 Gestion des emails Gmail</li>
                        <li>🤖 Intégration OpenAI</li>
                    </ul>
                </div>
                <p>Merci d'avoir choisi SecureVault pour sécuriser vos données !</p>
                <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                <p style="font-size: 12px; color: #666;">
                    Cet email a été envoyé automatiquement. Ne pas répondre.
                </p>
            </div>
        </body>
    </html>
    """

def tester_connexion_hotmail(email, app_password):
    """
    Teste la connexion SMTP Hotmail
    
    Returns:
        (bool, str): (succès, message)
    """
    try:
        with smtplib.SMTP(HOTMAIL_SMTP['server'], HOTMAIL_SMTP['port']) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(email, app_password)
        
        logger.info("Connexion Hotmail réussie")
        return True, "Connexion réussie"
        
    except smtplib.SMTPAuthenticationError:
        return False, "Erreur d'authentification"
    except Exception as e:
        return False, f"Erreur: {type(e).__name__}"
