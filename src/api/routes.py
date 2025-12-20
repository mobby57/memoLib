"""Routes API REST"""
from flask import request, jsonify
from . import api_bp
from ..core.auth import AuthManager
from ..core.cache import CacheManager

auth = AuthManager()
cache = CacheManager()

@api_bp.route('/health')
def health():
    return jsonify({'status': 'ok', 'version': '2.2.0'})

@api_bp.route('/emails', methods=['GET'])
@auth.login_required
@cache.cache(timeout=60)
def get_emails():
    # Récupérer historique emails
    return jsonify({'emails': []})

@api_bp.route('/emails', methods=['POST'])
@auth.login_required
@auth.rate_limit(max_attempts=10, window=60)
def send_email():
    data = request.get_json()
    # Logique envoi email
    cache.invalidate_pattern('get_emails:*')
    return jsonify({'success': True})

@api_bp.route('/ai/generate', methods=['POST'])
@auth.login_required
@auth.rate_limit(max_attempts=5, window=60)
def generate_ai():
    data = request.get_json()
    # Logique génération IA
    return jsonify({'success': True})

@api_bp.route('/ai/embeddings', methods=['POST'])
@auth.login_required
@auth.rate_limit(max_attempts=20, window=60)
def create_embeddings():
    """
    Crée des vecteurs d'embedding pour recherche sémantique.
    
    Body: {
        "text": "texte à transformer" OU "texts": ["texte1", "texte2", ...]
        "model": "text-embedding-ada-002" (optionnel)
    }
    """
    from ..backend.app import ai_service
    
    data = request.get_json()
    
    if not data:
        return jsonify({'success': False, 'error': 'No data provided'}), 400
    
    # Récupérer le modèle (par défaut: text-embedding-ada-002)
    model = data.get('model', 'text-embedding-ada-002')
    
    # Traitement batch ou single
    if 'texts' in data:
        # Batch de textes
        texts = data['texts']
        if not isinstance(texts, list):
            return jsonify({'success': False, 'error': 'texts must be an array'}), 400
        
        result = ai_service.batch_create_embeddings(texts, model=model)
        
    elif 'text' in data:
        # Texte unique
        text = data['text']
        if not isinstance(text, str):
            return jsonify({'success': False, 'error': 'text must be a string'}), 400
        
        result = ai_service.create_embedding(text, model=model)
        
    else:
        return jsonify({'success': False, 'error': 'Missing text or texts parameter'}), 400
    
    if result['success']:
        return jsonify(result), 200
    else:
        return jsonify(result), 500

@api_bp.route('/ai/similarity', methods=['POST'])
@auth.login_required
def calculate_similarity():
    """
    Calcule la similarité entre deux vecteurs d'embedding.
    
    Body: {
        "embedding1": [0.123, 0.456, ...],
        "embedding2": [0.789, 0.012, ...]
    }
    """
    from ..backend.app import ai_service
    
    data = request.get_json()
    
    if not data or 'embedding1' not in data or 'embedding2' not in data:
        return jsonify({'success': False, 'error': 'Missing embedding1 or embedding2'}), 400
    
    try:
        similarity = ai_service.calculate_similarity(
            data['embedding1'],
            data['embedding2']
        )
        
        return jsonify({
            'success': True,
            'similarity': float(similarity)
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@api_bp.route('/ai/vector-stores/<vector_store_id>/files', methods=['POST'])
@auth.login_required
@auth.rate_limit(max_attempts=20, window=60)
def create_vector_store_file(vector_store_id):
    """
    Attache un fichier à un vector store pour la recherche sémantique.
    
    Body: {
        "file_id": "file-abc123",
        "attributes": {"category": "emails", "priority": "high"},  // optionnel
        "chunking_strategy": {"type": "static", ...}  // optionnel
    }
    """
    from ..backend.app import ai_service
    
    data = request.get_json()
    
    if not data or 'file_id' not in data:
        return jsonify({'success': False, 'error': 'Missing file_id'}), 400
    
    result = ai_service.create_vector_store_file(
        vector_store_id=vector_store_id,
        file_id=data['file_id'],
        attributes=data.get('attributes'),
        chunking_strategy=data.get('chunking_strategy')
    )
    
    if result['success']:
        return jsonify(result), 200
    else:
        return jsonify(result), 500

@api_bp.route('/ai/vector-stores/<vector_store_id>/files', methods=['GET'])
@auth.login_required
def list_vector_store_files(vector_store_id):
    """
    Liste les fichiers d'un vector store.
    
    Query params:
        - limit: int (1-100, défaut 20)
        - order: str ('asc' ou 'desc')
        - filter: str (in_progress, completed, failed, cancelled)
        - after: str (curseur pagination)
        - before: str (curseur pagination)
    """
    from ..backend.app import ai_service
    
    limit = request.args.get('limit', 20, type=int)
    order = request.args.get('order', 'desc')
    filter_status = request.args.get('filter')
    after = request.args.get('after')
    before = request.args.get('before')
    
    result = ai_service.list_vector_store_files(
        vector_store_id=vector_store_id,
        limit=limit,
        order=order,
        filter_status=filter_status,
        after=after,
        before=before
    )
    
    if result['success']:
        return jsonify(result), 200
    else:
        return jsonify(result), 500

@api_bp.route('/ai/vector-stores/<vector_store_id>/files/<file_id>', methods=['GET'])
@auth.login_required
def get_vector_store_file(vector_store_id, file_id):
    """
    Récupère les détails d'un fichier dans un vector store.
    """
    from ..backend.app import ai_service
    
    result = ai_service.get_vector_store_file(
        vector_store_id=vector_store_id,
        file_id=file_id
    )
    
    if result['success']:
        return jsonify(result), 200
    else:
        return jsonify(result), 404

@api_bp.route('/ai/vector-stores/<vector_store_id>/files/<file_id>', methods=['DELETE'])
@auth.login_required
def delete_vector_store_file(vector_store_id, file_id):
    """
    Retire un fichier d'un vector store.
    Note: Le fichier lui-même n'est pas supprimé.
    """
    from ..backend.app import ai_service
    
    result = ai_service.delete_vector_store_file(
        vector_store_id=vector_store_id,
        file_id=file_id
    )
    
    if result['success']:
        return jsonify(result), 200
    else:
        return jsonify(result), 500

# ===== CHAT COMPLETIONS ENDPOINTS =====

@api_bp.route('/ai/chat/completions', methods=['POST'])
@auth.login_required
@auth.rate_limit(max_attempts=20, window=60)
def create_chat_completion():
    """
    Crée une completion de chat avec GPT.
    
    Body: {
        "messages": [
            {"role": "system", "content": "You are a helpful assistant"},
            {"role": "user", "content": "Hello!"}
        ],
        "model": "gpt-4o" (optionnel, défaut: gpt-4o),
        "temperature": 1.0 (optionnel, 0-2),
        "max_tokens": 1000 (optionnel),
        "stream": false (optionnel),
        "store": false (optionnel, pour stockage),
        "metadata": {} (optionnel)
    }
    """
    from ..backend.app import ai_service
    
    data = request.get_json()
    messages = data.get('messages', [])
    
    if not messages:
        return jsonify({
            'success': False,
            'error': 'Messages are required'
        }), 400
    
    # Paramètres de base
    params = {
        'messages': messages,
        'model': data.get('model', 'gpt-4o'),
        'temperature': data.get('temperature', 1.0),
        'stream': data.get('stream', False),
        'store': data.get('store', False)
    }
    
    # Paramètres optionnels
    if 'max_tokens' in data:
        params['max_tokens'] = data['max_tokens']
    
    if 'metadata' in data:
        params['metadata'] = data['metadata']
    
    # Autres paramètres optionnels
    optional = ['top_p', 'frequency_penalty', 'presence_penalty', 'stop', 
                'n', 'logprobs', 'response_format', 'tools', 'tool_choice', 
                'seed', 'reasoning_effort']
    
    for key in optional:
        if key in data:
            params[key] = data[key]
    
    result = ai_service.create_chat_completion(**params)
    
    if result['success']:
        return jsonify(result), 200
    else:
        return jsonify(result), 500

@api_bp.route('/ai/chat/completions/<completion_id>', methods=['GET'])
@auth.login_required
def get_chat_completion(completion_id):
    """
    Récupère une completion stockée.
    """
    from ..backend.app import ai_service
    
    result = ai_service.get_chat_completion(completion_id)
    
    if result['success']:
        return jsonify(result), 200
    else:
        return jsonify(result), 404

@api_bp.route('/ai/chat/completions', methods=['GET'])
@auth.login_required
def list_chat_completions():
    """
    Liste les completions stockées.
    
    Query params:
        - limit: Nombre max (1-100, défaut: 20)
        - order: asc ou desc (défaut: asc)
        - after: Curseur de pagination
        - model: Filtrer par modèle
    """
    from ..backend.app import ai_service
    
    limit = int(request.args.get('limit', 20))
    order = request.args.get('order', 'asc')
    after = request.args.get('after')
    model_filter = request.args.get('model')
    
    result = ai_service.list_chat_completions(
        limit=limit,
        order=order,
        after=after,
        model_filter=model_filter
    )
    
    if result['success']:
        return jsonify(result), 200
    else:
        return jsonify(result), 500

@api_bp.route('/ai/chat/completions/<completion_id>', methods=['POST'])
@auth.login_required
def update_chat_completion(completion_id):
    """
    Met à jour les métadonnées d'une completion.
    
    Body: {
        "metadata": {
            "key1": "value1",
            "key2": "value2"
        }
    }
    """
    from ..backend.app import ai_service
    
    data = request.get_json()
    metadata = data.get('metadata', {})
    
    result = ai_service.update_chat_completion(
        completion_id=completion_id,
        metadata=metadata
    )
    
    if result['success']:
        return jsonify(result), 200
    else:
        return jsonify(result), 500

@api_bp.route('/ai/chat/completions/<completion_id>', methods=['DELETE'])
@auth.login_required
def delete_chat_completion(completion_id):
    """
    Supprime une completion stockée.
    """
    from ..backend.app import ai_service
    
    result = ai_service.delete_chat_completion(completion_id)
    
    if result['success']:
        return jsonify(result), 200
    else:
        return jsonify(result), 500

@api_bp.route('/ai/chat/completions/<completion_id>/messages', methods=['GET'])
@auth.login_required
def get_chat_messages(completion_id):
    """
    Récupère les messages d'une completion.
    
    Query params:
        - limit: Nombre max (1-100, défaut: 20)
        - order: asc ou desc (défaut: asc)
        - after: Curseur de pagination
    """
    from ..backend.app import ai_service
    
    limit = int(request.args.get('limit', 20))
    order = request.args.get('order', 'asc')
    after = request.args.get('after')
    
    result = ai_service.get_chat_messages(
        completion_id=completion_id,
        limit=limit,
        order=order,
        after=after
    )
    
    if result['success']:
        return jsonify(result), 200
    else:
        return jsonify(result), 500

# ===== FILES API ENDPOINTS =====

@api_bp.route('/ai/files', methods=['POST'])
@auth.login_required
@auth.rate_limit(max_attempts=10, window=60)
def upload_file():
    """
    Upload un fichier vers OpenAI.
    
    Form data:
        - file: Fichier à uploader
        - purpose: assistants, fine-tune, batch (défaut: assistants)
    """
    from ..backend.app import ai_service
    from werkzeug.utils import secure_filename
    import os
    import tempfile
    
    if 'file' not in request.files:
        return jsonify({
            'success': False,
            'error': 'No file provided'
        }), 400
    
    file = request.files['file']
    purpose = request.form.get('purpose', 'assistants')
    
    if file.filename == '':
        return jsonify({
            'success': False,
            'error': 'Empty filename'
        }), 400
    
    # Sauvegarder temporairement
    filename = secure_filename(file.filename)
    temp_dir = tempfile.gettempdir()
    temp_path = os.path.join(temp_dir, filename)
    
    try:
        file.save(temp_path)
        result = ai_service.upload_file(temp_path, purpose)
        
        # Nettoyer
        os.remove(temp_path)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 500
    except Exception as e:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@api_bp.route('/ai/files', methods=['GET'])
@auth.login_required
def list_files():
    """
    Liste les fichiers uploadés.
    
    Query params:
        - purpose: Filtrer par usage
    """
    from ..backend.app import ai_service
    
    purpose = request.args.get('purpose')
    result = ai_service.list_files(purpose)
    
    if result['success']:
        return jsonify(result), 200
    else:
        return jsonify(result), 500

@api_bp.route('/ai/files/<file_id>', methods=['GET'])
@auth.login_required
def get_file(file_id):
    """
    Récupère les infos d'un fichier.
    """
    from ..backend.app import ai_service
    
    result = ai_service.get_file(file_id)
    
    if result['success']:
        return jsonify(result), 200
    else:
        return jsonify(result), 404

@api_bp.route('/ai/files/<file_id>', methods=['DELETE'])
@auth.login_required
def delete_file(file_id):
    """
    Supprime un fichier.
    """
    from ..backend.app import ai_service
    
    result = ai_service.delete_file(file_id)
    
    if result['success']:
        return jsonify(result), 200
    else:
        return jsonify(result), 500

@api_bp.route('/ai/files/<file_id>/content', methods=['GET'])
@auth.login_required
def download_file_content(file_id):
    """
    Télécharge le contenu d'un fichier.
    """
    from ..backend.app import ai_service
    
    result = ai_service.download_file_content(file_id)
    
    if result['success']:
        from flask import send_file
        import io
        return send_file(
            io.BytesIO(result['content']),
            download_name=f'{file_id}.txt',
            as_attachment=True
        )
    else:
        return jsonify(result), 500

# ===== MODERATION API ENDPOINTS =====

@api_bp.route('/ai/moderate', methods=['POST'])
@auth.login_required
@auth.rate_limit(max_attempts=30, window=60)
def moderate_content():
    """
    Modère un texte pour détecter contenu inapproprié.
    
    Body: {
        "text": "texte à modérer" OU "texts": ["texte1", "texte2", ...]
    }
    """
    from ..backend.app import ai_service
    
    data = request.get_json()
    
    # Batch ou single
    if 'texts' in data:
        result = ai_service.batch_moderate(data['texts'])
    elif 'text' in data:
        result = ai_service.moderate_content(data['text'])
    else:
        return jsonify({
            'success': False,
            'error': 'text or texts required'
        }), 400
    
    if result['success']:
        return jsonify(result), 200
    else:
        return jsonify(result), 500

# ===== RUN STEPS API ENDPOINTS (Assistants Beta) =====

@api_bp.route('/ai/threads/<thread_id>/runs/<run_id>/steps', methods=['GET'])
@auth.login_required
def list_run_steps(thread_id, run_id):
    """
    Liste les étapes d'exécution d'un run.
    
    Query params:
        - limit: Nombre max (1-100, défaut: 20)
        - order: asc ou desc (défaut: desc)
        - after: Curseur de pagination
        - before: Curseur de pagination
        - include: Champs additionnels (step_details.tool_calls[*].file_search.results[*].content)
    """
    from ..backend.app import ai_service
    
    limit = int(request.args.get('limit', 20))
    order = request.args.get('order', 'desc')
    after = request.args.get('after')
    before = request.args.get('before')
    include = request.args.getlist('include')
    
    result = ai_service.list_run_steps(
        thread_id=thread_id,
        run_id=run_id,
        limit=limit,
        order=order,
        after=after,
        before=before,
        include=include if include else None
    )
    
    if result['success']:
        return jsonify(result), 200
    else:
        return jsonify(result), 500

@api_bp.route('/ai/threads/<thread_id>/runs/<run_id>/steps/<step_id>', methods=['GET'])
@auth.login_required
def get_run_step(thread_id, run_id, step_id):
    """
    Récupère un run step spécifique.
    
    Query params:
        - include: Champs additionnels (step_details.tool_calls[*].file_search.results[*].content)
    """
    from ..backend.app import ai_service
    
    include = request.args.getlist('include')
    
    result = ai_service.get_run_step(
        thread_id=thread_id,
        run_id=run_id,
        step_id=step_id,
        include=include if include else None
    )
    
    if result['success']:
        return jsonify(result), 200
    else:
        return jsonify(result), 404

# ===== ASSISTANTS API ENDPOINTS =====

@api_bp.route('/ai/assistants', methods=['POST'])
@auth.login_required
@limiter.limit("20 per minute")
def create_assistant():
    """Crée un nouvel assistant."""
    data = request.get_json()
    
    result = ai_service.create_assistant(
        model=data.get('model'),
        name=data.get('name'),
        description=data.get('description'),
        instructions=data.get('instructions'),
        tools=data.get('tools'),
        tool_resources=data.get('tool_resources'),
        metadata=data.get('metadata'),
        temperature=data.get('temperature'),
        top_p=data.get('top_p'),
        response_format=data.get('response_format')
    )
    
    if result['success']:
        return jsonify(result), 201
    else:
        return jsonify(result), 400

@api_bp.route('/ai/assistants', methods=['GET'])
@auth.login_required
@limiter.limit("60 per minute")
def list_assistants():
    """Liste les assistants."""
    limit = request.args.get('limit', 20, type=int)
    order = request.args.get('order', 'desc')
    after = request.args.get('after')
    before = request.args.get('before')
    
    result = ai_service.list_assistants(
        limit=limit,
        order=order,
        after=after,
        before=before
    )
    
    if result['success']:
        return jsonify(result), 200
    else:
        return jsonify(result), 400

@api_bp.route('/ai/assistants/<assistant_id>', methods=['GET'])
@auth.login_required
@limiter.limit("60 per minute")
def get_assistant(assistant_id):
    """Récupère un assistant spécifique."""
    result = ai_service.get_assistant(assistant_id)
    
    if result['success']:
        return jsonify(result), 200
    else:
        return jsonify(result), 404

@api_bp.route('/ai/assistants/<assistant_id>', methods=['POST'])
@auth.login_required
@limiter.limit("20 per minute")
def update_assistant(assistant_id):
    """Met à jour un assistant."""
    data = request.get_json()
    
    result = ai_service.update_assistant(
        assistant_id=assistant_id,
        model=data.get('model'),
        name=data.get('name'),
        description=data.get('description'),
        instructions=data.get('instructions'),
        tools=data.get('tools'),
        tool_resources=data.get('tool_resources'),
        metadata=data.get('metadata'),
        temperature=data.get('temperature'),
        top_p=data.get('top_p'),
        response_format=data.get('response_format')
    )
    
    if result['success']:
        return jsonify(result), 200
    else:
        return jsonify(result), 400

@api_bp.route('/ai/assistants/<assistant_id>', methods=['DELETE'])
@auth.login_required
@limiter.limit("20 per minute")
def delete_assistant(assistant_id):
    """Supprime un assistant."""
    result = ai_service.delete_assistant(assistant_id)
    
    if result['success']:
        return jsonify(result), 200
    else:
        return jsonify(result), 400

# ===== THREADS API ENDPOINTS =====

@api_bp.route('/ai/threads', methods=['POST'])
@auth.login_required
@limiter.limit("30 per minute")
def create_thread():
    """Crée un nouveau thread."""
    data = request.get_json() or {}
    
    result = ai_service.create_thread(
        messages=data.get('messages'),
        tool_resources=data.get('tool_resources'),
        metadata=data.get('metadata')
    )
    
    if result['success']:
        return jsonify(result), 201
    else:
        return jsonify(result), 400

@api_bp.route('/ai/threads/<thread_id>', methods=['GET'])
@auth.login_required
@limiter.limit("60 per minute")
def get_thread(thread_id):
    """Récupère un thread spécifique."""
    result = ai_service.get_thread(thread_id)
    
    if result['success']:
        return jsonify(result), 200
    else:
        return jsonify(result), 404

@api_bp.route('/ai/threads/<thread_id>', methods=['POST'])
@auth.login_required
@limiter.limit("30 per minute")
def update_thread(thread_id):
    """Met à jour un thread."""
    data = request.get_json() or {}
    
    result = ai_service.update_thread(
        thread_id=thread_id,
        tool_resources=data.get('tool_resources'),
        metadata=data.get('metadata')
    )
    
    if result['success']:
        return jsonify(result), 200
    else:
        return jsonify(result), 400

@api_bp.route('/ai/threads/<thread_id>', methods=['DELETE'])
@auth.login_required
@limiter.limit("20 per minute")
def delete_thread(thread_id):
    """Supprime un thread."""
    result = ai_service.delete_thread(thread_id)
    
    if result['success']:
        return jsonify(result), 200
    else:
        return jsonify(result), 400

# ===== MESSAGES API ENDPOINTS =====

@api_bp.route('/ai/threads/<thread_id>/messages', methods=['POST'])
@auth.login_required
@limiter.limit("60 per minute")
def create_message(thread_id):
    """Ajoute un message à un thread."""
    data = request.get_json()
    
    result = ai_service.create_message(
        thread_id=thread_id,
        role=data.get('role'),
        content=data.get('content'),
        attachments=data.get('attachments'),
        metadata=data.get('metadata')
    )
    
    if result['success']:
        return jsonify(result), 201
    else:
        return jsonify(result), 400

@api_bp.route('/ai/threads/<thread_id>/messages', methods=['GET'])
@auth.login_required
@limiter.limit("60 per minute")
def list_messages(thread_id):
    """Liste les messages d'un thread."""
    limit = request.args.get('limit', 20, type=int)
    order = request.args.get('order', 'desc')
    after = request.args.get('after')
    before = request.args.get('before')
    run_id = request.args.get('run_id')
    
    result = ai_service.list_messages(
        thread_id=thread_id,
        limit=limit,
        order=order,
        after=after,
        before=before,
        run_id=run_id
    )
    
    if result['success']:
        return jsonify(result), 200
    else:
        return jsonify(result), 400

@api_bp.route('/ai/threads/<thread_id>/messages/<message_id>', methods=['GET'])
@auth.login_required
@limiter.limit("60 per minute")
def get_message(thread_id, message_id):
    """Récupère un message spécifique."""
    result = ai_service.get_message(thread_id, message_id)
    
    if result['success']:
        return jsonify(result), 200
    else:
        return jsonify(result), 404

@api_bp.route('/ai/threads/<thread_id>/messages/<message_id>', methods=['POST'])
@auth.login_required
@limiter.limit("30 per minute")
def update_message(thread_id, message_id):
    """Met à jour un message."""
    data = request.get_json() or {}
    
    result = ai_service.update_message(
        thread_id=thread_id,
        message_id=message_id,
        metadata=data.get('metadata')
    )
    
    if result['success']:
        return jsonify(result), 200
    else:
        return jsonify(result), 400

@api_bp.route('/ai/threads/<thread_id>/messages/<message_id>', methods=['DELETE'])
@auth.login_required
@limiter.limit("20 per minute")
def delete_message(thread_id, message_id):
    """Supprime un message."""
    result = ai_service.delete_message(thread_id, message_id)
    
    if result['success']:
        return jsonify(result), 200
    else:
        return jsonify(result), 400

# ===== RUNS API ENDPOINTS =====

@api_bp.route('/ai/threads/<thread_id>/runs', methods=['POST'])
@auth.login_required
@limiter.limit("30 per minute")
def create_run(thread_id):
    """Crée un run pour exécuter un assistant."""
    data = request.get_json()
    
    result = ai_service.create_run(
        thread_id=thread_id,
        assistant_id=data.get('assistant_id'),
        model=data.get('model'),
        instructions=data.get('instructions'),
        additional_instructions=data.get('additional_instructions'),
        additional_messages=data.get('additional_messages'),
        tools=data.get('tools'),
        metadata=data.get('metadata'),
        temperature=data.get('temperature'),
        top_p=data.get('top_p'),
        max_prompt_tokens=data.get('max_prompt_tokens'),
        max_completion_tokens=data.get('max_completion_tokens'),
        truncation_strategy=data.get('truncation_strategy'),
        tool_choice=data.get('tool_choice'),
        parallel_tool_calls=data.get('parallel_tool_calls'),
        response_format=data.get('response_format')
    )
    
    if result['success']:
        return jsonify(result), 201
    else:
        return jsonify(result), 400

@api_bp.route('/ai/threads/<thread_id>/runs', methods=['GET'])
@auth.login_required
@limiter.limit("60 per minute")
def list_runs(thread_id):
    """Liste les runs d'un thread."""
    limit = request.args.get('limit', 20, type=int)
    order = request.args.get('order', 'desc')
    after = request.args.get('after')
    before = request.args.get('before')
    
    result = ai_service.list_runs(
        thread_id=thread_id,
        limit=limit,
        order=order,
        after=after,
        before=before
    )
    
    if result['success']:
        return jsonify(result), 200
    else:
        return jsonify(result), 400

@api_bp.route('/ai/threads/<thread_id>/runs/<run_id>', methods=['GET'])
@auth.login_required
@limiter.limit("60 per minute")
def get_run(thread_id, run_id):
    """Récupère un run spécifique."""
    result = ai_service.get_run(thread_id, run_id)
    
    if result['success']:
        return jsonify(result), 200
    else:
        return jsonify(result), 404

@api_bp.route('/ai/threads/<thread_id>/runs/<run_id>', methods=['POST'])
@auth.login_required
@limiter.limit("30 per minute")
def update_run(thread_id, run_id):
    """Met à jour un run."""
    data = request.get_json() or {}
    
    result = ai_service.update_run(
        thread_id=thread_id,
        run_id=run_id,
        metadata=data.get('metadata')
    )
    
    if result['success']:
        return jsonify(result), 200
    else:
        return jsonify(result), 400

@api_bp.route('/ai/threads/<thread_id>/runs/<run_id>/cancel', methods=['POST'])
@auth.login_required
@limiter.limit("30 per minute")
def cancel_run(thread_id, run_id):
    """Annule un run en cours."""
    result = ai_service.cancel_run(thread_id, run_id)
    
    if result['success']:
        return jsonify(result), 200
    else:
        return jsonify(result), 400

@api_bp.route('/ai/threads/<thread_id>/runs/<run_id>/submit_tool_outputs', methods=['POST'])
@auth.login_required
@limiter.limit("30 per minute")
def submit_tool_outputs(thread_id, run_id):
    """Soumet les résultats d'outils."""
    data = request.get_json()
    
    result = ai_service.submit_tool_outputs(
        thread_id=thread_id,
        run_id=run_id,
        tool_outputs=data.get('tool_outputs', [])
    )
    
    if result['success']:
        return jsonify(result), 200
    else:
        return jsonify(result), 400

# ===== VECTOR STORES API ENDPOINTS =====

@api_bp.route('/ai/vector-stores', methods=['POST'])
@auth.login_required
@limiter.limit("20 per minute")
def create_vector_store():
    """Crée un nouveau vector store."""
    data = request.get_json() or {}
    
    result = ai_service.create_vector_store(
        name=data.get('name'),
        file_ids=data.get('file_ids'),
        expires_after=data.get('expires_after'),
        chunking_strategy=data.get('chunking_strategy'),
        metadata=data.get('metadata')
    )
    
    if result['success']:
        return jsonify(result), 201
    else:
        return jsonify(result), 400

@api_bp.route('/ai/vector-stores', methods=['GET'])
@auth.login_required
@limiter.limit("60 per minute")
def list_vector_stores():
    """Liste les vector stores."""
    limit = request.args.get('limit', 20, type=int)
    order = request.args.get('order', 'desc')
    after = request.args.get('after')
    before = request.args.get('before')
    
    result = ai_service.list_vector_stores(
        limit=limit,
        order=order,
        after=after,
        before=before
    )
    
    if result['success']:
        return jsonify(result), 200
    else:
        return jsonify(result), 400

@api_bp.route('/ai/vector-stores/<vector_store_id>', methods=['GET'])
@auth.login_required
@limiter.limit("60 per minute")
def get_vector_store(vector_store_id):
    """Récupère un vector store spécifique."""
    result = ai_service.get_vector_store(vector_store_id)
    
    if result['success']:
        return jsonify(result), 200
    else:
        return jsonify(result), 404

@api_bp.route('/ai/vector-stores/<vector_store_id>', methods=['POST'])
@auth.login_required
@limiter.limit("20 per minute")
def update_vector_store(vector_store_id):
    """Met à jour un vector store."""
    data = request.get_json() or {}
    
    result = ai_service.update_vector_store(
        vector_store_id=vector_store_id,
        name=data.get('name'),
        expires_after=data.get('expires_after'),
        metadata=data.get('metadata')
    )
    
    if result['success']:
        return jsonify(result), 200
    else:
        return jsonify(result), 400

@api_bp.route('/ai/vector-stores/<vector_store_id>', methods=['DELETE'])
@auth.login_required
@limiter.limit("20 per minute")
def delete_vector_store(vector_store_id):
    """Supprime un vector store."""
    result = ai_service.delete_vector_store(vector_store_id)
    
    if result['success']:
        return jsonify(result), 200
    else:
        return jsonify(result), 400

@api_bp.route('/stats')
@auth.login_required
@cache.cache(timeout=300)
def get_stats():
    # Statistiques cachées 5min
    return jsonify({'stats': {}})
