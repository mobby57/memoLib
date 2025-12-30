"""
Script pour réinitialiser la base de données PostgreSQL
Créé: 28 Décembre 2025
"""

from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import os

load_dotenv()

def reset_database():
    """Réinitialiser complètement la base de données"""
    database_url = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/iapostemanager')
    
    print("=" * 60)
    print("🗑️  RÉINITIALISATION BASE DE DONNÉES")
    print("=" * 60)
    print(f"\n📊 Database: {database_url}")
    
    # Connexion
    engine = create_engine(database_url)
    
    try:
        with engine.connect() as conn:
            # Drop schema public et recréer
            print("\n🗑️  Suppression schéma public...")
            conn.execute(text("DROP SCHEMA public CASCADE"))
            conn.commit()
            
            print("✅ Schéma public supprimé")
            
            print("\n📦 Création nouveau schéma public...")
            conn.execute(text("CREATE SCHEMA public"))
            conn.commit()
            
            print("✅ Schéma public créé")
            
        print("\n" + "=" * 60)
        print("✅ BASE DE DONNÉES RÉINITIALISÉE")
        print("=" * 60)
        print("\nProchaine étape: alembic upgrade head")
        
    except Exception as e:
        print(f"\n❌ Erreur: {e}")
        import traceback
        traceback.print_exc()
    finally:
        engine.dispose()

if __name__ == '__main__':
    reset_database()
