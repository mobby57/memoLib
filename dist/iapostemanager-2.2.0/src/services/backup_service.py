"""Service de sauvegarde automatique"""
import os
import shutil
import json
from datetime import datetime
import tarfile

class BackupService:
    def __init__(self, app_dir):
        self.app_dir = app_dir
        self.backup_dir = os.path.join(app_dir, 'backups')
        os.makedirs(self.backup_dir, exist_ok=True)
    
    def create_backup(self):
        """Créer sauvegarde complète"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_name = f'backup_{timestamp}.tar.gz'
        backup_path = os.path.join(self.backup_dir, backup_name)
        
        with tarfile.open(backup_path, 'w:gz') as tar:
            # Données critiques
            for file in ['app.db', 'credentials.enc', 'salt.bin', 'templates.json']:
                file_path = os.path.join(self.app_dir, file)
                if os.path.exists(file_path):
                    tar.add(file_path, arcname=file)
        
        # Métadonnées backup
        metadata = {
            'timestamp': timestamp,
            'version': '3.1.0',
            'files_count': len(tar.getnames()) if 'tar' in locals() else 0
        }
        
        with open(os.path.join(self.backup_dir, f'backup_{timestamp}.json'), 'w') as f:
            json.dump(metadata, f)
        
        return backup_path
    
    def restore_backup(self, backup_path):
        """Restaurer sauvegarde"""
        if not os.path.exists(backup_path):
            return False
        
        try:
            with tarfile.open(backup_path, 'r:gz') as tar:
                tar.extractall(self.app_dir)
            return True
        except:
            return False
    
    def cleanup_old_backups(self, keep_days=7):
        """Nettoyer anciennes sauvegardes"""
        cutoff = datetime.now().timestamp() - (keep_days * 86400)
        
        for file in os.listdir(self.backup_dir):
            file_path = os.path.join(self.backup_dir, file)
            if os.path.getctime(file_path) < cutoff:
                os.remove(file_path)