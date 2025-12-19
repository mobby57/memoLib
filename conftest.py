"""Configuration globale pour pytest"""
import pytest
import requests
import time
import subprocess
import os
import signal
from threading import Thread

def pytest_configure(config):
    """Configuration des markers pytest"""
    config.addinivalue_line(
        "markers", "e2e: mark test as end-to-end test requiring running server"
    )
    config.addinivalue_line(
        "markers", "integration: mark test as integration test"
    )
    config.addinivalue_line(
        "markers", "unit: mark test as unit test"
    )

def is_server_running(url="http://localhost:5000", timeout=5):
    """Vérifie si le serveur Flask est en cours d'exécution"""
    try:
        response = requests.get(f"{url}/health", timeout=timeout)
        return response.status_code == 200
    except:
        return False

@pytest.fixture(scope="session")
def flask_server():
    """Démarre le serveur Flask pour les tests E2E"""
    if is_server_running():
        yield "http://localhost:5000"
        return
    
    # Démarrer le serveur Flask
    env = os.environ.copy()
    env.update({
        'FLASK_ENV': 'testing',
        'SECRET_KEY': 'test-secret-key',
        'DATABASE_URL': 'sqlite:///test.db'
    })
    
    server_process = subprocess.Popen(
        ['python', 'src/backend/app.py'],
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    
    # Attendre que le serveur démarre
    for _ in range(30):  # 30 secondes max
        if is_server_running():
            break
        time.sleep(1)
    else:
        server_process.terminate()
        pytest.skip("Impossible de démarrer le serveur Flask")
    
    yield "http://localhost:5000"
    
    # Arrêter le serveur
    server_process.terminate()
    server_process.wait()

def pytest_runtest_setup(item):
    """Skip E2E tests si le serveur n'est pas disponible"""
    if item.get_closest_marker("e2e"):
        if not is_server_running():
            pytest.skip("Serveur Flask non disponible pour les tests E2E")