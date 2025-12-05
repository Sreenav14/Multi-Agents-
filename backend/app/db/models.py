from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB

from app.db.base import Base


class Assistant(Base):
    __tablename__ = "assistants"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    spec = Column(Text, nullable=True)
    graph_json = Column(JSONB, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Cascade delete: when assistant is deleted, delete all related runs and chats
    runs = relationship("Run", back_populates="assistant", cascade="all, delete-orphan")
    chats = relationship("Chat", back_populates="assistant", cascade="all, delete-orphan")

class Chat(Base):
    __tablename__ = "chats"
    
    id = Column(Integer, primary_key = True, index =True)
    assistant_id = Column(Integer, ForeignKey("assistants.id"), nullable = False)
    title = Column(String(255), nullable = True)
    created_at = Column(DateTime, default = datetime.utcnow, nullable = False)
    updated_at = Column(DateTime, default = datetime.utcnow, onupdate = datetime.utcnow, nullable = False)
    
    assistant = relationship("Assistant", back_populates = "chats")
    runs = relationship("Run", back_populates = "chat",cascade = "all, delete-orphan")
    


    
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
    messages = relationship("Message", back_populates = "run",cascade = "all, delete-orphan")
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
    
    
# MCP + Tooling models (NEW)

class MCPServer(Base):
    """
    Represents a configured MCP server (HTTP / STDIO / WebSocket)
    These are created from the custom MCP server tab in studio 
    """
    __tablename__ = "mcp_servers"
    
    id = Column(Integer, primary_key = True, index = True)
    name = Column(String(255), nullable = False)
    description = Column(Text, nullable = True)
    server_type = Column(String(50), nullable = False, default="http" )
    endpoint = Column(String(1024), nullable = True)
    
    config_json = Column(JSONB, nullable = False)
    
    created_at = Column(DateTime, default = datetime.utcnow, nullable = False)
    updated_at = Column(DateTime, default = datetime.utcnow, onupdate = datetime.utcnow, nullable = False)
    
    tools = relationship("MCPTool", back_populates = "server", cascade = "all ,delete-orphan")
    
class MCPTool(Base):
    """
    A single tool discovered from MCP's listTool() call.
    """
    __tablename__  = "mcp_tools"
    
    id = Column(Integer, primary_key = True, index = True)
    server_id = Column(Integer, ForeignKey("mcp_servers.id", ondelete = "CASCADE"), nullable = False)
    name=  Column(String(255), nullable = False)
    description = Column(Text, nullable = True)
    
    schema_json = Column(JSONB, nullable = True)
    enabled = Column(Boolean, default = True, nullable = False)
    
    created_at = Column(DateTime, default = datetime.utcnow, nullable = False)
    updated_at = Column(DateTime, default = datetime.utcnow, onupdate = datetime.utcnow, nullable = False)
    
    server = relationship("MCPServer", back_populates = "tools")
    
class UserToolConnection(Base):
    """
    Stores user-connected Library tools (Tavily, Gmail, Github ...)
    """
    __tablename__ = "user_tool_connections"
    
    id = Column(Integer,primary_key = True, index = True)
    name = Column(String(255), nullable = False)
    template_key = Column(String(255), nullable = False)    # tavily, gmail....
    
     # Store secrets + options here (API keys, tokens, etc.)
    # Never send this whole JSON to frontend
    config_json = Column(JSONB, nullable = False)
    
    status = Column(String(50), nullable = False, default = "pending")
    
    created_at = Column(DateTime, default = datetime.utcnow, nullable = False)
    updated_at = Column(DateTime, default = datetime.utcnow, onupdate = datetime.utcnow, nullable = False)
