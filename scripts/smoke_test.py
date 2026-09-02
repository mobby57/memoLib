#!/usr/bin/env python3
import requests
import sys
import os
import time

BASE_URL = os.environ.get("STAGING_URL", "http://localhost:8080")
TIMEOUT = 10

def run_tests():
    print(f"🚀 Smoke tests sur {BASE_URL}")
    failed = False

    try:
        resp = requests.get(f"{BASE_URL}/health", timeout=TIMEOUT)
        if resp.status_code == 200:
            print("✅ Health check OK")
        else:
            print(f"❌ Health check échoué (status {resp.status_code})")
            failed = True
    except Exception as e:
        print(f"❌ Health check injoignable : {e}")
        failed = True

    try:
        resp = requests.get(BASE_URL, timeout=TIMEOUT)
        if resp.status_code == 200:
            print("✅ Endpoint root OK")
        else:
            print(f"❌ Root échoué (status {resp.status_code})")
            failed = True
    except Exception as e:
        print(f"❌ Root injoignable : {e}")
        failed = True

    if failed:
        print("💥 Smoke tests échoués !")
        sys.exit(1)
    else:
        print("✅ Tous les tests sont OK !")
        sys.exit(0)

if __name__ == "__main__":
    time.sleep(5)
    run_tests()
