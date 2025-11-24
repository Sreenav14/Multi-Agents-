from datetime import datetime
from re import S
from typing import Any, Optional, Literal

from pydantic import BaseModel


# UserToolConnection

class UserToolConnectionBase(BaseModel):
    name: str
    template_key:str
    config_json:Optional[dict[str,Any]] = None
    
class UserToolConnectionCreate(UserToolConnectionBase):
    """ Payload for POST/ tools """
    pass

class UserToolConnectionRead(UserToolConnectionBase):
    id:int
    status:str
    created_at:datetime
    updated_at:datetime
    
    class config:
        from_attributes = True
        
        
        
# MCPServer 

class MCPServerBase(BaseModel):
    name: str
    description: Optional[str] = None
    server_type: Literal["http", "stdio", "websocket"] = "http"
    endpoint : str
    config_json : Optional[dict[str, Any]] = None
    

class MCPServerCreate(MCPServerBase):
    """ Payload for POST/mcp_servers """
    pass

class MCPServerRead(MCPServerBase):
    id:int
    created_at: datetime
    updated_at: datetime
    
    class config:
        from_attributes = True