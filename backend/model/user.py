from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship

from db import Base


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key =True, index=True)
    email = Column(String(255), unique = True, index = True, nullable = False)
    name = Column(String(255), nullable =False)
    created_at = Column(DateTime, default = datetime.now)
    
    worlflow = relationship("workflow", back_populates="owner")
    