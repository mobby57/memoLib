#!/usr/bin/env python3
"""Test connexion PostgreSQL depuis WSL2"""

from sqlalchemy import create_engine, text

url = 'postgresql://iaposte:changeme@localhost:5432/iapostemanager'
print(f"🔗 Connexion à: {url}")

try:
    engine = create_engine(url)
    conn = engine.connect()
    result = conn.execute(text('SELECT version()'))
    version = result.fetchone()[0]
    print(f"✅ PostgreSQL OK!")
    print(f"📊 Version: {version[:50]}...")
    conn.close()
    print("\n🎉 SUCCÈS - psycopg2 fonctionne parfaitement sur Linux!")
except Exception as e:
    print(f"❌ Erreur: {e}")
    exit(1)
