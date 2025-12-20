"""
Service de gestion des webhooks OpenAI
Gère la réception et le traitement des événements webhook d'OpenAI
"""
import hmac
import hashlib
import logging
from datetime import datetime
from typing import Dict, Any, Optional
import json
import os

logger = logging.getLogger(__name__)


class WebhookService:
    """Service pour gérer les webhooks OpenAI"""
    
    def __init__(self, db_path: str = None):
        """Initialise le service webhook
        
        Args:
            db_path: Chemin vers la base de données pour stocker les événements
        """
        self.db_path = db_path or os.path.join(os.path.dirname(__file__), '..', 'data', 'webhooks.db')
        self.webhook_secret = os.environ.get('OPENAI_WEBHOOK_SECRET', '')
        self._init_database()
        
    def _init_database(self):
        """Initialise la base de données pour stocker les événements webhook"""
        import sqlite3
        
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Table pour stocker tous les événements webhook
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS webhook_events (
                id TEXT PRIMARY KEY,
                event_type TEXT NOT NULL,
                event_object TEXT,
                created_at INTEGER NOT NULL,
                received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                data TEXT NOT NULL,
                status TEXT DEFAULT 'received',
                processing_error TEXT
            )
        ''')
        
        # Table pour les événements de réponse (response.*)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS response_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_id TEXT NOT NULL,
                response_id TEXT NOT NULL,
                status TEXT NOT NULL,
                created_at INTEGER NOT NULL,
                FOREIGN KEY (event_id) REFERENCES webhook_events(id)
            )
        ''')
        
        # Table pour les événements batch (batch.*)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS batch_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_id TEXT NOT NULL,
                batch_id TEXT NOT NULL,
                status TEXT NOT NULL,
                created_at INTEGER NOT NULL,
                FOREIGN KEY (event_id) REFERENCES webhook_events(id)
            )
        ''')
        
        # Table pour les événements fine-tuning (fine_tuning.job.*)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS fine_tuning_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_id TEXT NOT NULL,
                job_id TEXT NOT NULL,
                status TEXT NOT NULL,
                created_at INTEGER NOT NULL,
                FOREIGN KEY (event_id) REFERENCES webhook_events(id)
            )
        ''')
        
        # Table pour les événements eval (eval.run.*)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS eval_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_id TEXT NOT NULL,
                eval_run_id TEXT NOT NULL,
                status TEXT NOT NULL,
                created_at INTEGER NOT NULL,
                FOREIGN KEY (event_id) REFERENCES webhook_events(id)
            )
        ''')
        
        # Table pour les événements realtime (realtime.call.*)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS realtime_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_id TEXT NOT NULL,
                call_id TEXT,
                status TEXT NOT NULL,
                created_at INTEGER NOT NULL,
                FOREIGN KEY (event_id) REFERENCES webhook_events(id)
            )
        ''')
        
        # Index pour améliorer les performances
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_event_type ON webhook_events(event_type)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_created_at ON webhook_events(created_at)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_status ON webhook_events(status)')
        
        conn.commit()
        conn.close()
        
    def verify_signature(self, payload: bytes, signature: str) -> bool:
        """Vérifie la signature webhook pour s'assurer de l'authenticité
        
        Args:
            payload: Corps de la requête brut en bytes
            signature: Signature fournie dans les headers
            
        Returns:
            True si la signature est valide
        """
        if not self.webhook_secret:
            logger.warning("Aucun secret webhook configuré - la vérification est désactivée")
            return True
            
        expected_signature = hmac.new(
            self.webhook_secret.encode('utf-8'),
            payload,
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(signature, expected_signature)
    
    def process_event(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Traite un événement webhook reçu
        
        Args:
            event_data: Données de l'événement webhook
            
        Returns:
            Résultat du traitement
        """
        try:
            event_id = event_data.get('id')
            event_type = event_data.get('type')
            created_at = event_data.get('created_at')
            data = event_data.get('data', {})
            
            if not all([event_id, event_type, created_at]):
                raise ValueError("Événement webhook invalide: champs manquants")
            
            # Enregistrer l'événement dans la base de données
            self._store_event(event_id, event_type, event_data.get('object'), created_at, data)
            
            # Traiter selon le type d'événement
            handler_map = {
                'response.completed': self._handle_response_completed,
                'response.cancelled': self._handle_response_cancelled,
                'response.failed': self._handle_response_failed,
                'response.incomplete': self._handle_response_incomplete,
                'batch.completed': self._handle_batch_completed,
                'batch.cancelled': self._handle_batch_cancelled,
                'batch.expired': self._handle_batch_expired,
                'batch.failed': self._handle_batch_failed,
                'fine_tuning.job.succeeded': self._handle_fine_tuning_succeeded,
                'fine_tuning.job.failed': self._handle_fine_tuning_failed,
                'fine_tuning.job.cancelled': self._handle_fine_tuning_cancelled,
                'eval.run.succeeded': self._handle_eval_succeeded,
                'eval.run.failed': self._handle_eval_failed,
                'eval.run.canceled': self._handle_eval_canceled,
                'realtime.call.incoming': self._handle_realtime_call_incoming,
            }
            
            handler = handler_map.get(event_type)
            if handler:
                handler(event_id, data, created_at)
                self._update_event_status(event_id, 'processed')
            else:
                logger.warning(f"Type d'événement non géré: {event_type}")
                self._update_event_status(event_id, 'unhandled')
            
            return {
                'success': True,
                'event_id': event_id,
                'event_type': event_type,
                'processed_at': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Erreur lors du traitement de l'événement webhook: {str(e)}")
            if 'event_id' in locals():
                self._update_event_status(event_id, 'error', str(e))
            raise
    
    def _store_event(self, event_id: str, event_type: str, event_object: str, 
                     created_at: int, data: Dict[str, Any]):
        """Stocke un événement dans la base de données"""
        import sqlite3
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute('''
                INSERT INTO webhook_events (id, event_type, event_object, created_at, data)
                VALUES (?, ?, ?, ?, ?)
            ''', (event_id, event_type, event_object, created_at, json.dumps(data)))
            
            conn.commit()
        except sqlite3.IntegrityError:
            logger.warning(f"Événement déjà existant: {event_id}")
        finally:
            conn.close()
    
    def _update_event_status(self, event_id: str, status: str, error: str = None):
        """Met à jour le statut d'un événement"""
        import sqlite3
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE webhook_events 
            SET status = ?, processing_error = ?
            WHERE id = ?
        ''', (status, error, event_id))
        
        conn.commit()
        conn.close()
    
    # Handlers pour les événements de réponse
    def _handle_response_completed(self, event_id: str, data: Dict[str, Any], created_at: int):
        """Gère l'événement response.completed"""
        import sqlite3
        
        response_id = data.get('id')
        logger.info(f"Réponse complétée: {response_id}")
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO response_events (event_id, response_id, status, created_at)
            VALUES (?, ?, ?, ?)
        ''', (event_id, response_id, 'completed', created_at))
        
        conn.commit()
        conn.close()
    
    def _handle_response_cancelled(self, event_id: str, data: Dict[str, Any], created_at: int):
        """Gère l'événement response.cancelled"""
        import sqlite3
        
        response_id = data.get('id')
        logger.info(f"Réponse annulée: {response_id}")
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO response_events (event_id, response_id, status, created_at)
            VALUES (?, ?, ?, ?)
        ''', (event_id, response_id, 'cancelled', created_at))
        
        conn.commit()
        conn.close()
    
    def _handle_response_failed(self, event_id: str, data: Dict[str, Any], created_at: int):
        """Gère l'événement response.failed"""
        import sqlite3
        
        response_id = data.get('id')
        logger.error(f"Réponse échouée: {response_id}")
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO response_events (event_id, response_id, status, created_at)
            VALUES (?, ?, ?, ?)
        ''', (event_id, response_id, 'failed', created_at))
        
        conn.commit()
        conn.close()
    
    def _handle_response_incomplete(self, event_id: str, data: Dict[str, Any], created_at: int):
        """Gère l'événement response.incomplete"""
        import sqlite3
        
        response_id = data.get('id')
        logger.warning(f"Réponse incomplète: {response_id}")
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO response_events (event_id, response_id, status, created_at)
            VALUES (?, ?, ?, ?)
        ''', (event_id, response_id, 'incomplete', created_at))
        
        conn.commit()
        conn.close()
    
    # Handlers pour les événements batch
    def _handle_batch_completed(self, event_id: str, data: Dict[str, Any], created_at: int):
        """Gère l'événement batch.completed"""
        import sqlite3
        
        batch_id = data.get('id')
        logger.info(f"Batch complété: {batch_id}")
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO batch_events (event_id, batch_id, status, created_at)
            VALUES (?, ?, ?, ?)
        ''', (event_id, batch_id, 'completed', created_at))
        
        conn.commit()
        conn.close()
    
    def _handle_batch_cancelled(self, event_id: str, data: Dict[str, Any], created_at: int):
        """Gère l'événement batch.cancelled"""
        import sqlite3
        
        batch_id = data.get('id')
        logger.info(f"Batch annulé: {batch_id}")
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO batch_events (event_id, batch_id, status, created_at)
            VALUES (?, ?, ?, ?)
        ''', (event_id, batch_id, 'cancelled', created_at))
        
        conn.commit()
        conn.close()
    
    def _handle_batch_expired(self, event_id: str, data: Dict[str, Any], created_at: int):
        """Gère l'événement batch.expired"""
        import sqlite3
        
        batch_id = data.get('id')
        logger.warning(f"Batch expiré: {batch_id}")
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO batch_events (event_id, batch_id, status, created_at)
            VALUES (?, ?, ?, ?)
        ''', (event_id, batch_id, 'expired', created_at))
        
        conn.commit()
        conn.close()
    
    def _handle_batch_failed(self, event_id: str, data: Dict[str, Any], created_at: int):
        """Gère l'événement batch.failed"""
        import sqlite3
        
        batch_id = data.get('id')
        logger.error(f"Batch échoué: {batch_id}")
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO batch_events (event_id, batch_id, status, created_at)
            VALUES (?, ?, ?, ?)
        ''', (event_id, batch_id, 'failed', created_at))
        
        conn.commit()
        conn.close()
    
    # Handlers pour les événements fine-tuning
    def _handle_fine_tuning_succeeded(self, event_id: str, data: Dict[str, Any], created_at: int):
        """Gère l'événement fine_tuning.job.succeeded"""
        import sqlite3
        
        job_id = data.get('id')
        logger.info(f"Fine-tuning réussi: {job_id}")
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO fine_tuning_events (event_id, job_id, status, created_at)
            VALUES (?, ?, ?, ?)
        ''', (event_id, job_id, 'succeeded', created_at))
        
        conn.commit()
        conn.close()
    
    def _handle_fine_tuning_failed(self, event_id: str, data: Dict[str, Any], created_at: int):
        """Gère l'événement fine_tuning.job.failed"""
        import sqlite3
        
        job_id = data.get('id')
        logger.error(f"Fine-tuning échoué: {job_id}")
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO fine_tuning_events (event_id, job_id, status, created_at)
            VALUES (?, ?, ?, ?)
        ''', (event_id, job_id, 'failed', created_at))
        
        conn.commit()
        conn.close()
    
    def _handle_fine_tuning_cancelled(self, event_id: str, data: Dict[str, Any], created_at: int):
        """Gère l'événement fine_tuning.job.cancelled"""
        import sqlite3
        
        job_id = data.get('id')
        logger.info(f"Fine-tuning annulé: {job_id}")
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO fine_tuning_events (event_id, job_id, status, created_at)
            VALUES (?, ?, ?, ?)
        ''', (event_id, job_id, 'cancelled', created_at))
        
        conn.commit()
        conn.close()
    
    # Handlers pour les événements eval
    def _handle_eval_succeeded(self, event_id: str, data: Dict[str, Any], created_at: int):
        """Gère l'événement eval.run.succeeded"""
        import sqlite3
        
        eval_run_id = data.get('id')
        logger.info(f"Eval réussi: {eval_run_id}")
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO eval_events (event_id, eval_run_id, status, created_at)
            VALUES (?, ?, ?, ?)
        ''', (event_id, eval_run_id, 'succeeded', created_at))
        
        conn.commit()
        conn.close()
    
    def _handle_eval_failed(self, event_id: str, data: Dict[str, Any], created_at: int):
        """Gère l'événement eval.run.failed"""
        import sqlite3
        
        eval_run_id = data.get('id')
        logger.error(f"Eval échoué: {eval_run_id}")
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO eval_events (event_id, eval_run_id, status, created_at)
            VALUES (?, ?, ?, ?)
        ''', (event_id, eval_run_id, 'failed', created_at))
        
        conn.commit()
        conn.close()
    
    def _handle_eval_canceled(self, event_id: str, data: Dict[str, Any], created_at: int):
        """Gère l'événement eval.run.canceled"""
        import sqlite3
        
        eval_run_id = data.get('id')
        logger.info(f"Eval annulé: {eval_run_id}")
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO eval_events (event_id, eval_run_id, status, created_at)
            VALUES (?, ?, ?, ?)
        ''', (event_id, eval_run_id, 'canceled', created_at))
        
        conn.commit()
        conn.close()
    
    # Handlers pour les événements realtime
    def _handle_realtime_call_incoming(self, event_id: str, data: Dict[str, Any], created_at: int):
        """Gère l'événement realtime.call.incoming"""
        import sqlite3
        
        call_id = data.get('id')
        logger.info(f"Appel entrant: {call_id}")
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO realtime_events (event_id, call_id, status, created_at)
            VALUES (?, ?, ?, ?)
        ''', (event_id, call_id, 'incoming', created_at))
        
        conn.commit()
        conn.close()
    
    # Méthodes de récupération des données
    def get_events(self, event_type: str = None, limit: int = 100, offset: int = 0) -> list:
        """Récupère les événements webhook
        
        Args:
            event_type: Type d'événement à filtrer (optionnel)
            limit: Nombre maximum d'événements à retourner
            offset: Décalage pour la pagination
            
        Returns:
            Liste des événements
        """
        import sqlite3
        
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        if event_type:
            cursor.execute('''
                SELECT * FROM webhook_events 
                WHERE event_type = ?
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
            ''', (event_type, limit, offset))
        else:
            cursor.execute('''
                SELECT * FROM webhook_events 
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
            ''', (limit, offset))
        
        rows = cursor.fetchall()
        conn.close()
        
        return [dict(row) for row in rows]
    
    def get_event_stats(self) -> Dict[str, Any]:
        """Récupère les statistiques des événements webhook
        
        Returns:
            Dictionnaire contenant les statistiques
        """
        import sqlite3
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Total d'événements par type
        cursor.execute('''
            SELECT event_type, COUNT(*) as count
            FROM webhook_events
            GROUP BY event_type
        ''')
        events_by_type = {row[0]: row[1] for row in cursor.fetchall()}
        
        # Total d'événements par statut
        cursor.execute('''
            SELECT status, COUNT(*) as count
            FROM webhook_events
            GROUP BY status
        ''')
        events_by_status = {row[0]: row[1] for row in cursor.fetchall()}
        
        # Événements récents (dernières 24h)
        cursor.execute('''
            SELECT COUNT(*) 
            FROM webhook_events
            WHERE created_at > ?
        ''', (int((datetime.utcnow() - timedelta(days=1)).timestamp()),))
        recent_events = cursor.fetchone()[0]
        
        conn.close()
        
        return {
            'events_by_type': events_by_type,
            'events_by_status': events_by_status,
            'recent_events_24h': recent_events,
            'total_events': sum(events_by_type.values())
        }
