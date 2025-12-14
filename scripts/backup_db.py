"""Backup database"""
import shutil
import os
from datetime import datetime

def backup_database():
    db_path = 'data/app.db'
    if not os.path.exists(db_path):
        print("❌ Database not found")
        return
    
    backup_dir = 'data/backups'
    os.makedirs(backup_dir, exist_ok=True)
    
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_path = f"{backup_dir}/app_backup_{timestamp}.db"
    
    shutil.copy2(db_path, backup_path)
    print(f"✅ Backup created: {backup_path}")
    
    # Keep only last 10 backups
    backups = sorted([f for f in os.listdir(backup_dir) if f.endswith('.db')])
    if len(backups) > 10:
        for old_backup in backups[:-10]:
            os.remove(os.path.join(backup_dir, old_backup))
            print(f"🗑️  Removed old backup: {old_backup}")

if __name__ == '__main__':
    backup_database()
