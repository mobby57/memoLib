"""
Tests API Routes Data
Tests complets pour routes_data_api.py
"""
import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timedelta
import sys
from pathlib import Path

# Ajouter src au path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from src.backend.main_fastapi import app

client = TestClient(app)


# ===== FIXTURES =====

@pytest.fixture
def auth_token():
    """Token authentification test"""
    # Créer utilisateur test
    response = client.post("/api/auth/register", json={
        "email": "test_routes@example.com",
        "password": "TestPass123!",
        "name": "Test Routes User"
    })
    
    # Login
    response = client.post("/api/auth/login", json={
        "email": "test_routes@example.com",
        "password": "TestPass123!"
    })
    
    if response.status_code == 200:
        return response.json()["access_token"]
    
    # Si user existe, login direct
    return response.json().get("access_token", "test_token")


@pytest.fixture
def test_route(auth_token):
    """Créer route test"""
    route_data = {
        "route_code": f"TEST_{datetime.now().timestamp()}",
        "area_code": "75001",
        "area_name": "Paris Test",
        "description": "Route test automatique",
        "estimated_duration": 120,
        "distance": 15.5
    }
    
    response = client.post(
        "/api/routes/",
        json=route_data,
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    
    if response.status_code == 201:
        return response.json()["route"]
    
    return None


# ===== TESTS CRUD =====

class TestRoutesCRUD:
    """Tests création, lecture, mise à jour, suppression"""
    
    def test_create_route_success(self, auth_token):
        """✅ Créer route avec succès"""
        route_data = {
            "route_code": f"R{int(datetime.now().timestamp())}",
            "area_code": "92100",
            "area_name": "Boulogne Test",
            "description": "Test route creation",
            "estimated_duration": 90,
            "distance": 12.3
        }
        
        response = client.post(
            "/api/routes/",
            json=route_data,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["status"] == "success"
        assert "route" in data
        assert data["route"]["route_code"] == route_data["route_code"]
    
    
    def test_create_route_duplicate_code(self, auth_token, test_route):
        """❌ Empêcher création route code dupliqué"""
        if not test_route:
            pytest.skip("Test route creation failed")
        
        duplicate_data = {
            "route_code": test_route["route_code"],
            "area_code": "75002",
            "area_name": "Another Area"
        }
        
        response = client.post(
            "/api/routes/",
            json=duplicate_data,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 409
        assert "already exists" in response.json()["detail"]
    
    
    def test_list_routes_without_stats(self, auth_token):
        """📋 Lister routes sans stats"""
        response = client.get(
            "/api/routes/?limit=10",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "routes" in data
        assert "total" in data
        assert isinstance(data["routes"], list)
    
    
    def test_list_routes_with_stats(self, auth_token):
        """📊 Lister routes avec statistiques"""
        response = client.get(
            "/api/routes/?with_stats=true&limit=5",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        if len(data["routes"]) > 0:
            route = data["routes"][0]
            assert "total_deliveries" in route
            assert "success_rate" in route
    
    
    def test_list_routes_filter_area(self, auth_token, test_route):
        """🔍 Filtrer routes par zone"""
        if not test_route:
            pytest.skip("Test route creation failed")
        
        response = client.get(
            f"/api/routes/?area_code={test_route['area_code']}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        for route in data["routes"]:
            assert route["area_code"] == test_route["area_code"]
    
    
    def test_list_routes_pagination(self, auth_token):
        """📄 Pagination routes"""
        # Page 1
        response1 = client.get(
            "/api/routes/?limit=2&offset=0",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        # Page 2
        response2 = client.get(
            "/api/routes/?limit=2&offset=2",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response1.status_code == 200
        assert response2.status_code == 200
        
        data1 = response1.json()
        data2 = response2.json()
        
        # Vérifier total identique
        if data1["total"] > 0:
            assert data1["total"] == data2["total"]
    
    
    def test_get_route_by_id(self, auth_token, test_route):
        """🔍 Récupérer route par ID"""
        if not test_route:
            pytest.skip("Test route creation failed")
        
        response = client.get(
            f"/api/routes/{test_route['id']}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["route"]["id"] == test_route["id"]
        assert data["route"]["route_code"] == test_route["route_code"]
    
    
    def test_get_route_with_stats(self, auth_token, test_route):
        """📊 Récupérer route avec stats"""
        if not test_route:
            pytest.skip("Test route creation failed")
        
        response = client.get(
            f"/api/routes/{test_route['id']}?with_stats=true",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "stats" in data["route"]
        assert "total_deliveries" in data["route"]["stats"]
    
    
    def test_get_route_not_found(self, auth_token):
        """❌ Route inexistante"""
        fake_id = "00000000-0000-0000-0000-000000000000"
        
        response = client.get(
            f"/api/routes/{fake_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
    
    
    def test_update_route_success(self, auth_token, test_route):
        """✏️ Mettre à jour route"""
        if not test_route:
            pytest.skip("Test route creation failed")
        
        update_data = {
            "estimated_duration": 150,
            "distance": 18.0,
            "description": "Updated description"
        }
        
        response = client.put(
            f"/api/routes/{test_route['id']}",
            json=update_data,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
    
    
    def test_update_route_partial(self, auth_token, test_route):
        """✏️ Mise à jour partielle"""
        if not test_route:
            pytest.skip("Test route creation failed")
        
        update_data = {
            "description": "Only description updated"
        }
        
        response = client.put(
            f"/api/routes/{test_route['id']}",
            json=update_data,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200
    
    
    def test_update_route_not_found(self, auth_token):
        """❌ Update route inexistante"""
        fake_id = "00000000-0000-0000-0000-000000000000"
        
        response = client.put(
            f"/api/routes/{fake_id}",
            json={"description": "test"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 404
    
    
    def test_delete_route_without_deliveries(self, auth_token):
        """🗑️ Supprimer route sans livraisons"""
        # Créer route temporaire
        route_data = {
            "route_code": f"DEL_{int(datetime.now().timestamp())}",
            "area_code": "99999",
            "area_name": "Temp Zone"
        }
        
        create_response = client.post(
            "/api/routes/",
            json=route_data,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        if create_response.status_code != 201:
            pytest.skip("Could not create test route")
        
        route_id = create_response.json()["route"]["id"]
        
        # Supprimer
        delete_response = client.delete(
            f"/api/routes/{route_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert delete_response.status_code == 200
        assert "deleted" in delete_response.json()["message"]
    
    
    def test_delete_route_not_found(self, auth_token):
        """❌ Supprimer route inexistante"""
        fake_id = "00000000-0000-0000-0000-000000000000"
        
        response = client.delete(
            f"/api/routes/{fake_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 404


# ===== TESTS ANALYTICS =====

class TestRoutesAnalytics:
    """Tests endpoints statistiques"""
    
    def test_stats_by_area(self, auth_token):
        """📊 Statistiques par zone"""
        response = client.get(
            "/api/routes/stats/by-area",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "areas" in data
        assert "total_areas" in data
        
        if len(data["areas"]) > 0:
            area = data["areas"][0]
            assert "area_code" in area
            assert "routes_count" in area
            assert "success_rate" in area
    
    
    def test_routes_performance_default_period(self, auth_token):
        """📈 Performance routes (30 jours)"""
        response = client.get(
            "/api/routes/stats/performance",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "period" in data
        assert "top_performers" in data
        assert "need_attention" in data
        assert data["period"]["days"] == 30
    
    
    def test_routes_performance_custom_period(self, auth_token):
        """📈 Performance routes (7 jours)"""
        response = client.get(
            "/api/routes/stats/performance?days=7",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["period"]["days"] == 7
    
    
    def test_routes_performance_validation(self, auth_token):
        """❌ Validation période performance"""
        # Trop long
        response = client.get(
            "/api/routes/stats/performance?days=400",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 422  # Validation error


# ===== TESTS RECHERCHE =====

class TestRoutesSearch:
    """Tests recherche routes"""
    
    def test_search_by_route_code(self, auth_token, test_route):
        """🔍 Recherche par code route"""
        if not test_route:
            pytest.skip("Test route creation failed")
        
        response = client.get(
            f"/api/routes/search?q={test_route['route_code'][:4]}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "routes" in data
    
    
    def test_search_by_area_name(self, auth_token):
        """🔍 Recherche par nom zone"""
        response = client.get(
            "/api/routes/search?q=Paris",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["query"] == "Paris"
    
    
    def test_search_with_limit(self, auth_token):
        """🔍 Recherche avec limite"""
        response = client.get(
            "/api/routes/search?q=R&limit=5",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["routes"]) <= 5
    
    
    def test_search_empty_query(self, auth_token):
        """❌ Recherche query vide"""
        response = client.get(
            "/api/routes/search?q=",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 422  # Validation error


# ===== TESTS AUTHENTIFICATION =====

class TestRoutesAuth:
    """Tests sécurité et authentification"""
    
    def test_create_route_no_token(self):
        """❌ Créer route sans token"""
        response = client.post(
            "/api/routes/",
            json={"route_code": "TEST", "area_code": "75001", "area_name": "Test"}
        )
        
        assert response.status_code == 401
    
    
    def test_list_routes_no_token(self):
        """❌ Lister routes sans token"""
        response = client.get("/api/routes/")
        
        assert response.status_code == 401
    
    
    def test_update_route_no_token(self):
        """❌ Update route sans token"""
        response = client.put(
            "/api/routes/some_id",
            json={"description": "test"}
        )
        
        assert response.status_code == 401
    
    
    def test_delete_route_no_token(self):
        """❌ Supprimer route sans token"""
        response = client.delete("/api/routes/some_id")
        
        assert response.status_code == 401


# ===== TESTS VALIDATION =====

class TestRoutesValidation:
    """Tests validation données"""
    
    def test_create_route_missing_fields(self, auth_token):
        """❌ Créer route champs manquants"""
        incomplete_data = {
            "route_code": "TEST"
            # Manque area_code, area_name
        }
        
        response = client.post(
            "/api/routes/",
            json=incomplete_data,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 422
    
    
    def test_update_route_empty_body(self, auth_token, test_route):
        """❌ Update avec body vide"""
        if not test_route:
            pytest.skip("Test route creation failed")
        
        response = client.put(
            f"/api/routes/{test_route['id']}",
            json={},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 400
        assert "No fields to update" in response.json()["detail"]
    
    
    def test_list_routes_invalid_limit(self, auth_token):
        """❌ Limite invalide"""
        response = client.get(
            "/api/routes/?limit=1000",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 422


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
