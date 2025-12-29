"""
Routes pour l'API Batch OpenAI
Gère les endpoints de création et gestion des batches
"""
from flask import Blueprint, request, jsonify, send_file
import logging
import json
from services.batch_service import BatchService

logger = logging.getLogger(__name__)

batch_bp = Blueprint('batch', __name__, url_prefix='/api/batch')

# Initialiser le service batch
batch_service = BatchService()


@batch_bp.route('/create', methods=['POST'])
def create_batch():
    """
    Crée un nouveau batch OpenAI
    
    POST /api/batch/create
    
    Body:
        - requests: Liste des requêtes au format batch (optionnel si file_id fourni)
        - input_file_id: ID d'un fichier déjà uploadé (optionnel)
        - endpoint: Endpoint à utiliser (/v1/chat/completions, etc.)
        - completion_window: Fenêtre de completion (défaut: 24h)
        - metadata: Métadonnées optionnelles
        - filename: Nom du fichier batch (optionnel)
    
    Returns:
        200: Batch créé avec succès
        400: Données invalides
        500: Erreur serveur
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'error': 'Corps de requête invalide',
                'success': False
            }), 400
        
        endpoint = data.get('endpoint', '/v1/chat/completions')
        completion_window = data.get('completion_window', '24h')
        metadata = data.get('metadata')
        
        # Option 1: Créer à partir d'une liste de requêtes
        if 'requests' in data:
            requests = data['requests']
            filename = data.get('filename')
            
            # Créer le fichier JSONL
            filepath = batch_service.create_batch_file(requests, filename)
            
            # Uploader le fichier
            file_info = batch_service.upload_file(filepath)
            input_file_id = file_info['id']
        
        # Option 2: Utiliser un fichier déjà uploadé
        elif 'input_file_id' in data:
            input_file_id = data['input_file_id']
        
        else:
            return jsonify({
                'error': 'Requêtes ou input_file_id requis',
                'success': False
            }), 400
        
        # Créer le batch
        batch = batch_service.create_batch(
            input_file_id=input_file_id,
            endpoint=endpoint,
            completion_window=completion_window,
            metadata=metadata
        )
        
        logger.info(f"Batch créé: {batch['id']}")
        
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
        logger.error(f"Erreur lors de la création du batch: {str(e)}")
        return jsonify({
            'error': 'Erreur interne du serveur',
            'success': False
        }), 500


@batch_bp.route('/<batch_id>', methods=['GET'])
def get_batch(batch_id):
    """
    Récupère les informations d'un batch
    
    GET /api/batch/<batch_id>?refresh=true
    
    Query params:
        - refresh: Si true, récupère depuis l'API OpenAI (défaut: true)
    
    Returns:
        200: Informations du batch
        404: Batch non trouvé
        500: Erreur serveur
    """
    try:
        refresh = request.args.get('refresh', 'true').lower() == 'true'
        
        batch = batch_service.get_batch(batch_id, refresh=refresh)
        
        return jsonify({
            'success': True,
            'batch': batch
        }), 200
        
    except ValueError as e:
        logger.error(f"Batch non trouvé: {str(e)}")
        return jsonify({
            'error': str(e),
            'success': False
        }), 404
        
    except Exception as e:
        logger.error(f"Erreur lors de la récupération du batch: {str(e)}")
        return jsonify({
            'error': 'Erreur interne du serveur',
            'success': False
        }), 500


@batch_bp.route('/<batch_id>/cancel', methods=['POST'])
def cancel_batch(batch_id):
    """
    Annule un batch en cours
    
    POST /api/batch/<batch_id>/cancel
    
    Returns:
        200: Batch annulé
        400: Erreur
        500: Erreur serveur
    """
    try:
        batch = batch_service.cancel_batch(batch_id)
        
        logger.info(f"Batch annulé: {batch_id}")
        
        return jsonify({
            'success': True,
            'batch': batch
        }), 200
        
    except ValueError as e:
        logger.error(f"Erreur d'annulation: {str(e)}")
        return jsonify({
            'error': str(e),
            'success': False
        }), 400
        
    except Exception as e:
        logger.error(f"Erreur lors de l'annulation du batch: {str(e)}")
        return jsonify({
            'error': 'Erreur interne du serveur',
            'success': False
        }), 500


@batch_bp.route('/list', methods=['GET'])
def list_batches():
    """
    Liste les batches
    
    GET /api/batch/list?limit=20&after=batch_abc&source=api
    
    Query params:
        - limit: Nombre maximum de batches (défaut: 20, max: 100)
        - after: Cursor pour pagination (optionnel)
        - source: 'api' pour l'API OpenAI, 'local' pour la base locale (défaut: api)
        - status: Filtrer par statut (pour source=local uniquement)
        - offset: Décalage pour pagination (pour source=local uniquement)
    
    Returns:
        200: Liste des batches
        500: Erreur serveur
    """
    try:
        source = request.args.get('source', 'api')
        limit = int(request.args.get('limit', 20))
        
        if source == 'local':
            # Récupérer depuis la base locale
            status = request.args.get('status')
            offset = int(request.args.get('offset', 0))
            
            batches = batch_service.get_local_batches(
                status=status,
                limit=min(limit, 100),
                offset=offset
            )
            
            return jsonify({
                'success': True,
                'object': 'list',
                'data': batches,
                'count': len(batches)
            }), 200
        
        else:
            # Récupérer depuis l'API OpenAI
            after = request.args.get('after')
            
            result = batch_service.list_batches(
                limit=min(limit, 100),
                after=after
            )
            
            result['success'] = True
            return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Erreur lors de la liste des batches: {str(e)}")
        return jsonify({
            'error': 'Erreur interne du serveur',
            'success': False
        }), 500


@batch_bp.route('/stats', methods=['GET'])
def get_stats():
    """
    Récupère les statistiques des batches
    
    GET /api/batch/stats
    
    Returns:
        200: Statistiques
        500: Erreur serveur
    """
    try:
        stats = batch_service.get_batch_stats()
        
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


@batch_bp.route('/<batch_id>/results', methods=['GET'])
def download_results(batch_id):
    """
    Télécharge les résultats d'un batch
    
    GET /api/batch/<batch_id>/results?type=output
    
    Query params:
        - type: 'output' ou 'error' (défaut: output)
    
    Returns:
        200: Fichier de résultats
        400: Erreur
        500: Erreur serveur
    """
    try:
        output_type = request.args.get('type', 'output')
        
        if output_type not in ['output', 'error']:
            return jsonify({
                'error': 'Type invalide (output ou error)',
                'success': False
            }), 400
        
        filepath = batch_service.download_batch_results(batch_id, output_type)
        
        return send_file(
            filepath,
            mimetype='application/x-ndjson',
            as_attachment=True,
            download_name=f"{batch_id}_{output_type}.jsonl"
        )
        
    except ValueError as e:
        logger.error(f"Erreur de téléchargement: {str(e)}")
        return jsonify({
            'error': str(e),
            'success': False
        }), 400
        
    except Exception as e:
        logger.error(f"Erreur lors du téléchargement des résultats: {str(e)}")
        return jsonify({
            'error': 'Erreur interne du serveur',
            'success': False
        }), 500


@batch_bp.route('/upload', methods=['POST'])
def upload_file():
    """
    Upload un fichier JSONL pour batch
    
    POST /api/batch/upload
    
    Form data:
        - file: Fichier JSONL à uploader
        - purpose: Purpose du fichier (défaut: batch)
    
    Returns:
        200: Fichier uploadé
        400: Erreur
        500: Erreur serveur
    """
    try:
        if 'file' not in request.files:
            return jsonify({
                'error': 'Aucun fichier fourni',
                'success': False
            }), 400
        
        file = request.files['file']
        purpose = request.form.get('purpose', 'batch')
        
        if file.filename == '':
            return jsonify({
                'error': 'Nom de fichier vide',
                'success': False
            }), 400
        
        # Sauvegarder temporairement
        import os
        import tempfile
        
        temp_dir = tempfile.gettempdir()
        filepath = os.path.join(temp_dir, file.filename)
        file.save(filepath)
        
        # Uploader vers OpenAI
        file_info = batch_service.upload_file(filepath, purpose)
        
        # Supprimer le fichier temporaire
        os.remove(filepath)
        
        return jsonify({
            'success': True,
            'file': file_info
        }), 200
        
    except Exception as e:
        logger.error(f"Erreur lors de l'upload: {str(e)}")
        return jsonify({
            'error': 'Erreur interne du serveur',
            'success': False
        }), 500


@batch_bp.route('/health', methods=['GET'])
def batch_health():
    """
    Vérifie l'état du service batch
    
    GET /api/batch/health
    
    Returns:
        200: Service opérationnel
    """
    has_api_key = batch_service.client is not None
    
    return jsonify({
        'success': True,
        'service': 'batch',
        'status': 'healthy' if has_api_key else 'limited',
        'api_configured': has_api_key
    }), 200


def register_batch_routes(app):
    """
    Enregistre les routes batch dans l'application Flask
    
    Args:
        app: Instance de l'application Flask
    """
    app.register_blueprint(batch_bp)
    logger.info("Routes batch enregistrées")
