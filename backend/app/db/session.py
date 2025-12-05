from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool

from app.core.config import settings

# Create engine with connection pooling for better performance
engine = create_engine(
    settings.DATABASE_URL,
    echo=False,  # Disable SQL logging for performance (set True for debugging)
    future=True,
    poolclass=QueuePool,
    pool_size=5,  # Number of connections to keep open
    max_overflow=10,  # Additional connections allowed beyond pool_size
    pool_pre_ping=True,  # Verify connections before use
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

def get_db() -> Session:
    """
    FastAPI dependency: yields a DB session and closes it afterwards.
    Uses connection pooling for efficient database access.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()