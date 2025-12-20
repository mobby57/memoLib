"""
Service de gestion des Vector Stores et File Batches OpenAI
Gère les vector stores pour la recherche sémantique et les assistants
"""
import os
import json
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
import sqlite3
from openai import OpenAI

logger = logging.getLogger(__name__)


class VectorStoreService:
    """Service pour gérer les vector stores et file batches OpenAI"""
    
    def __init__(self, db_path: str = None):
        """Initialise le service vector store
        
        Args:
            db_path: Chemin vers la base de données
        """
        self.db_path = db_path or os.path.join(os.path.dirname(__file__), '..', 'data', 'vector_stores.db')
        self.api_key = os.environ.get('OPENAI_API_KEY')
        
        if not self.api_key:
            logger.warning("OPENAI_API_KEY non configurée - service vector store limité")
            self.client = None
        else:
            self.client = OpenAI(api_key=self.api_key)
        
        self._init_database()
    
    def _init_database(self):
        """Initialise la base de données"""
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Table pour les vector stores
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS vector_stores (
                id TEXT PRIMARY KEY,
                object TEXT DEFAULT 'vector_store',
                name TEXT,
                status TEXT,
                usage_bytes INTEGER DEFAULT 0,
                file_counts_total INTEGER DEFAULT 0,
                file_counts_completed INTEGER DEFAULT 0,
                file_counts_in_progress INTEGER DEFAULT 0,
                file_counts_failed INTEGER DEFAULT 0,
                file_counts_cancelled INTEGER DEFAULT 0,
                created_at INTEGER NOT NULL,
                expires_after TEXT,
                expires_at INTEGER,
                last_active_at INTEGER,
                metadata TEXT,
                local_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                local_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Table pour les file batches
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS vector_store_file_batches (
                id TEXT PRIMARY KEY,
                object TEXT DEFAULT 'vector_store.file_batch',
                vector_store_id TEXT NOT NULL,
                status TEXT NOT NULL,
                file_counts_total INTEGER DEFAULT 0,
                file_counts_completed INTEGER DEFAULT 0,
                file_counts_in_progress INTEGER DEFAULT 0,
                file_counts_failed INTEGER DEFAULT 0,
                file_counts_cancelled INTEGER DEFAULT 0,
                created_at INTEGER NOT NULL,
                local_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                local_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (vector_store_id) REFERENCES vector_stores(id)
            )
        ''')
        
        # Table pour les fichiers individuels
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS vector_store_files (
                id TEXT PRIMARY KEY,
                object TEXT DEFAULT 'vector_store.file',
                vector_store_id TEXT NOT NULL,
                batch_id TEXT,
                status TEXT,
                created_at INTEGER NOT NULL,
                chunking_strategy TEXT,
                attributes TEXT,
                local_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (vector_store_id) REFERENCES vector_stores(id),
                FOREIGN KEY (batch_id) REFERENCES vector_store_file_batches(id)
            )
        ''')
        
        # Index
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_vs_status ON vector_stores(status)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_vsfb_status ON vector_store_file_batches(status)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_vsfb_vector_store ON vector_store_file_batches(vector_store_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_vsf_vector_store ON vector_store_files(vector_store_id)')
        
        conn.commit()
        conn.close()
    
    # ============= VECTOR STORES =============
    
    def create_vector_store(self, 
                           name: str = None,
                           file_ids: List[str] = None,
                           expires_after: Dict[str, Any] = None,
                           chunking_strategy: Dict[str, Any] = None,
                           metadata: Dict[str, str] = None) -> Dict[str, Any]:
        """Crée un nouveau vector store
        
        Args:
            name: Nom du vector store
            file_ids: Liste d'IDs de fichiers à ajouter
            expires_after: Politique d'expiration
            chunking_strategy: Stratégie de chunking
            metadata: Métadonnées
            
        Returns:
            Informations du vector store créé
        """
        if not self.client:
            raise ValueError("Client OpenAI non initialisé")
        
        params = {}
        if name:
            params['name'] = name
        if file_ids:
            params['file_ids'] = file_ids
        if expires_after:
            params['expires_after'] = expires_after
        if chunking_strategy:
            params['chunking_strategy'] = chunking_strategy
        if metadata:
            params['metadata'] = metadata
        
        vector_store = self.client.beta.vector_stores.create(**params)
        self._store_vector_store(vector_store)
        
        logger.info(f"Vector store créé: {vector_store.id}")
        return self._vector_store_to_dict(vector_store)
    
    def get_vector_store(self, vector_store_id: str, refresh: bool = True) -> Dict[str, Any]:
        """Récupère un vector store
        
        Args:
            vector_store_id: ID du vector store
            refresh: Si True, récupère depuis l'API
            
        Returns:
            Informations du vector store
        """
        if refresh and self.client:
            vector_store = self.client.beta.vector_stores.retrieve(vector_store_id)
            self._store_vector_store(vector_store)
            return self._vector_store_to_dict(vector_store)
        else:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            cursor.execute('SELECT * FROM vector_stores WHERE id = ?', (vector_store_id,))
            row = cursor.fetchone()
            conn.close()
            
            if not row:
                raise ValueError(f"Vector store {vector_store_id} non trouvé")
            
            return dict(row)
    
    def list_vector_stores(self, limit: int = 20, after: str = None) -> Dict[str, Any]:
        """Liste les vector stores
        
        Args:
            limit: Nombre maximum
            after: Cursor pour pagination
            
        Returns:
            Liste des vector stores
        """
        if not self.client:
            raise ValueError("Client OpenAI non initialisé")
        
        params = {'limit': min(limit, 100)}
        if after:
            params['after'] = after
        
        stores = self.client.beta.vector_stores.list(**params)
        
        for store in stores.data:
            self._store_vector_store(store)
        
        return {
            'object': 'list',
            'data': [self._vector_store_to_dict(s) for s in stores.data],
            'first_id': stores.first_id if hasattr(stores, 'first_id') else None,
            'last_id': stores.last_id if hasattr(stores, 'last_id') else None,
            'has_more': stores.has_more if hasattr(stores, 'has_more') else False
        }
    
    def delete_vector_store(self, vector_store_id: str) -> Dict[str, Any]:
        """Supprime un vector store
        
        Args:
            vector_store_id: ID du vector store
            
        Returns:
            Résultat de la suppression
        """
        if not self.client:
            raise ValueError("Client OpenAI non initialisé")
        
        result = self.client.beta.vector_stores.delete(vector_store_id)
        
        # Supprimer de la base locale
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('DELETE FROM vector_stores WHERE id = ?', (vector_store_id,))
        conn.commit()
        conn.close()
        
        logger.info(f"Vector store supprimé: {vector_store_id}")
        return {'id': vector_store_id, 'deleted': result.deleted}
    
    # ============= FILE BATCHES =============
    
    def create_file_batch(self,
                         vector_store_id: str,
                         file_ids: List[str] = None,
                         files: List[Dict[str, Any]] = None,
                         attributes: Dict[str, Any] = None,
                         chunking_strategy: Dict[str, Any] = None) -> Dict[str, Any]:
        """Crée un batch de fichiers dans un vector store
        
        Args:
            vector_store_id: ID du vector store
            file_ids: Liste simple d'IDs de fichiers
            files: Liste de fichiers avec attributs spécifiques
            attributes: Attributs globaux pour tous les fichiers
            chunking_strategy: Stratégie de chunking globale
            
        Returns:
            Informations du batch créé
        """
        if not self.client:
            raise ValueError("Client OpenAI non initialisé")
        
        params = {}
        
        if file_ids:
            params['file_ids'] = file_ids
        elif files:
            params['files'] = files
        else:
            raise ValueError("file_ids ou files requis")
        
        if attributes:
            params['attributes'] = attributes
        if chunking_strategy:
            params['chunking_strategy'] = chunking_strategy
        
        batch = self.client.beta.vector_stores.file_batches.create(
            vector_store_id=vector_store_id,
            **params
        )
        
        self._store_file_batch(batch, vector_store_id)
        
        logger.info(f"File batch créé: {batch.id} pour vector store {vector_store_id}")
        return self._file_batch_to_dict(batch)
    
    def get_file_batch(self, 
                      vector_store_id: str,
                      batch_id: str,
                      refresh: bool = True) -> Dict[str, Any]:
        """Récupère un file batch
        
        Args:
            vector_store_id: ID du vector store
            batch_id: ID du batch
            refresh: Si True, récupère depuis l'API
            
        Returns:
            Informations du batch
        """
        if refresh and self.client:
            batch = self.client.beta.vector_stores.file_batches.retrieve(
                vector_store_id=vector_store_id,
                batch_id=batch_id
            )
            self._store_file_batch(batch, vector_store_id)
            return self._file_batch_to_dict(batch)
        else:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            cursor.execute('SELECT * FROM vector_store_file_batches WHERE id = ?', (batch_id,))
            row = cursor.fetchone()
            conn.close()
            
            if not row:
                raise ValueError(f"Batch {batch_id} non trouvé")
            
            return dict(row)
    
    def cancel_file_batch(self,
                         vector_store_id: str,
                         batch_id: str) -> Dict[str, Any]:
        """Annule un file batch
        
        Args:
            vector_store_id: ID du vector store
            batch_id: ID du batch
            
        Returns:
            Informations du batch annulé
        """
        if not self.client:
            raise ValueError("Client OpenAI non initialisé")
        
        batch = self.client.beta.vector_stores.file_batches.cancel(
            vector_store_id=vector_store_id,
            batch_id=batch_id
        )
        
        self._store_file_batch(batch, vector_store_id)
        
        logger.info(f"File batch annulé: {batch_id}")
        return self._file_batch_to_dict(batch)
    
    def list_batch_files(self,
                        vector_store_id: str,
                        batch_id: str,
                        limit: int = 20,
                        after: str = None,
                        before: str = None,
                        filter_status: str = None,
                        order: str = 'desc') -> Dict[str, Any]:
        """Liste les fichiers d'un batch
        
        Args:
            vector_store_id: ID du vector store
            batch_id: ID du batch
            limit: Nombre maximum
            after: Cursor après
            before: Cursor avant
            filter_status: Filtrer par statut
            order: Ordre de tri
            
        Returns:
            Liste des fichiers
        """
        if not self.client:
            raise ValueError("Client OpenAI non initialisé")
        
        params = {
            'limit': min(limit, 100),
            'order': order
        }
        
        if after:
            params['after'] = after
        if before:
            params['before'] = before
        if filter_status:
            params['filter'] = filter_status
        
        files = self.client.beta.vector_stores.file_batches.list_files(
            vector_store_id=vector_store_id,
            batch_id=batch_id,
            **params
        )
        
        return {
            'object': 'list',
            'data': [self._file_to_dict(f) for f in files.data],
            'first_id': files.first_id if hasattr(files, 'first_id') else None,
            'last_id': files.last_id if hasattr(files, 'last_id') else None,
            'has_more': files.has_more if hasattr(files, 'has_more') else False
        }
    
    # ============= STATS & LOCAL =============
    
    def get_local_vector_stores(self, limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
        """Récupère les vector stores depuis la base locale"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM vector_stores 
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        ''', (limit, offset))
        
        rows = cursor.fetchall()
        conn.close()
        
        return [dict(row) for row in rows]
    
    def get_local_file_batches(self,
                               vector_store_id: str = None,
                               limit: int = 50,
                               offset: int = 0) -> List[Dict[str, Any]]:
        """Récupère les file batches depuis la base locale"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        if vector_store_id:
            cursor.execute('''
                SELECT * FROM vector_store_file_batches 
                WHERE vector_store_id = ?
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
            ''', (vector_store_id, limit, offset))
        else:
            cursor.execute('''
                SELECT * FROM vector_store_file_batches 
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
            ''', (limit, offset))
        
        rows = cursor.fetchall()
        conn.close()
        
        return [dict(row) for row in rows]
    
    def get_stats(self) -> Dict[str, Any]:
        """Récupère les statistiques"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Total vector stores
        cursor.execute('SELECT COUNT(*) FROM vector_stores')
        total_stores = cursor.fetchone()[0]
        
        # Par statut
        cursor.execute('''
            SELECT status, COUNT(*) 
            FROM vector_stores 
            GROUP BY status
        ''')
        stores_by_status = {row[0]: row[1] for row in cursor.fetchall()}
        
        # Total file batches
        cursor.execute('SELECT COUNT(*) FROM vector_store_file_batches')
        total_batches = cursor.fetchone()[0]
        
        # Total fichiers
        cursor.execute('''
            SELECT 
                SUM(file_counts_total) as total,
                SUM(file_counts_completed) as completed,
                SUM(file_counts_failed) as failed
            FROM vector_stores
        ''')
        row = cursor.fetchone()
        file_counts = {
            'total': row[0] or 0,
            'completed': row[1] or 0,
            'failed': row[2] or 0
        }
        
        # Usage total
        cursor.execute('SELECT SUM(usage_bytes) FROM vector_stores')
        total_bytes = cursor.fetchone()[0] or 0
        
        conn.close()
        
        return {
            'total_vector_stores': total_stores,
            'stores_by_status': stores_by_status,
            'total_file_batches': total_batches,
            'file_counts': file_counts,
            'usage_bytes': total_bytes,
            'usage_mb': round(total_bytes / (1024 * 1024), 2)
        }
    
    # ============= HELPERS =============
    
    def _store_vector_store(self, store):
        """Stocke un vector store en base"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        metadata_json = json.dumps(store.metadata) if hasattr(store, 'metadata') and store.metadata else None
        expires_after_json = json.dumps(store.expires_after) if hasattr(store, 'expires_after') and store.expires_after else None
        
        file_counts = store.file_counts if hasattr(store, 'file_counts') else None
        
        cursor.execute('''
            INSERT OR REPLACE INTO vector_stores (
                id, object, name, status, usage_bytes,
                file_counts_total, file_counts_completed, file_counts_in_progress,
                file_counts_failed, file_counts_cancelled,
                created_at, expires_after, expires_at, last_active_at, metadata,
                local_updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ''', (
            store.id,
            store.object,
            store.name if hasattr(store, 'name') else None,
            store.status,
            store.usage_bytes if hasattr(store, 'usage_bytes') else 0,
            file_counts.total if file_counts else 0,
            file_counts.completed if file_counts else 0,
            file_counts.in_progress if file_counts else 0,
            file_counts.failed if file_counts else 0,
            file_counts.cancelled if file_counts else 0,
            store.created_at,
            expires_after_json,
            store.expires_at if hasattr(store, 'expires_at') else None,
            store.last_active_at if hasattr(store, 'last_active_at') else None,
            metadata_json
        ))
        
        conn.commit()
        conn.close()
    
    def _store_file_batch(self, batch, vector_store_id: str):
        """Stocke un file batch en base"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        file_counts = batch.file_counts if hasattr(batch, 'file_counts') else None
        
        cursor.execute('''
            INSERT OR REPLACE INTO vector_store_file_batches (
                id, object, vector_store_id, status,
                file_counts_total, file_counts_completed, file_counts_in_progress,
                file_counts_failed, file_counts_cancelled,
                created_at, local_updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ''', (
            batch.id,
            batch.object,
            vector_store_id,
            batch.status,
            file_counts.total if file_counts else 0,
            file_counts.completed if file_counts else 0,
            file_counts.in_progress if file_counts else 0,
            file_counts.failed if file_counts else 0,
            file_counts.cancelled if file_counts else 0,
            batch.created_at
        ))
        
        conn.commit()
        conn.close()
    
    def _vector_store_to_dict(self, store) -> Dict[str, Any]:
        """Convertit un vector store en dictionnaire"""
        result = {
            'id': store.id,
            'object': store.object,
            'name': store.name if hasattr(store, 'name') else None,
            'status': store.status,
            'usage_bytes': store.usage_bytes if hasattr(store, 'usage_bytes') else 0,
            'created_at': store.created_at
        }
        
        if hasattr(store, 'file_counts') and store.file_counts:
            result['file_counts'] = {
                'total': store.file_counts.total,
                'completed': store.file_counts.completed,
                'in_progress': store.file_counts.in_progress,
                'failed': store.file_counts.failed,
                'cancelled': store.file_counts.cancelled
            }
        
        if hasattr(store, 'metadata') and store.metadata:
            result['metadata'] = store.metadata
        
        if hasattr(store, 'expires_after') and store.expires_after:
            result['expires_after'] = store.expires_after
        
        if hasattr(store, 'expires_at') and store.expires_at:
            result['expires_at'] = store.expires_at
        
        if hasattr(store, 'last_active_at') and store.last_active_at:
            result['last_active_at'] = store.last_active_at
        
        return result
    
    def _file_batch_to_dict(self, batch) -> Dict[str, Any]:
        """Convertit un file batch en dictionnaire"""
        result = {
            'id': batch.id,
            'object': batch.object,
            'vector_store_id': batch.vector_store_id,
            'status': batch.status,
            'created_at': batch.created_at
        }
        
        if hasattr(batch, 'file_counts') and batch.file_counts:
            result['file_counts'] = {
                'total': batch.file_counts.total,
                'completed': batch.file_counts.completed,
                'in_progress': batch.file_counts.in_progress,
                'failed': batch.file_counts.failed,
                'cancelled': batch.file_counts.cancelled
            }
        
        return result
    
    def _file_to_dict(self, file) -> Dict[str, Any]:
        """Convertit un fichier en dictionnaire"""
        return {
            'id': file.id,
            'object': file.object,
            'vector_store_id': file.vector_store_id if hasattr(file, 'vector_store_id') else None,
            'status': file.status if hasattr(file, 'status') else None,
            'created_at': file.created_at
        }
