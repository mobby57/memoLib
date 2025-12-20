"""
Routes pour les webhooks OpenAI
Gère les endpoints de réception des événements webhook
"""
from flask import Blueprint, request, jsonify
import logging
import json
from services.webhook_service import WebhookService

logger = logging.getLogger(__name__)

webhook_bp = Blueprint('webhooks', __name__, url_prefix='/api/webhooks')

# Initialiser le service webhook
webhook_service = WebhookService()


@webhook_bp.route('/openai', methods=['POST'])
def handle_openai_webhook():
    """
    Endpoint pour recevoir les webhooks OpenAI
    
    POST /api/webhooks/openai
    
    Headers attendus:
        - X-OpenAI-Signature: Signature de vérification du webhook
        
    Body: Événement webhook au format JSON
    
    Returns:
        200: Événement traité avec succès
        400: Données invalides
        401: Signature invalide
        500: Erreur serveur
    """
    try:
        # Récupérer la signature du header
        signature = request.headers.get('X-OpenAI-Signature', '')
        
        # Vérifier la signature
        if not webhook_service.verify_signature(request.data, signature):
            logger.warning("Tentative de webhook avec signature invalide")
            return jsonify({
                'error': 'Signature invalide',
                'success': False
            }), 401
        
        # Parser les données de l'événement
        event_data = request.get_json()
        
        if not event_data:
            return jsonify({
                'error': 'Corps de requête invalide',
                'success': False
            }), 400
        
        # Traiter l'événement
        result = webhook_service.process_event(event_data)
        
        logger.info(f"Événement webhook traité: {event_data.get('type')} - {event_data.get('id')}")
        
        return jsonify(result), 200
        
    except ValueError as e:
        logger.error(f"Erreur de validation: {str(e)}")
        return jsonify({
            'error': str(e),
            'success': False
        }), 400
        
    except Exception as e:
        logger.error(f"Erreur lors du traitement du webhook: {str(e)}")
        return jsonify({
            'error': 'Erreur interne du serveur',
            'success': False
        }), 500


@webhook_bp.route('/events', methods=['GET'])
def get_webhook_events():
    """
    Récupère l'historique des événements webhook
    
    GET /api/webhooks/events?type=<event_type>&limit=<limit>&offset=<offset>
    
    Query params:
        - type: Type d'événement à filtrer (optionnel)
        - limit: Nombre d'événements à retourner (défaut: 100)
        - offset: Décalage pour pagination (défaut: 0)
    
    Returns:
        200: Liste des événements
        500: Erreur serveur
    """
    try:
        event_type = request.args.get('type')
        limit = int(request.args.get('limit', 100))
        offset = int(request.args.get('offset', 0))
        
        # Limiter le nombre d'événements retournés
        limit = min(limit, 500)
        
        events = webhook_service.get_events(event_type, limit, offset)
        
        return jsonify({
            'success': True,
            'events': events,
            'count': len(events),
            'limit': limit,
            'offset': offset
        }), 200
        
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des événements: {str(e)}")
        return jsonify({
            'error': 'Erreur interne du serveur',
            'success': False
        }), 500


@webhook_bp.route('/stats', methods=['GET'])
def get_webhook_stats():
    """
    Récupère les statistiques des événements webhook
    
    GET /api/webhooks/stats
    
    Returns:
        200: Statistiques des événements
        500: Erreur serveur
    """
    try:
        stats = webhook_service.get_event_stats()
        
        return jsonify({
            'success': True,
            'stats': stats
        }), 200
        
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des statistiques: {str(e)}")
        return jsonify({
            'error': 'Erreur interne du serveur',
            'success': False
        }), 500


@webhook_bp.route('/health', methods=['GET'])
def webhook_health():
    """
    Vérifie l'état du service webhook
    
    GET /api/webhooks/health
    
    Returns:
        200: Service opérationnel
    """
    return jsonify({
        'success': True,
        'service': 'webhook',
        'status': 'healthy'
    }), 200


def register_webhook_routes(app):
    """
    Enregistre les routes webhook dans l'application Flask
    
    Args:
        app: Instance de l'application Flask
    """
    app.register_blueprint(webhook_bp)
    logger.info("Routes webhook enregistrées")
