"""Démarrage optimisé de l'application"""
import os
import sys
from multiprocessing import freeze_support

# Optimisations Python
os.environ['PYTHONOPTIMIZE'] = '1'
os.environ['PYTHONDONTWRITEBYTECODE'] = '1'

def main():
    # Import différé pour accélérer le démarrage
    from src.web.app import app, socketio, HAS_SOCKETIO
    from src.web.performance_middleware import PerformanceMiddleware
    
    # Appliquer middleware de performance
    PerformanceMiddleware(app)
    
    # Configuration production
    app.config.update(
        SEND_FILE_MAX_AGE_DEFAULT=3600,
        TEMPLATES_AUTO_RELOAD=False,
        EXPLAIN_TEMPLATE_LOADING=False
    )
    
    print("🚀 IAPosteManager v2.2 - Démarrage optimisé")
    print("📊 Middleware de performance activé")
    print("🌐 http://127.0.0.1:5000")
    
    if HAS_SOCKETIO and socketio:
        socketio.run(app, debug=False, host='127.0.0.1', port=5000)
    else:
        app.run(debug=False, host='127.0.0.1', port=5000, threaded=True)

if __name__ == '__main__':
    freeze_support()
    main()