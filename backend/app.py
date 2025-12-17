"""
IAPosteManager Backend Application
Flask-based REST API for automated email sending with AI generation
"""
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_restful import Api, Resource
from dotenv import load_dotenv
import logging
from datetime import datetime

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max request size

# Enable CORS for frontend
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Initialize API
api = Api(app)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# Import modules
from security import encrypt_data, decrypt_data
from email_service import EmailService
from ai_generator import AIGenerator

# Initialize services
email_service = EmailService()
ai_generator = AIGenerator()


class HealthCheck(Resource):
    """Health check endpoint"""
    def get(self):
        return {
            'status': 'healthy',
            'timestamp': datetime.utcnow().isoformat(),
            'version': '2.2.0'
        }


class EmailSend(Resource):
    """Send email endpoint"""
    def post(self):
        try:
            data = request.get_json()
            
            # Validate required fields
            required_fields = ['to', 'subject', 'body']
            for field in required_fields:
                if field not in data:
                    return {'error': f'Missing required field: {field}'}, 400
            
            # Send email
            result = email_service.send_email(
                to=data['to'],
                subject=data['subject'],
                body=data['body'],
                from_email=data.get('from')
            )
            
            logger.info(f"Email sent successfully to {data['to']}")
            return {'success': True, 'message': 'Email sent successfully', 'data': result}, 200
            
        except Exception as e:
            logger.error(f"Error sending email: {str(e)}")
            return {'error': str(e)}, 500


class AIGenerate(Resource):
    """AI text generation endpoint"""
    def post(self):
        try:
            data = request.get_json()
            
            if 'prompt' not in data:
                return {'error': 'Missing required field: prompt'}, 400
            
            # Generate text
            generated_text = ai_generator.generate(
                prompt=data['prompt'],
                max_tokens=data.get('max_tokens', 500),
                temperature=data.get('temperature', 0.7)
            )
            
            logger.info(f"AI text generated successfully")
            return {'success': True, 'text': generated_text}, 200
            
        except Exception as e:
            logger.error(f"Error generating text: {str(e)}")
            return {'error': str(e)}, 500


class DataEncrypt(Resource):
    """Encrypt sensitive data endpoint"""
    def post(self):
        try:
            data = request.get_json()
            
            if 'data' not in data:
                return {'error': 'Missing required field: data'}, 400
            
            encrypted = encrypt_data(data['data'])
            
            return {'success': True, 'encrypted': encrypted}, 200
            
        except Exception as e:
            logger.error(f"Error encrypting data: {str(e)}")
            return {'error': str(e)}, 500


class DataDecrypt(Resource):
    """Decrypt sensitive data endpoint"""
    def post(self):
        try:
            data = request.get_json()
            
            if 'encrypted' not in data:
                return {'error': 'Missing required field: encrypted'}, 400
            
            decrypted = decrypt_data(data['encrypted'])
            
            return {'success': True, 'data': decrypted}, 200
            
        except Exception as e:
            logger.error(f"Error decrypting data: {str(e)}")
            return {'error': str(e)}, 500


class VoiceTranscribe(Resource):
    """Voice transcription endpoint"""
    def post(self):
        try:
            # This would integrate with a speech-to-text service
            # For now, return a mock response
            return {
                'success': True,
                'text': 'Voice transcription feature - integrate with speech API',
                'confidence': 0.95
            }, 200
            
        except Exception as e:
            logger.error(f"Error transcribing voice: {str(e)}")
            return {'error': str(e)}, 500


# Register API endpoints
api.add_resource(HealthCheck, '/api/health')
api.add_resource(EmailSend, '/api/email/send')
api.add_resource(AIGenerate, '/api/ai/generate')
api.add_resource(DataEncrypt, '/api/security/encrypt')
api.add_resource(DataDecrypt, '/api/security/decrypt')
api.add_resource(VoiceTranscribe, '/api/voice/transcribe')


@app.route('/api/docs')
def api_docs():
    """API documentation endpoint"""
    docs = {
        'version': '2.2.0',
        'title': 'IAPosteManager API',
        'description': 'REST API for automated email sending with AI generation',
        'endpoints': [
            {
                'path': '/api/health',
                'method': 'GET',
                'description': 'Health check endpoint',
                'response': {'status': 'healthy', 'timestamp': 'ISO8601', 'version': 'string'}
            },
            {
                'path': '/api/email/send',
                'method': 'POST',
                'description': 'Send an email',
                'body': {
                    'to': 'recipient@example.com',
                    'subject': 'Email subject',
                    'body': 'Email body',
                    'from': 'sender@example.com (optional)'
                },
                'response': {'success': True, 'message': 'string', 'data': {}}
            },
            {
                'path': '/api/ai/generate',
                'method': 'POST',
                'description': 'Generate text using AI',
                'body': {
                    'prompt': 'Your prompt here',
                    'max_tokens': 500,
                    'temperature': 0.7
                },
                'response': {'success': True, 'text': 'generated text'}
            },
            {
                'path': '/api/security/encrypt',
                'method': 'POST',
                'description': 'Encrypt data using AES-256',
                'body': {'data': 'data to encrypt'},
                'response': {'success': True, 'encrypted': 'encrypted string'}
            },
            {
                'path': '/api/security/decrypt',
                'method': 'POST',
                'description': 'Decrypt data using AES-256',
                'body': {'encrypted': 'encrypted string'},
                'response': {'success': True, 'data': 'decrypted data'}
            },
            {
                'path': '/api/voice/transcribe',
                'method': 'POST',
                'description': 'Transcribe voice to text',
                'response': {'success': True, 'text': 'transcribed text', 'confidence': 0.95}
            }
        ]
    }
    return jsonify(docs)


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=os.getenv('DEBUG', 'False') == 'True')
