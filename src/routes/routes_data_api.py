"""
API Routes Data Management - CRUD Complet
Gestion complète données routes postales
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from sqlalchemy import text
from src.backend.database import get_db_connection
from src.services.auth_manager import get_current_user_dependency

router = APIRouter(prefix="/api/routes", tags=["routes"])


# ===== MODELS PYDANTIC =====

class RouteCreate(BaseModel):
    """Création route"""
    route_code: str
    area_code: str
    area_name: str
    description: Optional[str] = None
    waze_route_id: Optional[str] = None
    estimated_duration: Optional[int] = None  # minutes
    distance: Optional[float] = None  # km
    geo_json: Optional[str] = None


class RouteUpdate(BaseModel):
    """Mise à jour route"""
    route_code: Optional[str] = None
    area_code: Optional[str] = None
    area_name: Optional[str] = None
    description: Optional[str] = None
    waze_route_id: Optional[str] = None
    estimated_duration: Optional[int] = None
    distance: Optional[float] = None
    geo_json: Optional[str] = None


class RouteResponse(BaseModel):
    """Route avec stats"""
    id: str
    route_code: str
    area_code: str
    area_name: str
    description: Optional[str]
    waze_route_id: Optional[str]
    estimated_duration: Optional[int]
    distance: Optional[float]
    geo_json: Optional[str]
    created_at: str
    updated_at: str
    
    # Stats (si demandées)
    total_deliveries: Optional[int] = None
    success_rate: Optional[float] = None
    avg_delivery_time: Optional[float] = None
    incidents_count: Optional[int] = None


class WaypointCreate(BaseModel):
    """Waypoint route"""
    route_id: str
    order: int
    latitude: float
    longitude: float
    address: str
    delivery_id: Optional[str] = None


# ===== CRUD ROUTES =====

@router.post("/", status_code=201)
async def create_route(
    route: RouteCreate,
    current_user = Depends(get_current_user_dependency)
):
    """
    ➕ Créer nouvelle route
    
    Body:
    - route_code: Code unique route (ex: "R001")
    - area_code: Code zone (ex: "75001")
    - area_name: Nom zone (ex: "Paris Centre")
    - description: Description (optionnel)
    - waze_route_id: ID route Waze (optionnel)
    - estimated_duration: Durée estimée minutes (optionnel)
    - distance: Distance km (optionnel)
    - geo_json: Polygon GeoJSON zone (optionnel)
    """
    try:
        async with get_db_connection() as conn:
            # Vérifier unicité route_code
            check_query = text("""
                SELECT COUNT(*) FROM routes WHERE route_code = :code
            """)
            result = await conn.execute(check_query, {"code": route.route_code})
            if result.fetchone()[0] > 0:
                raise HTTPException(
                    status_code=409,
                    detail=f"Route code '{route.route_code}' already exists"
                )
            
            # Créer route
            insert_query = text("""
                INSERT INTO routes (
                    id, route_code, area_code, area_name,
                    description, waze_route_id, estimated_duration,
                    distance, geo_json, created_at, updated_at
                )
                VALUES (
                    gen_random_uuid(), :route_code, :area_code, :area_name,
                    :description, :waze_route_id, :estimated_duration,
                    :distance, :geo_json, :now, :now
                )
                RETURNING id, route_code, area_code, area_name, created_at
            """)
            
            result = await conn.execute(insert_query, {
                "route_code": route.route_code,
                "area_code": route.area_code,
                "area_name": route.area_name,
                "description": route.description,
                "waze_route_id": route.waze_route_id,
                "estimated_duration": route.estimated_duration,
                "distance": route.distance,
                "geo_json": route.geo_json,
                "now": datetime.now()
            })
            
            row = result.fetchone()
            
            return {
                "status": "success",
                "message": "Route created",
                "route": {
                    "id": str(row[0]),
                    "route_code": row[1],
                    "area_code": row[2],
                    "area_name": row[3],
                    "created_at": row[4].isoformat()
                }
            }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Route creation failed: {e}")


@router.get("/", response_model=dict)
async def list_routes(
    area_code: Optional[str] = None,
    with_stats: bool = Query(False, description="Inclure statistiques"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    current_user = Depends(get_current_user_dependency)
):
    """
    📋 Lister routes avec filtres optionnels
    
    Query params:
    - area_code: Filtrer par code zone (optionnel)
    - with_stats: Inclure stats (livraisons, succès, incidents)
    - limit: Nombre max résultats (1-500, défaut 100)
    - offset: Pagination offset (défaut 0)
    """
    try:
        async with get_db_connection() as conn:
            # Query de base
            if with_stats:
                query = text("""
                    SELECT 
                        r.id, r.route_code, r.area_code, r.area_name,
                        r.description, r.waze_route_id, r.estimated_duration,
                        r.distance, r.geo_json, r.created_at, r.updated_at,
                        COUNT(DISTINCT d.id) as total_deliveries,
                        COALESCE(
                            SUM(CASE WHEN d.status = 'DELIVERED' THEN 1 ELSE 0 END)::float / 
                            NULLIF(COUNT(d.id), 0) * 100, 
                            0
                        ) as success_rate,
                        AVG(EXTRACT(EPOCH FROM (d.completed_at - d.started_at)) / 60) as avg_delivery_time,
                        COUNT(DISTINCT i.id) as incidents_count
                    FROM routes r
                    LEFT JOIN deliveries d ON d.route_id = r.id
                    LEFT JOIN incidents i ON i.route_id = r.id
                    WHERE (:area_code IS NULL OR r.area_code = :area_code)
                    GROUP BY r.id
                    ORDER BY r.area_code, r.route_code
                    LIMIT :limit OFFSET :offset
                """)
            else:
                query = text("""
                    SELECT 
                        id, route_code, area_code, area_name,
                        description, waze_route_id, estimated_duration,
                        distance, geo_json, created_at, updated_at
                    FROM routes
                    WHERE (:area_code IS NULL OR area_code = :area_code)
                    ORDER BY area_code, route_code
                    LIMIT :limit OFFSET :offset
                """)
            
            result = await conn.execute(query, {
                "area_code": area_code,
                "limit": limit,
                "offset": offset
            })
            
            routes = []
            for row in result.fetchall():
                route_data = {
                    "id": str(row[0]),
                    "route_code": row[1],
                    "area_code": row[2],
                    "area_name": row[3],
                    "description": row[4],
                    "waze_route_id": row[5],
                    "estimated_duration": row[6],
                    "distance": float(row[7]) if row[7] else None,
                    "geo_json": row[8],
                    "created_at": row[9].isoformat(),
                    "updated_at": row[10].isoformat()
                }
                
                if with_stats:
                    route_data.update({
                        "total_deliveries": row[11],
                        "success_rate": round(row[12], 2) if row[12] else 0,
                        "avg_delivery_time": round(row[13], 2) if row[13] else None,
                        "incidents_count": row[14]
                    })
                
                routes.append(route_data)
            
            # Count total
            count_query = text("""
                SELECT COUNT(*) FROM routes
                WHERE (:area_code IS NULL OR area_code = :area_code)
            """)
            count_result = await conn.execute(count_query, {"area_code": area_code})
            total = count_result.fetchone()[0]
            
            return {
                "status": "success",
                "total": total,
                "limit": limit,
                "offset": offset,
                "count": len(routes),
                "routes": routes
            }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch routes: {e}")


@router.get("/{route_id}", response_model=dict)
async def get_route(
    route_id: str,
    with_stats: bool = Query(False),
    with_deliveries: bool = Query(False, description="Inclure livraisons"),
    current_user = Depends(get_current_user_dependency)
):
    """
    🔍 Récupérer route par ID avec détails optionnels
    
    Query params:
    - with_stats: Inclure statistiques
    - with_deliveries: Inclure liste livraisons
    """
    try:
        async with get_db_connection() as conn:
            # Route de base
            query = text("""
                SELECT 
                    id, route_code, area_code, area_name,
                    description, waze_route_id, estimated_duration,
                    distance, geo_json, created_at, updated_at
                FROM routes
                WHERE id = :route_id
            """)
            
            result = await conn.execute(query, {"route_id": route_id})
            row = result.fetchone()
            
            if not row:
                raise HTTPException(status_code=404, detail="Route not found")
            
            route_data = {
                "id": str(row[0]),
                "route_code": row[1],
                "area_code": row[2],
                "area_name": row[3],
                "description": row[4],
                "waze_route_id": row[5],
                "estimated_duration": row[6],
                "distance": float(row[7]) if row[7] else None,
                "geo_json": row[8],
                "created_at": row[9].isoformat(),
                "updated_at": row[10].isoformat()
            }
            
            # Stats
            if with_stats:
                stats_query = text("""
                    SELECT 
                        COUNT(DISTINCT d.id) as total_deliveries,
                        SUM(CASE WHEN d.status = 'DELIVERED' THEN 1 ELSE 0 END) as successful,
                        AVG(EXTRACT(EPOCH FROM (d.completed_at - d.started_at)) / 60) as avg_time,
                        COUNT(DISTINCT i.id) as incidents
                    FROM routes r
                    LEFT JOIN deliveries d ON d.route_id = r.id
                    LEFT JOIN incidents i ON i.route_id = r.id
                    WHERE r.id = :route_id
                    GROUP BY r.id
                """)
                
                stats_result = await conn.execute(stats_query, {"route_id": route_id})
                stats_row = stats_result.fetchone()
                
                total = stats_row[0] or 0
                successful = stats_row[1] or 0
                
                route_data["stats"] = {
                    "total_deliveries": total,
                    "successful_deliveries": successful,
                    "success_rate": round((successful / total * 100) if total > 0 else 0, 2),
                    "avg_delivery_time": round(stats_row[2], 2) if stats_row[2] else None,
                    "incidents_count": stats_row[3] or 0
                }
            
            # Livraisons
            if with_deliveries:
                deliveries_query = text("""
                    SELECT 
                        id, tracking_number, recipient_name, recipient_address,
                        status, priority, delivery_date,
                        latitude, longitude
                    FROM deliveries
                    WHERE route_id = :route_id
                    ORDER BY delivery_date DESC, priority DESC
                    LIMIT 50
                """)
                
                deliveries_result = await conn.execute(deliveries_query, {"route_id": route_id})
                
                route_data["deliveries"] = [
                    {
                        "id": str(d[0]),
                        "tracking_number": d[1],
                        "recipient_name": d[2],
                        "recipient_address": d[3],
                        "status": d[4],
                        "priority": d[5],
                        "delivery_date": d[6].isoformat(),
                        "latitude": float(d[7]) if d[7] else None,
                        "longitude": float(d[8]) if d[8] else None
                    }
                    for d in deliveries_result.fetchall()
                ]
            
            return {
                "status": "success",
                "route": route_data
            }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch route: {e}")


@router.put("/{route_id}")
async def update_route(
    route_id: str,
    route_update: RouteUpdate,
    current_user = Depends(get_current_user_dependency)
):
    """
    ✏️ Mettre à jour route
    
    Body: Tous champs optionnels
    - Seuls les champs fournis seront modifiés
    """
    try:
        # Construire query dynamique avec champs fournis
        update_fields = []
        params = {"route_id": route_id, "now": datetime.now()}
        
        for field, value in route_update.dict(exclude_unset=True).items():
            update_fields.append(f"{field} = :{field}")
            params[field] = value
        
        if not update_fields:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        update_fields.append("updated_at = :now")
        
        async with get_db_connection() as conn:
            # Vérifier existence
            check_query = text("SELECT id FROM routes WHERE id = :route_id")
            result = await conn.execute(check_query, {"route_id": route_id})
            if not result.fetchone():
                raise HTTPException(status_code=404, detail="Route not found")
            
            # Update
            update_query = text(f"""
                UPDATE routes
                SET {', '.join(update_fields)}
                WHERE id = :route_id
                RETURNING id, route_code, area_code, area_name, updated_at
            """)
            
            result = await conn.execute(update_query, params)
            row = result.fetchone()
            
            return {
                "status": "success",
                "message": "Route updated",
                "route": {
                    "id": str(row[0]),
                    "route_code": row[1],
                    "area_code": row[2],
                    "area_name": row[3],
                    "updated_at": row[4].isoformat()
                }
            }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Route update failed: {e}")


@router.delete("/{route_id}")
async def delete_route(
    route_id: str,
    force: bool = Query(False, description="Forcer suppression même avec livraisons"),
    current_user = Depends(get_current_user_dependency)
):
    """
    🗑️ Supprimer route
    
    Query params:
    - force: Autoriser suppression avec livraisons associées (défaut: false)
    """
    try:
        async with get_db_connection() as conn:
            # Vérifier existence
            check_query = text("SELECT id FROM routes WHERE id = :route_id")
            result = await conn.execute(check_query, {"route_id": route_id})
            if not result.fetchone():
                raise HTTPException(status_code=404, detail="Route not found")
            
            # Vérifier livraisons associées
            if not force:
                deliveries_query = text("""
                    SELECT COUNT(*) FROM deliveries WHERE route_id = :route_id
                """)
                deliveries_result = await conn.execute(deliveries_query, {"route_id": route_id})
                deliveries_count = deliveries_result.fetchone()[0]
                
                if deliveries_count > 0:
                    raise HTTPException(
                        status_code=409,
                        detail=f"Cannot delete route with {deliveries_count} deliveries. Use ?force=true to override."
                    )
            
            # Supprimer
            delete_query = text("DELETE FROM routes WHERE id = :route_id")
            await conn.execute(delete_query, {"route_id": route_id})
            
            return {
                "status": "success",
                "message": f"Route {route_id} deleted"
            }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Route deletion failed: {e}")


# ===== ENDPOINTS ANALYTICS =====

@router.get("/stats/by-area")
async def get_routes_stats_by_area(
    current_user = Depends(get_current_user_dependency)
):
    """
    📊 Statistiques routes par zone
    
    Returns: Résumé par area_code avec totaux, succès, incidents
    """
    try:
        async with get_db_connection() as conn:
            query = text("""
                SELECT 
                    r.area_code,
                    r.area_name,
                    COUNT(DISTINCT r.id) as routes_count,
                    COUNT(DISTINCT d.id) as total_deliveries,
                    SUM(CASE WHEN d.status = 'DELIVERED' THEN 1 ELSE 0 END) as successful,
                    AVG(r.distance) as avg_distance,
                    AVG(r.estimated_duration) as avg_duration,
                    COUNT(DISTINCT i.id) as incidents_count
                FROM routes r
                LEFT JOIN deliveries d ON d.route_id = r.id
                LEFT JOIN incidents i ON i.route_id = r.id
                GROUP BY r.area_code, r.area_name
                ORDER BY total_deliveries DESC
            """)
            
            result = await conn.execute(query)
            
            areas_stats = []
            for row in result.fetchall():
                total = row[3] or 0
                successful = row[4] or 0
                
                areas_stats.append({
                    "area_code": row[0],
                    "area_name": row[1],
                    "routes_count": row[2],
                    "total_deliveries": total,
                    "successful_deliveries": successful,
                    "success_rate": round((successful / total * 100) if total > 0 else 0, 2),
                    "avg_distance_km": round(row[5], 2) if row[5] else None,
                    "avg_duration_minutes": round(row[6], 2) if row[6] else None,
                    "incidents_count": row[7]
                })
            
            return {
                "status": "success",
                "total_areas": len(areas_stats),
                "areas": areas_stats
            }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Stats fetch failed: {e}")


@router.get("/stats/performance")
async def get_routes_performance(
    days: int = Query(30, ge=1, le=365),
    current_user = Depends(get_current_user_dependency)
):
    """
    📈 Performance routes sur période
    
    Query params:
    - days: Période analyse (1-365 jours, défaut 30)
    
    Returns: Top/Bottom routes par taux succès
    """
    try:
        from datetime import timedelta
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        async with get_db_connection() as conn:
            query = text("""
                SELECT 
                    r.id, r.route_code, r.area_name,
                    COUNT(d.id) as total_deliveries,
                    SUM(CASE WHEN d.status = 'DELIVERED' THEN 1 ELSE 0 END) as successful,
                    AVG(EXTRACT(EPOCH FROM (d.completed_at - d.started_at)) / 60) as avg_time,
                    COUNT(DISTINCT i.id) as incidents
                FROM routes r
                LEFT JOIN deliveries d ON d.route_id = r.id 
                    AND d.delivery_date >= :start_date 
                    AND d.delivery_date < :end_date
                LEFT JOIN incidents i ON i.route_id = r.id
                    AND i.created_at >= :start_date
                    AND i.created_at < :end_date
                GROUP BY r.id, r.route_code, r.area_name
                HAVING COUNT(d.id) > 0
                ORDER BY successful::float / NULLIF(COUNT(d.id), 0) DESC
            """)
            
            result = await conn.execute(query, {
                "start_date": start_date,
                "end_date": end_date
            })
            
            all_routes = []
            for row in result.fetchall():
                total = row[3]
                successful = row[4]
                success_rate = (successful / total * 100) if total > 0 else 0
                
                all_routes.append({
                    "route_id": str(row[0]),
                    "route_code": row[1],
                    "area_name": row[2],
                    "total_deliveries": total,
                    "successful_deliveries": successful,
                    "success_rate": round(success_rate, 2),
                    "avg_delivery_time": round(row[5], 2) if row[5] else None,
                    "incidents_count": row[6]
                })
            
            # Top 10 et Bottom 10
            top_routes = all_routes[:10]
            bottom_routes = sorted(all_routes, key=lambda r: r['success_rate'])[:10]
            
            return {
                "status": "success",
                "period": {
                    "start": start_date.isoformat(),
                    "end": end_date.isoformat(),
                    "days": days
                },
                "total_routes": len(all_routes),
                "top_performers": top_routes,
                "need_attention": bottom_routes
            }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Performance fetch failed: {e}")


@router.get("/search")
async def search_routes(
    q: str = Query(..., min_length=1, description="Recherche route_code ou area_name"),
    limit: int = Query(20, ge=1, le=100),
    current_user = Depends(get_current_user_dependency)
):
    """
    🔍 Rechercher routes par code ou nom zone
    
    Query params:
    - q: Terme recherche (min 1 caractère)
    - limit: Max résultats (1-100, défaut 20)
    """
    try:
        async with get_db_connection() as conn:
            query = text("""
                SELECT 
                    id, route_code, area_code, area_name,
                    description, distance, estimated_duration
                FROM routes
                WHERE 
                    route_code ILIKE :search
                    OR area_name ILIKE :search
                    OR area_code ILIKE :search
                ORDER BY 
                    CASE 
                        WHEN route_code ILIKE :exact THEN 1
                        WHEN area_code ILIKE :exact THEN 2
                        ELSE 3
                    END,
                    route_code
                LIMIT :limit
            """)
            
            search_term = f"%{q}%"
            exact_term = q
            
            result = await conn.execute(query, {
                "search": search_term,
                "exact": exact_term,
                "limit": limit
            })
            
            routes = [
                {
                    "id": str(row[0]),
                    "route_code": row[1],
                    "area_code": row[2],
                    "area_name": row[3],
                    "description": row[4],
                    "distance_km": float(row[5]) if row[5] else None,
                    "estimated_duration_minutes": row[6]
                }
                for row in result.fetchall()
            ]
            
            return {
                "status": "success",
                "query": q,
                "count": len(routes),
                "routes": routes
            }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {e}")
