"""Smart Email Generation - AI handles everything"""
from flask import Blueprint, request, jsonify
from src.core.rate_limiter import rate_limiter
from src.core.crypto_utils import recuperer_api_key
from src.services.openai_service import OpenAIService
from src.models import get_session, Email
from datetime import datetime

smart_bp = Blueprint('smart', __name__, url_prefix='/api/smart')

@smart_bp.route('/generate-and-send', methods=['POST'])
@rate_limiter.limit('api')
def generate_and_send():
    """
    User fills form with:
    - recipient email
    - email type (demande, reclamation, remerciement, etc)
    - context/elements
    
    AI does everything: generate subject, body, and send
    """
    try:
        data = request.get_json()
        
        # Required fields
        recipient = data.get('recipient')
        email_type = data.get('email_type', 'demande')
        context = data.get('context', '')
        tone = data.get('tone', 'professionnel')
        
        if not recipient or not context:
            return jsonify({'success': False, 'error': 'Recipient et context requis'}), 400
        
        # Get OpenAI key
        master_password = request.headers.get('X-Master-Password')
        if not master_password:
            return jsonify({'success': False, 'error': 'Master password requis'}), 401
        
        from src.core.config import Config
        api_key, org_id = recuperer_api_key(master_password, Config.APP_DIR)
        
        # Generate email with AI
        if api_key:
            ai_service = OpenAIService(api_key, org_id)
            result = ai_service.generate_email(context, tone, email_type)
            
            if not result.get('success'):
                return jsonify({'success': False, 'error': 'Erreur génération IA'}), 500
            
            subject = result['subject']
            body = result['body']
        else:
            # Fallback template
            subject = f"{email_type.capitalize()} - {context[:50]}"
            body = f"Bonjour,\n\n{context}\n\nCordialement"
        
        # Save to DB
        session_db = get_session()
        email = Email(
            user_id=1,
            recipient=recipient,
            subject=subject,
            body=body,
            status='draft'
        )
        session_db.add(email)
        session_db.commit()
        
        # Auto-send if requested
        if data.get('auto_send', False):
            from src.services.smtp_service import SMTPService
            from src.core.crypto_utils import recuperer_app_password
            
            app_password, sender_email = recuperer_app_password(master_password, Config.APP_DIR)
            
            if app_password and sender_email:
                smtp = SMTPService()
                result = smtp.send_email(sender_email, app_password, recipient, subject, body)
                
                if result.get('success'):
                    email.status = 'sent'
                    email.sent_at = datetime.utcnow()
                    session_db.commit()
                    
                    return jsonify({
                        'success': True,
                        'message': 'Email généré et envoyé',
                        'email_id': email.id,
                        'subject': subject,
                        'preview': body[:200]
                    })
        
        return jsonify({
            'success': True,
            'message': 'Email généré',
            'email_id': email.id,
            'subject': subject,
            'body': body
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@smart_bp.route('/templates', methods=['GET'])
def get_templates():
    """Get available email types"""
    templates = {
        'demande': 'Demande administrative ou professionnelle',
        'reclamation': 'Réclamation ou contestation',
        'remerciement': 'Remerciement',
        'relance': 'Relance ou rappel',
        'candidature': 'Candidature emploi',
        'resiliation': 'Résiliation contrat',
        'information': 'Demande d\'information'
    }
    return jsonify({'success': True, 'templates': templates})
