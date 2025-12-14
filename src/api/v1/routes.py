"""API v1 Routes"""
from flask import jsonify, request
from . import api_v1
from src.core.jwt_manager import jwt_manager
from src.core.rate_limiter import rate_limiter
from src.core.cache_manager import cache

@api_v1.route('/health')
@rate_limiter.limit('api')
def health():
    return jsonify({'status': 'ok', 'version': 'v1'})

@api_v1.route('/auth/login', methods=['POST'])
@rate_limiter.limit('auth')
def login():
    data = request.get_json()
    # TODO: Implement real authentication
    user_id = 1
    
    access_token = jwt_manager.create_access_token(user_id)
    refresh_token = jwt_manager.create_refresh_token(user_id)
    
    return jsonify({
        'access_token': access_token,
        'refresh_token': refresh_token,
        'token_type': 'Bearer'
    })

@api_v1.route('/auth/refresh', methods=['POST'])
@rate_limiter.limit('auth')
def refresh():
    data = request.get_json()
    refresh_token = data.get('refresh_token')
    
    payload = jwt_manager.verify_token(refresh_token, 'refresh')
    if not payload:
        return jsonify({'error': 'Invalid refresh token'}), 401
    
    access_token = jwt_manager.create_access_token(payload['user_id'])
    return jsonify({'access_token': access_token})

@api_v1.route('/protected')
@jwt_manager.require_auth
@rate_limiter.limit('api')
def protected():
    return jsonify({'message': 'Protected resource', 'user_id': request.user_id})

@api_v1.route('/emails')
@jwt_manager.require_auth
@rate_limiter.limit('api')
def get_emails():
    # TODO: Implement real email fetching
    return jsonify({'emails': []})
