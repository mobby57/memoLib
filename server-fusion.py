"""Serveur HTTP simple pour servir la fusion complète sur port 3001"""
import http.server
import socketserver
import os
import webbrowser
from threading import Timer

PORT = 3001
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()
    
    def do_GET(self):
        if self.path == '/' or self.path == '/index.html':
            self.path = '/interface-finale.html'
        return super().do_GET()

def open_browser():
    webbrowser.open(f'http://localhost:{PORT}')

if __name__ == "__main__":
    with socketserver.TCPServer(("", PORT), CustomHTTPRequestHandler) as httpd:
        print(f"Serveur de fusion demarre sur http://localhost:{PORT}")
        print(f"Repertoire: {DIRECTORY}")
        print(f"Ouverture automatique du navigateur...")
        
        # Ouvrir le navigateur après 2 secondes
        Timer(2.0, open_browser).start()
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServeur arrete")
            httpd.shutdown()