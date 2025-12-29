from flask import Blueprint, request, jsonify
from backend.models import db, User, Workspace, EmailTemplate, EmailCampaign
from backend.services.workspace_manager import WorkspaceManager
from backend.ai.intelligent_analyzer import IntelligentAnalyzer
import jwt
import os

api = Blueprint('api', __name__, url_prefix='/api')
workspace_manager = WorkspaceManager()
analyzer = IntelligentAnalyzer()

@api.route('/workspaces', methods=['GET'])
def get_workspaces():
    workspaces = Workspace.query.all()
    return jsonify([{
        'id': w.id,
        'name': w.name,
        'description': w.description,
        'created_at': w.created_at.isoformat()
    } for w in workspaces])

@api.route('/workspaces', methods=['POST'])
def create_workspace():
    data = request.get_json()
    workspace = Workspace(
        name=data['name'],
        description=data.get('description', ''),
        user_id=1,  # Default user for demo
        settings=data.get('settings', {})
    )
    db.session.add(workspace)
    db.session.commit()
    
    return jsonify({
        'id': workspace.id,
        'name': workspace.name,
        'message': 'Workspace created successfully'
    }), 201

@api.route('/templates', methods=['GET'])
def get_templates():
    templates = EmailTemplate.query.all()
    return jsonify([{
        'id': t.id,
        'name': t.name,
        'subject': t.subject,
        'content': t.content[:100] + '...' if len(t.content) > 100 else t.content
    } for t in templates])

@api.route('/templates', methods=['POST'])
def create_template():
    data = request.get_json()
    template = EmailTemplate(
        name=data['name'],
        subject=data['subject'],
        content=data['content'],
        workspace_id=data.get('workspace_id', 1)
    )
    db.session.add(template)
    db.session.commit()
    
    return jsonify({
        'id': template.id,
        'message': 'Template created successfully'
    }), 201

@api.route('/ai/analyze', methods=['POST'])
def analyze_email():
    data = request.get_json()
    email_content = data.get('content', '')
    
    try:
        analysis = analyzer.analyze_email_content(email_content)
        return jsonify(analysis)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/ai/generate', methods=['POST'])
def generate_email():
    data = request.get_json()
    prompt = data.get('prompt', '')
    
    try:
        generated = workspace_manager.generate_email_with_ai(prompt)
        return jsonify({'content': generated})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/campaigns', methods=['GET'])
def get_campaigns():
    campaigns = EmailCampaign.query.all()
    return jsonify([{
        'id': c.id,
        'name': c.name,
        'status': c.status,
        'created_at': c.created_at.isoformat()
    } for c in campaigns])

@api.route('/campaigns', methods=['POST'])
def create_campaign():
    data = request.get_json()
    campaign = EmailCampaign(
        name=data['name'],
        template_id=data.get('template_id'),
        workspace_id=data.get('workspace_id', 1),
        status='draft'
    )
    db.session.add(campaign)
    db.session.commit()
    
    return jsonify({
        'id': campaign.id,
        'message': 'Campaign created successfully'
    }), 201