from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    echo = True,
)

SessionLocal = sessionmaker(
    autocommit = False,
    autoflush  = False,
    bind = engine,
)

def get_db():
    """"
    FastAPI dependency: yeilds a DB session and close it afterwards.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()