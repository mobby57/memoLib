"""WebSocket pour temps réel"""
from flask_socketio import SocketIO, emit, join_room, leave_room
import logging

logger = logging.getLogger(__name__)

class WebSocketManager:
    def __init__(self, app=None):
        self.socketio = None
        if app:
            self.init_app(app)
    
    def init_app(self, app):
        self.socketio = SocketIO(app, cors_allowed_origins="*")
        self._register_events()
    
    def _register_events(self):
        @self.socketio.on('connect')
        def handle_connect():
            logger.info(f"Client connecté: {request.sid}")
            emit('status', {'message': 'Connecté à SecureVault'})
        
        @self.socketio.on('disconnect')
        def handle_disconnect():
            logger.info(f"Client déconnecté: {request.sid}")
        
        @self.socketio.on('join_room')
        def handle_join_room(data):
            room = data['room']
            join_room(room)
            emit('status', {'message': f'Rejoint la room {room}'})
        
        @self.socketio.on('email_status')
        def handle_email_status(data):
            # Diffuser statut email en temps réel
            emit('email_update', data, broadcast=True)
    
    def notify_email_sent(self, email_data):
        """Notifier envoi email"""
        if self.socketio:
            self.socketio.emit('email_sent', {
                'recipient': email_data['recipient'],
                'subject': email_data['subject'],
                'timestamp': email_data['timestamp']
            })
    
    def notify_ai_generation(self, generation_data):
        """Notifier génération IA"""
        if self.socketio:
            self.socketio.emit('ai_generated', generation_data)