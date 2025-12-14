# Configuration AWS SES
import os
from services.ses_service import SESService

def configurer_ses_complet():
    """Configure AWS SES avec domaine et regles reception"""
    ses = SESService()
    domaine = os.getenv('SES_DOMAIN', 'example.com')
    
    # 1. Verifier domaine
    print(f"Configuration domaine: {domaine}")
    ses.configurer_domaine(domaine)
    
    # 2. Creer regle reception
    print("Creation regle reception emails...")
    ses.creer_regle_reception(
        nom_regle="reponses-emails",
        destinataires=[f"noreply@{domaine}"],
        bucket_s3="emails-reponses"
    )
    
    # 3. Verifier identite
    print("Verification identite email...")
    email_expediteur = os.getenv('EMAIL_EXPEDITEUR', f'noreply@{domaine}')
    ses.client.verify_email_identity(EmailAddress=email_expediteur)
    
    print("✅ Configuration SES terminee")
    return True

if __name__ == "__main__":
    configurer_ses_complet()
