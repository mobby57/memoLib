"""
📋 Système de Gestion des TODOs et Notifications
Basé sur l'analyse de documents avec authentification
"""
import sqlite3
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any
from enum import Enum
import json


class TodoStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class NotificationType(str, Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"
    SUCCESS = "success"


class TodoNotificationManager:
    """Gestionnaire de TODOs et Notifications avec persistance"""
    
    def __init__(self, db_path: str = "data/todos_notifications.db"):
        self.db_path = db_path
        self._init_db()
    
    def _init_db(self):
        """Initialise la base de données"""
        with sqlite3.connect(self.db_path) as conn:
            conn.executescript('''
                -- Table des TODOs
                CREATE TABLE IF NOT EXISTS todos (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    document_id TEXT,
                    task TEXT NOT NULL,
                    description TEXT,
                    deadline TEXT,
                    priority TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'pending',
                    created_at TEXT NOT NULL,
                    updated_at TEXT,
                    completed_at TEXT,
                    metadata TEXT
                );
                
                -- Table des Notifications
                CREATE TABLE IF NOT EXISTS notifications (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    todo_id TEXT,
                    document_id TEXT,
                    type TEXT NOT NULL,
                    message TEXT NOT NULL,
                    alert_date TEXT NOT NULL,
                    priority TEXT NOT NULL,
                    read BOOLEAN DEFAULT 0,
                    dismissed BOOLEAN DEFAULT 0,
                    created_at TEXT NOT NULL,
                    metadata TEXT,
                    FOREIGN KEY (todo_id) REFERENCES todos(id)
                );
                
                -- Table des Documents Analysés
                CREATE TABLE IF NOT EXISTS analyzed_documents (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    document_type TEXT NOT NULL,
                    emetteur TEXT,
                    reference TEXT,
                    montant REAL,
                    date_limite TEXT,
                    delai_jours INTEGER,
                    urgence TEXT,
                    risk_score INTEGER,
                    analysis_result TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    metadata TEXT
                );
                
                -- Index pour performance
                CREATE INDEX IF NOT EXISTS idx_todos_user_status ON todos(user_id, status);
                CREATE INDEX IF NOT EXISTS idx_todos_deadline ON todos(deadline);
                CREATE INDEX IF NOT EXISTS idx_notifs_user_read ON notifications(user_id, read);
                CREATE INDEX IF NOT EXISTS idx_notifs_priority ON notifications(priority, alert_date);
                CREATE INDEX IF NOT EXISTS idx_docs_user_deadline ON analyzed_documents(user_id, date_limite);
            ''')
    
    # ========== TODOS ==========
    
    def create_todo(self, user_id: str, task: str, deadline: Optional[str] = None, 
                   priority: str = "medium", document_id: Optional[str] = None,
                   description: Optional[str] = None, metadata: Optional[Dict] = None) -> str:
        """Crée un nouveau TODO"""
        todo_id = f"todo_{datetime.now().timestamp()}_{user_id}"
        
        with sqlite3.connect(self.db_path) as conn:
            conn.execute('''
                INSERT INTO todos (id, user_id, document_id, task, description, deadline, 
                                 priority, status, created_at, metadata)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                todo_id, user_id, document_id, task, description, deadline,
                priority, TodoStatus.PENDING, datetime.now().isoformat(),
                json.dumps(metadata) if metadata else None
            ))
        
        return todo_id
    
    def get_user_todos(self, user_id: str, status: Optional[str] = None,
                      include_completed: bool = False) -> List[Dict]:
        """Récupère les TODOs d'un utilisateur"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            
            if status:
                query = "SELECT * FROM todos WHERE user_id = ? AND status = ? ORDER BY deadline ASC"
                rows = conn.execute(query, (user_id, status)).fetchall()
            elif not include_completed:
                query = "SELECT * FROM todos WHERE user_id = ? AND status != ? ORDER BY deadline ASC"
                rows = conn.execute(query, (user_id, TodoStatus.COMPLETED)).fetchall()
            else:
                query = "SELECT * FROM todos WHERE user_id = ? ORDER BY deadline ASC"
                rows = conn.execute(query, (user_id,)).fetchall()
            
            return [self._row_to_dict(row) for row in rows]
    
    def get_overdue_todos(self, user_id: str) -> List[Dict]:
        """Récupère les TODOs en retard"""
        today = datetime.now().date().isoformat()
        
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            rows = conn.execute('''
                SELECT * FROM todos 
                WHERE user_id = ? 
                AND status IN (?, ?)
                AND deadline < ?
                ORDER BY deadline ASC
            ''', (user_id, TodoStatus.PENDING, TodoStatus.IN_PROGRESS, today)).fetchall()
            
            return [self._row_to_dict(row) for row in rows]
    
    def get_upcoming_todos(self, user_id: str, days: int = 7) -> List[Dict]:
        """Récupère les TODOs à venir dans les X prochains jours"""
        today = datetime.now().date()
        future = (today + timedelta(days=days)).isoformat()
        today_str = today.isoformat()
        
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            rows = conn.execute('''
                SELECT * FROM todos 
                WHERE user_id = ? 
                AND status IN (?, ?)
                AND deadline BETWEEN ? AND ?
                ORDER BY deadline ASC
            ''', (user_id, TodoStatus.PENDING, TodoStatus.IN_PROGRESS, today_str, future)).fetchall()
            
            return [self._row_to_dict(row) for row in rows]
    
    def update_todo_status(self, todo_id: str, status: str, user_id: str) -> bool:
        """Met à jour le statut d'un TODO"""
        with sqlite3.connect(self.db_path) as conn:
            updates = {"status": status, "updated_at": datetime.now().isoformat()}
            
            if status == TodoStatus.COMPLETED:
                updates["completed_at"] = datetime.now().isoformat()
            
            set_clause = ", ".join([f"{k} = ?" for k in updates.keys()])
            values = list(updates.values()) + [todo_id, user_id]
            
            cursor = conn.execute(
                f"UPDATE todos SET {set_clause} WHERE id = ? AND user_id = ?",
                values
            )
            
            return cursor.rowcount > 0
    
    def delete_todo(self, todo_id: str, user_id: str) -> bool:
        """Supprime un TODO"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute(
                "DELETE FROM todos WHERE id = ? AND user_id = ?",
                (todo_id, user_id)
            )
            return cursor.rowcount > 0
    
    # ========== NOTIFICATIONS ==========
    
    def create_notification(self, user_id: str, message: str, type: str = "info",
                          priority: str = "medium", todo_id: Optional[str] = None,
                          document_id: Optional[str] = None, metadata: Optional[Dict] = None) -> str:
        """Crée une nouvelle notification"""
        notif_id = f"notif_{datetime.now().timestamp()}_{user_id}"
        
        with sqlite3.connect(self.db_path) as conn:
            conn.execute('''
                INSERT INTO notifications (id, user_id, todo_id, document_id, type, message,
                                         alert_date, priority, created_at, metadata)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                notif_id, user_id, todo_id, document_id, type, message,
                datetime.now().isoformat(), priority, datetime.now().isoformat(),
                json.dumps(metadata) if metadata else None
            ))
        
        return notif_id
    
    def get_user_notifications(self, user_id: str, unread_only: bool = False,
                              limit: int = 50) -> List[Dict]:
        """Récupère les notifications d'un utilisateur"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            
            if unread_only:
                query = '''SELECT * FROM notifications 
                          WHERE user_id = ? AND read = 0 AND dismissed = 0
                          ORDER BY alert_date DESC LIMIT ?'''
            else:
                query = '''SELECT * FROM notifications 
                          WHERE user_id = ? 
                          ORDER BY alert_date DESC LIMIT ?'''
            
            rows = conn.execute(query, (user_id, limit)).fetchall()
            return [self._row_to_dict(row) for row in rows]
    
    def mark_notification_read(self, notif_id: str, user_id: str) -> bool:
        """Marque une notification comme lue"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute(
                "UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?",
                (notif_id, user_id)
            )
            return cursor.rowcount > 0
    
    def dismiss_notification(self, notif_id: str, user_id: str) -> bool:
        """Dismiss une notification"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute(
                "UPDATE notifications SET dismissed = 1 WHERE id = ? AND user_id = ?",
                (notif_id, user_id)
            )
            return cursor.rowcount > 0
    
    # ========== DOCUMENTS ==========
    
    def save_document_analysis(self, user_id: str, analysis: Dict, 
                              document_id: Optional[str] = None) -> str:
        """Sauvegarde l'analyse d'un document"""
        if not document_id:
            document_id = f"doc_{datetime.now().timestamp()}_{user_id}"
        
        with sqlite3.connect(self.db_path) as conn:
            conn.execute('''
                INSERT INTO analyzed_documents 
                (id, user_id, document_type, emetteur, reference, montant, 
                 date_limite, delai_jours, urgence, risk_score, analysis_result, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                document_id, user_id,
                analysis.get("type"), analysis.get("emetteur"), analysis.get("reference"),
                analysis.get("montant"), analysis.get("date_limite"), analysis.get("delai_jours"),
                analysis.get("urgence"), analysis.get("risk_score"),
                json.dumps(analysis), datetime.now().isoformat()
            ))
        
        return document_id
    
    def get_user_documents(self, user_id: str, limit: int = 50) -> List[Dict]:
        """Récupère les documents analysés d'un utilisateur"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            rows = conn.execute('''
                SELECT * FROM analyzed_documents 
                WHERE user_id = ? 
                ORDER BY created_at DESC LIMIT ?
            ''', (user_id, limit)).fetchall()
            
            return [self._row_to_dict(row) for row in rows]
    
    def get_documents_with_deadlines(self, user_id: str, days_ahead: int = 30) -> List[Dict]:
        """Récupère les documents avec deadlines approchantes"""
        today = datetime.now().date().isoformat()
        future = (datetime.now().date() + timedelta(days=days_ahead)).isoformat()
        
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            rows = conn.execute('''
                SELECT * FROM analyzed_documents 
                WHERE user_id = ? 
                AND date_limite BETWEEN ? AND ?
                ORDER BY date_limite ASC
            ''', (user_id, today, future)).fetchall()
            
            return [self._row_to_dict(row) for row in rows]
    
    # ========== STATS ==========
    
    def get_user_stats(self, user_id: str) -> Dict:
        """Statistiques de l'utilisateur"""
        with sqlite3.connect(self.db_path) as conn:
            stats = {}
            
            # TODOs
            stats["total_todos"] = conn.execute(
                "SELECT COUNT(*) FROM todos WHERE user_id = ?", (user_id,)
            ).fetchone()[0]
            
            stats["pending_todos"] = conn.execute(
                "SELECT COUNT(*) FROM todos WHERE user_id = ? AND status = ?",
                (user_id, TodoStatus.PENDING)
            ).fetchone()[0]
            
            stats["completed_todos"] = conn.execute(
                "SELECT COUNT(*) FROM todos WHERE user_id = ? AND status = ?",
                (user_id, TodoStatus.COMPLETED)
            ).fetchone()[0]
            
            # Notifications
            stats["unread_notifications"] = conn.execute(
                "SELECT COUNT(*) FROM notifications WHERE user_id = ? AND read = 0",
                (user_id,)
            ).fetchone()[0]
            
            # Documents
            stats["total_documents"] = conn.execute(
                "SELECT COUNT(*) FROM analyzed_documents WHERE user_id = ?", (user_id,)
            ).fetchone()[0]
            
            # High risk documents
            stats["high_risk_documents"] = conn.execute(
                "SELECT COUNT(*) FROM analyzed_documents WHERE user_id = ? AND risk_score > 60",
                (user_id,)
            ).fetchone()[0]
            
            return stats
    
    # ========== HELPERS ==========
    
    def _row_to_dict(self, row: sqlite3.Row) -> Dict:
        """Convertit une Row SQLite en dictionnaire"""
        d = dict(row)
        
        # Parser le JSON si présent
        if "metadata" in d and d["metadata"]:
            try:
                d["metadata"] = json.loads(d["metadata"])
            except:
                pass
        
        if "analysis_result" in d and d["analysis_result"]:
            try:
                d["analysis_result"] = json.loads(d["analysis_result"])
            except:
                pass
        
        return d


# Instance globale
todo_notification_manager = TodoNotificationManager()
