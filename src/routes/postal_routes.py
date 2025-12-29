"""
API Routes - Postal Management System
Endpoints pour facteurs, livraisons, incidents, rapports
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from datetime import datetime, timedelta
from typing import Optional, List
from pydantic import BaseModel

from src.services.postal_reporting_service import PostalReportingService
from src.services.incident_manager import IncidentManager, IncidentType, IncidentSeverity
from src.services.waze_route_optimizer import WazeRouteOptimizer
from src.services.performance_tracker import PerformanceTracker
from src.services.auth_manager import get_current_user_dependency

router = APIRouter(prefix="/api/postal", tags=["postal"])

# Services
reporting_service = PostalReportingService()
waze_optimizer = WazeRouteOptimizer()
incident_manager = IncidentManager(waze_optimizer=waze_optimizer)
performance_tracker = PerformanceTracker()


# ===== MODELS =====

class IncidentCreate(BaseModel):
    """Création incident"""
    postman_id: str
    incident_type: str
    title: str
    description: str
    delivery_id: Optional[str] = None
    route_id: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class RouteOptimizationRequest(BaseModel):
    """Demande optimisation route"""
    deliveries: List[dict]
    start_latitude: Optional[float] = None
    start_longitude: Optional[float] = None
    avoid_latitude: Optional[float] = None
    avoid_longitude: Optional[float] = None


# ===== REPORTING ENDPOINTS =====

@router.get("/reports/daily")
async def get_daily_report(
    date: Optional[str] = None,
    current_user = Depends(get_current_user_dependency)
):
    """
    📊 Rapport quotidien KPIs
    
    Query params:
    - date: YYYY-MM-DD (défaut: aujourd'hui)
    """
    try:
        if date:
            report_date = datetime.strptime(date, "%Y-%m-%d")
        else:
            report_date = None
        
        report = await reporting_service.generate_daily_report(report_date)
        
        return {
            "status": "success",
            "report": {
                "period": report.period,
                "start_date": report.start_date.isoformat(),
                "end_date": report.end_date.isoformat(),
                "kpis": {
                    "delivery_success_rate": report.delivery_success_rate,
                    "total_deliveries": report.total_deliveries,
                    "successful_deliveries": report.successful_deliveries,
                    "failed_deliveries": report.failed_deliveries,
                    "average_delivery_time": report.average_delivery_time,
                    "average_productivity": report.average_postman_productivity,
                    "incidents_count": report.incidents_count,
                    "overtime_hours": report.overtime_hours
                },
                "top_performers": report.top_performers,
                "areas_needing_support": report.areas_needing_support
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {e}")


@router.get("/reports/weekly")
async def get_weekly_report(
    week_start: Optional[str] = None,
    current_user = Depends(get_current_user_dependency)
):
    """
    📊 Rapport hebdomadaire
    
    Query params:
    - week_start: YYYY-MM-DD (défaut: début semaine courante)
    """
    try:
        if week_start:
            start_date = datetime.strptime(week_start, "%Y-%m-%d")
        else:
            start_date = None
        
        report = await reporting_service.generate_weekly_report(start_date)
        
        return {
            "status": "success",
            "report": {
                "period": report.period,
                "start_date": report.start_date.isoformat(),
                "end_date": report.end_date.isoformat(),
                "kpis": {
                    "delivery_success_rate": report.delivery_success_rate,
                    "total_deliveries": report.total_deliveries,
                    "average_delivery_time": report.average_delivery_time,
                    "average_productivity": report.average_postman_productivity,
                    "incidents_count": report.incidents_count,
                    "overtime_hours": report.overtime_hours
                },
                "top_performers": report.top_performers,
                "areas_needing_support": report.areas_needing_support
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {e}")


@router.get("/reports/monthly")
async def get_monthly_report(
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None, ge=2020, le=2030),
    current_user = Depends(get_current_user_dependency)
):
    """
    📊 Rapport mensuel
    
    Query params:
    - month: 1-12 (défaut: mois courant)
    - year: 2020-2030 (défaut: année courante)
    """
    try:
        report = await reporting_service.generate_monthly_report(month, year)
        
        return {
            "status": "success",
            "report": {
                "period": report.period,
                "start_date": report.start_date.isoformat(),
                "end_date": report.end_date.isoformat(),
                "kpis": {
                    "delivery_success_rate": report.delivery_success_rate,
                    "total_deliveries": report.total_deliveries,
                    "average_delivery_time": report.average_delivery_time,
                    "average_productivity": report.average_postman_productivity,
                    "incidents_count": report.incidents_count,
                    "overtime_hours": report.overtime_hours
                },
                "top_performers": report.top_performers,
                "areas_needing_support": report.areas_needing_support
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {e}")


# ===== INCIDENT MANAGEMENT =====

@router.post("/incidents")
async def create_incident(
    incident: IncidentCreate,
    current_user = Depends(get_current_user_dependency)
):
    """
    🚨 Signaler nouvel incident
    
    Actions automatiques selon sévérité:
    - CRITICAL: Notification management + reroutage immédiat
    - HIGH: Reroutage automatique
    - MEDIUM: Suggestion reroutage
    - LOW: Log seulement
    """
    try:
        # Convertir type string en enum
        incident_type = IncidentType(incident.incident_type)
        
        # Créer incident (actions auto appliquées)
        created_incident = await incident_manager.report_incident(
            postman_id=incident.postman_id,
            incident_type=incident_type,
            title=incident.title,
            description=incident.description,
            delivery_id=incident.delivery_id,
            route_id=incident.route_id,
            latitude=incident.latitude,
            longitude=incident.longitude
        )
        
        return {
            "status": "success",
            "incident": {
                "id": created_incident.id,
                "type": created_incident.type.value,
                "severity": created_incident.severity.name,
                "status": created_incident.status,
                "title": created_incident.title,
                "created_at": created_incident.created_at.isoformat()
            },
            "message": f"Incident {created_incident.severity.name} créé et traité automatiquement"
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid incident type: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Incident creation failed: {e}")


@router.get("/incidents/active")
async def get_active_incidents(
    severity_min: Optional[str] = None,
    current_user = Depends(get_current_user_dependency)
):
    """
    🚨 Récupérer incidents actifs
    
    Query params:
    - severity_min: LOW, MEDIUM, HIGH, CRITICAL (filtre minimum)
    """
    try:
        severity_filter = None
        if severity_min:
            severity_filter = IncidentSeverity[severity_min]
        
        incidents = await incident_manager.get_active_incidents(severity_filter)
        
        return {
            "status": "success",
            "count": len(incidents),
            "incidents": [
                {
                    "id": inc.id,
                    "postman_id": inc.postman_id,
                    "type": inc.type.value,
                    "severity": inc.severity.name,
                    "title": inc.title,
                    "description": inc.description,
                    "latitude": inc.latitude,
                    "longitude": inc.longitude,
                    "created_at": inc.created_at.isoformat()
                }
                for inc in incidents
            ]
        }
    except KeyError:
        raise HTTPException(status_code=400, detail="Invalid severity level")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch incidents: {e}")


@router.put("/incidents/{incident_id}/resolve")
async def resolve_incident(
    incident_id: str,
    resolution: str,
    current_user = Depends(get_current_user_dependency)
):
    """✅ Résoudre incident"""
    try:
        await incident_manager.resolve_incident(incident_id, resolution)
        
        return {
            "status": "success",
            "message": f"Incident {incident_id} résolu"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Resolution failed: {e}")


# ===== ROUTE OPTIMIZATION =====

@router.post("/routes/optimize")
async def optimize_route(
    request: RouteOptimizationRequest,
    current_user = Depends(get_current_user_dependency)
):
    """
    🗺️ Optimiser route multi-stops avec Waze
    
    Body:
    - deliveries: [{latitude, longitude, address}, ...]
    - start_latitude/longitude: Point départ (optionnel)
    - avoid_latitude/longitude: Point à éviter (optionnel)
    """
    try:
        start_location = None
        if request.start_latitude and request.start_longitude:
            start_location = (request.start_latitude, request.start_longitude)
        
        avoid_point = None
        if request.avoid_latitude and request.avoid_longitude:
            avoid_point = (request.avoid_latitude, request.avoid_longitude)
        
        optimized_route = await waze_optimizer.optimize_route(
            deliveries=request.deliveries,
            start_location=start_location,
            avoid_point=avoid_point
        )
        
        return {
            "status": "success",
            "route": {
                "route_id": optimized_route.route_id,
                "duration_minutes": optimized_route.duration,
                "distance_km": optimized_route.distance,
                "traffic_delay_minutes": optimized_route.traffic_delay,
                "alternative_available": optimized_route.alternative_available,
                "waypoints": optimized_route.waypoints
            }
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Route optimization failed: {e}")


@router.get("/routes/traffic/{area_code}")
async def get_traffic_conditions(
    area_code: str,
    current_user = Depends(get_current_user_dependency)
):
    """🚦 Récupérer conditions trafic zone"""
    try:
        traffic = await waze_optimizer.get_traffic_conditions(area_code)
        
        return {
            "status": "success",
            "traffic": traffic
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Traffic fetch failed: {e}")


@router.post("/routes/eta")
async def calculate_eta(
    current_lat: float,
    current_lon: float,
    dest_lat: float,
    dest_lon: float,
    include_traffic: bool = True,
    current_user = Depends(get_current_user_dependency)
):
    """⏱️ Calculer ETA (Estimated Time of Arrival)"""
    try:
        eta = await waze_optimizer.calculate_eta(
            current_location=(current_lat, current_lon),
            destination=(dest_lat, dest_lon),
            include_traffic=include_traffic
        )
        
        return {
            "status": "success",
            "eta": eta
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ETA calculation failed: {e}")


# ===== PERFORMANCE TRACKING =====

@router.get("/performance/postman/{postman_id}")
async def get_postman_performance(
    postman_id: str,
    days: int = Query(30, ge=1, le=365),
    current_user = Depends(get_current_user_dependency)
):
    """
    📊 Performance facteur avec coaching personnalisé
    
    Query params:
    - days: Période analyse (1-365 jours, défaut 30)
    """
    try:
        performance = await performance_tracker.get_postman_performance(
            postman_id=postman_id,
            days=days
        )
        
        return {
            "status": "success",
            "performance": {
                "postman_id": performance.postman_id,
                "postman_name": performance.postman_name,
                "period": {
                    "start": performance.period_start.isoformat(),
                    "end": performance.period_end.isoformat(),
                    "days": days
                },
                "metrics": {
                    "deliveries": {
                        "total": performance.total_deliveries,
                        "successful": performance.successful_deliveries,
                        "failed": performance.failed_deliveries,
                        "success_rate": performance.success_rate
                    },
                    "timing": {
                        "average_delivery_time": performance.average_delivery_time,
                        "total_working_hours": performance.total_working_hours,
                        "overtime_hours": performance.overtime_hours,
                        "productivity": performance.productivity
                    },
                    "quality": {
                        "average_rating": performance.average_rating,
                        "complaint_count": performance.complaint_count,
                        "incident_count": performance.incident_count
                    }
                },
                "analysis": {
                    "performance_trend": performance.performance_trend,
                    "rank": performance.rank,
                    "strengths": performance.strengths,
                    "areas_for_improvement": performance.areas_for_improvement,
                    "personalized_recommendations": performance.personalized_recommendations
                }
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Performance fetch failed: {e}")


@router.get("/performance/postman/{postman_id}/compare")
async def compare_with_team(
    postman_id: str,
    days: int = Query(30, ge=1, le=365),
    current_user = Depends(get_current_user_dependency)
):
    """
    📊 Comparer performance avec moyennes équipe
    """
    try:
        comparison = await performance_tracker.compare_with_team_average(
            postman_id=postman_id,
            days=days
        )
        
        return {
            "status": "success",
            "comparison": comparison
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Comparison failed: {e}")
