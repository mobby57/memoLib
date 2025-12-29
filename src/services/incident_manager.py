"""
Service Gestion Incidents - Real-time Issue Resolution
Priorisation automatique, reroutage, escalation
"""
import asyncio
from datetime import datetime
from typing import Dict, List, Optional
from dataclasses import dataclass
from enum import Enum
from sqlalchemy import text
from src.backend.database import get_db_connection


class IncidentType(Enum):
    """Types d'incidents"""
    ROAD_CLOSURE = "road_closure"
    TRAFFIC_JAM = "traffic_jam"
    MISSING_PACKAGE = "missing_package"
    WRONG_ADDRESS = "wrong_address"
    RECIPIENT_ABSENT = "recipient_absent"
    VEHICLE_ISSUE = "vehicle_issue"
    WEATHER_DELAY = "weather_delay"
    SAFETY_CONCERN = "safety_concern"
    OTHER = "other"


class IncidentSeverity(Enum):
    """Niveaux de sévérité"""
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    CRITICAL = 4


@dataclass
class Incident:
    """Incident postal"""
    id: str
    postman_id: str
    delivery_id: Optional[str]
    route_id: Optional[str]
    type: IncidentType
    severity: IncidentSeverity
    title: str
    description: str
    latitude: Optional[float]
    longitude: Optional[float]
    status: str
    created_at: datetime


class IncidentManager:
    """Gestionnaire d'incidents temps réel"""
    
    def __init__(self, waze_optimizer=None):
        self.waze_optimizer = waze_optimizer
        self.active_incidents: Dict[str, Incident] = {}
    
    async def report_incident(
        self,
        postman_id: str,
        incident_type: IncidentType,
        title: str,
        description: str,
        delivery_id: Optional[str] = None,
        route_id: Optional[str] = None,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None
    ) -> Incident:
        """
        🚨 Signaler nouvel incident
        
        Workflow:
        1. Créer incident en DB
        2. Calculer sévérité automatique
        3. Prioriser selon règles
        4. Appliquer actions automatiques (reroutage, notifications)
        """
        # Calculer sévérité automatique
        severity = self._calculate_severity(incident_type, description)
        
        # Créer incident en DB
        async with get_db_connection() as conn:
            query = text("""
                INSERT INTO incidents (
                    postman_id, delivery_id, route_id,
                    type, severity, status,
                    title, description,
                    latitude, longitude,
                    created_at
                )
                VALUES (
                    :postman_id, :delivery_id, :route_id,
                    :type, :severity, 'OPEN',
                    :title, :description,
                    :latitude, :longitude,
                    :created_at
                )
                RETURNING id
            """)
            
            result = await conn.execute(query, {
                "postman_id": postman_id,
                "delivery_id": delivery_id,
                "route_id": route_id,
                "type": incident_type.value,
                "severity": severity.name,
                "title": title,
                "description": description,
                "latitude": latitude,
                "longitude": longitude,
                "created_at": datetime.now()
            })
            
            incident_id = result.fetchone()[0]
        
        incident = Incident(
            id=incident_id,
            postman_id=postman_id,
            delivery_id=delivery_id,
            route_id=route_id,
            type=incident_type,
            severity=severity,
            title=title,
            description=description,
            latitude=latitude,
            longitude=longitude,
            status="OPEN",
            created_at=datetime.now()
        )
        
        # Stocker en mémoire pour traitement rapide
        self.active_incidents[incident_id] = incident
        
        # Actions automatiques selon sévérité
        await self._handle_incident_automatically(incident)
        
        return incident
    
    def _calculate_severity(self, incident_type: IncidentType, description: str) -> IncidentSeverity:
        """
        Calcul automatique sévérité
        
        Règles:
        - CRITICAL: safety_concern, vehicle_issue
        - HIGH: road_closure, traffic_jam avec urgence
        - MEDIUM: missing_package, wrong_address
        - LOW: recipient_absent
        """
        # Règles par type
        severity_rules = {
            IncidentType.SAFETY_CONCERN: IncidentSeverity.CRITICAL,
            IncidentType.VEHICLE_ISSUE: IncidentSeverity.CRITICAL,
            IncidentType.ROAD_CLOSURE: IncidentSeverity.HIGH,
            IncidentType.TRAFFIC_JAM: IncidentSeverity.MEDIUM,
            IncidentType.MISSING_PACKAGE: IncidentSeverity.MEDIUM,
            IncidentType.WRONG_ADDRESS: IncidentSeverity.MEDIUM,
            IncidentType.RECIPIENT_ABSENT: IncidentSeverity.LOW,
            IncidentType.WEATHER_DELAY: IncidentSeverity.MEDIUM,
        }
        
        base_severity = severity_rules.get(incident_type, IncidentSeverity.MEDIUM)
        
        # Escalade si mots-clés urgents dans description
        urgent_keywords = ["urgent", "bloqué", "danger", "accident", "critique"]
        if any(keyword in description.lower() for keyword in urgent_keywords):
            if base_severity.value < IncidentSeverity.HIGH.value:
                base_severity = IncidentSeverity.HIGH
        
        return base_severity
    
    async def _handle_incident_automatically(self, incident: Incident):
        """
        🤖 Actions automatiques selon sévérité
        
        CRITICAL:
        - Notification management immédiate
        - Reroutage automatique si route_id
        - Appel téléphonique facteur
        
        HIGH:
        - Reroutage automatique
        - Notification superviseur
        
        MEDIUM:
        - Suggestion reroutage
        - Notification facteur
        
        LOW:
        - Log seulement
        """
        if incident.severity == IncidentSeverity.CRITICAL:
            # Notification management
            await self._notify_management(incident)
            
            # Reroutage immédiat
            if incident.route_id and self.waze_optimizer:
                await self._apply_automatic_reroute(incident)
            
            # TODO: Appel téléphonique facteur
            print(f"📞 Appel automatique facteur {incident.postman_id}")
        
        elif incident.severity == IncidentSeverity.HIGH:
            # Reroutage automatique
            if incident.route_id and self.waze_optimizer:
                await self._apply_automatic_reroute(incident)
            
            # Notification superviseur
            await self._notify_supervisor(incident)
        
        elif incident.severity == IncidentSeverity.MEDIUM:
            # Suggestion reroutage
            if incident.route_id and self.waze_optimizer:
                suggestion = await self._suggest_reroute(incident)
                await self._notify_postman(incident.postman_id, f"💡 Suggestion reroutage: {suggestion}")
        
        else:  # LOW
            # Log seulement
            print(f"📋 Incident LOW: {incident.title}")
    
    async def _apply_automatic_reroute(self, incident: Incident):
        """
        🗺️ Appliquer reroutage automatique via Waze
        """
        if not self.waze_optimizer or not incident.route_id:
            return
        
        try:
            # Obtenir livraisons restantes sur route
            async with get_db_connection() as conn:
                query = text("""
                    SELECT id, latitude, longitude, recipient_address
                    FROM deliveries
                    WHERE route_id = :route_id 
                      AND status = 'PENDING'
                      AND postman_id = :postman_id
                    ORDER BY delivery_date ASC
                """)
                
                result = await conn.execute(query, {
                    "route_id": incident.route_id,
                    "postman_id": incident.postman_id
                })
                
                remaining_deliveries = [
                    {
                        "id": row[0],
                        "latitude": row[1],
                        "longitude": row[2],
                        "address": row[3]
                    }
                    for row in result.fetchall()
                ]
            
            # Calculer nouvelle route avec Waze
            new_route = await self.waze_optimizer.optimize_route(
                deliveries=remaining_deliveries,
                avoid_point=(incident.latitude, incident.longitude) if incident.latitude else None
            )
            
            # Mettre à jour route en DB
            async with get_db_connection() as conn:
                update_query = text("""
                    UPDATE routes
                    SET waze_route_id = :waze_route_id,
                        estimated_duration = :duration,
                        distance = :distance,
                        updated_at = :now
                    WHERE id = :route_id
                """)
                
                await conn.execute(update_query, {
                    "waze_route_id": new_route['route_id'],
                    "duration": new_route['duration'],
                    "distance": new_route['distance'],
                    "now": datetime.now(),
                    "route_id": incident.route_id
                })
            
            # Marquer reroutage appliqué
            async with get_db_connection() as conn:
                await conn.execute(
                    text("UPDATE incidents SET reroute_applied = TRUE WHERE id = :id"),
                    {"id": incident.id}
                )
            
            print(f"✅ Reroutage automatique appliqué - Incident {incident.id}")
            
        except Exception as e:
            print(f"❌ Erreur reroutage: {e}")
    
    async def _suggest_reroute(self, incident: Incident) -> str:
        """Suggérer reroutage sans appliquer"""
        # TODO: Implémenter suggestion
        return "Itinéraire alternatif disponible via Route B"
    
    async def _notify_management(self, incident: Incident):
        """Notification management pour incidents CRITICAL"""
        print(f"🚨 CRITICAL INCIDENT: {incident.title}")
        print(f"   Facteur: {incident.postman_id}")
        print(f"   Type: {incident.type.value}")
        # TODO: SMS + Email + Push notification
    
    async def _notify_supervisor(self, incident: Incident):
        """Notification superviseur pour incidents HIGH"""
        print(f"⚠️ HIGH INCIDENT: {incident.title}")
        # TODO: Email superviseur
    
    async def _notify_postman(self, postman_id: str, message: str):
        """Notification facteur via app mobile"""
        print(f"📱 Notification facteur {postman_id}: {message}")
        # TODO: Push notification mobile app
    
    async def resolve_incident(self, incident_id: str, resolution: str):
        """
        ✅ Résoudre incident
        """
        async with get_db_connection() as conn:
            query = text("""
                UPDATE incidents
                SET status = 'RESOLVED',
                    resolved_at = :now,
                    resolution = :resolution
                WHERE id = :id
            """)
            
            await conn.execute(query, {
                "id": incident_id,
                "now": datetime.now(),
                "resolution": resolution
            })
        
        # Retirer de active_incidents
        if incident_id in self.active_incidents:
            del self.active_incidents[incident_id]
    
    async def get_active_incidents(self, severity_min: Optional[IncidentSeverity] = None) -> List[Incident]:
        """Récupérer incidents actifs"""
        incidents = list(self.active_incidents.values())
        
        if severity_min:
            incidents = [i for i in incidents if i.severity.value >= severity_min.value]
        
        return sorted(incidents, key=lambda i: (i.severity.value, i.created_at), reverse=True)
