"""
Flask App - Production Mode (No Debug)
Pour les tests stables sans auto-reload
Utilise Waitress WSGI server pour plus de stabilité
"""
import os
import sys
import logging
import signal
import time

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Add paths
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))
sys.path.insert(0, os.path.dirname(__file__))

# Import from main app
from backend.app_postgres import create_app, db_service

# Global variable for graceful shutdown
app_instance = None
server_running = True

def signal_handler(sig, frame):
    """Handle CTRL+C gracefully"""
    global server_running
    logger.info("\n\n⏹️  Shutting down server gracefully...")
    server_running = False
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)

if __name__ == '__main__':
    try:
        logger.info("Starting IA Poste Manager API Server...")
        
        # Create Flask app
        app_instance = create_app()
        
        # Test database connection
        logger.info("Testing database connection...")
        if not db_service.health_check():
            logger.error("❌ Database connection failed!")
            logger.error("Please check your DATABASE_URL in .env file")
            sys.exit(1)
        
        logger.info("✅ Database connection successful")
        
        print("\n" + "="*60)
        print("🚀 IA POSTE MANAGER - Production API Server")
        print("="*60)
        print("\n📡 Server Information:")
        print("   • Mode: PRODUCTION (No auto-reload)")
        print("   • URL: http://localhost:5000")
        print("   • Health: http://localhost:5000/api/v2/health")
        print("   • Documentation: http://localhost:5000/")
        print("\n⌨️  Press CTRL+C to stop")
        print("="*60 + "\n")
        
        # Try to use Waitress if available, fallback to Flask dev server
        try:
            from waitress import serve
            logger.info("Using Waitress WSGI server (production-ready)")
            serve(app_instance, host='0.0.0.0', port=5000, threads=6)
        except ImportError:
            logger.warning("Waitress not found, using Flask development server")
            logger.warning("For production, install: pip install waitress")
            app_instance.run(host='0.0.0.0', port=5000, debug=False, threaded=True, use_reloader=False)
        
    except KeyboardInterrupt:
        logger.info("\n⏹️  Server stopped by user")
        sys.exit(0)
    except Exception as e:
        logger.error(f"❌ Failed to start server: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
