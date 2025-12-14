#!/usr/bin/env python3
import os
import shutil
import zipfile
from datetime import datetime

def build_release():
    version = "2.2.0"
    build_dir = f"dist/iapostemanager-{version}"
    
    # Nettoyer
    if os.path.exists("dist"):
        shutil.rmtree("dist")
    
    os.makedirs(build_dir)
    
    # Copier fichiers essentiels
    essential_files = [
        "src/", "templates/", "static/", 
        "requirements.txt", "Dockerfile", 
        "docker-compose.yml", "README.md"
    ]
    
    for item in essential_files:
        if os.path.exists(item):
            if os.path.isdir(item):
                shutil.copytree(item, f"{build_dir}/{item}")
            else:
                shutil.copy2(item, build_dir)
    
    # Créer ZIP
    with zipfile.ZipFile(f"dist/iapostemanager-{version}.zip", 'w') as zipf:
        for root, dirs, files in os.walk(build_dir):
            for file in files:
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, build_dir)
                zipf.write(file_path, arcname)
    
    print(f"[OK] Build cree: dist/iapostemanager-{version}.zip")

if __name__ == "__main__":
    build_release()