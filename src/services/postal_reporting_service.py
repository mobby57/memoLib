"""
Service Reporting Automatisé - KPIs Postal Service
Génération rapports daily/weekly/monthly avec analytics
"""
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Literal
from dataclasses import dataclass
from sqlalchemy import text
from src.backend.database import get_db_connection


@dataclass
class KPIReport:
    """Rapport KPIs"""
    period: str  # daily, weekly, monthly
    start_date: datetime
    end_date: datetime
    delivery_success_rate: float  # %
    average_delivery_time: float  # minutes
    total_deliveries: int
    successful_deliveries: int
    failed_deliveries: int
    average_postman_productivity: float  # deliveries per day
    incidents_count: int
    overtime_hours: float
    top_performers: List[Dict]
    areas_needing_support: List[Dict]


class PostalReportingService:
    """Service de reporting automatisé pour gestion postale"""
    
    def __init__(self):
        self.db = None
    
    async def generate_daily_report(self, date: Optional[datetime] = None) -> KPIReport:
        """
        📊 Rapport quotidien
        
        KPIs:
        - Taux de livraison réussie
        - Temps moyen de livraison
        - Productivité facteurs
        - Incidents
        """
        if date is None:
            date = datetime.now()
        
        start_date = date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = start_date + timedelta(days=1)
        
        return await self._generate_report(
            period="daily",
            start_date=start_date,
            end_date=end_date
        )
    
    async def generate_weekly_report(self, week_start: Optional[datetime] = None) -> KPIReport:
        """
        📊 Rapport hebdomadaire
        
        Tendances sur 7 jours avec comparaison semaine précédente
        """
        if week_start is None:
            today = datetime.now()
            week_start = today - timedelta(days=today.weekday())
        
        start_date = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = start_date + timedelta(days=7)
        
        return await self._generate_report(
            period="weekly",
            start_date=start_date,
            end_date=end_date
        )
    
    async def generate_monthly_report(self, month: Optional[int] = None, year: Optional[int] = None) -> KPIReport:
        """
        📊 Rapport mensuel
        
        Vue d'ensemble complète du mois
        """
        if month is None or year is None:
            now = datetime.now()
            month = now.month
            year = now.year
        
        start_date = datetime(year, month, 1)
        
        # Dernier jour du mois
        if month == 12:
            end_date = datetime(year + 1, 1, 1)
        else:
            end_date = datetime(year, month + 1, 1)
        
        return await self._generate_report(
            period="monthly",
            start_date=start_date,
            end_date=end_date
        )
    
    async def _generate_report(
        self,
        period: Literal["daily", "weekly", "monthly"],
        start_date: datetime,
        end_date: datetime
    ) -> KPIReport:
        """
        Génération rapport avec calcul KPIs
        """
        async with get_db_connection() as conn:
            # KPI 1: Taux de livraison réussie
            delivery_stats = await self._get_delivery_stats(conn, start_date, end_date)
            
            # KPI 2: Temps moyen de livraison
            avg_delivery_time = await self._get_average_delivery_time(conn, start_date, end_date)
            
            # KPI 3: Productivité facteurs
            productivity = await self._get_postman_productivity(conn, start_date, end_date)
            
            # KPI 4: Incidents
            incidents_count = await self._get_incidents_count(conn, start_date, end_date)
            
            # KPI 5: Heures supplémentaires
            overtime = await self._get_overtime_hours(conn, start_date, end_date)
            
            # Top performers
            top_performers = await self._get_top_performers(conn, start_date, end_date, limit=5)
            
            # Zones nécessitant support
            areas_needing_support = await self._identify_support_areas(conn, start_date, end_date)
            
            return KPIReport(
                period=period,
                start_date=start_date,
                end_date=end_date,
                delivery_success_rate=delivery_stats['success_rate'],
                average_delivery_time=avg_delivery_time,
                total_deliveries=delivery_stats['total'],
                successful_deliveries=delivery_stats['successful'],
                failed_deliveries=delivery_stats['failed'],
                average_postman_productivity=productivity,
                incidents_count=incidents_count,
                overtime_hours=overtime,
                top_performers=top_performers,
                areas_needing_support=areas_needing_support
            )
    
    async def _get_delivery_stats(self, conn, start_date: datetime, end_date: datetime) -> Dict:
        """Stats livraisons (total, succès, échecs)"""
        query = text("""
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as successful,
                SUM(CASE WHEN status IN ('failed', 'returned') THEN 1 ELSE 0 END) as failed
            FROM deliveries
            WHERE delivery_date >= :start_date AND delivery_date < :end_date
        """)
        
        result = await conn.execute(query, {"start_date": start_date, "end_date": end_date})
        row = result.fetchone()
        
        total = row[0] or 0
        successful = row[1] or 0
        failed = row[2] or 0
        
        success_rate = (successful / total * 100) if total > 0 else 0
        
        return {
            "total": total,
            "successful": successful,
            "failed": failed,
            "success_rate": round(success_rate, 2)
        }
    
    async def _get_average_delivery_time(self, conn, start_date: datetime, end_date: datetime) -> float:
        """Temps moyen de livraison en minutes"""
        query = text("""
            SELECT AVG(EXTRACT(EPOCH FROM (completed_at - started_at)) / 60) as avg_time
            FROM deliveries
            WHERE delivery_date >= :start_date 
              AND delivery_date < :end_date
              AND status = 'delivered'
              AND completed_at IS NOT NULL
        """)
        
        result = await conn.execute(query, {"start_date": start_date, "end_date": end_date})
        row = result.fetchone()
        
        return round(row[0] or 0, 2)
    
    async def _get_postman_productivity(self, conn, start_date: datetime, end_date: datetime) -> float:
        """Productivité moyenne (livraisons par jour par facteur)"""
        query = text("""
            SELECT AVG(daily_deliveries) as avg_productivity
            FROM (
                SELECT postman_id, DATE(delivery_date) as day, COUNT(*) as daily_deliveries
                FROM deliveries
                WHERE delivery_date >= :start_date AND delivery_date < :end_date
                  AND status = 'delivered'
                GROUP BY postman_id, DATE(delivery_date)
            ) as daily_stats
        """)
        
        result = await conn.execute(query, {"start_date": start_date, "end_date": end_date})
        row = result.fetchone()
        
        return round(row[0] or 0, 2)
    
    async def _get_incidents_count(self, conn, start_date: datetime, end_date: datetime) -> int:
        """Nombre total d'incidents"""
        query = text("""
            SELECT COUNT(*) FROM incidents
            WHERE created_at >= :start_date AND created_at < :end_date
        """)
        
        result = await conn.execute(query, {"start_date": start_date, "end_date": end_date})
        row = result.fetchone()
        
        return row[0] or 0
    
    async def _get_overtime_hours(self, conn, start_date: datetime, end_date: datetime) -> float:
        """Total heures supplémentaires"""
        query = text("""
            SELECT SUM(overtime_hours) FROM postman_shifts
            WHERE shift_date >= :start_date AND shift_date < :end_date
        """)
        
        result = await conn.execute(query, {"start_date": start_date, "end_date": end_date})
        row = result.fetchone()
        
        return round(row[0] or 0, 2)
    
    async def _get_top_performers(self, conn, start_date: datetime, end_date: datetime, limit: int = 5) -> List[Dict]:
        """Top 5 facteurs par productivité"""
        query = text("""
            SELECT 
                p.id,
                p.name,
                COUNT(d.id) as deliveries_count,
                AVG(d.customer_rating) as avg_rating,
                SUM(CASE WHEN d.status = 'delivered' THEN 1 ELSE 0 END)::float / COUNT(d.id) * 100 as success_rate
            FROM postmen p
            JOIN deliveries d ON d.postman_id = p.id
            WHERE d.delivery_date >= :start_date AND d.delivery_date < :end_date
            GROUP BY p.id, p.name
            ORDER BY deliveries_count DESC, success_rate DESC
            LIMIT :limit
        """)
        
        result = await conn.execute(query, {
            "start_date": start_date,
            "end_date": end_date,
            "limit": limit
        })
        
        return [
            {
                "postman_id": row[0],
                "name": row[1],
                "deliveries": row[2],
                "avg_rating": round(row[3] or 0, 2),
                "success_rate": round(row[4] or 0, 2)
            }
            for row in result.fetchall()
        ]
    
    async def _identify_support_areas(self, conn, start_date: datetime, end_date: datetime) -> List[Dict]:
        """Zones nécessitant support (taux échec >10% ou incidents >5)"""
        query = text("""
            SELECT 
                r.area_code,
                r.area_name,
                COUNT(d.id) as total_deliveries,
                SUM(CASE WHEN d.status IN ('failed', 'returned') THEN 1 ELSE 0 END) as failed_count,
                COUNT(i.id) as incidents_count
            FROM routes r
            LEFT JOIN deliveries d ON d.route_id = r.id
            LEFT JOIN incidents i ON i.route_id = r.id
            WHERE d.delivery_date >= :start_date AND d.delivery_date < :end_date
            GROUP BY r.area_code, r.area_name
            HAVING 
                (SUM(CASE WHEN d.status IN ('failed', 'returned') THEN 1 ELSE 0 END)::float / COUNT(d.id) > 0.10)
                OR COUNT(i.id) > 5
            ORDER BY failed_count DESC, incidents_count DESC
        """)
        
        result = await conn.execute(query, {"start_date": start_date, "end_date": end_date})
        
        return [
            {
                "area_code": row[0],
                "area_name": row[1],
                "total_deliveries": row[2],
                "failed_count": row[3],
                "incidents_count": row[4],
                "failure_rate": round((row[3] / row[2] * 100) if row[2] > 0 else 0, 2)
            }
            for row in result.fetchall()
        ]
    
    async def schedule_automated_reports(self):
        """
        🔄 Planification rapports automatiques
        
        - Daily: 7h00
        - Weekly: Lundi 8h00
        - Monthly: 1er du mois 9h00
        """
        while True:
            now = datetime.now()
            
            # Rapport quotidien à 7h00
            if now.hour == 7 and now.minute == 0:
                report = await self.generate_daily_report()
                await self._send_report_notification(report, recipients=["management@postal.com"])
            
            # Rapport hebdomadaire lundi 8h00
            if now.weekday() == 0 and now.hour == 8 and now.minute == 0:
                report = await self.generate_weekly_report()
                await self._send_report_notification(report, recipients=["management@postal.com", "supervisors@postal.com"])
            
            # Rapport mensuel 1er du mois 9h00
            if now.day == 1 and now.hour == 9 and now.minute == 0:
                report = await self.generate_monthly_report()
                await self._send_report_notification(report, recipients=["management@postal.com", "board@postal.com"])
            
            # Vérifier chaque minute
            await asyncio.sleep(60)
    
    async def _send_report_notification(self, report: KPIReport, recipients: List[str]):
        """Envoyer notification rapport par email"""
        # TODO: Intégrer avec service email
        print(f"📧 Rapport {report.period} envoyé à {recipients}")
        print(f"   Taux succès: {report.delivery_success_rate}%")
        print(f"   Livraisons: {report.successful_deliveries}/{report.total_deliveries}")
