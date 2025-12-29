"""
Performance Tracker - Individual Postman Analytics
Coaching personnalisé basé sur métriques individuelles
"""
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from dataclasses import dataclass
from sqlalchemy import text
from src.backend.database import get_db_connection


@dataclass
class PostmanPerformance:
    """Métriques performance facteur"""
    postman_id: str
    postman_name: str
    period_start: datetime
    period_end: datetime
    
    # Deliveries
    total_deliveries: int
    successful_deliveries: int
    failed_deliveries: int
    success_rate: float
    
    # Timing
    average_delivery_time: float  # minutes
    total_working_hours: float
    overtime_hours: float
    productivity: float  # deliveries per hour
    
    # Quality
    average_rating: float
    complaint_count: int
    incident_count: int
    
    # Trends
    performance_trend: str  # "improving", "stable", "declining"
    rank: int  # Position parmi tous les facteurs
    
    # Coaching
    strengths: List[str]
    areas_for_improvement: List[str]
    personalized_recommendations: List[str]


class PerformanceTracker:
    """
    Tracker de performance individuelle avec coaching
    
    Features:
    - Analytics détaillés par facteur
    - Comparaison avec moyennes équipe
    - Détection patterns problématiques
    - Recommandations coaching personnalisées
    """
    
    def __init__(self):
        self.db = None
    
    async def get_postman_performance(
        self,
        postman_id: str,
        days: int = 30
    ) -> PostmanPerformance:
        """
        📊 Récupérer performance facteur sur période
        
        Args:
            postman_id: ID facteur
            days: Nombre de jours historique (défaut 30)
        
        Returns:
            PostmanPerformance avec métriques complètes
        """
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        async with get_db_connection() as conn:
            # Métriques de base
            stats = await self._get_basic_stats(conn, postman_id, start_date, end_date)
            
            # Timing
            timing = await self._get_timing_stats(conn, postman_id, start_date, end_date)
            
            # Quality
            quality = await self._get_quality_stats(conn, postman_id, start_date, end_date)
            
            # Trends
            trend = await self._calculate_performance_trend(conn, postman_id, days)
            
            # Rank
            rank = await self._get_postman_rank(conn, postman_id, start_date, end_date)
            
            # Coaching
            strengths = await self._identify_strengths(stats, timing, quality)
            areas_improvement = await self._identify_improvement_areas(stats, timing, quality)
            recommendations = await self._generate_recommendations(
                postman_id, stats, timing, quality, trend
            )
            
            # Récupérer nom facteur
            postman_query = text("SELECT name FROM postmen WHERE id = :id")
            result = await conn.execute(postman_query, {"id": postman_id})
            postman_name = result.fetchone()[0]
            
            return PostmanPerformance(
                postman_id=postman_id,
                postman_name=postman_name,
                period_start=start_date,
                period_end=end_date,
                total_deliveries=stats['total'],
                successful_deliveries=stats['successful'],
                failed_deliveries=stats['failed'],
                success_rate=stats['success_rate'],
                average_delivery_time=timing['avg_time'],
                total_working_hours=timing['total_hours'],
                overtime_hours=timing['overtime'],
                productivity=timing['productivity'],
                average_rating=quality['avg_rating'],
                complaint_count=quality['complaints'],
                incident_count=quality['incidents'],
                performance_trend=trend,
                rank=rank,
                strengths=strengths,
                areas_for_improvement=areas_improvement,
                personalized_recommendations=recommendations
            )
    
    async def _get_basic_stats(self, conn, postman_id: str, start: datetime, end: datetime) -> Dict:
        """Stats livraisons de base"""
        query = text("""
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'DELIVERED' THEN 1 ELSE 0 END) as successful,
                SUM(CASE WHEN status IN ('FAILED', 'RETURNED') THEN 1 ELSE 0 END) as failed
            FROM deliveries
            WHERE postman_id = :postman_id
              AND delivery_date >= :start_date
              AND delivery_date < :end_date
        """)
        
        result = await conn.execute(query, {
            "postman_id": postman_id,
            "start_date": start,
            "end_date": end
        })
        row = result.fetchone()
        
        total = row[0] or 0
        successful = row[1] or 0
        failed = row[2] or 0
        
        return {
            "total": total,
            "successful": successful,
            "failed": failed,
            "success_rate": round((successful / total * 100) if total > 0 else 0, 2)
        }
    
    async def _get_timing_stats(self, conn, postman_id: str, start: datetime, end: datetime) -> Dict:
        """Stats temps et productivité"""
        # Temps moyen livraison
        time_query = text("""
            SELECT AVG(EXTRACT(EPOCH FROM (completed_at - started_at)) / 60) as avg_time
            FROM deliveries
            WHERE postman_id = :postman_id
              AND delivery_date >= :start_date
              AND delivery_date < :end_date
              AND status = 'DELIVERED'
              AND completed_at IS NOT NULL
        """)
        
        time_result = await conn.execute(time_query, {
            "postman_id": postman_id,
            "start_date": start,
            "end_date": end
        })
        avg_time = time_result.fetchone()[0] or 0
        
        # Heures travail et overtime
        hours_query = text("""
            SELECT 
                SUM(actual_hours) as total_hours,
                SUM(overtime_hours) as overtime
            FROM postman_shifts
            WHERE postman_id = :postman_id
              AND shift_date >= :start_date
              AND shift_date < :end_date
        """)
        
        hours_result = await conn.execute(hours_query, {
            "postman_id": postman_id,
            "start_date": start,
            "end_date": end
        })
        hours_row = hours_result.fetchone()
        total_hours = hours_row[0] or 0
        overtime = hours_row[1] or 0
        
        # Productivité (livraisons/heure)
        deliveries_query = text("""
            SELECT COUNT(*) FROM deliveries
            WHERE postman_id = :postman_id
              AND delivery_date >= :start_date
              AND delivery_date < :end_date
              AND status = 'DELIVERED'
        """)
        
        deliv_result = await conn.execute(deliveries_query, {
            "postman_id": postman_id,
            "start_date": start,
            "end_date": end
        })
        deliveries_count = deliv_result.fetchone()[0] or 0
        
        productivity = round((deliveries_count / total_hours) if total_hours > 0 else 0, 2)
        
        return {
            "avg_time": round(avg_time, 2),
            "total_hours": round(total_hours, 2),
            "overtime": round(overtime, 2),
            "productivity": productivity
        }
    
    async def _get_quality_stats(self, conn, postman_id: str, start: datetime, end: datetime) -> Dict:
        """Stats qualité service"""
        query = text("""
            SELECT 
                AVG(customer_rating) as avg_rating,
                COUNT(DISTINCT CASE WHEN customer_rating < 3 THEN id END) as complaints
            FROM deliveries
            WHERE postman_id = :postman_id
              AND delivery_date >= :start_date
              AND delivery_date < :end_date
              AND customer_rating IS NOT NULL
        """)
        
        result = await conn.execute(query, {
            "postman_id": postman_id,
            "start_date": start,
            "end_date": end
        })
        row = result.fetchone()
        
        # Incidents
        incident_query = text("""
            SELECT COUNT(*) FROM incidents
            WHERE postman_id = :postman_id
              AND created_at >= :start_date
              AND created_at < :end_date
        """)
        
        incident_result = await conn.execute(incident_query, {
            "postman_id": postman_id,
            "start_date": start,
            "end_date": end
        })
        incidents = incident_result.fetchone()[0] or 0
        
        return {
            "avg_rating": round(row[0] or 0, 2),
            "complaints": row[1] or 0,
            "incidents": incidents
        }
    
    async def _calculate_performance_trend(self, conn, postman_id: str, days: int) -> str:
        """
        Calculer tendance performance (improving, stable, declining)
        
        Compare 2 périodes: days/2 récents vs days/2 anciens
        """
        mid_point = days // 2
        now = datetime.now()
        
        # Période récente
        recent_start = now - timedelta(days=mid_point)
        recent_end = now
        
        # Période ancienne
        old_start = now - timedelta(days=days)
        old_end = recent_start
        
        # Stats périodes
        recent_stats = await self._get_basic_stats(conn, postman_id, recent_start, recent_end)
        old_stats = await self._get_basic_stats(conn, postman_id, old_start, old_end)
        
        # Comparer success_rate
        recent_rate = recent_stats['success_rate']
        old_rate = old_stats['success_rate']
        
        diff = recent_rate - old_rate
        
        if diff > 5:
            return "improving"
        elif diff < -5:
            return "declining"
        else:
            return "stable"
    
    async def _get_postman_rank(self, conn, postman_id: str, start: datetime, end: datetime) -> int:
        """Position facteur parmi tous (1 = meilleur)"""
        query = text("""
            WITH postman_scores AS (
                SELECT 
                    postman_id,
                    COUNT(*) as deliveries,
                    SUM(CASE WHEN status = 'DELIVERED' THEN 1 ELSE 0 END)::float / COUNT(*) * 100 as success_rate
                FROM deliveries
                WHERE delivery_date >= :start_date AND delivery_date < :end_date
                GROUP BY postman_id
            )
            SELECT ROW_NUMBER() OVER (ORDER BY success_rate DESC, deliveries DESC) as rank, postman_id
            FROM postman_scores
        """)
        
        result = await conn.execute(query, {"start_date": start, "end_date": end})
        
        for row in result.fetchall():
            if row[1] == postman_id:
                return row[0]
        
        return 0
    
    async def _identify_strengths(self, stats: Dict, timing: Dict, quality: Dict) -> List[str]:
        """Identifier points forts"""
        strengths = []
        
        if stats['success_rate'] >= 95:
            strengths.append("Excellent taux de réussite (>95%)")
        
        if timing['productivity'] >= 3.5:
            strengths.append("Haute productivité (>3.5 livraisons/heure)")
        
        if quality['avg_rating'] >= 4.5:
            strengths.append("Satisfaction client excellente (>4.5/5)")
        
        if timing['overtime'] < 2:
            strengths.append("Gestion temps efficace (peu d'heures sup)")
        
        if quality['incidents'] == 0:
            strengths.append("Aucun incident signalé")
        
        return strengths or ["Performance stable"]
    
    async def _identify_improvement_areas(self, stats: Dict, timing: Dict, quality: Dict) -> List[str]:
        """Identifier axes d'amélioration"""
        areas = []
        
        if stats['success_rate'] < 90:
            areas.append(f"Taux de réussite à améliorer ({stats['success_rate']}% < 90%)")
        
        if timing['productivity'] < 2.5:
            areas.append(f"Productivité faible ({timing['productivity']} livraisons/heure)")
        
        if quality['avg_rating'] < 4.0:
            areas.append(f"Satisfaction client ({quality['avg_rating']}/5)")
        
        if timing['overtime'] > 5:
            areas.append(f"Heures supplémentaires élevées ({timing['overtime']}h)")
        
        if quality['complaints'] > 3:
            areas.append(f"Plaintes clients ({quality['complaints']})")
        
        if quality['incidents'] > 5:
            areas.append(f"Incidents fréquents ({quality['incidents']})")
        
        return areas
    
    async def _generate_recommendations(
        self,
        postman_id: str,
        stats: Dict,
        timing: Dict,
        quality: Dict,
        trend: str
    ) -> List[str]:
        """
        💡 Générer recommandations coaching personnalisées
        """
        recommendations = []
        
        # Taux réussite faible
        if stats['success_rate'] < 90:
            recommendations.append(
                "📋 Formation: Techniques de gestion des adresses difficiles"
            )
            recommendations.append(
                "🎯 Objectif: Viser 95% de taux de réussite sur 2 semaines"
            )
        
        # Productivité faible
        if timing['productivity'] < 2.5:
            recommendations.append(
                "⚡ Formation: Optimisation de tournée et gestion du temps"
            )
            recommendations.append(
                "🗺️ Suggestion: Utiliser app mobile pour routing optimisé"
            )
        
        # Overtime élevé
        if timing['overtime'] > 5:
            recommendations.append(
                "⏰ Analyse: Revoir distribution charge de travail quotidienne"
            )
            recommendations.append(
                "💪 Support: Envisager aide temporaire zones difficiles"
            )
        
        # Satisfaction client
        if quality['avg_rating'] < 4.0:
            recommendations.append(
                "😊 Formation: Service client et communication"
            )
            recommendations.append(
                "📞 Action: Appeler clients après livraison pour feedback"
            )
        
        # Incidents fréquents
        if quality['incidents'] > 5:
            recommendations.append(
                "🚨 Alerte: Analyser causes incidents avec superviseur"
            )
            recommendations.append(
                "🛡️ Formation: Prévention incidents et sécurité"
            )
        
        # Tendance positive
        if trend == "improving":
            recommendations.append(
                "🌟 Félicitations: Performance en amélioration, continuer!"
            )
        
        # Tendance négative
        if trend == "declining":
            recommendations.append(
                "⚠️ Attention: Performance en baisse, entretien superviseur recommandé"
            )
        
        return recommendations or ["✅ Performance optimale, continuer ainsi!"]
    
    async def compare_with_team_average(self, postman_id: str, days: int = 30) -> Dict:
        """
        📊 Comparer performance avec moyennes équipe
        
        Returns:
            {
                "postman": {...},
                "team_average": {...},
                "differences": {...}
            }
        """
        postman_perf = await self.get_postman_performance(postman_id, days)
        
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        async with get_db_connection() as conn:
            # Moyennes équipe
            team_query = text("""
                SELECT 
                    AVG(success_rate) as avg_success_rate,
                    AVG(productivity) as avg_productivity,
                    AVG(avg_rating) as avg_rating
                FROM (
                    SELECT 
                        postman_id,
                        SUM(CASE WHEN status = 'DELIVERED' THEN 1 ELSE 0 END)::float / COUNT(*) * 100 as success_rate,
                        COUNT(*)::float / NULLIF(SUM(EXTRACT(EPOCH FROM (completed_at - started_at)) / 3600), 0) as productivity,
                        AVG(customer_rating) as avg_rating
                    FROM deliveries
                    WHERE delivery_date >= :start_date AND delivery_date < :end_date
                    GROUP BY postman_id
                ) as team_stats
            """)
            
            result = await conn.execute(team_query, {
                "start_date": start_date,
                "end_date": end_date
            })
            row = result.fetchone()
            
            team_avg = {
                "success_rate": round(row[0] or 0, 2),
                "productivity": round(row[1] or 0, 2),
                "avg_rating": round(row[2] or 0, 2)
            }
        
        # Différences
        differences = {
            "success_rate_diff": round(postman_perf.success_rate - team_avg['success_rate'], 2),
            "productivity_diff": round(postman_perf.productivity - team_avg['productivity'], 2),
            "rating_diff": round(postman_perf.average_rating - team_avg['avg_rating'], 2)
        }
        
        return {
            "postman": {
                "success_rate": postman_perf.success_rate,
                "productivity": postman_perf.productivity,
                "avg_rating": postman_perf.average_rating
            },
            "team_average": team_avg,
            "differences": differences
        }
