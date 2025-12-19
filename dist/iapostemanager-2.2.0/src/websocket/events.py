"""WebSocket events with Socket.IO"""
from flask_socketio import SocketIO, emit, join_room

socketio = SocketIO(cors_allowed_origins="*")

@socketio.on('connect')
def handle_connect():
    emit('connected', {'message': 'Connected'})

@socketio.on('join')
def handle_join(data):
    join_room(data.get('room'))
    emit('joined', {'room': data.get('room')})

def notify_email_sent(user_id, email_id, status):
    socketio.emit('email_sent', {'email_id': email_id, 'status': status}, room=str(user_id))
