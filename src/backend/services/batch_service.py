"""
Service de gestion des batches OpenAI
Gère la création, le suivi et la gestion des batches d'API OpenAI
"""
import os
import json
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
import sqlite3
from openai import OpenAI

logger = logging.getLogger(__name__)


class BatchService:
    """Service pour gérer les batches OpenAI"""
    
    def __init__(self, db_path: str = None):
        """Initialise le service batch
        
        Args:
            db_path: Chemin vers la base de données pour stocker les batches
        """
        self.db_path = db_path or os.path.join(os.path.dirname(__file__), '..', 'data', 'batches.db')
        self.api_key = os.environ.get('OPENAI_API_KEY')
        
        if not self.api_key:
            logger.warning("OPENAI_API_KEY non configurée - service batch limité")
            self.client = None
        else:
            self.client = OpenAI(api_key=self.api_key)
        
        self._init_database()
    
    def _init_database(self):
        """Initialise la base de données pour stocker les batches"""
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Table pour stocker les batches
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS batches (
                id TEXT PRIMARY KEY,
                object TEXT DEFAULT 'batch',
                endpoint TEXT NOT NULL,
                model TEXT,
                input_file_id TEXT NOT NULL,
                completion_window TEXT NOT NULL,
                status TEXT NOT NULL,
                output_file_id TEXT,
                error_file_id TEXT,
                created_at INTEGER NOT NULL,
                in_progress_at INTEGER,
                expires_at INTEGER,
                finalizing_at INTEGER,
                completed_at INTEGER,
                failed_at INTEGER,
                expired_at INTEGER,
                cancelling_at INTEGER,
                cancelled_at INTEGER,
                request_counts_total INTEGER DEFAULT 0,
                request_counts_completed INTEGER DEFAULT 0,
                request_counts_failed INTEGER DEFAULT 0,
                metadata TEXT,
                errors TEXT,
                usage_input_tokens INTEGER,
                usage_output_tokens INTEGER,
                usage_total_tokens INTEGER,
                local_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                local_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Table pour stocker les fichiers uploadés
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS batch_files (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                file_id TEXT UNIQUE NOT NULL,
                filename TEXT NOT NULL,
                purpose TEXT NOT NULL,
                bytes INTEGER,
                created_at INTEGER NOT NULL,
                status TEXT DEFAULT 'uploaded',
                local_path TEXT
            )
        ''')
        
        # Index pour améliorer les performances
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_batch_status ON batches(status)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_batch_created ON batches(created_at)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_file_id ON batch_files(file_id)')
        
        conn.commit()
        conn.close()
    
    def create_batch_file(self, requests: List[Dict[str, Any]], filename: str = None) -> str:
        """Crée un fichier JSONL pour le batch
        
        Args:
            requests: Liste des requêtes au format batch
            filename: Nom du fichier (optionnel)
            
        Returns:
            Chemin du fichier créé
        """
        if not filename:
            filename = f"batch_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jsonl"
        
        # Créer le dossier uploads s'il n'existe pas
        uploads_dir = os.path.join(os.path.dirname(__file__), '..', 'uploads', 'batches')
        os.makedirs(uploads_dir, exist_ok=True)
        
        filepath = os.path.join(uploads_dir, filename)
        
        # Écrire les requêtes au format JSONL
        with open(filepath, 'w', encoding='utf-8') as f:
            for request in requests:
                f.write(json.dumps(request) + '\n')
        
        logger.info(f"Fichier batch créé: {filepath} ({len(requests)} requêtes)")
        return filepath
    
    def upload_file(self, filepath: str, purpose: str = "batch") -> Dict[str, Any]:
        """Upload un fichier vers OpenAI
        
        Args:
            filepath: Chemin du fichier à uploader
            purpose: Purpose du fichier (batch, fine-tune, etc.)
            
        Returns:
            Informations du fichier uploadé
        """
        if not self.client:
            raise ValueError("Client OpenAI non initialisé - vérifier OPENAI_API_KEY")
        
        with open(filepath, 'rb') as f:
            file_response = self.client.files.create(
                file=f,
                purpose=purpose
            )
        
        # Stocker les infos du fichier en base
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO batch_files (file_id, filename, purpose, bytes, created_at, local_path)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            file_response.id,
            os.path.basename(filepath),
            purpose,
            file_response.bytes,
            file_response.created_at,
            filepath
        ))
        
        conn.commit()
        conn.close()
        
        logger.info(f"Fichier uploadé: {file_response.id}")
        
        return {
            'id': file_response.id,
            'filename': file_response.filename,
            'bytes': file_response.bytes,
            'created_at': file_response.created_at,
            'purpose': file_response.purpose
        }
    
    def create_batch(self, 
                     input_file_id: str, 
                     endpoint: str,
                     completion_window: str = "24h",
                     metadata: Dict[str, str] = None) -> Dict[str, Any]:
        """Crée un nouveau batch
        
        Args:
            input_file_id: ID du fichier uploadé
            endpoint: Endpoint à utiliser (/v1/chat/completions, etc.)
            completion_window: Fenêtre de completion (24h)
            metadata: Métadonnées optionnelles
            
        Returns:
            Informations du batch créé
        """
        if not self.client:
            raise ValueError("Client OpenAI non initialisé - vérifier OPENAI_API_KEY")
        
        # Créer le batch via l'API OpenAI
        batch_params = {
            'input_file_id': input_file_id,
            'endpoint': endpoint,
            'completion_window': completion_window
        }
        
        if metadata:
            batch_params['metadata'] = metadata
        
        batch = self.client.batches.create(**batch_params)
        
        # Stocker en base de données
        self._store_batch(batch)
        
        logger.info(f"Batch créé: {batch.id}")
        
        return self._batch_to_dict(batch)
    
    def get_batch(self, batch_id: str, refresh: bool = True) -> Dict[str, Any]:
        """Récupère les informations d'un batch
        
        Args:
            batch_id: ID du batch
            refresh: Si True, récupère depuis l'API, sinon depuis la base locale
            
        Returns:
            Informations du batch
        """
        if refresh and self.client:
            # Récupérer depuis l'API OpenAI
            batch = self.client.batches.retrieve(batch_id)
            self._store_batch(batch)
            return self._batch_to_dict(batch)
        else:
            # Récupérer depuis la base locale
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            cursor.execute('SELECT * FROM batches WHERE id = ?', (batch_id,))
            row = cursor.fetchone()
            conn.close()
            
            if not row:
                raise ValueError(f"Batch {batch_id} non trouvé")
            
            return dict(row)
    
    def cancel_batch(self, batch_id: str) -> Dict[str, Any]:
        """Annule un batch en cours
        
        Args:
            batch_id: ID du batch à annuler
            
        Returns:
            Informations du batch annulé
        """
        if not self.client:
            raise ValueError("Client OpenAI non initialisé - vérifier OPENAI_API_KEY")
        
        batch = self.client.batches.cancel(batch_id)
        self._store_batch(batch)
        
        logger.info(f"Batch annulé: {batch_id}")
        
        return self._batch_to_dict(batch)
    
    def list_batches(self, limit: int = 20, after: str = None) -> Dict[str, Any]:
        """Liste les batches
        
        Args:
            limit: Nombre maximum de batches à retourner
            after: Cursor pour la pagination
            
        Returns:
            Liste des batches
        """
        if not self.client:
            raise ValueError("Client OpenAI non initialisé - vérifier OPENAI_API_KEY")
        
        params = {'limit': min(limit, 100)}
        if after:
            params['after'] = after
        
        batches = self.client.batches.list(**params)
        
        # Stocker tous les batches en base
        for batch in batches.data:
            self._store_batch(batch)
        
        return {
            'object': 'list',
            'data': [self._batch_to_dict(b) for b in batches.data],
            'first_id': batches.first_id,
            'last_id': batches.last_id,
            'has_more': batches.has_more
        }
    
    def get_local_batches(self, 
                         status: str = None, 
                         limit: int = 50, 
                         offset: int = 0) -> List[Dict[str, Any]]:
        """Récupère les batches depuis la base locale
        
        Args:
            status: Filtrer par statut (optionnel)
            limit: Nombre maximum de batches
            offset: Décalage pour pagination
            
        Returns:
            Liste des batches
        """
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        if status:
            cursor.execute('''
                SELECT * FROM batches 
                WHERE status = ?
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
            ''', (status, limit, offset))
        else:
            cursor.execute('''
                SELECT * FROM batches 
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
            ''', (limit, offset))
        
        rows = cursor.fetchall()
        conn.close()
        
        return [dict(row) for row in rows]
    
    def get_batch_stats(self) -> Dict[str, Any]:
        """Récupère les statistiques des batches
        
        Returns:
            Statistiques
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Total par statut
        cursor.execute('''
            SELECT status, COUNT(*) as count
            FROM batches
            GROUP BY status
        ''')
        by_status = {row[0]: row[1] for row in cursor.fetchall()}
        
        # Total de requêtes
        cursor.execute('''
            SELECT 
                SUM(request_counts_total) as total,
                SUM(request_counts_completed) as completed,
                SUM(request_counts_failed) as failed
            FROM batches
        ''')
        row = cursor.fetchone()
        request_counts = {
            'total': row[0] or 0,
            'completed': row[1] or 0,
            'failed': row[2] or 0
        }
        
        # Tokens utilisés
        cursor.execute('''
            SELECT 
                SUM(usage_input_tokens) as input_tokens,
                SUM(usage_output_tokens) as output_tokens,
                SUM(usage_total_tokens) as total_tokens
            FROM batches
            WHERE usage_total_tokens IS NOT NULL
        ''')
        row = cursor.fetchone()
        usage = {
            'input_tokens': row[0] or 0,
            'output_tokens': row[1] or 0,
            'total_tokens': row[2] or 0
        }
        
        conn.close()
        
        return {
            'by_status': by_status,
            'request_counts': request_counts,
            'usage': usage,
            'total_batches': sum(by_status.values())
        }
    
    def download_batch_results(self, batch_id: str, output_type: str = 'output') -> str:
        """Télécharge les résultats d'un batch
        
        Args:
            batch_id: ID du batch
            output_type: 'output' ou 'error'
            
        Returns:
            Chemin du fichier téléchargé
        """
        if not self.client:
            raise ValueError("Client OpenAI non initialisé - vérifier OPENAI_API_KEY")
        
        batch = self.client.batches.retrieve(batch_id)
        
        file_id = batch.output_file_id if output_type == 'output' else batch.error_file_id
        
        if not file_id:
            raise ValueError(f"Pas de fichier {output_type} disponible pour le batch {batch_id}")
        
        # Télécharger le contenu
        file_response = self.client.files.content(file_id)
        
        # Sauvegarder localement
        downloads_dir = os.path.join(os.path.dirname(__file__), '..', 'uploads', 'batches', 'results')
        os.makedirs(downloads_dir, exist_ok=True)
        
        filename = f"{batch_id}_{output_type}.jsonl"
        filepath = os.path.join(downloads_dir, filename)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(file_response.text)
        
        logger.info(f"Résultats téléchargés: {filepath}")
        
        return filepath
    
    def _store_batch(self, batch):
        """Stocke ou met à jour un batch en base"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        metadata_json = json.dumps(batch.metadata) if batch.metadata else None
        errors_json = json.dumps(batch.errors) if batch.errors else None
        
        # Extraire les données d'usage si disponibles
        usage_input = None
        usage_output = None
        usage_total = None
        
        if hasattr(batch, 'usage') and batch.usage:
            usage_input = batch.usage.input_tokens if hasattr(batch.usage, 'input_tokens') else None
            usage_output = batch.usage.output_tokens if hasattr(batch.usage, 'output_tokens') else None
            usage_total = batch.usage.total_tokens if hasattr(batch.usage, 'total_tokens') else None
        
        cursor.execute('''
            INSERT OR REPLACE INTO batches (
                id, object, endpoint, model, input_file_id, completion_window,
                status, output_file_id, error_file_id,
                created_at, in_progress_at, expires_at, finalizing_at,
                completed_at, failed_at, expired_at, cancelling_at, cancelled_at,
                request_counts_total, request_counts_completed, request_counts_failed,
                metadata, errors,
                usage_input_tokens, usage_output_tokens, usage_total_tokens,
                local_updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ''', (
            batch.id,
            batch.object,
            batch.endpoint,
            getattr(batch, 'model', None),
            batch.input_file_id,
            batch.completion_window,
            batch.status,
            batch.output_file_id,
            batch.error_file_id,
            batch.created_at,
            batch.in_progress_at,
            batch.expires_at,
            batch.finalizing_at,
            batch.completed_at,
            batch.failed_at,
            batch.expired_at,
            batch.cancelling_at,
            batch.cancelled_at,
            batch.request_counts.total if batch.request_counts else 0,
            batch.request_counts.completed if batch.request_counts else 0,
            batch.request_counts.failed if batch.request_counts else 0,
            metadata_json,
            errors_json,
            usage_input,
            usage_output,
            usage_total
        ))
        
        conn.commit()
        conn.close()
    
    def _batch_to_dict(self, batch) -> Dict[str, Any]:
        """Convertit un objet batch en dictionnaire"""
        result = {
            'id': batch.id,
            'object': batch.object,
            'endpoint': batch.endpoint,
            'input_file_id': batch.input_file_id,
            'completion_window': batch.completion_window,
            'status': batch.status,
            'output_file_id': batch.output_file_id,
            'error_file_id': batch.error_file_id,
            'created_at': batch.created_at,
            'in_progress_at': batch.in_progress_at,
            'expires_at': batch.expires_at,
            'finalizing_at': batch.finalizing_at,
            'completed_at': batch.completed_at,
            'failed_at': batch.failed_at,
            'expired_at': batch.expired_at,
            'cancelling_at': batch.cancelling_at,
            'cancelled_at': batch.cancelled_at,
            'request_counts': {
                'total': batch.request_counts.total if batch.request_counts else 0,
                'completed': batch.request_counts.completed if batch.request_counts else 0,
                'failed': batch.request_counts.failed if batch.request_counts else 0
            }
        }
        
        if hasattr(batch, 'model') and batch.model:
            result['model'] = batch.model
        
        if batch.metadata:
            result['metadata'] = batch.metadata
        
        if batch.errors:
            result['errors'] = batch.errors
        
        if hasattr(batch, 'usage') and batch.usage:
            result['usage'] = {
                'input_tokens': batch.usage.input_tokens if hasattr(batch.usage, 'input_tokens') else 0,
                'output_tokens': batch.usage.output_tokens if hasattr(batch.usage, 'output_tokens') else 0,
                'total_tokens': batch.usage.total_tokens if hasattr(batch.usage, 'total_tokens') else 0
            }
        
        return result
