"""
Système de backup automatique avec chiffrement
Sauvegarde quotidienne des données sensibles pour cabinets d'avocats
"""
import os
import shutil
import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Optional
import zipfile
from src.backend.security.encryption import encryption


class BackupManager:
    """Gestionnaire de backups chiffrés automatiques"""
    
    def __init__(self, 
                 data_dir: str = 'data',
                 backup_dir: str = 'backups',
                 retention_days: int = 30):
        """
        Initialise le système de backup
        
        Args:
            data_dir: Répertoire des données à sauvegarder
            backup_dir: Répertoire des backups
            retention_days: Nombre de jours de rétention (défaut: 30)
        """
        self.data_dir = Path(data_dir)
        self.backup_dir = Path(backup_dir)
        self.backup_dir.mkdir(exist_ok=True)
        self.retention_days = retention_days
    
    def create_backup(self, encrypt: bool = True) -> Path:
        """
        Crée un backup complet des données
        
        Args:
            encrypt: Chiffrer le backup (recommandé)
            
        Returns:
            Chemin du fichier de backup
        """
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_name = f'backup_{timestamp}.zip'
        backup_path = self.backup_dir / backup_name
        
        print(f"📦 Création du backup: {backup_name}")
        
        # Création de l'archive ZIP
        with zipfile.ZipFile(backup_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for file_path in self.data_dir.rglob('*'):
                if file_path.is_file() and '.encryption_key' not in str(file_path):
                    arcname = file_path.relative_to(self.data_dir)
                    zipf.write(file_path, arcname)
                    print(f"  ✓ {arcname}")
        
        # Ajout métadonnées
        metadata = {
            'timestamp': timestamp,
            'created_at': datetime.now().isoformat(),
            'files_count': len(list(self.data_dir.rglob('*'))),
            'encrypted': encrypt
        }
        
        metadata_path = self.backup_dir / f'backup_{timestamp}.json'
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        # Chiffrement si demandé
        if encrypt:
            print(f"🔐 Chiffrement du backup...")
            encryption.encrypt_file(backup_path)
            metadata['encrypted'] = True
            with open(metadata_path, 'w') as f:
                json.dump(metadata, f, indent=2)
            print(f"  ✓ Backup chiffré: {backup_path.name}")
        
        file_size = backup_path.stat().st_size / 1024 / 1024
        print(f"✅ Backup créé: {backup_path.name} ({file_size:.2f} MB)")
        
        return backup_path
    
    def restore_backup(self, backup_file: str, decrypt: bool = True) -> bool:
        """
        Restaure un backup
        
        Args:
            backup_file: Nom du fichier de backup
            decrypt: Déchiffrer avant restauration
            
        Returns:
            Succès de la restauration
        """
        backup_path = self.backup_dir / backup_file
        
        if not backup_path.exists():
            print(f"❌ Backup introuvable: {backup_file}")
            return False
        
        print(f"📥 Restauration du backup: {backup_file}")
        
        # Déchiffrement si nécessaire
        if decrypt:
            print(f"🔓 Déchiffrement du backup...")
            temp_path = backup_path.with_suffix('.tmp')
            encryption.decrypt_file(backup_path, temp_path)
            backup_path = temp_path
        
        # Sauvegarde des données actuelles
        backup_current = self.data_dir.parent / f'data_before_restore_{datetime.now().strftime("%Y%m%d_%H%M%S")}'
        if self.data_dir.exists():
            shutil.copytree(self.data_dir, backup_current)
            print(f"💾 Données actuelles sauvegardées dans: {backup_current.name}")
        
        # Extraction du backup
        with zipfile.ZipFile(backup_path, 'r') as zipf:
            zipf.extractall(self.data_dir)
        
        # Nettoyage fichier temporaire
        if decrypt and temp_path.exists():
            temp_path.unlink()
        
        print(f"✅ Backup restauré avec succès")
        return True
    
    def list_backups(self) -> List[dict]:
        """
        Liste tous les backups disponibles
        
        Returns:
            Liste des backups avec métadonnées
        """
        backups = []
        
        for backup_file in sorted(self.backup_dir.glob('backup_*.zip'), reverse=True):
            metadata_file = backup_file.with_suffix('.json')
            
            metadata = {
                'filename': backup_file.name,
                'size': backup_file.stat().st_size / 1024 / 1024,  # MB
                'created': datetime.fromtimestamp(backup_file.stat().st_mtime),
                'encrypted': False
            }
            
            # Lecture métadonnées si disponibles
            if metadata_file.exists():
                with open(metadata_file, 'r') as f:
                    stored_metadata = json.load(f)
                    metadata.update(stored_metadata)
            
            backups.append(metadata)
        
        return backups
    
    def cleanup_old_backups(self) -> int:
        """
        Supprime les backups plus anciens que retention_days
        
        Returns:
            Nombre de backups supprimés
        """
        cutoff_date = datetime.now() - timedelta(days=self.retention_days)
        deleted_count = 0
        
        for backup_file in self.backup_dir.glob('backup_*.zip'):
            backup_date = datetime.fromtimestamp(backup_file.stat().st_mtime)
            
            if backup_date < cutoff_date:
                # Suppression backup et métadonnées
                backup_file.unlink()
                metadata_file = backup_file.with_suffix('.json')
                if metadata_file.exists():
                    metadata_file.unlink()
                
                deleted_count += 1
                print(f"🗑️  Supprimé: {backup_file.name} (ancien: {backup_date.date()})")
        
        if deleted_count > 0:
            print(f"✅ {deleted_count} backup(s) ancien(s) supprimé(s)")
        
        return deleted_count
    
    def auto_backup(self) -> Optional[Path]:
        """
        Exécute un backup automatique avec nettoyage
        
        Returns:
            Chemin du backup créé
        """
        print("🔄 Backup automatique quotidien")
        
        # Création du backup
        backup_path = self.create_backup(encrypt=True)
        
        # Nettoyage des anciens backups
        self.cleanup_old_backups()
        
        return backup_path
    
    def verify_backup(self, backup_file: str) -> bool:
        """
        Vérifie l'intégrité d'un backup
        
        Args:
            backup_file: Nom du fichier de backup
            
        Returns:
            True si le backup est valide
        """
        backup_path = self.backup_dir / backup_file
        
        if not backup_path.exists():
            return False
        
        try:
            # Test d'ouverture de l'archive
            with zipfile.ZipFile(backup_path, 'r') as zipf:
                # Vérification CRC
                corrupt_files = zipf.testzip()
                if corrupt_files:
                    print(f"❌ Fichiers corrompus dans le backup: {corrupt_files}")
                    return False
            
            print(f"✅ Backup valide: {backup_file}")
            return True
        
        except Exception as e:
            print(f"❌ Backup corrompu: {e}")
            return False


# Instance globale
backup_manager = BackupManager()


def schedule_daily_backup():
    """
    Configure une tâche de backup quotidienne
    À appeler au démarrage de l'application
    """
    from threading import Thread
    import time
    
    def daily_backup_task():
        while True:
            # Attendre jusqu'à 2h du matin
            now = datetime.now()
            next_run = now.replace(hour=2, minute=0, second=0, microsecond=0)
            
            if next_run <= now:
                next_run += timedelta(days=1)
            
            sleep_seconds = (next_run - now).total_seconds()
            print(f"⏰ Prochain backup automatique: {next_run.strftime('%Y-%m-%d %H:%M')}")
            
            time.sleep(sleep_seconds)
            
            # Exécution du backup
            try:
                backup_manager.auto_backup()
            except Exception as e:
                print(f"❌ Erreur backup automatique: {e}")
    
    # Lancement du thread de backup
    backup_thread = Thread(target=daily_backup_task, daemon=True)
    backup_thread.start()
    print("✅ Backup automatique quotidien activé (2h00)")
