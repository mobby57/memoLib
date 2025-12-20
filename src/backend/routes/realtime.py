"""
Routes pour l'API Realtime OpenAI
Gère les endpoints de création et gestion des appels temps réel
"""
from flask import Blueprint, request, jsonify
import logging
from services.realtime_service import RealtimeService

logger = logging.getLogger(__name__)

realtime_bp = Blueprint('realtime', __name__, url_prefix='/api/realtime')

# Initialiser le service
realtime_service = RealtimeService()


@realtime_bp.route('/calls', methods=['POST'])
def create_call():
    """
    Crée un nouvel appel Realtime WebRTC
    
    POST /api/realtime/calls
    
    Body:
        - sdp: SDP offer (requis) - peut être texte ou fichier
        - session: Configuration de session (optionnel)
            - model: Modèle à utiliser
            - modalities: Liste des modalités ['text', 'audio']
            - instructions: Instructions système
            - voice: Voix (alloy, echo, shimmer)
            - temperature: 0.6-1.2
            - max_response_output_tokens: Limite tokens
        - metadata: Métadonnées personnalisées
    """
    try:
        # Récupérer les données du formulaire multipart
        sdp_offer = request.form.get('sdp') or request.files.get('sdp')
        
        if not sdp_offer:
            # Essayer JSON si pas de form-data
            data = request.get_json() or {}
            sdp_offer = data.get('sdp')
        
        if not sdp_offer:
            return jsonify({
                'error': 'SDP offer est requis',
                'success': False
            }), 400
        
        # Lire le fichier SDP si c'est un fichier
        if hasattr(sdp_offer, 'read'):
            sdp_offer = sdp_offer.read().decode('utf-8')
        
        # Récupérer la configuration de session
        session_str = request.form.get('session')
        if session_str:
            import json
            session = json.loads(session_str)
        else:
            data = request.get_json() or {}
            session = data.get('session', {})
        
        # Extraire les paramètres
        model = session.get('model', 'gpt-4o-realtime-preview')
        modalities = session.get('modalities')
        instructions = session.get('instructions')
        voice = session.get('voice')
        temperature = session.get('temperature')
        max_tokens = session.get('max_response_output_tokens')
        
        # Métadonnées
        metadata = request.get_json().get('metadata') if request.is_json else None
        
        # Créer l'appel
        result = realtime_service.create_call(
            sdp_offer=sdp_offer,
            model=model,
            modalities=modalities,
            instructions=instructions,
            voice=voice,
            temperature=temperature,
            max_response_output_tokens=max_tokens,
            metadata=metadata
        )
        
        return jsonify({
            'success': True,
            **result
        }), 201
        
    except ValueError as e:
        logger.error(f"Erreur de validation: {str(e)}")
        return jsonify({
            'error': str(e),
            'success': False
        }), 400
        
    except Exception as e:
        logger.error(f"Erreur lors de la création de l'appel: {str(e)}")
        return jsonify({
            'error': 'Erreur interne du serveur',
            'success': False
        }), 500


@realtime_bp.route('/calls/<call_id>', methods=['GET'])
def get_call(call_id):
    """
    Récupère les informations d'un appel
    
    GET /api/realtime/calls/<call_id>
    """
    try:
        call = realtime_service.get_call(call_id)
        
        return jsonify({
            'success': True,
            'call': call
        }), 200
        
    except ValueError as e:
        return jsonify({
            'error': str(e),
            'success': False
        }), 404
        
    except Exception as e:
        logger.error(f"Erreur: {str(e)}")
        return jsonify({
            'error': 'Erreur interne du serveur',
            'success': False
        }), 500


@realtime_bp.route('/calls/<call_id>', methods=['DELETE'])
def hangup_call(call_id):
    """
    Termine un appel en cours
    
    DELETE /api/realtime/calls/<call_id>
    """
    try:
        call = realtime_service.hangup_call(call_id)
        
        return jsonify({
            'success': True,
            'call': call,
            'message': 'Appel terminé'
        }), 200
        
    except Exception as e:
        logger.error(f"Erreur: {str(e)}")
        return jsonify({
            'error': 'Erreur interne du serveur',
            'success': False
        }), 500


@realtime_bp.route('/calls', methods=['GET'])
def list_calls():
    """
    Liste les appels
    
    GET /api/realtime/calls?limit=20&offset=0&status=active
    
    Query params:
        - limit: Nombre maximum (défaut: 20)
        - offset: Offset pagination (défaut: 0)
        - status: Filtrer par statut (active, ended)
    """
    try:
        limit = int(request.args.get('limit', 20))
        offset = int(request.args.get('offset', 0))
        status = request.args.get('status')
        
        calls = realtime_service.list_calls(
            limit=limit,
            offset=offset,
            status=status
        )
        
        return jsonify({
            'success': True,
            'data': calls,
            'count': len(calls)
        }), 200
        
    except Exception as e:
        logger.error(f"Erreur: {str(e)}")
        return jsonify({
            'error': 'Erreur interne du serveur',
            'success': False
        }), 500


@realtime_bp.route('/calls/<call_id>/events', methods=['GET'])
def get_call_events(call_id):
    """
    Récupère les événements d'un appel
    
    GET /api/realtime/calls/<call_id>/events?limit=100&event_type=call.created
    
    Query params:
        - limit: Nombre maximum d'événements
        - event_type: Filtrer par type
    """
    try:
        limit = int(request.args.get('limit', 100))
        event_type = request.args.get('event_type')
        
        events = realtime_service.get_call_events(
            call_id=call_id,
            limit=limit,
            event_type=event_type
        )
        
        return jsonify({
            'success': True,
            'data': events,
            'count': len(events)
        }), 200
        
    except Exception as e:
        logger.error(f"Erreur: {str(e)}")
        return jsonify({
            'error': 'Erreur interne du serveur',
            'success': False
        }), 500


@realtime_bp.route('/stats', methods=['GET'])
def get_stats():
    """
    Récupère les statistiques des appels
    
    GET /api/realtime/stats
    """
    try:
        stats = realtime_service.get_stats()
        
        return jsonify({
            'success': True,
            'stats': stats
        }), 200
        
    except Exception as e:
        logger.error(f"Erreur: {str(e)}")
        return jsonify({
            'error': 'Erreur interne du serveur',
            'success': False
        }), 500


@realtime_bp.route('/health', methods=['GET'])
def health():
    """
    Vérifie l'état du service
    
    GET /api/realtime/health
    """
    has_api_key = realtime_service.client is not None
    
    return jsonify({
        'success': True,
        'service': 'realtime',
        'status': 'healthy' if has_api_key else 'limited',
        'api_configured': has_api_key
    }), 200


def register_realtime_routes(app):
    """
    Enregistre les routes Realtime dans l'application Flask
    
    Args:
        app: Instance de l'application Flask
    """
    app.register_blueprint(realtime_bp)
    logger.info("Routes Realtime enregistrées")
