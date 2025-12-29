"""
Routes pour les Vector Stores et File Batches OpenAI
Gère les endpoints de création et gestion des vector stores
"""
from flask import Blueprint, request, jsonify
import logging
from services.vector_store_service import VectorStoreService

logger = logging.getLogger(__name__)

vector_store_bp = Blueprint('vector_stores', __name__, url_prefix='/api/vector-stores')

# Initialiser le service
vs_service = VectorStoreService()


# ============= VECTOR STORES =============

@vector_store_bp.route('/', methods=['POST'])
def create_vector_store():
    """
    Crée un nouveau vector store
    
    POST /api/vector-stores/
    
    Body:
        - name: Nom du vector store (optionnel)
        - file_ids: Liste d'IDs de fichiers (optionnel)
        - expires_after: Politique d'expiration (optionnel)
        - chunking_strategy: Stratégie de chunking (optionnel)
        - metadata: Métadonnées (optionnel)
    """
    try:
        data = request.get_json() or {}
        
        vector_store = vs_service.create_vector_store(
            name=data.get('name'),
            file_ids=data.get('file_ids'),
            expires_after=data.get('expires_after'),
            chunking_strategy=data.get('chunking_strategy'),
            metadata=data.get('metadata')
        )
        
        return jsonify({
            'success': True,
            'vector_store': vector_store
        }), 200
        
    except ValueError as e:
        logger.error(f"Erreur de validation: {str(e)}")
        return jsonify({
            'error': str(e),
            'success': False
        }), 400
        
    except Exception as e:
        logger.error(f"Erreur lors de la création: {str(e)}")
        return jsonify({
            'error': 'Erreur interne du serveur',
            'success': False
        }), 500


@vector_store_bp.route('/<vector_store_id>', methods=['GET'])
def get_vector_store(vector_store_id):
    """
    Récupère un vector store
    
    GET /api/vector-stores/<vector_store_id>?refresh=true
    """
    try:
        refresh = request.args.get('refresh', 'true').lower() == 'true'
        vector_store = vs_service.get_vector_store(vector_store_id, refresh=refresh)
        
        return jsonify({
            'success': True,
            'vector_store': vector_store
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


@vector_store_bp.route('/list', methods=['GET'])
def list_vector_stores():
    """
    Liste les vector stores
    
    GET /api/vector-stores/list?limit=20&after=vs_abc&source=api
    
    Query params:
        - limit: Nombre maximum (défaut: 20)
        - after: Cursor pour pagination
        - source: 'api' ou 'local' (défaut: api)
    """
    try:
        source = request.args.get('source', 'api')
        limit = int(request.args.get('limit', 20))
        
        if source == 'local':
            offset = int(request.args.get('offset', 0))
            stores = vs_service.get_local_vector_stores(limit=limit, offset=offset)
            
            return jsonify({
                'success': True,
                'object': 'list',
                'data': stores,
                'count': len(stores)
            }), 200
        else:
            after = request.args.get('after')
            result = vs_service.list_vector_stores(limit=limit, after=after)
            result['success'] = True
            return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Erreur: {str(e)}")
        return jsonify({
            'error': 'Erreur interne du serveur',
            'success': False
        }), 500


@vector_store_bp.route('/<vector_store_id>', methods=['DELETE'])
def delete_vector_store(vector_store_id):
    """
    Supprime un vector store
    
    DELETE /api/vector-stores/<vector_store_id>
    """
    try:
        result = vs_service.delete_vector_store(vector_store_id)
        
        return jsonify({
            'success': True,
            **result
        }), 200
        
    except Exception as e:
        logger.error(f"Erreur: {str(e)}")
        return jsonify({
            'error': 'Erreur interne du serveur',
            'success': False
        }), 500


# ============= FILE BATCHES =============

@vector_store_bp.route('/<vector_store_id>/file-batches', methods=['POST'])
def create_file_batch(vector_store_id):
    """
    Crée un batch de fichiers
    
    POST /api/vector-stores/<vector_store_id>/file-batches
    
    Body:
        - file_ids: Liste simple d'IDs (ou)
        - files: Liste de fichiers avec attributs
        - attributes: Attributs globaux (optionnel)
        - chunking_strategy: Stratégie globale (optionnel)
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'error': 'Corps de requête invalide',
                'success': False
            }), 400
        
        batch = vs_service.create_file_batch(
            vector_store_id=vector_store_id,
            file_ids=data.get('file_ids'),
            files=data.get('files'),
            attributes=data.get('attributes'),
            chunking_strategy=data.get('chunking_strategy')
        )
        
        return jsonify({
            'success': True,
            'batch': batch
        }), 200
        
    except ValueError as e:
        logger.error(f"Erreur de validation: {str(e)}")
        return jsonify({
            'error': str(e),
            'success': False
        }), 400
        
    except Exception as e:
        logger.error(f"Erreur: {str(e)}")
        return jsonify({
            'error': 'Erreur interne du serveur',
            'success': False
        }), 500


@vector_store_bp.route('/<vector_store_id>/file-batches/<batch_id>', methods=['GET'])
def get_file_batch(vector_store_id, batch_id):
    """
    Récupère un file batch
    
    GET /api/vector-stores/<vector_store_id>/file-batches/<batch_id>?refresh=true
    """
    try:
        refresh = request.args.get('refresh', 'true').lower() == 'true'
        batch = vs_service.get_file_batch(vector_store_id, batch_id, refresh=refresh)
        
        return jsonify({
            'success': True,
            'batch': batch
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


@vector_store_bp.route('/<vector_store_id>/file-batches/<batch_id>/cancel', methods=['POST'])
def cancel_file_batch(vector_store_id, batch_id):
    """
    Annule un file batch
    
    POST /api/vector-stores/<vector_store_id>/file-batches/<batch_id>/cancel
    """
    try:
        batch = vs_service.cancel_file_batch(vector_store_id, batch_id)
        
        return jsonify({
            'success': True,
            'batch': batch
        }), 200
        
    except Exception as e:
        logger.error(f"Erreur: {str(e)}")
        return jsonify({
            'error': 'Erreur interne du serveur',
            'success': False
        }), 500


@vector_store_bp.route('/<vector_store_id>/file-batches/<batch_id>/files', methods=['GET'])
def list_batch_files(vector_store_id, batch_id):
    """
    Liste les fichiers d'un batch
    
    GET /api/vector-stores/<vector_store_id>/file-batches/<batch_id>/files
    
    Query params:
        - limit: Nombre maximum (défaut: 20)
        - after: Cursor après
        - before: Cursor avant
        - filter: Filtrer par statut
        - order: Ordre (asc/desc)
    """
    try:
        limit = int(request.args.get('limit', 20))
        after = request.args.get('after')
        before = request.args.get('before')
        filter_status = request.args.get('filter')
        order = request.args.get('order', 'desc')
        
        result = vs_service.list_batch_files(
            vector_store_id=vector_store_id,
            batch_id=batch_id,
            limit=limit,
            after=after,
            before=before,
            filter_status=filter_status,
            order=order
        )
        
        result['success'] = True
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Erreur: {str(e)}")
        return jsonify({
            'error': 'Erreur interne du serveur',
            'success': False
        }), 500


@vector_store_bp.route('/<vector_store_id>/file-batches/list', methods=['GET'])
def list_file_batches(vector_store_id):
    """
    Liste les batches d'un vector store
    
    GET /api/vector-stores/<vector_store_id>/file-batches/list?limit=20
    """
    try:
        limit = int(request.args.get('limit', 50))
        offset = int(request.args.get('offset', 0))
        
        batches = vs_service.get_local_file_batches(
            vector_store_id=vector_store_id,
            limit=limit,
            offset=offset
        )
        
        return jsonify({
            'success': True,
            'data': batches,
            'count': len(batches)
        }), 200
        
    except Exception as e:
        logger.error(f"Erreur: {str(e)}")
        return jsonify({
            'error': 'Erreur interne du serveur',
            'success': False
        }), 500


# ============= STATS =============

@vector_store_bp.route('/stats', methods=['GET'])
def get_stats():
    """
    Récupère les statistiques des vector stores
    
    GET /api/vector-stores/stats
    """
    try:
        stats = vs_service.get_stats()
        
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


@vector_store_bp.route('/health', methods=['GET'])
def health():
    """
    Vérifie l'état du service
    
    GET /api/vector-stores/health
    """
    has_api_key = vs_service.client is not None
    
    return jsonify({
        'success': True,
        'service': 'vector_stores',
        'status': 'healthy' if has_api_key else 'limited',
        'api_configured': has_api_key
    }), 200


def register_vector_store_routes(app):
    """
    Enregistre les routes vector store dans l'application Flask
    
    Args:
        app: Instance de l'application Flask
    """
    app.register_blueprint(vector_store_bp)
    logger.info("Routes vector store enregistrées")
