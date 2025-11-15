from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from pydantic import BaseModel

from db import Base



class Workflow(Base):
    __tablename__="workflows"
    id = Column(Integer, primary_key=True,index=True)
    user_id = Column(Integer, ForeignKey("user_id"),nullable=False)
    title = Column(String(255), nullable=False)
    json = Column(JSONB, nullable=False)
    created_at = Column(DateTime, default = datetime.utcnow)
    
    owner = relationship("User",back_populates="workflows")

