"""
Service pour gérer l'API Realtime d'OpenAI
Gère les appels WebRTC, WebSocket et SIP pour communication temps réel
"""
import os
import sqlite3
import logging
import json
from datetime import datetime
from typing import Optional, Dict, List, Any
from openai import OpenAI

logger = logging.getLogger(__name__)


class RealtimeService:
    """
    Service pour gérer les appels Realtime API OpenAI
    
    Fonctionnalités:
    - Créer des appels WebRTC
    - Gérer les sessions temps réel
    - Monitoring des appels
    - Hangup (terminer les appels)
    - Cache local SQLite
    """
    
    def __init__(self, db_path: str = "data/realtime_calls.db"):
        """
        Initialise le service Realtime
        
        Args:
            db_path: Chemin vers la base de données SQLite
        """
        self.db_path = db_path
        self.client = None
        
        # Initialiser le client OpenAI
        api_key = os.getenv('OPENAI_API_KEY')
        if api_key:
            self.client = OpenAI(api_key=api_key)
        else:
            logger.warning("OPENAI_API_KEY non configurée - Service Realtime limité")
        
        # Initialiser la base de données
        self._init_database()
    
    def _init_database(self):
        """Initialise la base de données SQLite"""
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Table pour les appels
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS realtime_calls (
                call_id TEXT PRIMARY KEY,
                sdp_offer TEXT NOT NULL,
                sdp_answer TEXT,
                model TEXT DEFAULT 'gpt-4o-realtime-preview',
                modalities TEXT,
                instructions TEXT,
                voice TEXT,
                temperature REAL,
                max_response_output_tokens INTEGER,
                status TEXT DEFAULT 'active',
                created_at INTEGER NOT NULL,
                ended_at INTEGER,
                duration_seconds INTEGER,
                metadata TEXT
            )
        ''')
        
        # Table pour les événements d'appel
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS call_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                call_id TEXT NOT NULL,
                event_type TEXT NOT NULL,
                event_data TEXT,
                timestamp INTEGER NOT NULL,
                FOREIGN KEY (call_id) REFERENCES realtime_calls(call_id)
            )
        ''')
        
        # Index pour les requêtes
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_calls_status ON realtime_calls(status)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_calls_created ON realtime_calls(created_at)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_events_call ON call_events(call_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_events_type ON call_events(event_type)')
        
        conn.commit()
        conn.close()
        
        logger.info(f"Base de données Realtime initialisée: {self.db_path}")
    
    def create_call(
        self,
        sdp_offer: str,
        model: str = "gpt-4o-realtime-preview",
        modalities: Optional[List[str]] = None,
        instructions: Optional[str] = None,
        voice: Optional[str] = None,
        temperature: Optional[float] = None,
        max_response_output_tokens: Optional[int] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Crée un nouvel appel Realtime via WebRTC
        
        Args:
            sdp_offer: Session Description Protocol offer du client
            model: Modèle à utiliser (gpt-4o-realtime-preview)
            modalities: Liste des modalités ['text', 'audio']
            instructions: Instructions système pour l'assistant
            voice: Voix à utiliser (alloy, echo, shimmer)
            temperature: Température de génération (0.6-1.2)
            max_response_output_tokens: Limite de tokens par réponse
            metadata: Métadonnées personnalisées
            
        Returns:
            Dict avec call_id, sdp_answer et informations de l'appel
        """
        if not self.client:
            raise ValueError("Client OpenAI non configuré - Vérifiez OPENAI_API_KEY")
        
        if not sdp_offer:
            raise ValueError("sdp_offer est requis")
        
        # Préparer la configuration de session
        session_config = {
            "type": "realtime",
            "model": model
        }
        
        if modalities:
            session_config["modalities"] = modalities
        if instructions:
            session_config["instructions"] = instructions
        if voice:
            session_config["voice"] = voice
        if temperature is not None:
            session_config["temperature"] = temperature
        if max_response_output_tokens:
            session_config["max_response_output_tokens"] = max_response_output_tokens
        
        try:
            # Appeler l'API OpenAI Realtime
            # Note: L'API Realtime utilise un endpoint différent
            import requests
            
            api_key = os.getenv('OPENAI_API_KEY')
            headers = {
                'Authorization': f'Bearer {api_key}'
            }
            
            files = {
                'sdp': ('offer.sdp', sdp_offer, 'application/sdp'),
                'session': (None, json.dumps(session_config), 'application/json')
            }
            
            response = requests.post(
                'https://api.openai.com/v1/realtime/calls',
                headers=headers,
                files=files
            )
            
            response.raise_for_status()
            
            # Extraire le call_id du header Location
            location = response.headers.get('Location', '')
            call_id = location.split('/')[-1] if location else None
            
            # La réponse contient le SDP answer
            sdp_answer = response.text
            
            # Stocker dans la base de données
            call_data = {
                'call_id': call_id or f"call_{int(datetime.now().timestamp())}",
                'sdp_offer': sdp_offer,
                'sdp_answer': sdp_answer,
                'model': model,
                'modalities': json.dumps(modalities) if modalities else None,
                'instructions': instructions,
                'voice': voice,
                'temperature': temperature,
                'max_response_output_tokens': max_response_output_tokens,
                'status': 'active',
                'created_at': int(datetime.now().timestamp()),
                'metadata': json.dumps(metadata) if metadata else None
            }
            
            self._store_call(call_data)
            
            # Logger l'événement de création
            self._log_event(call_data['call_id'], 'call.created', {
                'model': model,
                'modalities': modalities,
                'voice': voice
            })
            
            return {
                'call_id': call_data['call_id'],
                'sdp_answer': sdp_answer,
                'model': model,
                'status': 'active',
                'created_at': call_data['created_at'],
                'session': session_config
            }
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Erreur lors de la création de l'appel: {str(e)}")
            raise Exception(f"Erreur API Realtime: {str(e)}")
    
    def get_call(self, call_id: str, from_cache: bool = True) -> Dict[str, Any]:
        """
        Récupère les informations d'un appel
        
        Args:
            call_id: ID de l'appel
            from_cache: Utiliser le cache local
            
        Returns:
            Dict avec les informations de l'appel
        """
        if not call_id:
            raise ValueError("call_id est requis")
        
        # Récupérer depuis le cache
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM realtime_calls WHERE call_id = ?
        ''', (call_id,))
        
        row = cursor.fetchone()
        conn.close()
        
        if not row:
            raise ValueError(f"Appel {call_id} non trouvé")
        
        return self._row_to_dict(row)
    
    def hangup_call(self, call_id: str) -> Dict[str, Any]:
        """
        Termine un appel en cours
        
        Args:
            call_id: ID de l'appel à terminer
            
        Returns:
            Dict avec les informations de l'appel terminé
        """
        if not self.client:
            raise ValueError("Client OpenAI non configuré")
        
        if not call_id:
            raise ValueError("call_id est requis")
        
        try:
            # Appeler l'API pour terminer l'appel
            import requests
            
            api_key = os.getenv('OPENAI_API_KEY')
            headers = {
                'Authorization': f'Bearer {api_key}'
            }
            
            response = requests.delete(
                f'https://api.openai.com/v1/realtime/calls/{call_id}',
                headers=headers
            )
            
            response.raise_for_status()
            
            # Mettre à jour dans la base de données
            ended_at = int(datetime.now().timestamp())
            
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Récupérer l'heure de création pour calculer la durée
            cursor.execute('SELECT created_at FROM realtime_calls WHERE call_id = ?', (call_id,))
            row = cursor.fetchone()
            
            if row:
                created_at = row[0]
                duration = ended_at - created_at
                
                cursor.execute('''
                    UPDATE realtime_calls 
                    SET status = 'ended', ended_at = ?, duration_seconds = ?
                    WHERE call_id = ?
                ''', (ended_at, duration, call_id))
                
                conn.commit()
            
            conn.close()
            
            # Logger l'événement
            self._log_event(call_id, 'call.ended', {
                'ended_at': ended_at,
                'duration_seconds': duration if row else None
            })
            
            return self.get_call(call_id)
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Erreur lors du hangup: {str(e)}")
            raise Exception(f"Erreur API Realtime: {str(e)}")
    
    def list_calls(
        self,
        limit: int = 20,
        offset: int = 0,
        status: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Liste les appels
        
        Args:
            limit: Nombre maximum d'appels à retourner
            offset: Offset pour la pagination
            status: Filtrer par statut (active, ended)
            
        Returns:
            Liste de dictionnaires avec les appels
        """
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        query = 'SELECT * FROM realtime_calls'
        params = []
        
        if status:
            query += ' WHERE status = ?'
            params.append(status)
        
        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
        params.extend([limit, offset])
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()
        
        return [self._row_to_dict(row) for row in rows]
    
    def get_call_events(
        self,
        call_id: str,
        limit: int = 100,
        event_type: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Récupère les événements d'un appel
        
        Args:
            call_id: ID de l'appel
            limit: Nombre maximum d'événements
            event_type: Filtrer par type d'événement
            
        Returns:
            Liste des événements
        """
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        query = 'SELECT * FROM call_events WHERE call_id = ?'
        params = [call_id]
        
        if event_type:
            query += ' AND event_type = ?'
            params.append(event_type)
        
        query += ' ORDER BY timestamp DESC LIMIT ?'
        params.append(limit)
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()
        
        events = []
        for row in rows:
            event = {
                'id': row['id'],
                'call_id': row['call_id'],
                'event_type': row['event_type'],
                'timestamp': row['timestamp'],
                'event_data': json.loads(row['event_data']) if row['event_data'] else None
            }
            events.append(event)
        
        return events
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Récupère les statistiques des appels
        
        Returns:
            Dict avec les statistiques
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Total appels
        cursor.execute('SELECT COUNT(*) FROM realtime_calls')
        total_calls = cursor.fetchone()[0]
        
        # Appels actifs
        cursor.execute('SELECT COUNT(*) FROM realtime_calls WHERE status = ?', ('active',))
        active_calls = cursor.fetchone()[0]
        
        # Appels terminés
        cursor.execute('SELECT COUNT(*) FROM realtime_calls WHERE status = ?', ('ended',))
        ended_calls = cursor.fetchone()[0]
        
        # Durée moyenne
        cursor.execute('SELECT AVG(duration_seconds) FROM realtime_calls WHERE duration_seconds IS NOT NULL')
        avg_duration = cursor.fetchone()[0] or 0
        
        # Total événements
        cursor.execute('SELECT COUNT(*) FROM call_events')
        total_events = cursor.fetchone()[0]
        
        # Appels par modèle
        cursor.execute('''
            SELECT model, COUNT(*) as count 
            FROM realtime_calls 
            GROUP BY model
        ''')
        calls_by_model = {row[0]: row[1] for row in cursor.fetchall()}
        
        # Appels par voix
        cursor.execute('''
            SELECT voice, COUNT(*) as count 
            FROM realtime_calls 
            WHERE voice IS NOT NULL
            GROUP BY voice
        ''')
        calls_by_voice = {row[0]: row[1] for row in cursor.fetchall()}
        
        conn.close()
        
        return {
            'total_calls': total_calls,
            'active_calls': active_calls,
            'ended_calls': ended_calls,
            'avg_duration_seconds': round(avg_duration, 2),
            'total_events': total_events,
            'calls_by_model': calls_by_model,
            'calls_by_voice': calls_by_voice
        }
    
    def _store_call(self, call_data: Dict[str, Any]):
        """Stocke un appel dans la base de données"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO realtime_calls (
                call_id, sdp_offer, sdp_answer, model, modalities,
                instructions, voice, temperature, max_response_output_tokens,
                status, created_at, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            call_data['call_id'],
            call_data['sdp_offer'],
            call_data['sdp_answer'],
            call_data['model'],
            call_data.get('modalities'),
            call_data.get('instructions'),
            call_data.get('voice'),
            call_data.get('temperature'),
            call_data.get('max_response_output_tokens'),
            call_data['status'],
            call_data['created_at'],
            call_data.get('metadata')
        ))
        
        conn.commit()
        conn.close()
    
    def _log_event(self, call_id: str, event_type: str, event_data: Optional[Dict[str, Any]] = None):
        """Enregistre un événement d'appel"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO call_events (call_id, event_type, event_data, timestamp)
            VALUES (?, ?, ?, ?)
        ''', (
            call_id,
            event_type,
            json.dumps(event_data) if event_data else None,
            int(datetime.now().timestamp())
        ))
        
        conn.commit()
        conn.close()
    
    def _row_to_dict(self, row: sqlite3.Row) -> Dict[str, Any]:
        """Convertit une ligne SQLite en dictionnaire"""
        call = {
            'call_id': row['call_id'],
            'model': row['model'],
            'status': row['status'],
            'created_at': row['created_at'],
            'ended_at': row['ended_at'],
            'duration_seconds': row['duration_seconds']
        }
        
        # Ajouter les champs optionnels
        if row['modalities']:
            call['modalities'] = json.loads(row['modalities'])
        if row['instructions']:
            call['instructions'] = row['instructions']
        if row['voice']:
            call['voice'] = row['voice']
        if row['temperature']:
            call['temperature'] = row['temperature']
        if row['max_response_output_tokens']:
            call['max_response_output_tokens'] = row['max_response_output_tokens']
        if row['metadata']:
            call['metadata'] = json.loads(row['metadata'])
        
        return call
