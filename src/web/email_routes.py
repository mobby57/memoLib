"""Routes pour la gestion des emails"""
from flask import Blueprint, jsonify, request, session
import logging

logger = logging.getLogger(__name__)

# Créer le blueprint
email_bp = Blueprint('email_routes', __name__, url_prefix='/email')

@email_bp.route('/send', methods=['POST'])
def send_email_route():
    """Route pour envoyer un email"""
    try:
        data = request.get_json() or {}
        
        recipient = data.get('recipient')
        subject = data.get('subject')
        body = data.get('body')
        
        if not all([recipient, subject, body]):
            return jsonify({
                'success': False,
                'error': 'Destinataire, sujet et corps requis'
            }), 400
        
        # Vérifier l'authentification
        if not session.get('authenticated'):
            return jsonify({
                'success': False,
                'error': 'Non authentifié'
            }), 401
        
        # Simulation d'envoi
        logger.info(f"Email envoyé: {recipient} - {subject}")
        
        return jsonify({
            'success': True,
            'message': 'Email envoyé avec succès',
            'email_id': 'email_123'
        })
        
    except Exception as e:
        logger.error(f"Erreur envoi email: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@email_bp.route('/draft', methods=['POST'])
def save_draft():
    """Sauvegarde un brouillon"""
    try:
        data = request.get_json() or {}
        
        draft = {
            'recipient': data.get('recipient', ''),
            'subject': data.get('subject', ''),
            'body': data.get('body', ''),
            'saved_at': '2024-01-01T00:00:00Z'
        }
        
        return jsonify({
            'success': True,
            'message': 'Brouillon sauvegardé',
            'draft_id': 'draft_123',
            'draft': draft
        })
        
    except Exception as e:
        logger.error(f"Erreur sauvegarde brouillon: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@email_bp.route('/history', methods=['GET'])
def get_email_history():
    """Récupère l'historique des emails"""
    try:
        # Simulation d'historique
        history = [
            {
                'id': 'email_1',
                'recipient': 'test@example.com',
                'subject': 'Test email',
                'status': 'sent',
                'sent_at': '2024-01-01T10:00:00Z'
            },
            {
                'id': 'email_2',
                'recipient': 'demo@example.com',
                'subject': 'Demo email',
                'status': 'sent',
                'sent_at': '2024-01-01T11:00:00Z'
            }
        ]
        
        return jsonify({
            'success': True,
            'emails': history,
            'total': len(history)
        })
        
    except Exception as e:
        logger.error(f"Erreur récupération historique: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@email_bp.route('/validate', methods=['POST'])
def validate_email():
    """Valide un email avant envoi"""
    try:
        data = request.get_json() or {}
        
        recipient = data.get('recipient', '')
        subject = data.get('subject', '')
        body = data.get('body', '')
        
        errors = []
        warnings = []
        
        # Validation du destinataire
        if not recipient:
            errors.append("Destinataire requis")
        elif '@' not in recipient:
            errors.append("Format d'email invalide")
        
        # Validation du sujet
        if not subject:
            warnings.append("Sujet vide")
        elif len(subject) > 200:
            warnings.append("Sujet très long")
        
        # Validation du corps
        if not body:
            errors.append("Corps du message requis")
        elif len(body) < 10:
            warnings.append("Message très court")
        
        is_valid = len(errors) == 0
        
        return jsonify({
            'success': True,
            'valid': is_valid,
            'errors': errors,
            'warnings': warnings,
            'suggestions': [
                "Ajoutez une formule de politesse",
                "Vérifiez l'orthographe"
            ] if is_valid else []
        })
        
    except Exception as e:
        logger.error(f"Erreur validation email: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@email_bp.errorhandler(404)
def not_found(error):
    return jsonify({
        'error': 'Route email non trouvée'
    }), 404