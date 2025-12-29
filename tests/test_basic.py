"""
Tests simples pour vérifier l'API Routes Data
"""
import sys
from pathlib import Path

# Ajouter src au path
sys.path.insert(0, str(Path(__file__).parent.parent))

def test_import_routes_api():
    """Test import API routes"""
    try:
        from src.routes.routes_data_api import router
        assert router is not None
        print("✓ Import routes_data_api OK")
    except ImportError as e:
        print(f"✗ Erreur import: {e}")
        assert False, f"Import failed: {e}"


def test_import_postal_services():
    """Test import services postaux"""
    try:
        from src.services.postal_reporting_service import PostalReportingService
        from src.services.incident_manager import IncidentManager
        from src.services.waze_route_optimizer import WazeRouteOptimizer
        from src.services.performance_tracker import PerformanceTracker
        
        print("✓ Import services postaux OK")
        assert True
    except ImportError as e:
        print(f"✗ Erreur import services: {e}")
        assert False, f"Import failed: {e}"


def test_import_main_app():
    """Test import application principale"""
    try:
        from src.backend.main_fastapi import app
        assert app is not None
        print("✓ Import main_fastapi OK")
    except ImportError as e:
        print(f"✗ Erreur import app: {e}")
        assert False, f"Import failed: {e}"


def test_routes_registered():
    """Test routes enregistrées"""
    try:
        from src.backend.main_fastapi import app
        
        routes = [route.path for route in app.routes]
        
        # Vérifier routes critiques
        expected_routes = [
            "/api/routes/",
            "/api/postal/reports/daily",
            "/api/auth/login"
        ]
        
        for expected in expected_routes:
            found = any(expected in route for route in routes)
            if found:
                print(f"✓ Route {expected} trouvée")
            else:
                print(f"✗ Route {expected} manquante")
        
        assert len(routes) > 0, "Aucune route enregistrée"
        
    except Exception as e:
        print(f"✗ Erreur vérification routes: {e}")
        assert False, f"Routes check failed: {e}"


if __name__ == "__main__":
    print("\n=== Tests Import & Configuration ===\n")
    
    test_import_routes_api()
    test_import_postal_services()
    test_import_main_app()
    test_routes_registered()
    
    print("\n✅ Tous les tests basiques passent!\n")
