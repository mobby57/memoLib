"""
API Routes for Workspace Management
"""

from flask import Blueprint, request, jsonify
from typing import Dict, Any
import asyncio
import logging

from ..services.workspace_service import WorkspaceService, WorkspaceType
from ..services.security import SecurityService

logger = logging.getLogger(__name__)

# Create blueprint
workspace_bp = Blueprint('workspace', __name__, url_prefix='/api/workspace')

# Initialize services
workspace_service = WorkspaceService()
security_service = SecurityService()

@workspace_bp.route('/create', methods=['POST'])
def create_workspace():
    """Create new workspace"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['email_content', 'email_subject', 'email_sender']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing field: {field}'}), 400
        
        # Create workspace
        workspace = asyncio.run(workspace_service.create_workspace(
            email_content=data['email_content'],
            email_subject=data['email_subject'],
            email_sender=data['email_sender'],
            workspace_type=WorkspaceType(data.get('workspace_type', 'general')),
            user_id=data.get('user_id'),
            user_plan=data.get('user_plan', 'FREE'),
            language=data.get('language', 'fr'),
            accessibility_mode=data.get('accessibility_mode')
        ))
        
        return jsonify(workspace), 201
        
    except Exception as e:
        logger.error(f"Error creating workspace: {str(e)}")
        return jsonify({'error': str(e)}), 500

@workspace_bp.route('/<workspace_id>', methods=['GET'])
def get_workspace(workspace_id: str):
    """Get workspace by ID"""
    try:
        workspace = asyncio.run(workspace_service.get_workspace(workspace_id))
        
        if not workspace:
            return jsonify({'error': 'Workspace not found'}), 404
        
        return jsonify(workspace), 200
        
    except Exception as e:
        logger.error(f"Error getting workspace: {str(e)}")
        return jsonify({'error': str(e)}), 500

@workspace_bp.route('/<workspace_id>/process', methods=['PUT'])
def process_workspace(workspace_id: str):
    """Process workspace action"""
    try:
        data = request.get_json()
        
        if 'action' not in data:
            return jsonify({'error': 'Missing action field'}), 400
        
        result = asyncio.run(workspace_service.process_workspace(
            workspace_id=workspace_id,
            action=data['action'],
            parameters=data.get('parameters', {})
        ))
        
        return jsonify(result), 200
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 404
    except Exception as e:
        logger.error(f"Error processing workspace: {str(e)}")
        return jsonify({'error': str(e)}), 500

@workspace_bp.route('/list', methods=['GET'])
def list_workspaces():
    """List workspaces with filters"""
    try:
        user_id = request.args.get('user_id')
        status = request.args.get('status')
        workspace_type = request.args.get('type')
        
        workspaces = asyncio.run(workspace_service.list_workspaces(
            user_id=user_id,
            status=status,
            workspace_type=workspace_type
        ))
        
        return jsonify({'workspaces': workspaces}), 200
        
    except Exception as e:
        logger.error(f"Error listing workspaces: {str(e)}")
        return jsonify({'error': str(e)}), 500

@workspace_bp.route('/<workspace_id>', methods=['DELETE'])
def delete_workspace(workspace_id: str):
    """Delete workspace"""
    try:
        success = asyncio.run(workspace_service.delete_workspace(workspace_id))
        
        if not success:
            return jsonify({'error': 'Workspace not found'}), 404
        
        return jsonify({'message': 'Workspace deleted successfully'}), 200
        
    except Exception as e:
        logger.error(f"Error deleting workspace: {str(e)}")
        return jsonify({'error': str(e)}), 500

@workspace_bp.route('/<workspace_id>/metrics', methods=['GET'])
def get_workspace_metrics(workspace_id: str):
    """Get workspace metrics"""
    try:
        metrics = asyncio.run(workspace_service.get_workspace_metrics(workspace_id))
        
        if not metrics:
            return jsonify({'error': 'Workspace not found'}), 404
        
        return jsonify(metrics), 200
        
    except Exception as e:
        logger.error(f"Error getting metrics: {str(e)}")
        return jsonify({'error': str(e)}), 500