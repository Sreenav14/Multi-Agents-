from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


# Assistant Schemas
class AssistantBase(BaseModel):
    name:str
    description: Optional[str] = None
    spec: Optional[str] = None
    
    
class AssistantCreate(AssistantBase):
    """
    Request body for post/ assistants
    frontend will send the assistant spec in graph json format.
    {
        "name": "Assistant Name",
        "description": "Assistant Description",
        "spec": ""
    }
    graph_json is generated on backend 
    """
    pass
class AssistantRead(AssistantBase):
    """
    Response schema for GET /assistants and GET /assistants/{id}
    Includes all fields from the Assistant model
    """
    id: int
    graph_json: Dict[str, Any]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
        
# Assistant Graph Update Schema (NEW)

class AssistantGraphUpdate(BaseModel):
    """
    used for put assistant/{assistant_id}/graph
    allow the frontend to update the assistant graph json
    conatining agent nodes, edges and assigned tool Ids.
    
    example:
    {
        "graph_json":{
            "node":[{
                "id":"planner",
                "role":"planner",
                "system_prompt":"...",
                "tool_ids":[1,2,3],
            }],
            "edges":[]
        }
    }
    """
    graph_json: Dict[str, Any]

# Message Schemas

class MessageRead(BaseModel):
    id:int
    run_id:int
    sender:str
    content:str
    message_metadata : Optional[Any] = None
    created_at : datetime
    
    class Config:
        from_attributes = True
        
        
# Run Schemas

class RunBase(BaseModel):
    input_text : str
    
class RunCreate(RunBase):
    """
    Request body for POST/assistants/{id}/runs
    frontend send:
    {
        "input_text":""
    }
    """
    chat_id: Optional[int] = None

class RunRead(BaseModel):
    id:int
    assistant_id:int
    chat_id: Optional[int] = None
    status:str
    input_text:str
    created_at:datetime
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    
    class Config:
        from_attributes = True
        
class RunWithMessages(RunRead):
    """
    Response returned by:
    GET/runs/{id}
    Post / assistants/{id}/runs
    """
    messages: List[MessageRead]
    
class ChatBase(BaseModel):
    assistant_id: int
    title: Optional[str] = None
    
class ChatRead(ChatBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

