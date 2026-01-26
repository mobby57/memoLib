"""
API REST Routes - IA Poste Manager v4.0

Endpoints JSON pour architecture séparée Frontend/Backend.
Coexiste avec les routes Flask HTML existantes.
"""

from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token
from datetime import timedelta, datetime
import os

# Le Blueprint est créé dans __init__.py pour éviter circular import
from . import api_bp


# ==================== AUTH ENDPOINTS ====================

@api_bp.route('/auth/login', methods=['POST'])
def api_login():
    """
    Login API - Retourne JWT token
    
    Request:
        {
            "username": "admin",
            "password": "admin123"
        }
    
    Response:
        {
            "success": true,
            "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
            "user": {"username": "admin"}
        }
    """
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({
                'success': False,
                'error': 'Username and password required'
            }), 400
        
        # Validation simple (améliorer avec auth_system.py plus tard)
        # TODO: Intégrer avec src/backend/auth_system.py
        if username == 'admin' and password == 'admin123':
            access_token = create_access_token(
                identity=username,
                expires_delta=timedelta(hours=24)
            )
            
            return jsonify({
                'success': True,
                'token': access_token,
                'user': {
                    'username': username,
                    'role': 'admin'
                }
            }), 200
        
        return jsonify({
            'success': False,
            'error': 'Invalid credentials'
        }), 401
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@api_bp.route('/auth/verify', methods=['GET'])
@jwt_required()
def api_verify_token():
    """Vérifier validité du token JWT"""
    current_user = get_jwt_identity()
    return jsonify({
        'success': True,
        'user': {'username': current_user}
    }), 200


# ==================== CASES ENDPOINTS ====================

@api_bp.route('/cases', methods=['GET'])
@jwt_required()
def api_get_cases():
    """
    Liste tous les dossiers
    
    Response:
        {
            "success": true,
            "data": [
                {
                    "id": 1,
                    "title": "Dossier CESEDA",
                    "deadline": "2025-01-15T00:00:00",
                    "status": "en_cours",
                    "procedure_type": "titre_sejour"
                }
            ],
            "total": 1
        }
    """
    try:
        # TODO: Intégrer avec deadline_manager.py
        # Pour l'instant, données mockées
        cases = [
            {
                'id': 1,
                'title': 'Demande titre de séjour - M. Dupont',
                'deadline': '2025-01-15T00:00:00',
                'status': 'en_cours',
                'procedure_type': 'titre_sejour',
                'created_at': '2024-12-15T10:00:00'
            },
            {
                'id': 2,
                'title': 'Recours OQTF - Mme Martin',
                'deadline': '2025-01-08T00:00:00',
                'status': 'urgent',
                'procedure_type': 'recours_oqtf',
                'created_at': '2024-12-20T14:30:00'
            }
        ]
        
        return jsonify({
            'success': True,
            'data': cases,
            'total': len(cases)
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@api_bp.route('/cases/<int:case_id>', methods=['GET'])
@jwt_required()
def api_get_case(case_id):
    """
    Détail d'un dossier
    
    Response:
        {
            "success": true,
            "data": {
                "id": 1,
                "title": "...",
                "description": "...",
                "deadline": "...",
                "documents": []
            }
        }
    """
    try:
        # Mock data
        if case_id == 1:
            case = {
                'id': 1,
                'title': 'Demande titre de séjour - M. Dupont',
                'description': 'Client algérien, présent depuis 7 ans, marié à française',
                'deadline': '2025-01-15T00:00:00',
                'status': 'en_cours',
                'procedure_type': 'titre_sejour',
                'documents': [
                    {'name': 'passeport.pdf', 'size': '2.3 MB'},
                    {'name': 'justificatif_domicile.pdf', 'size': '1.1 MB'}
                ]
            }
            return jsonify({'success': True, 'data': case}), 200
        
        return jsonify({
            'success': False,
            'error': 'Case not found'
        }), 404
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@api_bp.route('/cases', methods=['POST'])
@jwt_required()
def api_create_case():
    """
    Créer nouveau dossier
    
    Request:
        {
            "title": "...",
            "description": "...",
            "procedure_type": "titre_sejour",
            "deadline": "2025-02-01"
        }
    """
    try:
        data = request.get_json()
        
        # Validation
        if not data.get('title'):
            return jsonify({
                'success': False,
                'error': 'Title is required'
            }), 400
        
        # Mock response
        new_case = {
            'id': 3,
            'title': data['title'],
            'description': data.get('description', ''),
            'procedure_type': data.get('procedure_type', 'titre_sejour'),
            'deadline': data.get('deadline'),
            'status': 'en_cours',
            'created_at': datetime.now().isoformat()
        }
        
        return jsonify({
            'success': True,
            'data': new_case
        }), 201
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# ==================== AI ENDPOINTS ====================

@api_bp.route('/ai/analyze', methods=['POST'])
@jwt_required()
def api_ai_analyze():
    """
    Analyse IA d'un dossier
    
    Request:
        {
            "description": "Client algérien...",
            "procedure_type": "titre_sejour"
        }
    
    Response:
        {
            "success": true,
            "analysis": {
                "success_probability": 0.82,
                "confidence": 0.87,
                "factors_positive": [...],
                "factors_negative": [...],
                "recommendations": [...]
            }
        }
    """
    try:
        data = request.get_json()
        description = data.get('description', '')
        procedure_type = data.get('procedure_type', 'titre_sejour')
        
        if not description:
            return jsonify({
                'success': False,
                'error': 'Description is required'
            }), 400
        
        # Analyse simple basée sur mots-clés
        positive_keywords = ['famille', 'enfant', 'français', 'emploi', 'cdi', 'intégration', 'mariage']
        negative_keywords = ['condamnation', 'trouble', 'fraude', 'irrégulier', 'expulsion']
        
        text_lower = description.lower()
        positive_count = sum(1 for kw in positive_keywords if kw in text_lower)
        negative_count = sum(1 for kw in negative_keywords if kw in text_lower)
        
        # Taux de base par procédure
        base_rates = {
            'titre_sejour': 78,
            'regroupement_familial': 65,
            'naturalisation': 82,
            'recours_oqtf': 35
        }
        
        base_rate = base_rates.get(procedure_type, 50)
        success_rate = base_rate + (positive_count * 5) - (negative_count * 10)
        success_rate = max(10, min(95, success_rate))
        
        analysis = {
            'success_probability': success_rate / 100,
            'confidence': 0.87,
            'procedure_type': procedure_type,
            'factors_positive': [
                kw for kw in positive_keywords if kw in text_lower
            ],
            'factors_negative': [
                kw for kw in negative_keywords if kw in text_lower
            ],
            'recommendations': [
                'Constituer un dossier complet avec tous les justificatifs',
                'Mettre en avant les éléments d\'intégration',
                'Préparer une argumentation solide sur les liens familiaux'
            ] if success_rate > 50 else [
                'Renforcer le dossier avec des éléments positifs supplémentaires',
                'Consulter un avocat spécialisé CESEDA',
                'Anticiper les objections de l\'administration'
            ],
            'urgency': 'ELEVEE' if 'oqtf' in text_lower or 'expulsion' in text_lower else 'NORMALE'
        }
        
        return jsonify({
            'success': True,
            'analysis': analysis
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# ==================== INVOICES ENDPOINTS ====================

@api_bp.route('/invoices', methods=['GET'])
@jwt_required()
def api_get_invoices():
    """Liste toutes les factures"""
    try:
        # Mock data
        invoices = [
            {
                'id': 1,
                'number': 'FAC-2025-0001',
                'client': 'M. Dupont',
                'amount_ht': 500.00,
                'amount_ttc': 600.00,
                'status': 'payee',
                'date': '2025-01-05T00:00:00'
            },
            {
                'id': 2,
                'number': 'FAC-2025-0002',
                'client': 'Mme Martin',
                'amount_ht': 750.00,
                'amount_ttc': 900.00,
                'status': 'en_attente',
                'date': '2025-01-10T00:00:00'
            }
        ]
        
        return jsonify({
            'success': True,
            'data': invoices,
            'total': len(invoices)
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@api_bp.route('/invoices', methods=['POST'])
@jwt_required()
def api_create_invoice():
    """
    Créer nouvelle facture
    
    Request:
        {
            "client": "M. Client",
            "amount_ht": 500.00,
            "description": "Consultation juridique"
        }
    """
    try:
        data = request.get_json()
        
        if not data.get('client') or not data.get('amount_ht'):
            return jsonify({
                'success': False,
                'error': 'Client and amount_ht are required'
            }), 400
        
        amount_ht = float(data['amount_ht'])
        amount_ttc = amount_ht * 1.20  # TVA 20%
        
        new_invoice = {
            'id': 3,
            'number': 'FAC-2025-0003',
            'client': data['client'],
            'description': data.get('description', ''),
            'amount_ht': amount_ht,
            'amount_ttc': amount_ttc,
            'status': 'en_attente',
            'date': datetime.now().isoformat()
        }
        
        return jsonify({
            'success': True,
            'data': new_invoice
        }), 201
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# ==================== ANALYTICS ENDPOINTS ====================

@api_bp.route('/analytics/summary', methods=['GET'])
@jwt_required()
def api_analytics_summary():
    """
    Résumé analytics
    
    Response:
        {
            "success": true,
            "data": {
                "cases_total": 156,
                "cases_urgent": 12,
                "success_rate": 87,
                "time_saved": 2494
            }
        }
    """
    try:
        summary = {
            'cases_total': 156,
            'cases_urgent': 12,
            'cases_analyzed': 1247,
            'success_rate': 87,
            'time_saved_hours': 2494,
            'roi_generated': 124700,
            'languages_supported': 10
        }
        
        return jsonify({
            'success': True,
            'data': summary
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# ==================== HEALTH CHECK ====================

@api_bp.route('/health', methods=['GET'])
def api_health():
    """Health check endpoint (pas de JWT requis)"""
    return jsonify({
        'success': True,
        'status': 'healthy',
        'version': '4.0.0-api',
        'timestamp': datetime.now().isoformat()
    }), 200
