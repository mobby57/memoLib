"""
🆓 OpenRouteService - Alternative GRATUITE à Google Maps
Calcul d'itinéraires, géocodage, optimisation de tournées
2000 requêtes/jour gratuitement
"""

import os
import requests
from typing import List, Dict, Tuple, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class OpenRouteService:
    """Service gratuit de calcul d'itinéraires et géocodage"""
    
    def __init__(self):
        self.api_key = os.getenv("OPENROUTE_API_KEY", "")
        self.base_url = "https://api.openrouteservice.org"
        
        if not self.api_key:
            logger.warning("⚠️ OPENROUTE_API_KEY non configurée. Utilisez le mode démo limité.")
            logger.info("📝 Obtenez une clé gratuite sur: https://openrouteservice.org/dev/#/signup")
    
    def geocode_address(self, address: str) -> Optional[Dict]:
        """
        Convertit une adresse en coordonnées GPS (GRATUIT)
        
        Args:
            address: Adresse complète
            
        Returns:
            {"lat": float, "lon": float, "formatted_address": str}
        """
        if not self.api_key:
            return self._demo_geocode(address)
        
        url = f"{self.base_url}/geocode/search"
        headers = {"Authorization": self.api_key}
        params = {"text": address, "size": 1}
        
        try:
            response = requests.get(url, headers=headers, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            if data.get("features"):
                feature = data["features"][0]
                coords = feature["geometry"]["coordinates"]
                
                return {
                    "lat": coords[1],
                    "lon": coords[0],
                    "formatted_address": feature["properties"]["label"]
                }
            
            logger.warning(f"Adresse non trouvée: {address}")
            return None
            
        except Exception as e:
            logger.error(f"Erreur géocodage: {e}")
            return None
    
    def calculate_route(
        self, 
        start: Tuple[float, float], 
        end: Tuple[float, float],
        profile: str = "driving-car"
    ) -> Optional[Dict]:
        """
        Calcule l'itinéraire entre 2 points (GRATUIT)
        
        Args:
            start: (latitude, longitude) départ
            end: (latitude, longitude) arrivée
            profile: driving-car, cycling-regular, foot-walking
            
        Returns:
            {
                "distance": float (mètres),
                "duration": float (secondes),
                "geometry": str (encoded polyline),
                "instructions": List[str]
            }
        """
        if not self.api_key:
            return self._demo_route(start, end)
        
        url = f"{self.base_url}/v2/directions/{profile}"
        headers = {
            "Authorization": self.api_key,
            "Content-Type": "application/json"
        }
        
        body = {
            "coordinates": [
                [start[1], start[0]],  # lon, lat
                [end[1], end[0]]
            ]
        }
        
        try:
            response = requests.post(url, headers=headers, json=body, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            route = data["routes"][0]
            
            return {
                "distance": route["summary"]["distance"],
                "duration": route["summary"]["duration"],
                "geometry": route["geometry"],
                "instructions": [
                    step["instruction"] 
                    for segment in route["segments"]
                    for step in segment["steps"]
                ]
            }
            
        except Exception as e:
            logger.error(f"Erreur calcul route: {e}")
            return None
    
    def optimize_route(
        self, 
        locations: List[Tuple[float, float]],
        start_index: int = 0
    ) -> Optional[Dict]:
        """
        Optimise une tournée multi-points (TSP - GRATUIT)
        
        Args:
            locations: Liste de (lat, lon) à visiter
            start_index: Index du point de départ
            
        Returns:
            {
                "order": List[int],  # Ordre optimal
                "total_distance": float,
                "total_duration": float
            }
        """
        if not self.api_key:
            return self._demo_optimization(locations)
        
        url = f"{self.base_url}/optimization"
        headers = {
            "Authorization": self.api_key,
            "Content-Type": "application/json"
        }
        
        # Convertir en format OpenRouteService
        jobs = [
            {"id": i, "location": [loc[1], loc[0]]}
            for i, loc in enumerate(locations)
        ]
        
        vehicles = [{
            "id": 1,
            "profile": "driving-car",
            "start": [locations[start_index][1], locations[start_index][0]],
            "end": [locations[start_index][1], locations[start_index][0]]
        }]
        
        body = {
            "jobs": jobs,
            "vehicles": vehicles
        }
        
        try:
            response = requests.post(url, headers=headers, json=body, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            route = data["routes"][0]
            
            return {
                "order": [step["id"] for step in route["steps"] if step["type"] == "job"],
                "total_distance": route["distance"],
                "total_duration": route["duration"]
            }
            
        except Exception as e:
            logger.error(f"Erreur optimisation: {e}")
            return None
    
    def calculate_matrix(
        self, 
        locations: List[Tuple[float, float]]
    ) -> Optional[Dict]:
        """
        Calcule la matrice de distances/durées (GRATUIT)
        
        Args:
            locations: Liste de (lat, lon)
            
        Returns:
            {
                "distances": List[List[float]],  # Matrice distances (mètres)
                "durations": List[List[float]]   # Matrice durées (secondes)
            }
        """
        if not self.api_key:
            return self._demo_matrix(locations)
        
        url = f"{self.base_url}/v2/matrix/driving-car"
        headers = {
            "Authorization": self.api_key,
            "Content-Type": "application/json"
        }
        
        body = {
            "locations": [[loc[1], loc[0]] for loc in locations],
            "metrics": ["distance", "duration"]
        }
        
        try:
            response = requests.post(url, headers=headers, json=body, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            
            return {
                "distances": data["distances"],
                "durations": data["durations"]
            }
            
        except Exception as e:
            logger.error(f"Erreur matrice: {e}")
            return None
    
    # ========== Mode DÉMO (sans clé API) ==========
    
    def _demo_geocode(self, address: str) -> Dict:
        """Géocodage démo pour tests"""
        logger.info("🎭 Mode DÉMO - Géocodage simulé")
        # Paris par défaut
        return {
            "lat": 48.8566,
            "lon": 2.3522,
            "formatted_address": f"📍 {address} (DEMO)"
        }
    
    def _demo_route(self, start: Tuple, end: Tuple) -> Dict:
        """Route démo pour tests"""
        logger.info("🎭 Mode DÉMO - Route simulée")
        # Distance approximative (crow flies * 1.3)
        import math
        
        lat1, lon1 = start
        lat2, lon2 = end
        
        # Formule de Haversine simplifiée
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * \
            math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        distance = 6371000 * c * 1.3  # Rayon terre * facteur route
        
        return {
            "distance": distance,
            "duration": distance / 13.89,  # ~50 km/h
            "geometry": "",
            "instructions": ["Route démo - Obtenez une clé OpenRouteService gratuite"]
        }
    
    def _demo_optimization(self, locations: List) -> Dict:
        """Optimisation démo"""
        logger.info("🎭 Mode DÉMO - Optimisation simulée")
        return {
            "order": list(range(len(locations))),
            "total_distance": len(locations) * 5000,
            "total_duration": len(locations) * 600
        }
    
    def _demo_matrix(self, locations: List) -> Dict:
        """Matrice démo"""
        logger.info("🎭 Mode DÉMO - Matrice simulée")
        n = len(locations)
        return {
            "distances": [[5000.0] * n for _ in range(n)],
            "durations": [[360.0] * n for _ in range(n)]
        }


# Instance globale
openroute = OpenRouteService()


# ========== Exemples d'utilisation ==========

async def example_usage():
    """Exemples d'utilisation du service gratuit"""
    
    # 1. Géocodage d'une adresse
    result = openroute.geocode_address("1 Rue de Rivoli, Paris")
    print(f"Coordonnées: {result}")
    
    # 2. Calcul d'itinéraire
    route = openroute.calculate_route(
        start=(48.8566, 2.3522),  # Paris
        end=(48.8606, 2.3376)     # Arc de Triomphe
    )
    print(f"Distance: {route['distance']}m, Durée: {route['duration']}s")
    
    # 3. Optimisation de tournée
    delivery_points = [
        (48.8566, 2.3522),  # Point 1
        (48.8606, 2.3376),  # Point 2
        (48.8584, 2.2945),  # Point 3
        (48.8738, 2.2950),  # Point 4
    ]
    
    optimized = openroute.optimize_route(delivery_points)
    print(f"Ordre optimal: {optimized['order']}")
    print(f"Distance totale: {optimized['total_distance']}m")


if __name__ == "__main__":
    import asyncio
    asyncio.run(example_usage())
