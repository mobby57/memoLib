from flask_socketio import SocketIO, emit
import json

class WebSocketManager:
    def __init__(self, app=None):
        self.socketio = None
        if app:
            self.init_app(app)
    
    def init_app(self, app):
        self.socketio = SocketIO(app, cors_allowed_origins="*")
        
        @self.socketio.on('connect')
        def handle_connect():
            emit('status', {'message': 'Connected to IA Poste Manager'})
        
        @self.socketio.on('subscribe_metrics')
        def handle_metrics_subscription():
            emit('metrics_subscribed', {'status': 'subscribed'})
    
    def broadcast_metrics(self, metrics):
        if self.socketio:
            self.socketio.emit('metrics_update', metrics)
    
    def notify_user(self, user_id, message):
        if self.socketio:
            self.socketio.emit('notification', {
                'user_id': user_id,
                'message': message
            })