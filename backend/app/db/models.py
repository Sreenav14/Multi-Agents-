from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB

from app.db.base import Base


class Assistant(Base):
    __tablename__ = "assistants"
    
    id = Column(Integer, primary_key =True, index = True)
    name = Column(String(255), nullable = False)
    description = Column(Text, nullable = True)
    spec = Column(Text, nullable = True)
    graph_json = Column(JSONB, nullable = False)
    
    created_at = Column(DateTime, default = datetime.utcnow, nullable = False)
    updated_at = Column(DateTime, default = datetime.utcnow,onupdate = datetime.utcnow, nullable = False)
    
    runs = relationship("Run", back_populates = "assistant")
    chats = relationship("Chat", back_populates = "assistant")

class Chat(Base):
    __tablename__ = "chats"
    
    id = Column(Integer, primary_key = True, index =True)
    assistant_id = Column(Integer, ForeignKey("assistants.id"), nullable = False)
    title = Column(String(255), nullable = True)
    created_at = Column(DateTime, default = datetime.utcnow, nullable = False)
    updated_at = Column(DateTime, default = datetime.utcnow, onupdate = datetime.utcnow, nullable = False)
    
    assistant = relationship("Assistant", back_populates = "chats")
    runs = relationship("Run", back_populates = "chat")
    


    
class Run(Base):
    __tablename__ = "runs"
    
    id = Column(Integer, primary_key = True, index = True)
    assistant_id = Column(Integer, ForeignKey("assistants.id"), nullable = False)
    chat_id = Column(Integer, ForeignKey("chats.id"), nullable = True)
    status = Column(String(50), default="created", nullable = False)
    input_text = Column(Text, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable = False)
    completed_at = Column(DateTime, nullable = True)
    error_message = Column(Text, nullable = True)
    
    assistant = relationship("Assistant", back_populates = "runs")
    messages = relationship("Message", back_populates = "run")
    chat = relationship("Chat", back_populates = "runs")
    
class Message(Base):
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key = True, index = True)
    run_id = Column(Integer, ForeignKey("runs.id"), nullable = False)
    
    sender = Column(String(100), nullable= False)
    content = Column(Text ,nullable = False)
    message_metadata = Column(JSONB, nullable = True)
    
    created_at = Column(DateTime, default = datetime.utcnow, nullable = False)
    
    run = relationship("Run", back_populates = "messages")