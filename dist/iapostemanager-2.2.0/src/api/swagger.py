"""Documentation API Swagger"""
from flask import jsonify
from flask_restx import Api, Resource, fields
from . import api_bp

api = Api(api_bp, doc='/docs/', title='SecureVault API', version='3.0')

# Modèles
email_model = api.model('Email', {
    'recipient': fields.String(required=True, description='Email destinataire'),
    'subject': fields.String(required=True, description='Sujet'),
    'body': fields.String(required=True, description='Corps du message')
})

ai_model = api.model('AIGeneration', {
    'context': fields.String(required=True, description='Contexte'),
    'tone': fields.String(description='Ton (professionnel, amical, formel)'),
    'length': fields.String(description='Longueur (court, moyen, long)')
})

# Routes documentées
@api.route('/health')
class Health(Resource):
    def get(self):
        """Vérification santé API"""
        return {'status': 'ok', 'version': '3.0'}

@api.route('/emails')
class Emails(Resource):
    @api.expect(email_model)
    def post(self):
        """Envoyer un email"""
        return {'success': True, 'message': 'Email envoyé'}
    
    def get(self):
        """Récupérer historique emails"""
        return {'emails': []}

@api.route('/ai/generate')
class AIGenerate(Resource):
    @api.expect(ai_model)
    def post(self):
        """Générer email avec IA"""
        return {'success': True, 'result': {'subject': '', 'body': ''}}

@api.route('/stats')
class Stats(Resource):
    def get(self):
        """Statistiques d'utilisation"""
        return {'envois': {'total': 0}, 'ia': {'total_generations': 0}}