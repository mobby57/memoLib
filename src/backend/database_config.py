"""
Configuration Database PostgreSQL pour FastAPI
Connexion + Session SQLAlchemy

Date: 26 décembre 2025
Version: 1.0
"""

from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
import os
from dotenv import load_dotenv
import logging

# Charger variables environnement
load_dotenv()

# Configuration logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================
# CONFIGURATION DATABASE
# ============================================

# URL PostgreSQL depuis .env
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/iapostemanager"
)

# Configuration engine
engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=10,              # Connexions persistantes
    max_overflow=20,           # Connexions supplémentaires si nécessaire
    pool_pre_ping=True,        # Vérifier connexion avant usage
    pool_recycle=3600,         # Recycler connexions après 1h
    echo=False,                # True pour debug SQL
    echo_pool=False,           # True pour debug pool
    connect_args={
        "options": "-c timezone=Europe/Paris"
    }
)

# SessionLocal factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False
)

# ============================================
# DEPENDENCY INJECTION FASTAPI
# ============================================

def get_db() -> Session:
    """
    Dependency pour obtenir session database dans routes FastAPI
    
    Usage dans routes:
        @app.get("/users/{user_id}")
        async def get_user(user_id: str, db: Session = Depends(get_db)):
            user = db.query(User).filter(User.id == user_id).first()
            return user
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ============================================
# ÉVÉNEMENTS DATABASE
# ============================================

@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_conn, connection_record):
    """Configurer paramètres connexion PostgreSQL"""
    cursor = dbapi_conn.cursor()
    # Extensions déjà activées dans 01_create_database.sql
    cursor.close()


@event.listens_for(engine, "checkout")
def receive_checkout(dbapi_conn, connection_record, connection_proxy):
    """Log quand connexion est prise du pool (debug)"""
    if os.getenv("DEBUG_DB_POOL") == "true":
        logger.debug("Connexion checkout from pool")


@event.listens_for(engine, "checkin")
def receive_checkin(dbapi_conn, connection_record):
    """Log quand connexion retournée au pool (debug)"""
    if os.getenv("DEBUG_DB_POOL") == "true":
        logger.debug("Connexion checkin to pool")


# ============================================
# HELPERS
# ============================================

def test_connection():
    """Tester connexion database"""
    try:
        with engine.connect() as conn:
            result = conn.execute("SELECT 1")
            logger.info("✅ Connexion PostgreSQL réussie")
            return True
    except Exception as e:
        logger.error(f"❌ Erreur connexion PostgreSQL: {e}")
        return False


def get_db_info():
    """Obtenir infos database"""
    try:
        with engine.connect() as conn:
            # Version PostgreSQL
            version = conn.execute("SELECT version()").scalar()
            
            # Nombre tables
            tables_count = conn.execute("""
                SELECT COUNT(*) 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
            """).scalar()
            
            # Taille base
            db_size = conn.execute(f"""
                SELECT pg_size_pretty(pg_database_size('{engine.url.database}'))
            """).scalar()
            
            return {
                "version": version,
                "tables_count": tables_count,
                "database_size": db_size,
                "url": str(engine.url).replace(engine.url.password, "***")
            }
    except Exception as e:
        logger.error(f"Erreur get_db_info: {e}")
        return None


def get_pool_status():
    """Obtenir statut pool connexions"""
    return {
        "pool_size": engine.pool.size(),
        "checked_in": engine.pool.checkedin(),
        "checked_out": engine.pool.checkedout(),
        "overflow": engine.pool.overflow(),
        "total": engine.pool.size() + engine.pool.overflow()
    }


# ============================================
# INITIALISATION
# ============================================

if __name__ == "__main__":
    # Test connexion au démarrage
    logger.info("Test connexion PostgreSQL...")
    
    if test_connection():
        info = get_db_info()
        if info:
            logger.info(f"PostgreSQL Version: {info['version'].split(',')[0]}")
            logger.info(f"Tables: {info['tables_count']}")
            logger.info(f"Taille: {info['database_size']}")
            logger.info(f"URL: {info['url']}")
    
    # Statut pool
    pool = get_pool_status()
    logger.info(f"Pool: {pool['checked_in']} in / {pool['checked_out']} out / {pool['total']} total")
