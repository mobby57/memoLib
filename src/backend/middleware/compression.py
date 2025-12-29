from flask import request, Response
import gzip
import io

class CompressionMiddleware:
    def __init__(self, app=None):
        if app:
            self.init_app(app)
    
    def init_app(self, app):
        app.after_request(self.compress_response)
    
    def compress_response(self, response):
        accept_encoding = request.headers.get('Accept-Encoding', '')
        
        if ('gzip' not in accept_encoding.lower() or 
            not response.data or 
            len(response.data) < 500 or
            'Content-Encoding' in response.headers):
            return response
        
        gzip_buffer = io.BytesIO()
        with gzip.GzipFile(fileobj=gzip_buffer, mode='wb') as gzip_file:
            gzip_file.write(response.data)
        
        response.data = gzip_buffer.getvalue()
        response.headers['Content-Encoding'] = 'gzip'
        response.headers['Content-Length'] = len(response.data)
        
        return response