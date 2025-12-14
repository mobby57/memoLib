#!/usr/bin/env python3
"""Serveur de développement avec hot reload"""
import os
import sys
import subprocess
import time
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

class DevServerHandler(FileSystemEventHandler):
    def __init__(self):
        self.process = None
        self.restart_server()
    
    def on_modified(self, event):
        if event.src_path.endswith('.py'):
            print(f"🔄 Fichier modifié: {event.src_path}")
            self.restart_server()
    
    def restart_server(self):
        if self.process:
            self.process.terminate()
            self.process.wait()
        
        print("🚀 Démarrage serveur...")
        self.process = subprocess.Popen([
            sys.executable, 'src/web/app.py'
        ])

def main():
    handler = DevServerHandler()
    observer = Observer()
    observer.schedule(handler, 'src/', recursive=True)
    observer.start()
    
    print("👀 Surveillance des fichiers activée")
    print("📝 Modifiez un fichier .py pour redémarrer")
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
        if handler.process:
            handler.process.terminate()
    
    observer.join()

if __name__ == "__main__":
    main()