from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    echo = True,
    future = True,
)

SessionLocal = sessionmaker(
    autocommit = False,
    autoflush  = False,
    bind = engine,
)

def get_db() -> Session:
    """"
    FastAPI dependency: yeilds a DB session and close it afterwards.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()