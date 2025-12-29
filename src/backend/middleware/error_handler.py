from flask import jsonify, request
import traceback
import logging

class ErrorHandler:
    def __init__(self, app=None):
        if app:
            self.init_app(app)
    
    def init_app(self, app):
        app.errorhandler(400)(self.bad_request)
        app.errorhandler(401)(self.unauthorized)
        app.errorhandler(403)(self.forbidden)
        app.errorhandler(404)(self.not_found)
        app.errorhandler(500)(self.internal_error)
        app.errorhandler(Exception)(self.handle_exception)
    
    def bad_request(self, error):
        return jsonify({'error': 'Bad request', 'message': str(error)}), 400
    
    def unauthorized(self, error):
        return jsonify({'error': 'Unauthorized'}), 401
    
    def forbidden(self, error):
        return jsonify({'error': 'Forbidden'}), 403
    
    def not_found(self, error):
        return jsonify({'error': 'Not found'}), 404
    
    def internal_error(self, error):
        logging.error(f"Internal error: {error}")
        return jsonify({'error': 'Internal server error'}), 500
    
    def handle_exception(self, error):
        logging.error(f"Unhandled exception: {error}\n{traceback.format_exc()}")
        return jsonify({'error': 'Server error', 'type': type(error).__name__}), 500