"""
Routes API SMTP - iaPosteManager
Gestion des configurations SMTP utilisateurs
"""
from flask import Blueprint, request, jsonify, session
from services.smtp_user_service import smtp_service
from models.smtp_config import SMTP_PROVIDERS

smtp_bp = Blueprint('smtp', __name__)

@smtp_bp.route('/api/smtp/providers', methods=['GET'])
def get_smtp_providers():
    """Récupère la liste des providers SMTP disponibles"""
    return jsonify({
        'success': True,
        'providers': SMTP_PROVIDERS
    })

@smtp_bp.route('/api/smtp/configs', methods=['GET'])
def get_user_smtp_configs():
    """Récupère les configurations SMTP de l'utilisateur"""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'error': 'Non authentifié'}), 401
    
    configs = smtp_service.get_user_smtp_configs(user_id)
    return jsonify({
        'success': True,
        'configs': configs
    })

@smtp_bp.route('/api/smtp/config', methods=['POST'])
def add_smtp_config():
    """Ajoute une nouvelle configuration SMTP"""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'error': 'Non authentifié'}), 401
    
    data = request.get_json()
    
    # Validation des données
    required_fields = ['provider', 'username', 'password']
    for field in required_fields:
        if not data.get(field):
            return jsonify({
                'success': False, 
                'error': f'Champ requis: {field}'
            }), 400
    
    # Ajout de la configuration
    success = smtp_service.add_smtp_config(user_id, data)
    
    if success:
        return jsonify({
            'success': True,
            'message': 'Configuration SMTP ajoutée avec succès'
        })
    else:
        return jsonify({
            'success': False,
            'error': 'Erreur lors de l\'ajout de la configuration'
        }), 500

@smtp_bp.route('/api/smtp/test', methods=['POST'])
def test_smtp_config():
    """Test une configuration SMTP"""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'error': 'Non authentifié'}), 401
    
    data = request.get_json()
    username = data.get('username')
    
    if not username:
        return jsonify({
            'success': False,
            'error': 'Username requis'
        }), 400
    
    result = smtp_service.test_smtp_connection(user_id, username)
    return jsonify(result)

@smtp_bp.route('/api/smtp/send', methods=['POST'])
def send_email_via_smtp():
    """Envoie un email via SMTP utilisateur"""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'error': 'Non authentifié'}), 401
    
    data = request.get_json()
    
    # Validation
    required_fields = ['username', 'to', 'subject', 'body_html']
    for field in required_fields:
        if not data.get(field):
            return jsonify({
                'success': False,
                'error': f'Champ requis: {field}'
            }), 400
    
    result = smtp_service.send_email_for_user(
        user_id=user_id,
        username=data['username'],
        to=data['to'] if isinstance(data['to'], list) else [data['to']],
        subject=data['subject'],
        body_html=data['body_html'],
        body_text=data.get('body_text')
    )
    
    return jsonify(result)

@smtp_bp.route('/api/smtp/config/<username>', methods=['DELETE'])
def delete_smtp_config(username):
    """Supprime une configuration SMTP"""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'error': 'Non authentifié'}), 401
    
    success = smtp_service.delete_smtp_config(user_id, username)
    
    if success:
        return jsonify({
            'success': True,
            'message': 'Configuration supprimée avec succès'
        })
    else:
        return jsonify({
            'success': False,
            'error': 'Erreur lors de la suppression'
        }), 500

@smtp_bp.route('/api/smtp/wizard', methods=['POST'])
def smtp_setup_wizard():
    """Assistant de configuration SMTP guidé"""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'error': 'Non authentifié'}), 401
    
    data = request.get_json()
    provider = data.get('provider')
    
    if provider not in SMTP_PROVIDERS:
        return jsonify({
            'success': False,
            'error': 'Provider non supporté'
        }), 400
    
    # Configuration automatique basée sur le provider
    config_template = SMTP_PROVIDERS[provider].copy()
    config_template.update({
        'username': data.get('email', ''),
        'password': data.get('password', ''),
        'display_name': data.get('display_name', ''),
        'provider': provider
    })
    
    # Test automatique
    if data.get('test_connection', True):
        test_result = smtp_service.test_smtp_connection(user_id, config_template['username'])
        if not test_result['success']:
            return jsonify({
                'success': False,
                'error': f'Test de connexion échoué: {test_result["error"]}',
                'config_suggested': config_template
            })
    
    # Ajout si test réussi
    success = smtp_service.add_smtp_config(user_id, config_template)
    
    return jsonify({
        'success': success,
        'message': 'Configuration SMTP créée et testée avec succès' if success else 'Erreur lors de la création',
        'config': config_template if success else None
    })